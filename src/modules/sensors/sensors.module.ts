import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Sensor } from '../../database/entities/sensor.entity';
import { SensorReading } from '../../database/entities/sensor-reading.entity';
import { SensorsController } from './sensors.controller';
import { SensorsService } from './sensors.service';
import { WebsocketModule } from '../websocket/websocket.module';

@Module({
  imports: [TypeOrmModule.forFeature([Sensor, SensorReading]), WebsocketModule],
  controllers: [SensorsController],
  providers: [SensorsService],
  exports: [SensorsService],
})
export class SensorsModule {}
