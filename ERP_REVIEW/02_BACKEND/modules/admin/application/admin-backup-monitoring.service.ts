import { Injectable } from '@nestjs/common';
import {
  BackupJobStatus,
  BackupTrigger,
  BackupType,
  Prisma,
  ReportJobStatus,
} from '@prisma/client';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { gzipSync, gunzipSync } from 'zlib';
import { PrismaService } from '../../../core/database/prisma.service';
import { RedisService } from '../../../core/redis/redis.service';
import { AuditService } from '../../../core/audit/audit.service';
import { AppException } from '../../../core/exceptions/app.exception';
import {
  buildPaginationMeta,
  paginationSkip,
} from '../../../core/utils/pagination.util';
import { AdminListQueryDto } from '../api/dto/admin.dto';

export interface BackupScheduleSettings {
  enabled: boolean;
  hourUtc: number;
  type: 'full' | 'incremental';
  retentionDays: number;
}

export interface BackupJobResponse {
  id: string;
  type: 'full' | 'incremental';
  status: 'completed' | 'running' | 'failed';
  trigger: 'manual' | 'automatic';
  size: string;
  createdAt: string;
  completedAt?: string | null;
  errorMessage?: string | null;
}

export interface SystemMetricResponse {
  id: string;
  label: string;
  value: string;
  status: 'healthy' | 'warning' | 'critical';
}

export interface MonitoringResponse {
  metrics: SystemMetricResponse[];
  systemStatus: 'healthy' | 'degraded' | 'critical';
  health: {
    api: { status: string; latencyMs: number };
    database: { status: string; sizeBytes?: number; sizeLabel?: string };
    redis: { status: string; latencyMs?: number };
    memory: { status: string; usedPercent: number; usedLabel: string };
    disk: { status: string; uploadsSizeBytes: number; uploadsSizeLabel: string };
  };
  queue: {
    pending: number;
    processing: number;
    failed: number;
    total: number;
  };
}

export interface LogEntryResponse {
  id: string;
  level: 'info' | 'warn' | 'error';
  message: string;
  source: string;
  user: string;
  ip: string;
  createdAt: string;
}

const DEFAULT_SCHEDULE: BackupScheduleSettings = {
  enabled: false,
  hourUtc: 2,
  type: 'incremental',
  retentionDays: 30,
};

@Injectable()
export class AdminBackupService {
  private readonly backupDir: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {
    this.backupDir = path.join(process.cwd(), 'uploads', 'backups');
    fs.mkdirSync(this.backupDir, { recursive: true });
  }

