import { Controller, Get, Post, Body, Query, UseGuards, Req, Ip, Res, Param } from '@nestjs/common';
import { SaasService } from '../application/saas.service';
import { JwtAuthGuard } from '../../../core/guards/jwt-auth.guard';
import { CurrentUser } from '../../../core/decorators/current-user.decorator';
import { Request, Response } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('SaaS Platform')
@Controller('saas')
export class SaasController {
  constructor(private readonly saasService: SaasService) {}

  @Post('license/validate')
  @ApiOperation({ summary: 'Validate software license key' })
  validateLicense(@Body('licenseKey') licenseKey: string) {
    return this.saasService.validateLicense(licenseKey);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('tenant/limits')
  @ApiOperation({ summary: 'Get active plan limitations for tenant' })
  getTenantLimits(@CurrentUser() user: any) {
    return this.saasService.getTenantLimits(user.companyId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('tenant/usage')
  @ApiOperation({ summary: 'Get active resource usage stats for tenant' })
  getTenantUsage(@CurrentUser() user: any) {
    return this.saasService.getTenantUsage(user.companyId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('backup/trigger')
  @ApiOperation({ summary: 'Trigger remote encrypted backup' })
  triggerRemoteBackup(
    @CurrentUser() user: any,
    @Ip() ip: string,
    @Req() req: Request,
  ) {
    const reqId = (req as any).id ?? 'saas-remote';
    return this.saasService.triggerRemoteBackup(user.companyId, user.sub, ip, reqId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('backup/restore')
  @ApiOperation({ summary: 'Trigger remote state restore from backup' })
  triggerRemoteRestore(
    @CurrentUser() user: any,
    @Body('backupId') backupId: string,
    @Ip() ip: string,
    @Req() req: Request,
  ) {
    const reqId = (req as any).id ?? 'saas-remote';
    return this.saasService.triggerRemoteRestore(user.companyId, backupId, user.sub, ip, reqId);
  }

  @Get('updates/check')
  @ApiOperation({ summary: 'Check remote app bundle updates' })
  checkRemoteUpdate(
    @Query('currentVersion') currentVersion: string,
    @Query('companyId') companyId: string,
  ) {
    return this.saasService.checkRemoteUpdateForCompany(currentVersion, companyId);
  }

  @Get('updates/download/:filename')
  @ApiOperation({ summary: 'Stream update zip package with Range support' })
  downloadUpdatePackage(@Param('filename') filename: string, @Res() res: Response) {
    return this.saasService.downloadUpdatePackage(filename, res);
  }

  @Get('updates/public-key')
  @ApiOperation({ summary: 'Get RSA public key for signature verification' })
  getPublicKey() {
    return this.saasService.getPublicKey();
  }

  @Post('updates/report')
  @ApiOperation({ summary: 'Report update progress from client device' })
  reportUpdateProgress(
    @Body() dto: {
      companyId: string;
      releaseId: string;
      previousVersion: string;
      currentVersion: string;
      status: string;
      failureReason?: string;
      durationMs?: number;
    }
  ) {
    return this.saasService.reportUpdateProgress(dto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('local-update/trigger')
  @ApiOperation({ summary: 'Trigger client update agent lifecycle' })
  triggerLocalUpdate(@CurrentUser() user: any) {
    return this.saasService.triggerLocalUpdate(user.companyId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('local-update/status')
  @ApiOperation({ summary: 'Get current update agent progress status' })
  getLocalUpdateStatus() {
    return this.saasService.getLocalUpdateStatus();
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('local-update/pause')
  @ApiOperation({ summary: 'Pause progressive update download' })
  pauseLocalDownload() {
    return this.saasService.pauseLocalDownload();
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('local-update/resume')
  @ApiOperation({ summary: 'Resume paused progressive update download' })
  resumeLocalDownload(@CurrentUser() user: any) {
    return this.saasService.resumeLocalDownload(user.companyId);
  }

  @Get('monitoring/health')
  @ApiOperation({ summary: 'Get system health monitoring statistics' })
  getSystemMonitoring() {
    return this.saasService.getSystemMonitoring();
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('heartbeat')
  @ApiOperation({ summary: 'Report store client heartbeat telemetry to SaaS' })
  recordHeartbeat(@CurrentUser() user: any, @Body() dto: any) {
    return this.saasService.recordHeartbeat(user.companyId, dto);
  }
}
