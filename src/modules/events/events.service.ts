import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Event, EventType } from '../../database/entities/event.entity';
import { Sensor } from '../../database/entities/sensor.entity';
import { CreateEventDto } from './dto/create-event.dto';
import { FilterEventsDto } from './dto/filter-events.dto';
import { ResolveEventDto } from './dto/resolve-event.dto';

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,
    @InjectRepository(Sensor)
    private readonly sensorRepository: Repository<Sensor>,
  ) {}

  async create(createEventDto: CreateEventDto): Promise<Event> {
    if (createEventDto.sensorId) {
      const sensor = await this.sensorRepository.findOne({
        where: { id: createEventDto.sensorId },
      });

      if (!sensor) {
        throw new NotFoundException('Датчик не знайдено');
      }
    }

    const event = this.eventRepository.create(createEventDto);
    return this.eventRepository.save(event);
  }

  async findAll(filterDto: FilterEventsDto): Promise<Event[]> {
    const queryBuilder = this.eventRepository
      .createQueryBuilder('event')
      .leftJoinAndSelect('event.sensor', 'sensor')
      .leftJoinAndSelect('event.resolvedBy', 'resolvedBy');

    if (filterDto.eventType) {
      queryBuilder.andWhere('event.event_type = :eventType', {
        eventType: filterDto.eventType,
      });
    }

    if (filterDto.resolved !== undefined) {
      queryBuilder.andWhere('event.resolved = :resolved', {
        resolved: filterDto.resolved,
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
      relations: ['sensor', 'resolvedBy'],
    });

    if (!event) {
      throw new NotFoundException('Подію не знайдено');
    }

    return event;
  }

  async resolve(id: number, userId: number): Promise<Event> {
    const event = await this.findOne(id);

    if (event.resolved) {
      throw new NotFoundException('Подія вже вирішена');
    }

    event.resolved = true;
    event.resolvedAt = new Date();
    event.resolvedById = userId;

    return this.eventRepository.save(event);
  }

  async getStatistics(): Promise<{
    total: number;
    resolved: number;
    unresolved: number;
    byType: Record<EventType, number>;
  }> {
    const [total, resolved, unresolved, byTypeSmokeDetected, byTypeAlarmActivated, byTypeAlarmDeactivated] =
      await Promise.all([
        this.eventRepository.count(),
        this.eventRepository.count({ where: { resolved: true } }),
        this.eventRepository.count({ where: { resolved: false } }),
        this.eventRepository.count({
          where: { eventType: EventType.SMOKE_DETECTED },
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
      resolved,
      unresolved,
      byType: {
        [EventType.SMOKE_DETECTED]: byTypeSmokeDetected,
        [EventType.ALARM_ACTIVATED]: byTypeAlarmActivated,
        [EventType.ALARM_DEACTIVATED]: byTypeAlarmDeactivated,
      },
    };
  }
}
