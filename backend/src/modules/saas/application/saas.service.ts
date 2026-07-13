import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import { AdminBackupService } from '../../admin/application/admin-backup-monitoring.service';
import { SaasSubscriptionStatus, BackupType, BackupTrigger } from '@prisma/client';
import * as os from 'os';

@Injectable()
export class SaasService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly backupService: AdminBackupService,
  ) {}

  // 1. License & Subscriptions
  async validateLicense(licenseKey: string) {
    const sub = await this.prisma.tenantSubscription.findUnique({
      where: { licenseKey },
      include: { plan: true, company: true },
    });

    if (!sub) {
      return { valid: false, message: 'License key not found' };
    }

    const now = new Date();
    if (sub.endDate < now) {
      await this.prisma.tenantSubscription.update({
        where: { id: sub.id },
        data: { status: SaasSubscriptionStatus.EXPIRED },
      });
      return { valid: false, message: 'Subscription expired', subscription: sub };
    }

    if (sub.status !== SaasSubscriptionStatus.ACTIVE) {
      return { valid: false, message: 'Subscription suspended or trial ended', subscription: sub };
    }

    return { valid: true, subscription: sub };
  }

  // 2. Tenant Management & Usage Stats
  async getTenantLimits(companyId: string) {
    const sub = await this.prisma.tenantSubscription.findFirst({
      where: { companyId, status: SaasSubscriptionStatus.ACTIVE },
      include: { plan: true },
    });

    if (!sub) {
      return {
        unlimited: false,
        maxUsers: 3,
        maxProducts: 100,
        maxTransactions: 500,
      };
    }

    return {
      unlimited: false,
      maxUsers: sub.plan.maxUsers,
      maxProducts: sub.plan.maxProducts,
      maxTransactions: sub.plan.maxTransactions,
    };
  }

  async getTenantUsage(companyId: string) {
    const [userCount, productCount, transactionCount] = await Promise.all([
      this.prisma.userCompany.count({ where: { companyId } }),
      this.prisma.product.count({ where: { companyId, deletedAt: null } }),
      this.prisma.sale.count({ where: { companyId } }),
    ]);

    // Save/update usage stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await this.prisma.saasUsageStat.upsert({
      where: { companyId_date: { companyId, date: today } },
      create: { companyId, date: today, userCount, productCount, transactionCount },
      update: { userCount, productCount, transactionCount },
    });

    return {
      userCount,
      productCount,
      transactionCount,
    };
  }

  // 3. Remote Backup & Restore triggers
  async triggerRemoteBackup(companyId: string, userId: string, ip: string, reqId: string) {
    return this.backupService.createBackup(companyId, userId, BackupType.FULL, BackupTrigger.MANUAL, ip, reqId);
  }

  async triggerRemoteRestore(companyId: string, backupId: string, userId: string, ip: string, reqId: string) {
    return this.backupService.restoreBackup(companyId, backupId, userId, ip, reqId);
  }

  // 4. Remote Update manager
  async checkRemoteUpdate(currentVersion: string) {
    const latest = await this.prisma.remoteUpdateHistory.findFirst({
      orderBy: { releasedAt: 'desc' },
    });

    if (!latest) {
      return { updateRequired: false, message: 'No releases found' };
    }

    const updateRequired = latest.version !== currentVersion;
    return {
      updateRequired,
      latestVersion: latest.version,
      changelog: latest.changelog,
      downloadUrl: latest.downloadUrl,
      checksum: latest.checksum,
    };
  }

  // 5. System Monitoring & Health Checks
  async getSystemMonitoring() {
    const memoryUsage = process.memoryUsage();
    const cpus = os.cpus();
    const loadAverage = os.loadavg();

    const dbStats = await this.prisma.$queryRaw`SELECT count(*)::int as active_connections FROM pg_stat_activity`;

    return {
      uptime: process.uptime(),
      memory: {
        rss: `${(memoryUsage.rss / 1024 / 1024).toFixed(2)} MB`,
        heapTotal: `${(memoryUsage.heapTotal / 1024 / 1024).toFixed(2)} MB`,
        heapUsed: `${(memoryUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`,
      },
      cpu: {
        model: cpus[0]?.model ?? 'Unknown CPU',
        cores: cpus.length,
        loadavg: loadAverage,
      },
      db: {
        activeConnections: (dbStats as any)?.[0]?.active_connections ?? 1,
      },
      status: 'HEALTHY',
    };
  }
}