  async listBackups(companyId: string, query: AdminListQueryDto) {
    const page = query.resolvedPage();
    const limit = query.resolvedLimit();
    const where: Prisma.BackupJobWhereInput = { companyId };

    const [rows, total] = await Promise.all([
      this.prisma.backupJob.findMany({
        where,
        skip: paginationSkip(page, limit),
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.backupJob.count({ where }),
    ]);

    return {
      data: rows.map(toBackupResponse),
      meta: buildPaginationMeta(page, limit, total),
    };
  }

  async getBackup(companyId: string, id: string): Promise<BackupJobResponse> {
    const row = await this.findBackup(companyId, id);
    return toBackupResponse(row);
  }

  async createBackup(
    companyId: string,
    userId: string,
    type: BackupType,
    trigger: BackupTrigger,
    ip?: string,
    requestId?: string,
  ): Promise<BackupJobResponse> {
    const running = await this.prisma.backupJob.findFirst({
      where: { companyId, status: { in: [BackupJobStatus.PENDING, BackupJobStatus.RUNNING] } },
    });
    if (running) {
      throw AppException.conflict('BACKUP_IN_PROGRESS', 'A backup is already in progress');
    }

    const job = await this.prisma.backupJob.create({
      data: {
        companyId,
        userId,
        type,
        trigger,
        status: BackupJobStatus.RUNNING,
      },
    });

    try {
      const payload = await this.exportCompanyData(companyId, type);
      const companyDir = path.join(this.backupDir, companyId);
      fs.mkdirSync(companyDir, { recursive: true });

      const fileName = `backup_${type.toLowerCase()}_${Date.now()}.json.gz`;
      const filePath = path.join(companyDir, `${job.id}.json.gz`);
      const buffer = gzipSync(Buffer.from(JSON.stringify(payload), 'utf-8'));
      fs.writeFileSync(filePath, buffer);

      const updated = await this.prisma.backupJob.update({
        where: { id: job.id },
        data: {
          status: BackupJobStatus.COMPLETED,
          filePath,
          fileName,
          mimeType: 'application/gzip',
          fileSize: buffer.length,
          completedAt: new Date(),
          metadata: {
            recordCounts: {
              products: payload.products.length,
              customers: payload.customers.length,
              suppliers: payload.suppliers.length,
              categories: payload.categories.length,
            },
          },
        },
      });

      await this.audit.log({
        companyId,
        userId,
        action: 'CREATE',
        entityType: 'backup',
        entityId: job.id,
        newValue: { type, trigger, fileSize: buffer.length },
        ipAddress: ip ?? null,
        requestId: requestId ?? null,
      });

      return toBackupResponse(updated);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Backup failed';
      const failed = await this.prisma.backupJob.update({
        where: { id: job.id },
        data: { status: BackupJobStatus.FAILED, errorMessage: message },
      });
      return toBackupResponse(failed);
    }
  }

  async restoreBackup(
    companyId: string,
    backupId: string,
    userId: string,
    ip?: string,
    requestId?: string,
  ) {
    const backup = await this.findBackup(companyId, backupId);
    if (backup.status !== BackupJobStatus.COMPLETED || !backup.filePath) {
      throw AppException.businessRule('Only completed backups can be restored');
    }
    if (!fs.existsSync(backup.filePath)) {
      throw AppException.notFound('Backup file', backupId);
    }

    const raw = gunzipSync(fs.readFileSync(backup.filePath));
    const payload = JSON.parse(raw.toString('utf-8')) as {
      version: number;
      companyId: string;
      categories: Array<{ id: string; name: string; parentId?: string | null }>;
      products: Array<{ id: string; sku: string; name: string; categoryId?: string | null }>;
      customers: Array<{ id: string; name: string; phone?: string | null }>;
      suppliers: Array<{ id: string; name: string; phone?: string | null }>;
    };

    if (payload.companyId !== companyId) {
      throw AppException.forbidden('BACKUP_COMPANY_MISMATCH', 'Backup belongs to another company');
    }

    await this.prisma.$transaction(async (tx) => {
      for (const cat of payload.categories ?? []) {
        await tx.productCategory.upsert({
          where: { id: cat.id },
          create: {
            id: cat.id,
            companyId,
            name: cat.name,
            parentId: cat.parentId ?? null,
          },
          update: { name: cat.name, parentId: cat.parentId ?? null },
        });
      }

      for (const p of payload.products ?? []) {
        await tx.product.upsert({
          where: { id: p.id },
          create: {
            id: p.id,
            companyId,
            sku: p.sku,
            name: p.name,
            categoryId: p.categoryId ?? null,
          },
          update: { name: p.name, sku: p.sku, categoryId: p.categoryId ?? null },
        });
      }

      for (const c of payload.customers ?? []) {
        await tx.customer.upsert({
          where: { id: c.id },
          create: {
            id: c.id,
            companyId,
            name: c.name,
            phone: c.phone ?? '',
          },
          update: { name: c.name, phone: c.phone ?? '' },
        });
      }

      for (const s of payload.suppliers ?? []) {
        await tx.supplier.upsert({
          where: { id: s.id },
          create: {
            id: s.id,
            companyId,
            name: s.name,
            phone: s.phone ?? '',
          },
          update: { name: s.name, phone: s.phone ?? '' },
        });
      }
    });

    await this.audit.log({
      companyId,
      userId,
      action: 'RESTORE',
      entityType: 'backup',
      entityId: backupId,
      newValue: {
        products: payload.products?.length ?? 0,
        customers: payload.customers?.length ?? 0,
      },
      ipAddress: ip ?? null,
      requestId: requestId ?? null,
    });

    return { ok: true, restoredAt: new Date().toISOString() };
  }

  getDownloadPath(companyId: string, id: string) {
    return this.findBackup(companyId, id).then((backup) => {
      if (backup.status !== BackupJobStatus.COMPLETED || !backup.filePath) {
        throw AppException.businessRule('Backup file is not available');
      }
      if (!fs.existsSync(backup.filePath)) {
        throw AppException.notFound('Backup file', id);
      }
      return {
        filePath: backup.filePath,
        fileName: backup.fileName ?? `backup_${id}.json.gz`,
        mimeType: backup.mimeType ?? 'application/gzip',
      };
    });
  }

  async getSchedule(companyId: string): Promise<BackupScheduleSettings> {
    const company = await this.prisma.company.findUnique({ where: { id: companyId } });
    const settings = (company?.settings ?? {}) as Record<string, unknown>;
    const backup = settings.backup as Partial<BackupScheduleSettings> | undefined;
    return { ...DEFAULT_SCHEDULE, ...backup };
  }

  async updateSchedule(
    companyId: string,
    input: Partial<BackupScheduleSettings>,
    userId: string,
    ip?: string,
    requestId?: string,
  ): Promise<BackupScheduleSettings> {
    const company = await this.prisma.company.findUnique({ where: { id: companyId } });
    if (!company) throw AppException.notFound('Company', companyId);

    const current = await this.getSchedule(companyId);
    const next: BackupScheduleSettings = {
      ...current,
      ...input,
      hourUtc: input.hourUtc ?? current.hourUtc,
      retentionDays: input.retentionDays ?? current.retentionDays,
    };

    const settings = (company.settings ?? {}) as Record<string, unknown>;
    await this.prisma.company.update({
      where: { id: companyId },
      data: { settings: { ...settings, backup: next } as unknown as Prisma.InputJsonValue },
    });

    await this.audit.log({
      companyId,
      userId,
      action: 'UPDATE',
      entityType: 'backup_schedule',
      newValue: next,
      ipAddress: ip ?? null,
      requestId: requestId ?? null,
    });

    return next;
  }

  private async exportCompanyData(companyId: string, type: BackupType) {
    const [categories, products, customers, suppliers] = await Promise.all([
      this.prisma.productCategory.findMany({ where: { companyId, deletedAt: null } }),
      this.prisma.product.findMany({
        where: { companyId, deletedAt: null },
        select: { id: true, sku: true, name: true, categoryId: true },
      }),
      this.prisma.customer.findMany({
        where: { companyId, deletedAt: null },
        select: { id: true, name: true, phone: true },
      }),
      this.prisma.supplier.findMany({
        where: { companyId, deletedAt: null },
        select: { id: true, name: true, phone: true },
      }),
    ]);

    return {
      version: 1,
      companyId,
      type,
      exportedAt: new Date().toISOString(),
      categories: categories.map((c) => ({
        id: c.id,
        name: c.name,
        parentId: c.parentId,
      })),
      products,
      customers,
      suppliers,
    };
  }

  private async findBackup(companyId: string, id: string) {
    const row = await this.prisma.backupJob.findFirst({ where: { id, companyId } });
    if (!row) throw AppException.notFound('Backup', id);
    return row;
  }
}

@Injectable()
export class AdminMonitoringService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async getMonitoring(companyId: string): Promise<MonitoringResponse> {
    const start = Date.now();
    const health = await this.probeHealth(companyId);
    health.api.latencyMs = Date.now() - start;

    const queue = await this.getQueueStatus(companyId);
    const lastBackup = await this.prisma.backupJob.findFirst({
      where: { companyId, status: BackupJobStatus.COMPLETED },
      orderBy: { completedAt: 'desc' },
    });
    const metrics = this.buildMetrics(health, queue, lastBackup);
    const criticalCount = metrics.filter((m) => m.status === 'critical').length;
    const warningCount = metrics.filter((m) => m.status === 'warning').length;
    const systemStatus =
      criticalCount > 0 ? 'critical' : warningCount > 0 ? 'degraded' : 'healthy';

    return { metrics, systemStatus, health, queue };
  }

  async getHealthCheck(companyId: string) {
    const health = await this.probeHealth(companyId);
    const allOk =
      health.database.status === 'healthy' &&
      health.memory.status !== 'critical' &&
      health.disk.status !== 'critical';
    return {
      status: allOk ? 'ok' : 'degraded',
      checks: health,
      checkedAt: new Date().toISOString(),
    };
  }

  async getQueueStatus(companyId: string) {
    const [pending, processing, failed, total] = await Promise.all([
      this.prisma.reportJob.count({
        where: { companyId, status: ReportJobStatus.PENDING },
      }),
      this.prisma.reportJob.count({
        where: { companyId, status: ReportJobStatus.PROCESSING },
      }),
      this.prisma.reportJob.count({
        where: { companyId, status: ReportJobStatus.FAILED },
      }),
      this.prisma.reportJob.count({ where: { companyId } }),
    ]);
    return { pending, processing, failed, total };
  }

  async listLogs(companyId: string, query: AdminListQueryDto) {
    const page = query.resolvedPage();
    const limit = query.resolvedLimit();

    const [rows, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where: { companyId },
        skip: paginationSkip(page, limit),
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { user: true },
      }),
      this.prisma.auditLog.count({ where: { companyId } }),
    ]);

    const data: LogEntryResponse[] = rows.map((l) => ({
      id: l.id,
      level: actionToLevel(l.action),
      message: `${l.action} — ${l.entityType}${l.entityId ? ` (${l.entityId.slice(0, 8)}…)` : ''}`,
      source: l.entityType,
      user: l.user ? `${l.user.firstName} ${l.user.lastName}`.trim() : 'Tizim',
      ip: l.ipAddress ?? '—',
      createdAt: l.createdAt.toISOString(),
    }));

    return { data, meta: buildPaginationMeta(page, limit, total) };
  }

  private async probeHealth(companyId: string) {
    let dbStatus = 'healthy';
    let dbSizeBytes = 0;
    let dbSizeLabel = '—';
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      const sizeRow = await this.prisma.$queryRaw<Array<{ size: bigint }>>`
        SELECT pg_database_size(current_database()) AS size
      `;
      dbSizeBytes = Number(sizeRow[0]?.size ?? 0);
      dbSizeLabel = formatBytes(dbSizeBytes);
    } catch {
      dbStatus = 'critical';
    }

    let redisStatus: 'healthy' | 'warning' | 'critical' = 'critical';
    let redisLatencyMs: number | undefined;
    try {
      const t0 = Date.now();
      const pong = await this.redis.getClient().ping();
      redisLatencyMs = Date.now() - t0;
      redisStatus = pong === 'PONG' ? 'healthy' : 'warning';
    } catch {
      redisStatus = 'warning';
    }

    const mem = process.memoryUsage();
    const totalMem = os.totalmem();
    const usedPercent = Math.round((mem.rss / totalMem) * 100);
    const memoryStatus =
      usedPercent > 90 ? 'critical' : usedPercent > 75 ? 'warning' : 'healthy';

    const uploadsDir = path.join(process.cwd(), 'uploads');
    const uploadsSize = dirSizeBytes(uploadsDir);
    const uploadsLabel = formatBytes(uploadsSize);
    const diskStatus =
      uploadsSize > 5 * 1024 * 1024 * 1024 ? 'warning' : 'healthy';

    return {
      api: { status: 'healthy', latencyMs: 0 },
      database: { status: dbStatus, sizeBytes: dbSizeBytes, sizeLabel: dbSizeLabel },
      redis: { status: redisStatus, latencyMs: redisLatencyMs },
      memory: {
        status: memoryStatus,
        usedPercent,
        usedLabel: formatBytes(mem.rss),
      },
      disk: {
        status: diskStatus,
        uploadsSizeBytes: uploadsSize,
        uploadsSizeLabel: uploadsLabel,
      },
    };
  }

  private buildMetrics(
    health: MonitoringResponse['health'],
    queue: MonitoringResponse['queue'],
    lastBackup: { completedAt: Date | null } | null,
  ): SystemMetricResponse[] {
    const backupAgeHours = lastBackup?.completedAt
      ? Math.round((Date.now() - lastBackup.completedAt.getTime()) / 3600000)
      : null;
    const backupStatus =
      backupAgeHours === null
        ? 'critical'
        : backupAgeHours > 48
          ? 'warning'
          : 'healthy';

    return [
      {
        id: 'api',
        label: 'API holati',
        value: `${health.api.status.toUpperCase()} (${health.api.latencyMs} ms)`,
        status: health.api.status === 'healthy' ? 'healthy' : 'critical',
      },
      {
        id: 'database',
        label: 'Ma\'lumotlar bazasi',
        value: health.database.sizeLabel ?? '—',
        status: health.database.status === 'healthy' ? 'healthy' : 'critical',
      },
      {
        id: 'redis',
        label: 'Redis holati',
        value:
          health.redis.status === 'healthy'
            ? `OK (${health.redis.latencyMs ?? 0} ms)`
            : 'Mavjud emas',
        status: health.redis.status === 'healthy' ? 'healthy' : 'warning',
      },
      {
        id: 'memory',
        label: 'Xotira',
        value: `${health.memory.usedLabel} (${health.memory.usedPercent}%)`,
        status:
          health.memory.status === 'healthy'
            ? 'healthy'
            : health.memory.status === 'warning'
              ? 'warning'
              : 'critical',
      },
      {
        id: 'disk',
        label: 'Disk (uploads)',
        value: health.disk.uploadsSizeLabel,
        status:
          health.disk.status === 'healthy'
            ? 'healthy'
            : health.disk.status === 'warning'
              ? 'warning'
              : 'critical',
      },
      {
        id: 'queue',
        label: 'Navbat holati',
        value: `${queue.processing} jarayonda / ${queue.pending} kutilmoqda`,
        status: queue.failed > 0 ? 'warning' : 'healthy',
      },
      {
        id: 'backup',
        label: 'Zaxira nusxasi',
        value:
          backupAgeHours === null
            ? 'Hech qachon'
            : backupAgeHours < 24
              ? `${backupAgeHours} soat oldin`
              : `${Math.round(backupAgeHours / 24)} kun oldin`,
        status: backupStatus,
      },
    ];
  }
}

