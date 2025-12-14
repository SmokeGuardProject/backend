import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Alarm } from '../../database/entities/alarm.entity';
import { Sensor } from '../../database/entities/sensor.entity';
import { AlarmsService } from './alarms.service';
import { AlarmsController } from './alarms.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Alarm, Sensor])],
  controllers: [AlarmsController],
  providers: [AlarmsService],
  exports: [AlarmsService],
})
export class AlarmsModule {}
