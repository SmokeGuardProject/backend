import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { Sensor } from '../../database/entities/sensor.entity';
import { WebsocketGateway } from './websocket.gateway';
import { WebsocketEventsService } from './websocket-events.service';

@Module({
  imports: [AuthModule, TypeOrmModule.forFeature([Sensor])],
  controllers: [],
  providers: [WebsocketGateway, WebsocketEventsService],
  exports: [WebsocketEventsService],
})
export class WebsocketModule {}
