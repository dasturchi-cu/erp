import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { Public } from '../../core/decorators/auth.decorators';
import { getAppVersion } from '../../core/utils/app-version.util';
import { PrismaService } from '../../core/database/prisma.service';
import { RedisService } from '../../core/redis/redis.service';

@Controller('health')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  @Public()
  @Get()
  async check() {
    let database: 'up' | 'down' = 'down';
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      database = 'up';
    } catch {
      database = 'down';
    }

    // Redis is optional (RedisService degrades gracefully) so it never fails the check.
    let redisPing: 'up' | 'down' = 'down';
    try {
      const pong = await this.redis.getClient().ping();
      redisPing = pong === 'PONG' ? 'up' : 'down';
    } catch {
      redisPing = 'down';
    }

    const body = {
      status: database === 'up' ? 'ok' : 'error',
      version: getAppVersion(),
      database,
      redis: redisPing,
    };

    if (database === 'down') {
      throw new ServiceUnavailableException(body);
    }

    return body;
  }
}
