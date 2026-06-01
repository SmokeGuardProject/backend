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

  async create(
    createEventDto: CreateEventDto,
    options: CreateEventOptions = {},
  ): Promise<Event> {
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
      });

      if (!alarm) {
        throw new NotFoundException('Сигналізацію не знайдено');
      }
    }

    const event = this.eventRepository.create({
      ...createEventDto,
      alarmId: isAlarmEvent ? createEventDto.alarmId ?? null : null,
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

  async findAll(filterDto: FilterEventsDto): Promise<Event[]> {
    const queryBuilder = this.eventRepository
      .createQueryBuilder('event')
      .leftJoinAndSelect('event.sensor', 'sensor')
      .leftJoinAndSelect('event.alarm', 'alarm');

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

  async findOne(id: number): Promise<Event> {
    const event = await this.eventRepository.findOne({
      where: { id },
      relations: ['sensor', 'alarm'],
    });

    if (!event) {
      throw new NotFoundException('Подію не знайдено');
    }

    return event;
  }

  async getStatistics(): Promise<{
    total: number;
    byType: Record<EventType, number>;
  }> {
    const [total, byTypeSmokeDetected, byTypeSmokeCleared, byTypeAlarmActivated, byTypeAlarmDeactivated] =
      await Promise.all([
        this.eventRepository.count(),
        this.eventRepository.count({
          where: { eventType: EventType.SMOKE_DETECTED },
        }),
        this.eventRepository.count({
          where: { eventType: EventType.SMOKE_CLEARED },
        }),
        this.eventRepository.count({
          where: { eventType: EventType.ALARM_ACTIVATED },
        }),
        this.eventRepository.count({
          where: { eventType: EventType.ALARM_DEACTIVATED },
        }),
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
    return [
      EventType.ALARM_ACTIVATED,
      EventType.ALARM_DEACTIVATED,
    ].includes(eventType);
  }
}
