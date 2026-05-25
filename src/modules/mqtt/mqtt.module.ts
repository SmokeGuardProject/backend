import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MqttAuthController } from './mqtt-auth.controller';
import { MqttService } from './mqtt.service';
import { SensorsModule } from '../sensors/sensors.module';
import { EventsModule } from '../events/events.module';
import { AlarmsModule } from '../alarms/alarms.module';
import { WebsocketModule } from '../websocket/websocket.module';

@Module({
  imports: [
    ConfigModule,
    SensorsModule,
    EventsModule,
    WebsocketModule,
    forwardRef(() => AlarmsModule),
  ],
  controllers: [MqttAuthController],
  providers: [MqttService],
  exports: [MqttService],
})
export class MqttModule {}
