import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly client: Redis;

  constructor(config: ConfigService) {
    const url = config.get<string>('REDIS_URL', 'redis://localhost:6379');
    this.client = new Redis(url, {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });
    this.client.on('error', (err) => {
      /* Redis optional in dev - ignore error to prevent crash */
    });
    void this.client.connect().catch(() => {
      /* Redis optional in dev if unavailable */
    });
  }

  getClient(): Redis {
    return this.client;
  }

  async get(key: string): Promise<string | null> {
    try {
      return await this.client.get(key);
    } catch {
      return null;
    }
  }

  async setex(key: string, ttlSeconds: number, value: string): Promise<void> {
    try {
      await this.client.setex(key, ttlSeconds, value);
    } catch {
      /* non-fatal */
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.client.del(key);
    } catch {
      /* non-fatal */
    }
  }

  async onModuleDestroy() {
    await this.client.quit();
  }
}
