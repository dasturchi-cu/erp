import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Res,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Response } from 'express';
import * as fs from 'fs';
import { ReportsService } from '../application/reports.service';
import {
  BaseReportQueryDto,
  GenerateReportRequestDto,
  GenerateReportResponseDto,
  ReportCatalogQueryDto,
  ReportDataResponseDto,
  ReportHistoryQueryDto,
  ReportJobResponseDto,
} from './dto/reports.dto';
import { CompanyIsolationGuard } from '../../../core/guards/company-isolation.guard';
import { RequireModule, RequirePermissions } from '../../../core/decorators/auth.decorators';
import { CurrentUser, ClientIp, RequestId } from '../../../core/decorators/current-user.decorator';
import { JwtPayload } from '../../auth/interfaces/jwt-payload.interface';

@ApiTags('Reports')
@ApiBearerAuth()
@Controller('reports')
@UseGuards(CompanyIsolationGuard)
@RequireModule('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('catalog')
  @RequirePermissions('reports.view')
  @ApiOperation({ summary: 'List available report types' })
  @ApiResponse({ status: 200, description: 'Paginated report catalog' })
  catalog(@CurrentUser() user: JwtPayload, @Query() query: ReportCatalogQueryDto) {
    return this.reportsService.getCatalog(user.companyId!, {
      page: query.resolvedPage(),
      limit: query.resolvedLimit(),
      q: query.q,
      category: query.category,
      sort: query.sort,
    });
  }

  @Get()
  @RequirePermissions('reports.view')
  @ApiOperation({ summary: 'List reports (alias for catalog)' })
  list(@CurrentUser() user: JwtPayload, @Query() query: ReportCatalogQueryDto) {
    return this.catalog(user, query);
  }

  @Get('history')
  @RequirePermissions('reports.view')
  @ApiOperation({ summary: 'Recent report exports' })
  history(@CurrentUser() user: JwtPayload, @Query() query: ReportHistoryQueryDto) {
    return this.reportsService.getHistory(
      user.companyId!,
      user.sub,
      query.resolvedPage(),
      query.resolvedLimit(),
    );
  }

  @Get('cogs')
  @RequirePermissions('reports.financial')
  @ApiOperation({ summary: 'COGS detail report (FIFO allocations)' })
  @ApiResponse({ status: 200, type: ReportDataResponseDto })
  cogs(@CurrentUser() user: JwtPayload, @Query() query: BaseReportQueryDto) {
    return this.reportsService.getCogs(
      user.companyId!,
      user.sub,
      user.permissions,
      query as never,
      this.canViewAllSales(user),
    );
  }

  @Get('sales')
  @RequirePermissions('reports.sales')
  @ApiOperation({ summary: 'Sales reports' })
  @ApiResponse({ status: 200, type: ReportDataResponseDto })
  sales(@CurrentUser() user: JwtPayload, @Query() query: BaseReportQueryDto) {
    return this.categoryReport(user, 'sales', query);
  }

  @Get('products')
  @RequirePermissions('reports.sales')
  @ApiOperation({ summary: 'Product reports' })
  @ApiResponse({ status: 200, type: ReportDataResponseDto })
  products(@CurrentUser() user: JwtPayload, @Query() query: BaseReportQueryDto) {
    return this.categoryReport(user, 'products', query);
  }

  @Get('inventory')
  @RequirePermissions('reports.inventory')
  @ApiOperation({ summary: 'Inventory reports' })
  @ApiResponse({ status: 200, type: ReportDataResponseDto })
  inventory(@CurrentUser() user: JwtPayload, @Query() query: BaseReportQueryDto) {
    return this.categoryReport(user, 'inventory', query);
  }

  @Get('customers')
  @RequirePermissions('reports.view')
  @ApiOperation({ summary: 'Customer reports' })
  @ApiResponse({ status: 200, type: ReportDataResponseDto })
  customers(@CurrentUser() user: JwtPayload, @Query() query: BaseReportQueryDto) {
    return this.categoryReport(user, 'customers', query);
  }

  @Get('suppliers')
  @RequirePermissions('reports.view')
  @ApiOperation({ summary: 'Supplier reports' })
  @ApiResponse({ status: 200, type: ReportDataResponseDto })
  suppliers(@CurrentUser() user: JwtPayload, @Query() query: BaseReportQueryDto) {
    return this.categoryReport(user, 'suppliers', query);
  }

  @Get('debt')
  @RequirePermissions('reports.debt')
  @ApiOperation({ summary: 'Debt reports' })
  @ApiResponse({ status: 200, type: ReportDataResponseDto })
  debt(@CurrentUser() user: JwtPayload, @Query() query: BaseReportQueryDto) {
    return this.categoryReport(user, 'debt', query);
  }

  @Get('expenses')
  @RequirePermissions('reports.financial')
  @ApiOperation({ summary: 'Expense reports' })
  @ApiResponse({ status: 200, type: ReportDataResponseDto })
  expenses(@CurrentUser() user: JwtPayload, @Query() query: BaseReportQueryDto) {
    return this.categoryReport(user, 'expenses', query);
  }

  @Get('profit')
  @RequirePermissions('reports.financial')
  @ApiOperation({ summary: 'Profit reports' })
  @ApiResponse({ status: 200, type: ReportDataResponseDto })
  profit(@CurrentUser() user: JwtPayload, @Query() query: BaseReportQueryDto) {
    return this.categoryReport(user, 'profit', query);
  }

  @Post('generate')
  @HttpCode(HttpStatus.ACCEPTED)
  @RequirePermissions('reports.generate')
  @ApiOperation({ summary: 'Generate report export (PDF, Excel, CSV)' })
  @ApiResponse({ status: 202, type: GenerateReportResponseDto })
  generate(
    @CurrentUser() user: JwtPayload,
    @Body() dto: GenerateReportRequestDto,
    @ClientIp() ip?: string,
    @RequestId() requestId?: string,
  ) {
    return this.reportsService.generate(
      user.companyId!,
      user.sub,
      user.permissions,
      {
        template: dto.template,
        category: dto.category,
        format: dto.format,
        period: dto.period,
        dateFrom: dto.date_from,
        dateTo: dto.date_to,
        branchId: dto.branch_id,
        warehouseId: dto.warehouse_id,
        currency: dto.currency,
        q: dto.q,
        sort: dto.sort,
      },
      this.canViewAllSales(user),
      ip,
      requestId,
    );
  }

  @Get('jobs/:id')
  @RequirePermissions('reports.view')
  @ApiOperation({ summary: 'Check report generation status' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, type: ReportJobResponseDto })
  jobStatus(@CurrentUser() user: JwtPayload, @Param('id', ParseUUIDPipe) id: string) {
    return this.reportsService.getJob(user.companyId!, id);
  }

  @Get('jobs/:id/download')
  @RequirePermissions('reports.view')
  @ApiOperation({ summary: 'Download completed report file' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  async download(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Res({ passthrough: true }) res: Response,
    @ClientIp() ip?: string,
    @RequestId() requestId?: string,
  ) {
    const file = await this.reportsService.getDownload(user.companyId!, user.sub, id, ip, requestId);
    res.set({
      'Content-Type': file.mimeType,
      'Content-Disposition': `attachment; filename="${file.fileName}"`,
    });
    const stream = fs.createReadStream(file.filePath);
    return new StreamableFile(stream);
  }

  @Get(':id/download')
  @RequirePermissions('reports.view')
  @ApiOperation({ summary: 'Download report by job ID (alternate path)' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  downloadAlt(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Res({ passthrough: true }) res: Response,
    @ClientIp() ip?: string,
    @RequestId() requestId?: string,
  ) {
    return this.download(user, id, res, ip, requestId);
  }

  private categoryReport(user: JwtPayload, category: string, query: BaseReportQueryDto) {
    return this.reportsService.runCategoryReport(
      category,
      user.sub,
      user.companyId!,
      user.permissions,
      {
        template: query.template,
        period: query.period,
        date_from: query.date_from,
        date_to: query.date_to,
        branch_id: query.branch_id,
        warehouse_id: query.warehouse_id,
        currency: query.currency,
        page: query.resolvedPage(),
        limit: query.resolvedLimit(),
        sort: query.sort,
        q: query.q,
      },
      this.canViewAllSales(user),
    );
  }

  private canViewAllSales(user: JwtPayload): boolean {
    return (
      user.permissions.includes('sales.view_all') ||
      user.permissions.includes('sales.*') ||
      user.permissions.includes('admin.*')
    );
  }
}
