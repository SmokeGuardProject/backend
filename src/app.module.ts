import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { typeOrmConfig } from './config/typeorm.config';
import { AuthModule } from './modules/auth/auth.module';
import { SensorsModule } from './modules/sensors/sensors.module';
import { AlarmsModule } from './modules/alarms/alarms.module';
import { EventsModule } from './modules/events/events.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { ReportsModule } from './modules/reports/reports.module';
import { WebsocketModule } from './modules/websocket/websocket.module';
import { MqttModule } from './modules/mqtt/mqtt.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      useFactory: () => typeOrmConfig,
    }),
    AuthModule,
    SensorsModule,
    AlarmsModule,
    EventsModule,
    NotificationsModule,
    ReportsModule,
    WebsocketModule,
    MqttModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
