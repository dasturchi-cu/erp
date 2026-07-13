import { Controller, Get, Post, Body, Query, UseGuards, Req, Ip } from '@nestjs/common';
import { SaasService } from '../application/saas.service';
import { JwtAuthGuard } from '../../../core/guards/jwt-auth.guard';
import { CurrentUser } from '../../../core/decorators/current-user.decorator';
import { Request } from 'express';
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
  checkRemoteUpdate(@Query('currentVersion') currentVersion: string) {
    return this.saasService.checkRemoteUpdate(currentVersion);
  }

  @Get('monitoring/health')
  @ApiOperation({ summary: 'Get system health monitoring statistics' })
  getSystemMonitoring() {
    return this.saasService.getSystemMonitoring();
  }
}
