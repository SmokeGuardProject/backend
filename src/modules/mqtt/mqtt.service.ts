import { Injectable, Logger, OnModuleDestroy, Inject, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as mqtt from 'mqtt';
import { hostname } from 'os';
import { MqttClient } from 'mqtt';
import { SensorsService } from '../sensors/sensors.service';
import { EventsService } from '../events/events.service';
import { AlarmsService } from '../alarms/alarms.service';
import { EventType } from '../../database/entities/event.entity';
import { AlarmStatus } from '../../database/entities/alarm.entity';
import { WebsocketEventsService } from '../websocket/websocket-events.service';

interface SensorDataPayload {
  smokeDetected: boolean;
  smokeLevel: number;
  temperature: number;
  humidity: number;
}

interface SensorHeartbeatPayload {
  status: 'online' | 'offline';
}

@Injectable()
export class MqttService implements OnModuleDestroy {
  private readonly logger = new Logger(MqttService.name);
  private client: MqttClient;
  private readonly mqttHost: string;
  private readonly mqttPort: number;
  private readonly mqttUsername: string;
  private readonly mqttPassword: string;
  private readonly mqttSharedSubscriptionGroup: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly sensorsService: SensorsService,
    private readonly eventsService: EventsService,
    @Inject(forwardRef(() => AlarmsService))
    private readonly alarmsService: AlarmsService,
    private readonly websocketEventsService: WebsocketEventsService,
  ) {
    this.mqttHost = this.configService.get<string>('MQTT_HOST', 'localhost');
    this.mqttPort = this.configService.get<number>('MQTT_PORT', 1883);
    this.mqttUsername = this.configService.get<string>('MQTT_USERNAME', '');
    this.mqttPassword = this.configService.get<string>('MQTT_PASSWORD', '');
    this.mqttSharedSubscriptionGroup = this.configService.get<string>(
      'MQTT_SHARED_SUBSCRIPTION_GROUP',
      'smokeguard-backend',
    );
  }

  async onModuleDestroy() {
    await this.disconnect();
  }

  public connect(): void {
    const brokerUrl = `mqtt://${this.mqttHost}:${this.mqttPort}`;
    const clientId = this.buildClientId();

    this.logger.log(
      `Connecting to MQTT broker at ${brokerUrl}... as ${this.mqttUsername}, clientId=${clientId}`,
    );

    this.client = mqtt.connect(brokerUrl, {
      clientId,
      username: this.mqttUsername,
      password: this.mqttPassword,
      clean: true,
      reconnectPeriod: 5000,
    });

    this.client.on('connect', () => {
      this.logger.log('✅ Connected to MQTT broker');
      this.subscribeToTopics();
    });

    this.client.on('error', (error) => {
      this.logger.error(`MQTT connection error: ${error.message}`);
    });

    this.client.on('reconnect', () => {
      this.logger.warn('Reconnecting to MQTT broker...');
    });

    this.client.on('close', () => {
      this.logger.warn('Disconnected from MQTT broker');
    });

    this.client.on('message', (topic, payload) => {
      this.handleMessage(topic, payload);
    });
  }

  private subscribeToTopics(): void {
    const topics = ['sensors/+/data', 'sensors/+/heartbeat', 'sensors/+/status'];

    topics.forEach((topic) => {
      const subscriptionTopic = this.buildSubscriptionTopic(topic);

      this.client.subscribe(subscriptionTopic, { qos: 1 }, (err) => {
        if (err) {
          this.logger.error(`Failed to subscribe to ${subscriptionTopic}: ${err.message}`);
        } else {
          this.logger.log(`Subscribed to ${subscriptionTopic}`);
        }
      });
    });
  }

  private buildSubscriptionTopic(topic: string): string {
    if (!this.mqttSharedSubscriptionGroup) {
      return topic;
    }

    return `$share/${this.mqttSharedSubscriptionGroup}/${topic}`;
  }

  private buildClientId(): string {
    const instanceName = process.env.HOSTNAME || hostname() || `${process.pid}`;
    return `backend-smokeguard-${instanceName}-${process.pid}`;
  }

  private handleMessage(topic: string, payload: Buffer): void {
    try {
      const normalizedTopic = this.normalizeMessageTopic(topic);
      const topicParts = normalizedTopic.split('/');
      if (topicParts.length !== 3) {
        this.logger.warn(`Invalid topic format: ${normalizedTopic}`);
        return;
      }

      const [, sensorIdStr, messageType] = topicParts;
      const sensorId = parseInt(sensorIdStr, 10);

      if (isNaN(sensorId)) {
        this.logger.warn(`Invalid sensor ID in topic: ${topic}`);
        return;
      }

      const data = JSON.parse(payload.toString());

      switch (messageType) {
        case 'data':
          this.handleSensorData(sensorId, data);
          break;
        case 'heartbeat':
          this.handleHeartbeat(sensorId, data);
          break;
        case 'status':
          this.handleStatusUpdate(sensorId, data);
          break;
        default:
          this.logger.warn(`Unknown message type: ${messageType}`);
      }
    } catch (error) {
      this.logger.error(`Error handling message from ${topic}: ${error.message}`);
    }
  }

  private normalizeMessageTopic(topic: string): string {
    if (!topic.startsWith('$share/')) {
      return topic;
    }

    return topic.split('/').slice(2).join('/');
  }

  private async handleSensorData(sensorId: number, data: SensorDataPayload): Promise<void> {
    this.logger.debug(`Received data from sensor ${sensorId}: ${JSON.stringify(data)}`);
    try {
      if (this.isInvalidHumidityReading(data)) {
        this.logger.debug(`Ignoring reading from sensor ${sensorId}: humidity is below 1`);
        await this.sensorsService.updateHeartbeat(sensorId);
        return;
      }

      const { smokeStateChanged } = await this.sensorsService.saveSensorReading(sensorId, {
        smokeDetected: data.smokeDetected,
        smokeLevel: data.smokeLevel,
        temperature: data.temperature,
        humidity: data.humidity,
      });

      if (smokeStateChanged) {
        const sensor = await this.sensorsService.findEntityById(sensorId);

        if (data.smokeDetected) {
          this.logger.warn(`🔥 Smoke detected by sensor ${sensorId}! Level: ${data.smokeLevel}`);

          await this.eventsService.create({
            sensorId,
            eventType: EventType.SMOKE_DETECTED,
          });

          this.websocketEventsService.broadcastCriticalEvent(sensor.userId, sensorId, {
            type: 'smoke_detected',
            message: `Smoke detected by sensor ${sensorId}`,
            smokeLevel: data.smokeLevel,
          });

          this.logger.log(`Created SMOKE_DETECTED event for sensor ${sensorId}`);

          await this.activateAlarmsForSmoke(sensorId, sensor.userId);
        } else {
          this.logger.log(`✅ Smoke cleared on sensor ${sensorId}`);

          await this.eventsService.create({
            sensorId,
            eventType: EventType.SMOKE_CLEARED,
          });

          this.websocketEventsService.broadcastCriticalEvent(sensor.userId, sensorId, {
            type: 'smoke_cleared',
            message: `Smoke cleared on sensor ${sensorId}`,
          });

          this.logger.log(`Created SMOKE_CLEARED event for sensor ${sensorId}`);
        }
      }
    } catch (error) {
      this.logger.error(`Failed to save sensor reading: ${error.message}`);
    }
  }

  private isInvalidHumidityReading(data: SensorDataPayload): boolean {
    return data.humidity < 1;
  }

  private async activateAlarmsForSmoke(sensorId: number, userId: number): Promise<void> {
    try {
      const availableAlarms = await this.alarmsService.findAll(
        {
          status: AlarmStatus.INACTIVE,
          sensorId,
        },
        userId,
      );

      if (availableAlarms.length === 0) {
        this.logger.warn(`No inactive alarms linked to sensor ${sensorId} available to activate`);
        return;
      }

      this.logger.warn(`🔥 Activating alarms linked to sensor ${sensorId}`);

      let activatedCount = 0;

      for (const alarm of availableAlarms) {
        try {
          await this.alarmsService.activate(alarm.id, false, userId);
          activatedCount += 1;
          this.logger.log(`🚨 Activated alarm ${alarm.id} on sensor ${alarm.sensorId}`);
        } catch (error) {
          this.logger.error(`Failed to activate alarm ${alarm.id}: ${error.message}`);
        }
      }

      if (activatedCount > 0) {
        await this.eventsService.create(
          {
            eventType: EventType.ALARM_ACTIVATED,
          },
          {
            notify: false,
            notificationUserId: userId,
          },
        );
      }

      this.logger.log(`✅ Activated ${activatedCount} alarm(s) in response to sensor ${sensorId}`);
    } catch (error) {
      this.logger.error(`Failed to activate alarms: ${error.message}`);
    }
  }

  private async handleHeartbeat(sensorId: number, data: SensorHeartbeatPayload): Promise<void> {
    this.logger.debug(`Heartbeat from sensor ${sensorId}: ${data.status}`);
    try {
      await this.sensorsService.updateHeartbeat(sensorId);
    } catch (error) {
      this.logger.error(`Failed to update heartbeat: ${error.message}`);
    }
  }

  private async handleStatusUpdate(sensorId: number, data: any): Promise<void> {
    this.logger.debug(`Status update from sensor ${sensorId}: ${JSON.stringify(data)}`);
  }

  async publishAlarmCommand(alarmId: number, command: 'activate' | 'deactivate'): Promise<void> {
    if (!this.client || !this.client.connected) {
      throw new Error('MQTT Client is not connected yet');
    }
    const topic = `alarms/${alarmId}/${command}`;
    const payload = JSON.stringify({ timestamp: new Date().toISOString(), command });

    return new Promise((resolve, reject) => {
      this.client.publish(topic, payload, { qos: 1 }, (err) => {
        if (err) {
          this.logger.error(`Failed to publish to ${topic}: ${err.message}`);
          reject(err);
        } else {
          this.logger.log(`Published ${command} command to alarm ${alarmId}`);
          resolve();
        }
      });
    });
  }

  private async disconnect(): Promise<void> {
    if (this.client) {
      this.logger.log('Disconnecting from MQTT broker...');
      await this.client.endAsync();
    }
  }
}
