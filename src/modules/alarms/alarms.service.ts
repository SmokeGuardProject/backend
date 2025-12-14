import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Alarm, AlarmStatus } from '../../database/entities/alarm.entity';
import { Sensor } from '../../database/entities/sensor.entity';
import { CreateAlarmDto } from './dto/create-alarm.dto';
import { UpdateAlarmDto } from './dto/update-alarm.dto';
import { FilterAlarmsDto } from './dto/filter-alarms.dto';

@Injectable()
export class AlarmsService {
  constructor(
    @InjectRepository(Alarm)
    private readonly alarmRepository: Repository<Alarm>,
    @InjectRepository(Sensor)
    private readonly sensorRepository: Repository<Sensor>,
  ) {}

  async create(createAlarmDto: CreateAlarmDto): Promise<Alarm> {
    const sensor = await this.sensorRepository.findOne({
      where: { id: createAlarmDto.sensorId },
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

  async findAll(filterDto: FilterAlarmsDto): Promise<Alarm[]> {
    const queryBuilder = this.alarmRepository.createQueryBuilder('alarm');

    if (filterDto.status) {
      queryBuilder.andWhere('alarm.status = :status', {
        status: filterDto.status,
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

  async findOne(id: number): Promise<Alarm> {
    const alarm = await this.alarmRepository.findOne({ where: { id } });

    if (!alarm) {
      throw new NotFoundException('Сигналізацію не знайдено');
    }

    return alarm;
  }

  async update(id: number, updateAlarmDto: UpdateAlarmDto): Promise<Alarm> {
    const alarm = await this.findOne(id);

    Object.assign(alarm, updateAlarmDto);

    return this.alarmRepository.save(alarm);
  }

  async remove(id: number): Promise<void> {
    const alarm = await this.findOne(id);
    await this.alarmRepository.remove(alarm);
  }

  async activate(id: number): Promise<Alarm> {
    const alarm = await this.findOne(id);

    if (alarm.status === AlarmStatus.ACTIVE) {
      throw new BadRequestException('Сигналізація вже активована');
    }

    alarm.status = AlarmStatus.ACTIVE;
    alarm.activatedAt = new Date();

    return this.alarmRepository.save(alarm);
  }

  async deactivate(id: number): Promise<Alarm> {
    const alarm = await this.findOne(id);

    if (alarm.status !== AlarmStatus.ACTIVE) {
      throw new BadRequestException('Сигналізація не активна');
    }

    alarm.status = AlarmStatus.INACTIVE;
    alarm.deactivatedAt = new Date();

    return this.alarmRepository.save(alarm);
  }

  async findActiveAlarms(): Promise<Alarm[]> {
    return this.alarmRepository.find({
      where: { status: AlarmStatus.ACTIVE },
    });
  }

  async findBySensorId(sensorId: number, status?: AlarmStatus): Promise<Alarm[]> {
    const where: any = { sensorId };
    if (status) {
      where.status = status;
    }
    return this.alarmRepository.find({ where });
  }
}
