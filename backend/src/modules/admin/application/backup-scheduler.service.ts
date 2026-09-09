import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { BackupJobStatus, BackupTrigger, BackupType, CompanyStatus } from '@prisma/client';
import * as fs from 'fs';
import { RLS_PRISMA, RlsPrismaClient } from '../../../core/database/rls-prisma.service';
import { rlsContextStorage } from '../../../core/company/rls-context.storage';
import { AdminBackupService } from './admin-backup-monitoring.service';

/**
 * Actually runs the automatic backups that AdminBackupService's
 * getSchedule()/updateSchedule() only ever *stored a preference* for —
 * nothing previously read that preference and acted on it, so "enable
 * daily backup" in the settings UI did nothing.
 */
@Injectable()
export class BackupSchedulerService {
  private readonly logger = new Logger(BackupSchedulerService.name);

  constructor(
    @Inject(RLS_PRISMA) private readonly prisma: RlsPrismaClient,
    private readonly backupService: AdminBackupService,
  ) {}

  @Cron('0 * * * *') // top of every hour
  async runScheduledBackups(): Promise<void> {
    await rlsContextStorage.run({ bypass: true }, async () => {
      const companies = await this.prisma.company.findMany({
        where: { status: CompanyStatus.ACTIVE },
        select: { id: true },
      });

      const nowHourUtc = new Date().getUTCHours();
      const todayStartUtc = new Date();
      todayStartUtc.setUTCHours(0, 0, 0, 0);

      for (const { id: companyId } of companies) {
        try {
          const schedule = await this.backupService.getSchedule(companyId);
          if (!schedule.enabled || schedule.hourUtc !== nowHourUtc) continue;

          const alreadyRanToday = await this.prisma.backupJob.findFirst({
            where: {
              companyId,
              trigger: BackupTrigger.AUTOMATIC,
              createdAt: { gte: todayStartUtc },
            },
          });
          if (alreadyRanToday) continue;

          const type = schedule.type === 'full' ? BackupType.FULL : BackupType.INCREMENTAL;
          await this.backupService.createBackup(companyId, undefined, type, BackupTrigger.AUTOMATIC);
          this.logger.log(`Automatic backup completed for company ${companyId}`);
        } catch (err) {
          // One company's failure must not stop the rest from running.
          this.logger.error(
            `Automatic backup failed for company ${companyId}: ${err instanceof Error ? err.message : String(err)}`,
          );
        }
      }
    });
  }

  @Cron('30 3 * * *') // once daily, off-peak
  async cleanupExpiredBackups(): Promise<void> {
    await rlsContextStorage.run({ bypass: true }, async () => {
      const companies = await this.prisma.company.findMany({
        select: { id: true },
      });

      for (const { id: companyId } of companies) {
        try {
          const schedule = await this.backupService.getSchedule(companyId);
          const cutoff = new Date();
          cutoff.setUTCDate(cutoff.getUTCDate() - schedule.retentionDays);

          const expired = await this.prisma.backupJob.findMany({
            where: {
              companyId,
              status: BackupJobStatus.COMPLETED,
              createdAt: { lt: cutoff },
            },
            select: { id: true, filePath: true },
          });
          if (expired.length === 0) continue;

          for (const job of expired) {
            if (job.filePath && fs.existsSync(job.filePath)) {
              fs.unlinkSync(job.filePath);
            }
          }
          await this.prisma.backupJob.deleteMany({
            where: { id: { in: expired.map((j) => j.id) } },
          });
          this.logger.log(`Deleted ${expired.length} expired backup(s) for company ${companyId}`);
        } catch (err) {
          this.logger.error(
            `Backup cleanup failed for company ${companyId}: ${err instanceof Error ? err.message : String(err)}`,
          );
        }
      }
    });
  }
}
