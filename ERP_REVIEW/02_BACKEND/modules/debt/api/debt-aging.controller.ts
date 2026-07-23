import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Res,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Response } from 'express';
import { DebtAgingService } from '../application/debt-aging.service';
import {
  DebtAgingExportDto,
  DebtAgingQueryDto,
} from './dto/debt-aging.dto';
import { CompanyIsolationGuard } from '../../../core/guards/company-isolation.guard';
import { RequireModule, RequirePermissions } from '../../../core/decorators/auth.decorators';
import { CurrentUser, ClientIp, RequestId } from '../../../core/decorators/current-user.decorator';
import { JwtPayload } from '../../auth/interfaces/jwt-payload.interface';

@ApiTags('Debt Aging')
@ApiBearerAuth()
@Controller('debt/aging')
@UseGuards(CompanyIsolationGuard)
@RequireModule('debt')
export class DebtAgingController {
  constructor(private readonly debtAgingService: DebtAgingService) {}

  @Get()
  @RequirePermissions('debt.aging')
  @ApiOperation({ summary: 'Customer aging buckets (legacy + supplier summary)' })
  legacy(@CurrentUser() user: JwtPayload) {
    return this.debtAgingService.getLegacyAging(user.companyId!);
  }

  @Get('summary')
  @RequirePermissions('debt.aging')
  @ApiOperation({ summary: 'Combined customer and supplier aging summary' })
  summary(@CurrentUser() user: JwtPayload, @Query() query: DebtAgingQueryDto) {
    return this.debtAgingService.getSummary(user.companyId!, query);
  }

  @Get('customers')
  @RequirePermissions('debt.aging')
  @ApiOperation({ summary: 'Customer aging detail list with filters' })
  customers(@CurrentUser() user: JwtPayload, @Query() query: DebtAgingQueryDto) {
    return this.debtAgingService.getCustomerAging(user.companyId!, query);
  }

  @Get('suppliers')
  @RequirePermissions('debt.aging')
  @ApiOperation({ summary: 'Supplier aging detail list with filters' })
  suppliers(@CurrentUser() user: JwtPayload, @Query() query: DebtAgingQueryDto) {
    return this.debtAgingService.getSupplierAging(user.companyId!, query);
  }

  @Get('report')
  @RequirePermissions('debt.aging')
  @ApiOperation({ summary: 'Full aging report with summary, buckets, and paginated rows' })
  report(@CurrentUser() user: JwtPayload, @Query() query: DebtAgingQueryDto) {
    return this.debtAgingService.getReport(user.companyId!, query);
  }

  @Post('export')
  @RequirePermissions('debt.aging.export')
  @ApiOperation({ summary: 'Export aging report (CSV, XLSX, PDF)' })
  @ApiResponse({ status: 201, description: 'File download' })
  async export(
    @CurrentUser() user: JwtPayload,
    @Body() dto: DebtAgingExportDto,
    @Res({ passthrough: true }) res: Response,
    @ClientIp() ip?: string,
    @RequestId() requestId?: string,
  ) {
    const file = await this.debtAgingService.exportAging(
      user.companyId!,
      user.sub,
      dto,
      ip,
      requestId,
    );
    res.set({
      'Content-Type': file.mimeType,
      'Content-Disposition': `attachment; filename="${file.fileName}"`,
    });
    return new StreamableFile(file.buffer);
  }
}
