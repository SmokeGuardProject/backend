import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MqttAuthController } from './mqtt-auth.controller';
import { MqttService } from './mqtt.service';
import { SensorsModule } from '../sensors/sensors.module';
import { EventsModule } from '../events/events.module';
import { AlarmsModule } from '../alarms/alarms.module';

@Module({
  imports: [
    ConfigModule,
    SensorsModule,
    EventsModule,
    forwardRef(() => AlarmsModule),
  ],
  controllers: [MqttAuthController],
  providers: [MqttService],
  exports: [MqttService],
})
export class MqttModule {}
