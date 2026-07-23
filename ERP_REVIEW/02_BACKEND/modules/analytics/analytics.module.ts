import { Module } from '@nestjs/common';
import { AnalyticsController } from './api/analytics.controller';
import { AnalyticsService } from './application/analytics.service';
import { AnalyticsCacheService } from './application/analytics-cache.service';
import { AnalyticsQueriesService } from './application/analytics-queries.service';

@Module({
  controllers: [AnalyticsController],
  providers: [AnalyticsService, AnalyticsCacheService, AnalyticsQueriesService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
