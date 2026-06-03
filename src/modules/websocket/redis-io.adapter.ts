import { INestApplicationContext, Logger } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';
import { ServerOptions } from 'socket.io';

export class RedisIoAdapter extends IoAdapter {
  private readonly logger = new Logger(RedisIoAdapter.name);
  private adapterConstructor: ReturnType<typeof createAdapter> | null = null;

  constructor(app: INestApplicationContext) {
    super(app);
  }

  async connectToRedis(): Promise<void> {
    const host = process.env.REDIS_HOST;

    if (!host) {
      this.logger.log('REDIS_HOST is not set. Socket.IO will use the local in-memory adapter.');
      return;
    }

    const port = Number.parseInt(process.env.REDIS_PORT || '6379', 10);
    const password = process.env.REDIS_PASSWORD || undefined;
    const url = `redis://${host}:${Number.isInteger(port) ? port : 6379}`;

    const pubClient = createClient({ url, password });
    const subClient = pubClient.duplicate();

    pubClient.on('error', (error) => {
      this.logger.error(`Redis pub client error: ${error.message}`);
    });

    subClient.on('error', (error) => {
      this.logger.error(`Redis sub client error: ${error.message}`);
    });

    await Promise.all([pubClient.connect(), subClient.connect()]);

    this.adapterConstructor = createAdapter(pubClient, subClient);
    this.logger.log(`Socket.IO Redis adapter connected to ${url}`);
  }

  createIOServer(port: number, options?: ServerOptions): any {
    const server = super.createIOServer(port, options);

    if (this.adapterConstructor) {
      server.adapter(this.adapterConstructor);
    }

    return server;
  }
}
