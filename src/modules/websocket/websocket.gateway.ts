import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Server, Socket } from 'socket.io';
import { AuthService } from '../auth/auth.service';
import { Sensor } from '../../database/entities/sensor.entity';
import { WsAuthenticatedUser } from './interfaces/ws-authenticated-user.interface';

interface AuthenticatedSocket extends Socket {
  data: Socket['data'] & {
    user?: WsAuthenticatedUser;
  };
}

@WebSocketGateway({
  namespace: '/realtime',
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  },
})
export class WebsocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(WebsocketGateway.name);

  @WebSocketServer()
  server: Server;

  constructor(
    private readonly authService: AuthService,
    @InjectRepository(Sensor)
    private readonly sensorRepository: Repository<Sensor>,
  ) {}

  async handleConnection(client: AuthenticatedSocket): Promise<void> {
    try {
      const token = this.extractToken(client);
      const user = await this.authService.verifyAccessToken(token);

      client.data.user = user;
      await client.join(this.getUserRoom(user.id));

      this.logger.log(`WebSocket client connected: ${client.id}, userId=${user.id}`);
      client.emit('socket:ready', { userId: user.id });
    } catch (error) {
      this.logger.warn(`Rejected WebSocket connection ${client.id}: ${error.message}`);
      client.emit('socket:error', { message: 'WebSocket authentication failed' });
      client.disconnect(true);
    }
  }

  handleDisconnect(client: AuthenticatedSocket): void {
    const userId = client.data.user?.id;
    this.logger.log(`WebSocket client disconnected: ${client.id}, userId=${userId ?? 'unknown'}`);
  }

  @SubscribeMessage('sensor:subscribe')
  async handleSensorSubscribe(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() body: { sensorId?: number },
  ): Promise<void> {
    const sensorId = Number(body?.sensorId);
    const userId = client.data.user?.id;

    if (!userId) {
      throw new WsException('Unauthorized');
    }

    if (!Number.isInteger(sensorId) || sensorId <= 0) {
      throw new WsException('sensorId must be a positive integer');
    }

    const sensor = await this.sensorRepository.findOne({
      where: { id: sensorId, userId },
    });

    if (!sensor) {
      throw new WsException('Sensor not found');
    }

    await client.join(this.getSensorRoom(sensorId));
    client.emit('sensor:subscribed', { sensorId });
  }

  @SubscribeMessage('sensor:unsubscribe')
  async handleSensorUnsubscribe(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() body: { sensorId?: number },
  ): Promise<void> {
    const sensorId = Number(body?.sensorId);

    if (!Number.isInteger(sensorId) || sensorId <= 0) {
      throw new WsException('sensorId must be a positive integer');
    }

    await client.leave(this.getSensorRoom(sensorId));
    client.emit('sensor:unsubscribed', { sensorId });
  }

  emitToUser(userId: number, event: string, payload: unknown): void {
    if (!this.server) {
      return;
    }

    this.server.to(this.getUserRoom(userId)).emit(event, payload);
  }

  emitToSensor(sensorId: number, event: string, payload: unknown): void {
    if (!this.server) {
      return;
    }

    this.server.to(this.getSensorRoom(sensorId)).emit(event, payload);
  }

  private extractToken(client: Socket): string {
    const authToken = client.handshake.auth?.token;
    const queryToken = Array.isArray(client.handshake.query?.token)
      ? client.handshake.query.token[0]
      : client.handshake.query?.token;
    const headerValue = client.handshake.headers.authorization;
    const rawToken = authToken || queryToken || headerValue;

    if (!rawToken || typeof rawToken !== 'string') {
      throw new WsException('Missing access token');
    }

    return rawToken.startsWith('Bearer ') ? rawToken.slice(7) : rawToken;
  }

  private getUserRoom(userId: number): string {
    return `user:${userId}`;
  }

  private getSensorRoom(sensorId: number): string {
    return `sensor:${sensorId}`;
  }
}
