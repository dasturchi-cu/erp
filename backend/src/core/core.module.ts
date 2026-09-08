import { Global, Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { PrismaService } from './database/prisma.service';
import { RLS_PRISMA, rlsPrismaProvider } from './database/rls-prisma.service';
import { RlsContextInterceptor } from './company/rls-context.interceptor';
import { RlsBypassInterceptor } from './company/rls-bypass.interceptor';
import { RedisService } from './redis/redis.service';
import { AuditService } from './audit/audit.service';
import { CompanyContextService } from './company/company-context.service';
import { AccessControlService } from './access/access-control.service';
import { SecurityConfigService } from './security/security-config.service';
import { IdempotencyService } from './idempotency/idempotency.service';
import { PilotErrorLogger } from './logging/pilot-error.logger';
import { EventBusService } from './event-bus/event-bus.service';
import { JobQueueService } from './job-queue/job-queue.service';

@Global()
@Module({
  providers: [
    PrismaService,
    rlsPrismaProvider,
    RedisService,
    AuditService,
    CompanyContextService,
    AccessControlService,
    SecurityConfigService,
    IdempotencyService,
    PilotErrorLogger,
    EventBusService,
    JobQueueService,
    RlsBypassInterceptor,
    { provide: APP_INTERCEPTOR, useClass: RlsContextInterceptor },
  ],
  exports: [
    PrismaService,
    RLS_PRISMA,
    RedisService,
    AuditService,
    CompanyContextService,
    AccessControlService,
    SecurityConfigService,
    IdempotencyService,
    PilotErrorLogger,
    EventBusService,
    JobQueueService,
    RlsBypassInterceptor,
  ],
})
export class CoreModule {}
