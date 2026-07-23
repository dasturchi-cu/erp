import { createHash } from 'crypto';
import { Injectable } from '@nestjs/common';
import { RedisService } from '../../../core/redis/redis.service';
import { cacheTtlForPeriod } from './analytics-period.util';
import { ReportPeriod } from '@prisma/client';

@Injectable()
export class AnalyticsCacheService {
  constructor(private readonly redis: RedisService) {}

  private hashParams(params: Record<string, unknown>): string {
    const normalized = JSON.stringify(params, Object.keys(params).sort());
    return createHash('sha256').update(normalized).digest('hex').slice(0, 16);
  }

  cacheKey(companyId: string, endpoint: string, params: Record<string, unknown>): string {
    return `analytics:${companyId}:${endpoint}:${this.hashParams(params)}`;
  }

  async getOrSet<T>(
    companyId: string,
    endpoint: string,
    params: Record<string, unknown>,
    period: ReportPeriod,
    factory: () => Promise<T>,
  ): Promise<T> {
    const key = this.cacheKey(companyId, endpoint, params);
    const cached = await this.redis.get(key);
    if (cached) {
      return JSON.parse(cached) as T;
    }

    const data = await factory();
    const ttl = cacheTtlForPeriod(period);
    await this.redis.setex(key, ttl, JSON.stringify(data));
    return data;
  }

  async invalidateCompany(companyId: string): Promise<void> {
    const client = this.redis.getClient();
    try {
      const keys = await client.keys(`analytics:${companyId}:*`);
      if (keys.length > 0) await client.del(...keys);
    } catch {
      /* non-fatal */
    }
  }
}
