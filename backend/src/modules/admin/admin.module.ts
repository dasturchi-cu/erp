import { Module } from '@nestjs/common';
import { AdminController } from './api/admin.controller';
import { AdminService } from './application/admin.service';
import {
  AdminBackupService,
  AdminMonitoringService,
} from './application/admin-backup-monitoring.service';
import { BackupSchedulerService } from './application/backup-scheduler.service';

@Module({
  controllers: [AdminController],
  providers: [AdminService, AdminBackupService, AdminMonitoringService, BackupSchedulerService],
  exports: [AdminBackupService],
})
export class AdminModule {}
