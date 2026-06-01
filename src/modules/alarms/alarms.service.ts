import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Alarm, AlarmStatus } from '../../database/entities/alarm.entity';
import { Sensor } from '../../database/entities/sensor.entity';
import { CreateAlarmDto } from './dto/create-alarm.dto';
import { UpdateAlarmDto } from './dto/update-alarm.dto';
import { FilterAlarmsDto } from './dto/filter-alarms.dto';
import { MqttService } from '../mqtt/mqtt.service';
import { EventsService } from '../events/events.service';
import { EventType } from '../../database/entities/event.entity';
import { WebsocketEventsService } from '../websocket/websocket-events.service';

@Injectable()
export class AlarmsService {
  constructor(
    @InjectRepository(Alarm)
    private readonly alarmRepository: Repository<Alarm>,
    @InjectRepository(Sensor)
    private readonly sensorRepository: Repository<Sensor>,
    @Inject(forwardRef(() => MqttService))
    private readonly mqttService: MqttService,
    private readonly eventsService: EventsService,
    private readonly websocketEventsService: WebsocketEventsService,
  ) {}

  async create(userId: number, createAlarmDto: CreateAlarmDto): Promise<Alarm> {
    const sensor = await this.sensorRepository.findOne({
      where: { id: createAlarmDto.sensorId, userId },
    });

    if (!sensor) {
      throw new NotFoundException('Датчик не знайдено');
    }

    const alarm = this.alarmRepository.create({
      ...createAlarmDto,
      status: AlarmStatus.INACTIVE,
      floor: createAlarmDto.floor ?? sensor.floor,
      building: createAlarmDto.building ?? sensor.building,
    });

    return this.alarmRepository.save(alarm);
  }

  async findAll(filterDto: FilterAlarmsDto, userId?: number): Promise<Alarm[]> {
    const queryBuilder = this.alarmRepository
      .createQueryBuilder('alarm')
      .leftJoinAndSelect('alarm.sensor', 'sensor');

    if (userId !== undefined) {
      queryBuilder.where('sensor.user_id = :userId', { userId });
    }

    if (filterDto.status) {
      queryBuilder.andWhere('alarm.status = :status', {
        status: filterDto.status,
      });
    }

    if (filterDto.building) {
      queryBuilder.andWhere('alarm.building = :building', {
        building: filterDto.building,
      });
    }

    if (filterDto.floor !== undefined) {
      queryBuilder.andWhere('alarm.floor = :floor', {
        floor: filterDto.floor,
      });
    }

    queryBuilder.orderBy('alarm.created_at', 'DESC');

    if (filterDto.offset) {
      queryBuilder.offset(filterDto.offset);
    }

    if (filterDto.limit) {
      queryBuilder.limit(filterDto.limit);
    }

    return queryBuilder.getMany();
  }

  async findOne(id: number, userId?: number): Promise<Alarm> {
    const alarm = await this.findOneWithSensor(id, userId);

    if (!alarm) {
      throw new NotFoundException('Сигналізацію не знайдено');
    }

    return alarm;
  }

  async update(id: number, updateAlarmDto: UpdateAlarmDto, userId?: number): Promise<Alarm> {
    const alarm = await this.findOne(id, userId);

    Object.assign(alarm, updateAlarmDto);

    return this.alarmRepository.save(alarm);
  }

  async remove(id: number, userId?: number): Promise<void> {
    const alarm = await this.findOne(id, userId);
    await this.alarmRepository.remove(alarm);
  }

  async activate(id: number, notify = true, userId?: number): Promise<Alarm> {
    const alarm = await this.findOne(id, userId);
    const sensor = alarm.sensor;

    if (alarm.status === AlarmStatus.ACTIVE) {
      throw new BadRequestException('Сигналізація вже активована');
    }

    if (!sensor) {
      throw new NotFoundException('Датчик не знайдено');
    }

    alarm.status = AlarmStatus.ACTIVE;
    alarm.activatedAt = new Date();

    const savedAlarm = await this.alarmRepository.save(alarm);

    await this.mqttService.publishAlarmCommand(id, 'activate');
    await this.eventsService.create(
      {
        sensorId: alarm.sensorId,
        alarmId: alarm.id,
        eventType: EventType.ALARM_ACTIVATED,
      },
      {
        notify,
      },
    );

    this.websocketEventsService.emitAlarmActivated(savedAlarm, sensor);
    this.websocketEventsService.broadcastCriticalEvent(sensor.userId, alarm.sensorId, {
      type: 'alarm_activated',
      message: `Alarm ${alarm.id} activated`,
      alarmId: alarm.id,
    });

    return savedAlarm;
  }