function toBackupResponse(row: {
  id: string;
  type: BackupType;
  trigger: BackupTrigger;
  status: BackupJobStatus;
  fileSize: number | null;
  createdAt: Date;
  completedAt: Date | null;
  errorMessage: string | null;
}): BackupJobResponse {
  const statusMap: Record<BackupJobStatus, BackupJobResponse['status']> = {
    [BackupJobStatus.PENDING]: 'running',
    [BackupJobStatus.RUNNING]: 'running',
    [BackupJobStatus.COMPLETED]: 'completed',
    [BackupJobStatus.FAILED]: 'failed',
  };
  return {
    id: row.id,
    type: row.type === BackupType.FULL ? 'full' : 'incremental',
    status: statusMap[row.status],
    trigger: row.trigger === BackupTrigger.MANUAL ? 'manual' : 'automatic',
    size: row.fileSize ? formatBytes(row.fileSize) : '—',
    createdAt: row.createdAt.toISOString(),
    completedAt: row.completedAt?.toISOString() ?? null,
    errorMessage: row.errorMessage,
  };
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

function dirSizeBytes(dir: string): number {
  if (!fs.existsSync(dir)) return 0;
  let total = 0;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) total += dirSizeBytes(full);
    else total += fs.statSync(full).size;
  }
  return total;
}

function actionToLevel(action: string): 'info' | 'warn' | 'error' {
  const upper = action.toUpperCase();
  if (['DELETE', 'BLOCK', 'REVOKE', 'FAILED'].some((k) => upper.includes(k))) return 'error';
  if (['UPDATE', 'VOID', 'CANCEL'].some((k) => upper.includes(k))) return 'warn';
  return 'info';
}
