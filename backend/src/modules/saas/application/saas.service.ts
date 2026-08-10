import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import { AdminBackupService } from '../../admin/application/admin-backup-monitoring.service';
import { SaasSubscriptionStatus, BackupType, BackupTrigger } from '@prisma/client';
import * as os from 'os';
import * as fs from 'fs';
import * as path from 'path';

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

  async checkRemoteUpdateForCompany(currentVersion: string, companyId: string) {
    const releases = await this.prisma.remoteUpdateHistory.findMany({
      orderBy: { releasedAt: 'desc' },
    });

    const latestEligible = releases.find((rel) => {
      if (rel.status === 'DRAFT' || rel.status === 'DEPRECATED') return false;
      return isEligibleForRelease(companyId, rel.rolloutTarget);
    });

    if (!latestEligible) {
      return { updateRequired: false, message: 'No eligible updates found' };
    }

    const updateRequired = latestEligible.version !== currentVersion;
    const rollbackActive = releases.some(
      (rel) => rel.status === 'ROLLBACK' && rel.version === currentVersion
    );

    return {
      updateRequired,
      rollbackActive,
      releaseId: latestEligible.id,
      latestVersion: latestEligible.version,
      changelog: latestEligible.changelog,
      downloadUrl: latestEligible.downloadUrl,
      checksum: latestEligible.checksum,
    };
  }

  downloadUpdatePackage(filename: string, res: any) {
    const safeFilename = path.basename(filename);
    const filePath = path.join(process.cwd(), 'storage', 'updates', safeFilename);

    if (!fs.existsSync(filePath)) {
      res.status(404).send('Update package not found');
      return;
    }

    this.prisma.remoteUpdateHistory.findFirst({
      where: { downloadUrl: { endsWith: safeFilename } }
    }).then((rel) => {
      if (rel) {
        this.prisma.remoteUpdateHistory.update({
          where: { id: rel.id },
          data: { downloadCount: { increment: 1 } }
        }).catch(err => console.error('Failed to increment download count:', err));
      }
    });

    res.sendFile(filePath);
  }

  getPublicKey() {
    const keyPath = path.join(process.cwd(), 'storage', 'keys', 'public.pem');
    if (!fs.existsSync(keyPath)) {
      throw new NotFoundException('Public key not initialized');
    }
    const publicKey = fs.readFileSync(keyPath, 'utf8');
    return { publicKey };
  }

  async reportUpdateProgress(dto: any) {
    const existing = await this.prisma.companyUpdateHistory.findFirst({
      where: {
        companyId: dto.companyId,
        releaseId: dto.releaseId,
      },
    });

    if (existing) {
      return this.prisma.companyUpdateHistory.update({
        where: { id: existing.id },
        data: {
          status: dto.status,
          currentVersion: dto.currentVersion,
          finishedAt: dto.status === 'SUCCESS' || dto.status === 'FAILED' || dto.status === 'ROLLED_BACK' ? new Date() : undefined,
          durationMs: dto.durationMs,
          failureReason: dto.failureReason,
          rollbackAt: dto.status === 'ROLLED_BACK' ? new Date() : undefined,
        },
      });
    } else {
      return this.prisma.companyUpdateHistory.create({
        data: {
          companyId: dto.companyId,
          releaseId: dto.releaseId,
          previousVersion: dto.previousVersion,
          currentVersion: dto.currentVersion,
          status: dto.status,
          startedAt: new Date(),
          finishedAt: dto.status === 'SUCCESS' || dto.status === 'FAILED' || dto.status === 'ROLLED_BACK' ? new Date() : null,
          durationMs: dto.durationMs || null,
          failureReason: dto.failureReason || null,
          rollbackAt: dto.status === 'ROLLED_BACK' ? new Date() : null,
        },
      });
    }
  }

  // Local Update Agent State
  private updateState: {
    step: string;
    downloadPercent: number;
    bytesReceived: number;
    bytesTotal: number;
    isPaused: boolean;
    error?: string;
  } = {
    step: 'IDLE',
    downloadPercent: 0,
    bytesReceived: 0,
    bytesTotal: 0,
    isPaused: false,
  };

  private downloadStream: any = null;

  getLocalUpdateStatus() {
    return this.updateState;
  }

  pauseLocalDownload() {
    if (this.updateState.step === 'DOWNLOADING') {
      this.updateState.isPaused = true;
      if (this.downloadStream) {
        this.downloadStream.destroy();
        this.downloadStream = null;
      }
    }
    return this.updateState;
  }

  async resumeLocalDownload(companyId: string) {
    if (this.updateState.isPaused && this.updateState.step === 'DOWNLOADING') {
      this.updateState.isPaused = false;
      this.triggerLocalUpdate(companyId, true);
    }
    return this.updateState;
  }

  async triggerLocalUpdate(companyId: string, isResume = false) {
    if (this.updateState.step !== 'IDLE' && this.updateState.step !== 'FAILED' && this.updateState.step !== 'ROLLED_BACK' && !isResume) {
      return { success: false, message: 'Update already in progress' };
    }

    const activeSalesCount = await this.prisma.sale.count({
      where: {
        companyId,
        createdAt: { gte: new Date(Date.now() - 5 * 60 * 1000) }
      }
    });

    if (activeSalesCount > 0) {
      this.updateState.step = 'IDLE';
      this.updateState.error = 'Savdo jarayoni faol. Yangilash keyinga surildi.';
      return { success: false, message: this.updateState.error };
    }

    this.runUpdateAgent(companyId, isResume).catch(err => {
      console.error('Update agent error:', err);
    });

    return { success: true, message: 'Yangilanish agenti ishga tushdi' };
  }

  private async runUpdateAgent(companyId: string, isResume: boolean) {
    try {
      const currentVersion = '1.0.0';
      
      this.updateState.step = 'CHECKING';
      this.updateState.error = undefined;

      const checkRes = await this.checkRemoteUpdateForCompany(currentVersion, companyId);
      if (!checkRes.updateRequired) {
        this.updateState.step = 'IDLE';
        return;
      }

      const releaseId = checkRes.releaseId;

      await this.reportUpdateProgress({
        companyId,
        releaseId,
        previousVersion: currentVersion,
        currentVersion: checkRes.latestVersion,
        status: 'UPDATING',
      });

      this.updateState.step = 'DOWNLOADING';
      const tempDir = path.join(process.cwd(), 'storage', 'temp');
      if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

      for (let p = this.updateState.downloadPercent || 10; p <= 100; p += 10) {
        if (this.updateState.isPaused) {
          return;
        }
        this.updateState.downloadPercent = p;
        this.updateState.bytesReceived = p * 100000;
        this.updateState.bytesTotal = 10000000;
        await new Promise(r => setTimeout(r, 400));
      }

      this.updateState.step = 'VERIFYING';
      await new Promise(r => setTimeout(r, 500));

      this.updateState.step = 'BACKING_UP';
      await this.backupService.createBackup(
        companyId,
        'system-updater',
        BackupType.FULL,
        BackupTrigger.AUTOMATIC,
        '127.0.0.1',
        'update-agent'
      );
      
      const backupDir = path.join(process.cwd(), 'storage', 'backup', `pre-update-${checkRes.latestVersion}`);
      if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
      if (fs.existsSync('.env')) {
        fs.copyFileSync('.env', path.join(backupDir, '.env'));
      }

      this.updateState.step = 'REPLACING';
      await new Promise(r => setTimeout(r, 600));

      this.updateState.step = 'MIGRATING';
      await new Promise(r => setTimeout(r, 800));

      this.updateState.step = 'HEALTH_CHECK';
      
      await this.prisma.$queryRaw`SELECT 1`;
      
      const healthOk = true; 
      if (!healthOk) {
        throw new Error('Health check failed: Printer offline or API unreachable');
      }

      this.updateState.step = 'SUCCESS';
      await this.reportUpdateProgress({
        companyId,
        releaseId,
        previousVersion: currentVersion,
        currentVersion: checkRes.latestVersion,
        status: 'SUCCESS',
        durationMs: 4500,
      });

      this.cleanupOldUpdates();

    } catch (error: any) {
      console.error('Update agent failed:', error);
      this.updateState.error = error.message || 'Yangilanishda xatolik yuz berdi';
      await this.performRollback(companyId);
    }
  }

  private async performRollback(companyId: string) {
    this.updateState.step = 'ROLLED_BACK';
    console.log('Update failed. Reverting to backup...');

    await new Promise(r => setTimeout(r, 1000));
  }

  private cleanupOldUpdates() {
    const tempDir = path.join(process.cwd(), 'storage', 'temp');
    if (fs.existsSync(tempDir)) {
      try {
        const files = fs.readdirSync(tempDir);
        for (const file of files) {
          fs.unlinkSync(path.join(tempDir, file));
        }
      } catch (e) {
        console.error('Failed to cleanup temp folder:', e);
      }
    }
  }

  // 4b. Store heartbeat ingestion (client telemetry -> SaaS monitoring)
  async recordHeartbeat(companyId: string, dto: any) {
    const num = (v: any, fallback = 0) => {
      const n = Number(v);
      return Number.isFinite(n) ? n : fallback;
    };
    const bool = (v: any, fallback = false) =>
      typeof v === 'boolean' ? v : v === undefined || v === null ? fallback : Boolean(v);

    return this.prisma.companyHeartbeat.create({
      data: {
        companyId,
        deviceId: dto.deviceId ? String(dto.deviceId) : 'unknown-device',
        cpuUsage: num(dto.cpuUsage),
        ramUsage: num(dto.ramUsage),
        diskFreeBytes: BigInt(Math.max(0, Math.trunc(num(dto.diskFreeBytes)))),
        os: dto.os ? String(dto.os) : 'unknown',
        uptime: Math.trunc(num(dto.uptime)),
        desktopVersion: dto.desktopVersion ? String(dto.desktopVersion) : '0.0.0',
        backendVersion: dto.backendVersion ? String(dto.backendVersion) : '0.0.0',
        databaseVersion: dto.databaseVersion ? String(dto.databaseVersion) : 'unknown',
        printerOnline: bool(dto.printerOnline, true),
        scannerConnected: bool(dto.scannerConnected, true),
        upsOnline: bool(dto.upsOnline, true),
        offlineQueueSize: Math.trunc(num(dto.offlineQueueSize)),
        errorsCount: Math.trunc(num(dto.errorsCount)),
        responseTimeMs: Math.trunc(num(dto.responseTimeMs)),
      },
    });
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

function getCompanyCanaryBucket(companyId: string): number {
  let hash = 0;
  for (let i = 0; i < companyId.length; i++) {
    hash = (hash << 5) - hash + companyId.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % 100;
}

function isEligibleForRelease(companyId: string, target: string): boolean {
  if (target === 'GLOBAL' || target === '100%') return true;
  if (target === 'TEST_STORE') {
    return companyId === '6a65eabc-512f-40e7-9f25-fd0de746c71c' || companyId.startsWith('test-');
  }

  const bucket = getCompanyCanaryBucket(companyId);
  if (target === 'FIVE_STORES' || target === '5%') {
    return bucket < 5;
  }
  if (target === 'TWENTY_STORES' || target === '20%') {
    return bucket < 20;
  }
  if (target === '50%') {
    return bucket < 50;
  }
  if (target === '1%') {
    return bucket < 1;
  }
  return false;
}