  async activateAll(userId: number): Promise<{
    total: number;
    activated: number;
    failed: Array<{ alarmId: number; error: string }>;
  }> {
    const alarms = await this.findAll({ status: AlarmStatus.INACTIVE }, userId);
    const failed: Array<{ alarmId: number; error: string }> = [];
    const activatedSensorIds: number[] = [];
    let activated = 0;

    for (const alarm of alarms) {
      try {
        await this.activate(alarm.id, false, userId);
        activated += 1;
        activatedSensorIds.push(alarm.sensorId);
      } catch (error) {
        failed.push({
          alarmId: alarm.id,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    if (activated > 0) {
      await this.eventsService.create(
        {
          sensorId: activatedSensorIds.length === 1 ? activatedSensorIds[0] : undefined,
          eventType: EventType.ALARM_ACTIVATED,
        },
        {
          notificationUserId: userId,
          notificationMessage: `Активовано всі сигналізації: ${activated} з ${alarms.length}.`,
        },
      );
    }

    return {
      total: alarms.length,
      activated,
      failed,
    };
  }

  async deactivate(id: number, notify = true, userId?: number): Promise<Alarm> {
    const alarm = await this.findOne(id, userId);
    const sensor = alarm.sensor;

    if (alarm.status !== AlarmStatus.ACTIVE) {
      throw new BadRequestException('Сигналізація не активна');
    }

    if (!sensor) {
      throw new NotFoundException('Датчик не знайдено');
    }

    alarm.status = AlarmStatus.INACTIVE;
    alarm.deactivatedAt = new Date();

    const savedAlarm = await this.alarmRepository.save(alarm);

    await this.mqttService.publishAlarmCommand(id, 'deactivate');

    await this.eventsService.create(
      {
        sensorId: alarm.sensorId,
        alarmId: alarm.id,
        eventType: EventType.ALARM_DEACTIVATED,
      },
      {
        notify,
      },
    );

    this.websocketEventsService.emitAlarmDeactivated(savedAlarm, sensor);

    return savedAlarm;
  }

  async deactivateAll(userId: number): Promise<{
    total: number;
    deactivated: number;
    failed: Array<{ alarmId: number; error: string }>;
  }> {
    const alarms = await this.findAll({ status: AlarmStatus.ACTIVE }, userId);
    const failed: Array<{ alarmId: number; error: string }> = [];
    const deactivatedSensorIds: number[] = [];
    let deactivated = 0;

    for (const alarm of alarms) {
      try {
        await this.deactivate(alarm.id, false, userId);
        deactivated += 1;
        deactivatedSensorIds.push(alarm.sensorId);
      } catch (error) {
        failed.push({
          alarmId: alarm.id,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    if (deactivated > 0) {
      await this.eventsService.create(
        {
          sensorId: deactivatedSensorIds.length === 1 ? deactivatedSensorIds[0] : undefined,
          eventType: EventType.ALARM_DEACTIVATED,
        },
        {
          notificationUserId: userId,
          notificationMessage: `Деактивовано всі сигналізації: ${deactivated} з ${alarms.length}.`,
        },
      );
    }

    return {
      total: alarms.length,
      deactivated,
      failed,
    };
  }

  private async findOneWithSensor(id: number, userId?: number): Promise<Alarm | null> {
    const queryBuilder = this.alarmRepository
      .createQueryBuilder('alarm')
      .leftJoinAndSelect('alarm.sensor', 'sensor')
      .where('alarm.id = :id', { id });

    if (userId !== undefined) {
      queryBuilder.andWhere('sensor.user_id = :userId', { userId });
    }

    return queryBuilder.getOne();
  }
}
