import { Controller, Get, Post, Patch, Delete, Body, Query, Param, UseGuards } from '@nestjs/common';
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
  @Patch('company/:id/users/:userId/branch')
  updateUserBranch(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Body() dto: { branchId: string | null }
  ) {
    return this.saasService.updateUserBranch(id, userId, dto.branchId);
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
}
