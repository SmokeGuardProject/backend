import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Alarm } from '../../database/entities/alarm.entity';
import { Sensor } from '../../database/entities/sensor.entity';
import { AlarmsService } from './alarms.service';
import { AlarmsController } from './alarms.controller';
import { MqttModule } from '../mqtt/mqtt.module';
import { EventsModule } from '../events/events.module';
import { WebsocketModule } from '../websocket/websocket.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Alarm, Sensor]),
    forwardRef(() => MqttModule),
    EventsModule,
    WebsocketModule,
  ],
  controllers: [AlarmsController],
  providers: [AlarmsService],
  exports: [AlarmsService],
})
export class AlarmsModule {}
