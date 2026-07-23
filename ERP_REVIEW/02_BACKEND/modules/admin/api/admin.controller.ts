import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { BackupTrigger, BackupType } from '@prisma/client';
import type { Response } from 'express';
import * as fs from 'fs';
import { AdminService } from '../application/admin.service';
import {
  AdminBackupService,
  AdminMonitoringService,
} from '../application/admin-backup-monitoring.service';
import {
  AdminAuditListQueryDto,
  AdminListQueryDto,
  CreateAdminUserDto,
  CreateBackupRequestDto,
  UpdateBackupScheduleDto,
  UpdateDeviceStatusDto,
  UpdateUserStatusDto,
} from './dto/admin.dto';
import { CompanyIsolationGuard } from '../../../core/guards/company-isolation.guard';
import { RequireModule, RequirePermissions } from '../../../core/decorators/auth.decorators';
import { CurrentUser, ClientIp, RequestId } from '../../../core/decorators/current-user.decorator';
import { AuditService } from '../../../core/audit/audit.service';
import { JwtPayload } from '../../auth/interfaces/jwt-payload.interface';

@ApiTags('Admin')
@ApiBearerAuth()
@Controller('admin')
@UseGuards(CompanyIsolationGuard)
@RequireModule('admin')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly backupService: AdminBackupService,
    private readonly monitoringService: AdminMonitoringService,
    private readonly audit: AuditService,
  ) {}

  @Get('overview')
  @RequirePermissions('admin.*')
  @ApiOperation({ summary: 'Admin dashboard overview KPIs' })
  overview(@CurrentUser() user: JwtPayload) {
    return this.adminService.getOverview(user.companyId!);
  }

  @Get('monitoring')
  @RequirePermissions('admin.*')
  @ApiOperation({ summary: 'System monitoring metrics' })
  monitoring(@CurrentUser() user: JwtPayload) {
    return this.monitoringService.getMonitoring(user.companyId!);
  }

  @Get('monitoring/health')
  @RequirePermissions('admin.*')
  @ApiOperation({ summary: 'Health check probe' })
  healthCheck(@CurrentUser() user: JwtPayload) {
    return this.monitoringService.getHealthCheck(user.companyId!);
  }

  @Get('monitoring/queue')
  @RequirePermissions('admin.*')
  @ApiOperation({ summary: 'Background job queue status' })
  queueStatus(@CurrentUser() user: JwtPayload) {
    return this.monitoringService.getQueueStatus(user.companyId!);
  }

  @Get('logs')
  @RequirePermissions('admin.audit.view')
  @ApiOperation({ summary: 'System log viewer (audit-based)' })
  logs(@CurrentUser() user: JwtPayload, @Query() query: AdminListQueryDto) {
    return this.monitoringService.listLogs(user.companyId!, query);
  }

  @Get('backups')
  @RequirePermissions('admin.*')
  @ApiOperation({ summary: 'Backup history' })
  listBackups(@CurrentUser() user: JwtPayload, @Query() query: AdminListQueryDto) {
    return this.backupService.listBackups(user.companyId!, query);
  }

  @Get('backups/schedule')
  @RequirePermissions('admin.*')
  @ApiOperation({ summary: 'Automatic backup schedule settings' })
  getBackupSchedule(@CurrentUser() user: JwtPayload) {
    return this.backupService.getSchedule(user.companyId!);
  }

  @Patch('backups/schedule')
  @RequirePermissions('admin.*')
  @ApiOperation({ summary: 'Update automatic backup schedule' })
  updateBackupSchedule(
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateBackupScheduleDto,
    @ClientIp() ip?: string,
    @RequestId() requestId?: string,
  ) {
    return this.backupService.updateSchedule(user.companyId!, dto, user.sub, ip, requestId);
  }

  @Post('backups')
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions('admin.*')
  @ApiOperation({ summary: 'Create manual backup' })
  createBackup(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateBackupRequestDto,
    @ClientIp() ip?: string,
    @RequestId() requestId?: string,
  ) {
    return this.backupService.createBackup(
      user.companyId!,
      user.sub,
      dto.type ?? BackupType.FULL,
      BackupTrigger.MANUAL,
      ip,
      requestId,
    );
  }

  @Get('backups/:id')
  @RequirePermissions('admin.*')
  @ApiOperation({ summary: 'Get backup job by ID' })
  @ApiParam({ name: 'id', format: 'uuid' })
  getBackup(@CurrentUser() user: JwtPayload, @Param('id', ParseUUIDPipe) id: string) {
    return this.backupService.getBackup(user.companyId!, id);
  }

  @Get('backups/:id/download')
  @RequirePermissions('admin.*')
  @ApiOperation({ summary: 'Download backup file' })
  @ApiParam({ name: 'id', format: 'uuid' })
  async downloadBackup(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Res() res: Response,
    @ClientIp() ip?: string,
    @RequestId() requestId?: string,
  ) {
    const file = await this.backupService.getDownloadPath(user.companyId!, id);
    await this.audit.log({
      companyId: user.companyId!,
      userId: user.sub,
      action: 'DOWNLOAD',
      entityType: 'backup',
      entityId: id,
      ipAddress: ip ?? null,
      requestId: requestId ?? null,
    });
    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${file.fileName}"`);
    fs.createReadStream(file.filePath).pipe(res);
  }

  @Post('backups/:id/restore')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('admin.*')
  @ApiOperation({ summary: 'Restore from backup' })
  @ApiParam({ name: 'id', format: 'uuid' })
  restoreBackup(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @ClientIp() ip?: string,
    @RequestId() requestId?: string,
  ) {
    return this.backupService.restoreBackup(user.companyId!, id, user.sub, ip, requestId);
  }

  @Get('users')
  @RequirePermissions('admin.users.view')
  @ApiOperation({ summary: 'List company users' })
  listUsers(@CurrentUser() user: JwtPayload, @Query() query: AdminListQueryDto) {
    return this.adminService.listUsers(user.companyId!, query);
  }

  @Post('users')
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions('admin.users.create')
  @ApiOperation({ summary: 'Create user' })
  createUser(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateAdminUserDto,
    @ClientIp() ip?: string,
    @RequestId() requestId?: string,
  ) {
    return this.adminService.createUser(user.companyId!, dto, user.sub, ip, requestId);
  }

  @Patch('users/:id/status')
  @RequirePermissions('admin.users.manage')
  @ApiOperation({ summary: 'Block or unblock user in this company' })
  updateUserStatus(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserStatusDto,
    @ClientIp() ip?: string,
    @RequestId() requestId?: string,
  ) {
    return this.adminService.updateUserStatus(
      user.companyId!,
      id,
      dto.status,
      user.sub,
      ip,
      requestId,
    );
  }

  @Get('sessions')
  @RequirePermissions('admin.*')
  @ApiOperation({ summary: 'List active sessions' })
  listSessions(@CurrentUser() user: JwtPayload, @Query() query: AdminListQueryDto) {
    return this.adminService.listSessions(user.companyId!, query);
  }

  @Post('sessions/:id/revoke')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('admin.*')
  @ApiOperation({ summary: 'Revoke session' })
  revokeSession(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @ClientIp() ip?: string,
    @RequestId() requestId?: string,
  ) {
    return this.adminService.revokeSession(user.companyId!, id, user.sub, ip, requestId);
  }

  @Get('devices')
  @RequirePermissions('admin.*')
  @ApiOperation({ summary: 'List devices' })
  listDevices(@CurrentUser() user: JwtPayload, @Query() query: AdminListQueryDto) {
    return this.adminService.listDevices(user.companyId!, query);
  }

  @Patch('devices/:id/status')
  @RequirePermissions('admin.*')
  @ApiOperation({ summary: 'Block or unblock device' })
  updateDeviceStatus(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDeviceStatusDto,
    @ClientIp() ip?: string,
    @RequestId() requestId?: string,
  ) {
    return this.adminService.updateDeviceStatus(
      user.companyId!,
      id,
      dto.status,
      user.sub,
      ip,
      requestId,
    );
  }

  @Get('audit-logs')
  @RequirePermissions('admin.audit.view')
  @ApiOperation({ summary: 'Audit log list' })
  listAuditLogs(@CurrentUser() user: JwtPayload, @Query() query: AdminAuditListQueryDto) {
    return this.adminService.listAuditLogs(user.companyId!, query);
  }

  @Get('roles')
  @RequirePermissions('admin.*')
  @ApiOperation({ summary: 'List roles' })
  listRoles(@CurrentUser() user: JwtPayload) {
    return this.adminService.listRoles(user.companyId!);
  }

  @Get('permissions')
  @RequirePermissions('admin.*')
  @ApiOperation({ summary: 'List permissions' })
  listPermissions() {
    return this.adminService.listPermissions();
  }
}
