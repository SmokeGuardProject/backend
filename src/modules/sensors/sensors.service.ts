import {ConflictException, Injectable, NotFoundException} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {Repository} from 'typeorm';
import {Sensor, SensorStatus} from '../../database/entities/sensor.entity';
import {SensorReading} from '../../database/entities/sensor-reading.entity';
import {CreateSensorDto} from './dto/create-sensor.dto';
import {UpdateSensorDto} from './dto/update-sensor.dto';
import {SensorResponseDto} from './dto/sensor-response.dto';
import {CreateSensorResponseDto} from './dto/create-sensor-response.dto';
import {RegenerateCodeResponseDto} from './dto/regenerate-code-response.dto';
import {SensorReadingResponseDto} from './dto/sensor-reading-response.dto';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

@Injectable()
export class SensorsService {
  constructor(
    @InjectRepository(Sensor)
    private readonly sensorRepository: Repository<Sensor>,
    @InjectRepository(SensorReading)
    private readonly sensorReadingRepository: Repository<SensorReading>,
  ) {}

  async create(userId: number, createSensorDto: CreateSensorDto): Promise<CreateSensorResponseDto> {
    const sensorCode = this.generateSensorCode();
    const sensorCodeHash = await this.hashSensorCode(sensorCode);

    const sensor = this.sensorRepository.create({
      ...createSensorDto,
      userId,
      sensorCodeHash,
      status: SensorStatus.INACTIVE,
    });

    try {
      const savedSensor = await this.sensorRepository.save(sensor);
      return {
        sensor: this.sanitizeSensor(savedSensor),
        sensorCode,
      };
    } catch (error) {
      if (error.code === '23505') {
        throw new ConflictException('Датчик з таким кодом вже існує');
      }
      throw error;
    }
  }

  async findAll(userId: number, filters?: {
    status?: SensorStatus;
    floor?: number;
    building?: string;
  }): Promise<SensorResponseDto[]> {
    const queryBuilder = this.sensorRepository.createQueryBuilder('sensor');

    queryBuilder.where('sensor.user_id = :userId', { userId });

    if (filters?.status) {
      queryBuilder.andWhere('sensor.status = :status', { status: filters.status });
    }

    if (filters?.floor !== undefined) {
      queryBuilder.andWhere('sensor.floor = :floor', { floor: filters.floor });
    }

    if (filters?.building) {
      queryBuilder.andWhere('sensor.building = :building', { building: filters.building });
    }

    queryBuilder.orderBy('sensor.createdAt', 'DESC');

    const sensors = await queryBuilder.getMany();
    return sensors.map((sensor) => this.sanitizeSensor(sensor));
  }

  async findOne(userId: number, id: number): Promise<SensorResponseDto> {
    const sensor = await this.sensorRepository.findOne({ where: { id, userId } });

    if (!sensor) {
      throw new NotFoundException('Датчик не знайдено');
    }

    return this.sanitizeSensor(sensor);
  }

  async update(userId: number, id: number, updateSensorDto: UpdateSensorDto): Promise<SensorResponseDto> {
    const sensor = await this.sensorRepository.findOne({ where: { id, userId } });

    if (!sensor) {
      throw new NotFoundException('Датчик не знайдено');
    }

    Object.assign(sensor, updateSensorDto);

    const updatedSensor = await this.sensorRepository.save(sensor);
    return this.sanitizeSensor(updatedSensor);
  }

  async remove(userId: number, id: number): Promise<void> {
    const sensor = await this.sensorRepository.findOne({ where: { id, userId } });

    if (!sensor) {
      throw new NotFoundException('Датчик не знайдено');
    }

    await this.sensorRepository.remove(sensor);
  }

  async regenerateCode(userId: number, id: number): Promise<RegenerateCodeResponseDto> {
    const sensor = await this.sensorRepository.findOne({ where: { id, userId } });

    if (!sensor) {
      throw new NotFoundException('Датчик не знайдено');
    }

    const newSensorCode = this.generateSensorCode();
      sensor.sensorCodeHash = await this.hashSensorCode(newSensorCode);
    await this.sensorRepository.save(sensor);

    return {
      sensorCode: newSensorCode,
      message: 'Код датчика успішно оновлено',
    };
  }

