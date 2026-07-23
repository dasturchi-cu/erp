import { Module } from '@nestjs/common';
import { AdminController } from './api/admin.controller';
import { AdminService } from './application/admin.service';
import {
  AdminBackupService,
  AdminMonitoringService,
} from './application/admin-backup-monitoring.service';

@Module({
  controllers: [AdminController],
  providers: [AdminService, AdminBackupService, AdminMonitoringService],
  exports: [AdminBackupService],
})
export class AdminModule {}
