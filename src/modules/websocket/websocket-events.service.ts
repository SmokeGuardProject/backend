import { Injectable, Logger } from '@nestjs/common';
import { Alarm } from '../../database/entities/alarm.entity';
import { Notification } from '../../database/entities/notification.entity';
import { Sensor } from '../../database/entities/sensor.entity';
import { SensorReading } from '../../database/entities/sensor-reading.entity';
import { WebsocketGateway } from './websocket.gateway';

@Injectable()
export class WebsocketEventsService {
  private readonly logger = new Logger(WebsocketEventsService.name);

  constructor(private readonly websocketGateway: WebsocketGateway) {}

  emitNotificationCreated(userId: number, notification: Notification): void {
    this.websocketGateway.emitToUser(userId, 'notification:created', notification);
  }

  emitSensorReading(sensor: Sensor, reading: SensorReading): void {
    const payload = {
      id: reading.id,
      sensorId: sensor.id,
      userId: sensor.userId,
      location: sensor.location,
      floor: sensor.floor,
      building: sensor.building,
      status: sensor.status,
      smokeDetected: reading.smokeDetected,
      smokeLevel: this.normalizeMetric(reading.smokeLevel),
      temperature: this.normalizeMetric(reading.temperature),
      humidity: this.normalizeMetric(reading.humidity),
      timestamp: reading.timestamp,
      createdAt: reading.createdAt,
    };

    this.websocketGateway.emitToUser(sensor.userId, 'sensor:reading', payload);
    this.websocketGateway.emitToSensor(sensor.id, 'sensor:reading', payload);
  }

  emitAlarmActivated(alarm: Alarm, sensor: Sensor): void {
    const payload = {
      alarmId: alarm.id,
      sensorId: alarm.sensorId,
      userId: sensor.userId,
      location: alarm.location,
      floor: alarm.floor,
      building: alarm.building,
      status: alarm.status,
      activatedAt: alarm.activatedAt,
      timestamp: new Date().toISOString(),
    };

    this.websocketGateway.emitToUser(sensor.userId, 'alarm:activated', payload);
    this.websocketGateway.emitToSensor(alarm.sensorId, 'alarm:activated', payload);
  }

  emitAlarmDeactivated(alarm: Alarm, sensor: Sensor): void {
    const payload = {
      alarmId: alarm.id,
      sensorId: alarm.sensorId,
      userId: sensor.userId,
      location: alarm.location,
      floor: alarm.floor,
      building: alarm.building,
      status: alarm.status,
      deactivatedAt: alarm.deactivatedAt,
      timestamp: new Date().toISOString(),
    };

    this.websocketGateway.emitToUser(sensor.userId, 'alarm:deactivated', payload);
    this.websocketGateway.emitToSensor(alarm.sensorId, 'alarm:deactivated', payload);
  }

  broadcastCriticalEvent(
    userId: number,
    sensorId: number,
    payload: {
      type: 'smoke_detected' | 'smoke_cleared' | 'alarm_activated';
      message: string;
      [key: string]: unknown;
    },
  ): void {
    const eventPayload = {
      sensorId,
      ...payload,
      timestamp: new Date().toISOString(),
    };

    this.logger.warn(`Broadcasting critical event ${payload.type} for sensor ${sensorId}`);
    this.websocketGateway.emitToUser(userId, 'critical:event', eventPayload);
    this.websocketGateway.emitToSensor(sensorId, 'critical:event', eventPayload);
  }

  private normalizeMetric(value: number | string | null): number | null {
    if (value === null || value === undefined) {
      return null;
    }

    return Number(value);
  }
}