  async getSensorReadings(
    userId: number,
    id: number,
    filters?: {
      startDate?: Date;
      endDate?: Date;
      offset?: number;
      limit?: number;
    },
  ): Promise<SensorReadingResponseDto[]> {
    const sensor = await this.sensorRepository.findOne({ where: { id, userId } });

    if (!sensor) {
      throw new NotFoundException('Датчик не знайдено');
    }

    const queryBuilder = this.sensorReadingRepository
      .createQueryBuilder('reading')
      .where('reading.sensor_id = :sensorId', { sensorId: id });

    if (filters?.startDate) {
      queryBuilder.andWhere('reading.timestamp >= :startDate', {
        startDate: filters.startDate,
      });
    }

    if (filters?.endDate) {
      queryBuilder.andWhere('reading.timestamp <= :endDate', {
        endDate: filters.endDate,
      });
    }

    queryBuilder.orderBy('reading.timestamp', 'DESC');

    if (filters?.offset) {
      queryBuilder.offset(filters.offset);
    }

    if (filters?.limit) {
      queryBuilder.limit(filters.limit);
    }

    const readings = await queryBuilder.getMany();

    return readings.map((reading) => ({
      id: reading.id,
      sensorId: reading.sensorId,
      smokeDetected: reading.smokeDetected,
      smokeLevel: reading.smokeLevel,
      temperature: reading.temperature,
      humidity: reading.humidity,
      timestamp: reading.timestamp,
      createdAt: reading.createdAt,
    }));
  }

  async validateSensorCode(id: number, plainCode: string): Promise<boolean> {
    const sensor = await this.sensorRepository.findOne({ where: { id } });

    if (!sensor) {
      return false;
    }

    return bcrypt.compare(plainCode, sensor.sensorCodeHash);
  }

  async saveSensorReading(
    sensorId: number,
    data: {
      smokeDetected: boolean;
      smokeLevel: number;
      temperature: number;
      humidity: number,

    },
  ): Promise<{ smokeStateChanged: boolean; previousState: boolean | null }> {
    const sensor = await this.sensorRepository.findOne({
      where: { id: sensorId },
    });

    if (!sensor) {
      throw new NotFoundException(`Sensor ${sensorId} not found`);
    }

    const previousSmokeDetected = sensor.lastSmokeDetected;
    const smokeStateChanged = previousSmokeDetected !== data.smokeDetected;

    sensor.lastSmokeDetected = data.smokeDetected;
    await this.sensorRepository.save(sensor);

    const reading = this.sensorReadingRepository.create({
      sensor,
      smokeDetected: data.smokeDetected,
      smokeLevel: data.smokeLevel,
      temperature: data.temperature,
      humidity: data.humidity,
      timestamp: new Date(),
    });

    await this.sensorReadingRepository.save(reading);

    return {
      smokeStateChanged,
      previousState: previousSmokeDetected,
    };
  }

  async updateHeartbeat(sensorId: number): Promise<void> {
    const sensor = await this.sensorRepository.findOne({
      where: { id: sensorId },
    });

    if (!sensor) {
      throw new NotFoundException(`Sensor ${sensorId} not found`);
    }

    sensor.lastCheckedAt = new Date();
    sensor.status = SensorStatus.ACTIVE;

    await this.sensorRepository.save(sensor);
  }

  private generateSensorCode(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  private async hashSensorCode(code: string): Promise<string> {
    return bcrypt.hash(code, 10);
  }

  private sanitizeSensor(sensor: Sensor): SensorResponseDto {
    const { sensorCodeHash, ...sensorData } = sensor;

    return {
      id: sensorData.id,
      location: sensorData.location,
      floor: sensorData.floor,
      building: sensorData.building,
      status: sensorData.status,
      lastCheckedAt: sensorData.lastCheckedAt,
      createdAt: sensorData.createdAt,
      updatedAt: sensorData.updatedAt,
    };
  }
}
