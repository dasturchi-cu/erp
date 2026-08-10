import { Controller, Get, Post, Patch, Delete, Body, Query, Param, UseGuards, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { SaaSAdminService } from '../application/saas-admin.service';
import { SaasJwtGuard } from '../guards/saas-jwt.guard';
import {
  SaaSLoginDto,
  CreateCompanyDto,
  UpdateCompanyDto,
  CreateSaaSAdminDto,
  UpdateSaaSAdminDto,
  SaaSListQueryDto,
  SaasLicenseDto
} from './dto/saas-admin.dto';

import { Public } from '../../../core/decorators/auth.decorators';

@Controller('saas-admin')
@Public()
export class SaaSAdminController {
  constructor(private readonly saasService: SaaSAdminService) {}

  // --- ANONYMOUS AUTH ENDPOINTS ---

  @Post('auth/login')
  login(@Body() dto: SaaSLoginDto) {
    return this.saasService.login(dto);
  }

  @Post('auth/refresh')
  refresh(@Body('refreshToken') refreshToken: string) {
    return this.saasService.refresh(refreshToken);
  }

  // --- PROTECTED TELEMETRY & CRUD ENDPOINTS ---

  @UseGuards(SaasJwtGuard)
  @Get('dashboard')
  getDashboardStats() {
    return this.saasService.getDashboardStats();
  }

  @UseGuards(SaasJwtGuard)
  @Get('companies')
  getCompanies(@Query() query: SaaSListQueryDto) {
    return this.saasService.getCompanies(query);
  }

  @UseGuards(SaasJwtGuard)
  @Post('companies')
  createCompany(@Body() dto: CreateCompanyDto) {
    return this.saasService.createCompany(dto);
  }

  @UseGuards(SaasJwtGuard)
  @Get('company/:id')
  getCompanyProfile(@Param('id') id: string) {
    return this.saasService.getCompanyProfile(id);
  }

  @UseGuards(SaasJwtGuard)
  @Patch('company/:id')
  updateCompany(@Param('id') id: string, @Body() dto: UpdateCompanyDto) {
    return this.saasService.updateCompany(id, dto);
  }

  @UseGuards(SaasJwtGuard)
  @Delete('company/:id')
  deleteCompany(@Param('id') id: string) {
    return this.saasService.deleteCompany(id);
  }

  @UseGuards(SaasJwtGuard)
  @Get('company/:id/branches')
  getCompanyBranches(@Param('id') id: string) {
    return this.saasService.getCompanyBranches(id);
  }

  @UseGuards(SaasJwtGuard)
  @Post('company/:id/branches')
  createCompanyBranch(@Param('id') id: string, @Body() dto: { name: string; address?: string }) {
    return this.saasService.createCompanyBranch(id, dto);
  }

  @UseGuards(SaasJwtGuard)
  @Get('company/:id/users')
  getCompanyUsers(@Param('id') id: string) {
    return this.saasService.getCompanyUsers(id);
  }

  @UseGuards(SaasJwtGuard)
  @Post('company/:id/users')
  createCompanyUser(
    @Param('id') id: string,
    @Body() dto: {
      email: string;
      password?: string;
      firstName: string;
      lastName: string;
      roleName: string;
    }
  ) {
    return this.saasService.createCompanyUser(id, dto);
  }

  @UseGuards(SaasJwtGuard)
  @Patch('company/:id/users/:userId/branch')
  updateUserBranch(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Body() dto: { branchId: string | null }
  ) {
    return this.saasService.updateUserBranch(id, userId, dto.branchId);
  }

  @UseGuards(SaasJwtGuard)
  @Patch('company/:id/users/:userId/password')
  changeUserPassword(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Body('password') password: string
  ) {
    return this.saasService.changeUserPassword(id, userId, password);
  }

  @UseGuards(SaasJwtGuard)
  @Patch('company/:id/license')
  updateLicense(@Param('id') id: string, @Body() dto: SaasLicenseDto) {
    return this.saasService.updateLicense(id, dto);
  }

  // --- SUPER ADMIN USER MANAGEMENT ---

  @UseGuards(SaasJwtGuard)
  @Get('admins')
  getAdmins() {
    return this.saasService.getAdmins();
  }

  @UseGuards(SaasJwtGuard)
  @Post('admins')
  createAdmin(@Body() dto: CreateSaaSAdminDto) {
    return this.saasService.createAdmin(dto);
  }

  @UseGuards(SaasJwtGuard)
  @Patch('admins/:id')
  updateAdmin(@Param('id') id: string, @Body() dto: UpdateSaaSAdminDto) {
    return this.saasService.updateAdmin(id, dto);
  }

  @UseGuards(SaasJwtGuard)
  @Delete('admins/:id')
  deleteAdmin(@Param('id') id: string) {
    return this.saasService.deleteAdmin(id);
  }

  @UseGuards(SaasJwtGuard)
  @Get('releases')
  getReleases() {
    return this.saasService.getReleases();
  }

  @UseGuards(SaasJwtGuard)
  @Post('releases/upload')
  @UseInterceptors(FileInterceptor('file'))
  uploadRelease(
    @UploadedFile() file: any,
    @Body('version') version: string,
    @Body('status') status: string,
    @Body('rolloutTarget') rolloutTarget: string,
    @Body('whatsNew') whatsNew: string,
    @Body('bugFixes') bugFixes: string,
    @Body('breakingChanges') breakingChanges: string,
    @Body('estUpdateTime') estUpdateTime: string,
  ) {
    return this.saasService.createReleaseFromUpload(file, {
      version,
      status,
      rolloutTarget,
      whatsNew,
      bugFixes,
      breakingChanges,
      estUpdateTime: parseInt(estUpdateTime, 10) || 2,
    });
  }

  @UseGuards(SaasJwtGuard)
  @Patch('releases/:id/status')
  updateReleaseStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.saasService.updateReleaseStatus(id, status);
  }

  @UseGuards(SaasJwtGuard)
  @Post('releases/:id/emergency-stop')
  emergencyStop(@Param('id') id: string) {
    return this.saasService.emergencyStop(id);
  }

  @UseGuards(SaasJwtGuard)
  @Delete('releases/:id')
  deleteRelease(@Param('id') id: string) {
    return this.saasService.deleteRelease(id);
  }

  @UseGuards(SaasJwtGuard)
  @Get('releases/:id/progress')
  getReleaseProgress(@Param('id') id: string) {
    return this.saasService.getReleaseProgress(id);
  }

  @UseGuards(SaasJwtGuard)
  @Get('releases/:id/history')
  getReleaseHistory(@Param('id') id: string) {
    return this.saasService.getReleaseHistory(id);
  }

  @UseGuards(SaasJwtGuard)
  @Get('health-scores')
  getHealthScores() {
    return this.saasService.getHealthScores();
  }
}
