import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Event, EventType } from '../../database/entities/event.entity';
import { Sensor } from '../../database/entities/sensor.entity';
import { Alarm } from '../../database/entities/alarm.entity';
import { CreateEventDto } from './dto/create-event.dto';
import { FilterEventsDto } from './dto/filter-events.dto';
import { NotificationsService } from '../notifications/notifications.service';

interface CreateEventOptions {
  notify?: boolean;
  notificationUserId?: number;
  notificationMessage?: string;
}

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,
    @InjectRepository(Sensor)
    private readonly sensorRepository: Repository<Sensor>,
    @InjectRepository(Alarm)
    private readonly alarmRepository: Repository<Alarm>,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(createEventDto: CreateEventDto, options: CreateEventOptions = {}): Promise<Event> {
    const shouldNotify = options.notify ?? true;
    let sensor: Sensor | null = null;
    let alarm: Alarm | null = null;

    if (createEventDto.sensorId) {
      sensor = await this.sensorRepository.findOne({
        where: { id: createEventDto.sensorId },
      });

      if (!sensor) {
        throw new NotFoundException('Датчик не знайдено');
      }
    }

    const isAlarmEvent = this.isAlarmEvent(createEventDto.eventType);

    if (isAlarmEvent && createEventDto.alarmId) {
      alarm = await this.alarmRepository.findOne({
        where: { id: createEventDto.alarmId },
        relations: ['sensor'],
      });

      if (!alarm) {
        throw new NotFoundException('Сигналізацію не знайдено');
      }
    }

    const userId = sensor?.userId ?? alarm?.sensor?.userId ?? options.notificationUserId ?? null;

    const event = this.eventRepository.create({
      ...createEventDto,
      alarmId: isAlarmEvent ? (createEventDto.alarmId ?? null) : null,
      userId,
    });
    const savedEvent = await this.eventRepository.save(event);

    if (sensor) {
      savedEvent.sensor = sensor;
    }

    if (alarm) {
      savedEvent.alarm = alarm;
    }

    if (shouldNotify && sensor) {
      await this.notificationsService.createNotificationsForEvent(savedEvent);
    }

    if (shouldNotify && options.notificationUserId) {
      await this.notificationsService.createNotificationForUser(
        options.notificationUserId,
        savedEvent,
        options.notificationMessage,
      );
    }

    return savedEvent;
  }

  async findAll(filterDto: FilterEventsDto, userId?: number): Promise<Event[]> {
    const queryBuilder = this.eventRepository
      .createQueryBuilder('event')
      .leftJoinAndSelect('event.sensor', 'sensor')
      .leftJoinAndSelect('event.alarm', 'alarm');

    if (userId !== undefined) {
      queryBuilder.where('event.user_id = :userId', { userId });
    }

    if (filterDto.eventType) {
      queryBuilder.andWhere('event.event_type = :eventType', {
        eventType: filterDto.eventType,
      });
    }

    queryBuilder.orderBy('event.created_at', 'DESC');

    if (filterDto.offset) {
      queryBuilder.offset(filterDto.offset);
    }

    if (filterDto.limit) {
      queryBuilder.limit(filterDto.limit);
    }

    return queryBuilder.getMany();
  }

  async findOne(id: number, userId?: number): Promise<Event> {
    const queryBuilder = this.eventRepository
      .createQueryBuilder('event')
      .leftJoinAndSelect('event.sensor', 'sensor')
      .leftJoinAndSelect('event.alarm', 'alarm')
      .where('event.id = :id', { id });

    if (userId !== undefined) {
      queryBuilder.andWhere('event.user_id = :userId', { userId });
    }

    const event = await queryBuilder.getOne();

    if (!event) {
      throw new NotFoundException('Подію не знайдено');
    }

    return event;
  }

  async getStatistics(userId?: number): Promise<{
    total: number;
    byType: Record<EventType, number>;
  }> {
    const countByType = (eventType: EventType) =>
      this.eventRepository.count({
        where: userId !== undefined ? { userId, eventType } : { eventType },
      });

    const [
      total,
      byTypeSmokeDetected,
      byTypeSmokeCleared,
      byTypeAlarmActivated,
      byTypeAlarmDeactivated,
    ] = await Promise.all([
      this.eventRepository.count({
        where: userId !== undefined ? { userId } : {},
      }),
      countByType(EventType.SMOKE_DETECTED),
      countByType(EventType.SMOKE_CLEARED),
      countByType(EventType.ALARM_ACTIVATED),
      countByType(EventType.ALARM_DEACTIVATED),
    ]);

    return {
      total,
      byType: {
        [EventType.SMOKE_DETECTED]: byTypeSmokeDetected,
        [EventType.SMOKE_CLEARED]: byTypeSmokeCleared,
        [EventType.ALARM_ACTIVATED]: byTypeAlarmActivated,
        [EventType.ALARM_DEACTIVATED]: byTypeAlarmDeactivated,
      },
    };
  }

  private isAlarmEvent(eventType: EventType): boolean {
    return [EventType.ALARM_ACTIVATED, EventType.ALARM_DEACTIVATED].includes(eventType);
  }
}
