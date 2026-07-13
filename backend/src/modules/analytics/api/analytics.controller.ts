import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AnalyticsService } from '../application/analytics.service';
import { AnalyticsOverviewResponseDto, AnalyticsQueryDto } from './dto/analytics.dto';
import { CompanyIsolationGuard } from '../../../core/guards/company-isolation.guard';
import { RequireModule, RequirePermissions } from '../../../core/decorators/auth.decorators';
import { CurrentUser, ClientIp, RequestId } from '../../../core/decorators/current-user.decorator';
import { JwtPayload } from '../../auth/interfaces/jwt-payload.interface';

@ApiTags('Analytics')
@ApiBearerAuth()
@Controller('analytics')
@UseGuards(CompanyIsolationGuard)
@RequireModule('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('overview')
  @RequirePermissions('analytics.view')
  @ApiOperation({ summary: 'Analytics overview — KPI metrics, chart, highlights' })
  @ApiResponse({ status: 200, type: AnalyticsOverviewResponseDto })
  overview(
    @CurrentUser() user: JwtPayload,
    @Query() query: AnalyticsQueryDto,
    @ClientIp() ip?: string,
    @RequestId() requestId?: string,
  ) {
    return this.analyticsService.getOverview(
      user.companyId!,
      user.sub,
      query,
      this.canViewAllSales(user),
      ip,
      requestId,
    );
  }

  @Get('metrics')
  @RequirePermissions('analytics.view')
  @ApiOperation({ summary: 'KPI metric cards' })
  metrics(@CurrentUser() user: JwtPayload, @Query() query: AnalyticsQueryDto) {
    return this.analyticsService.getMetrics(user.companyId!, query as never, user.sub, this.canViewAllSales(user));
  }

  @Get('dashboard/kpi')
  @RequirePermissions('analytics.view')
  @ApiOperation({ summary: 'Dashboard KPI aggregates' })
  dashboardKpi(@CurrentUser() user: JwtPayload, @Query() query: AnalyticsQueryDto) {
    return this.analyticsService.getDashboardKpi(user.companyId!, query, user.sub, this.canViewAllSales(user));
  }

  @Get('dashboard/enterprise')
  @RequirePermissions('analytics.view')
  @ApiOperation({ summary: 'Enterprise dashboard raw SQL aggregates' })
  enterpriseDashboard(@CurrentUser() user: JwtPayload) {
    return this.analyticsService.getEnterpriseDashboard(
      user.companyId!,
      user.sub,
      this.canViewAllSales(user),
    );
  }

  @Get('sales')
  @RequirePermissions('analytics.view')
  @ApiOperation({ summary: 'Sales analytics' })
  sales(@CurrentUser() user: JwtPayload, @Query() query: AnalyticsQueryDto) {
    return this.analyticsService.getSalesAnalytics(user.companyId!, query as never, user.sub, this.canViewAllSales(user));
  }

  @Get('revenue')
  @RequirePermissions('analytics.view')
  @ApiOperation({ summary: 'Revenue analytics' })
  revenue(@CurrentUser() user: JwtPayload, @Query() query: AnalyticsQueryDto) {
    return this.analyticsService.getRevenueAnalytics(user.companyId!, query as never, user.sub, this.canViewAllSales(user));
  }

  @Get('profit')
  @RequirePermissions('analytics.view')
  @ApiOperation({ summary: 'Profit analytics' })
  profit(@CurrentUser() user: JwtPayload, @Query() query: AnalyticsQueryDto) {
    return this.analyticsService.getProfitAnalytics(user.companyId!, query as never, user.sub, this.canViewAllSales(user));
  }

  @Get('suppliers')
  @RequirePermissions('analytics.view')
  @ApiOperation({ summary: 'Supplier analytics' })
  suppliers(@CurrentUser() user: JwtPayload, @Query() query: AnalyticsQueryDto) {
    return this.analyticsService.getSupplierAnalytics(user.companyId!, query as never);
  }

  @Get('customers')
  @RequirePermissions('analytics.view')
  @ApiOperation({ summary: 'Customer analytics' })
  customers(@CurrentUser() user: JwtPayload, @Query() query: AnalyticsQueryDto) {
    return this.analyticsService.getCustomerAnalytics(user.companyId!, query as never);
  }

  @Get('products')
  @RequirePermissions('analytics.view')
  @ApiOperation({ summary: 'Product analytics' })
  products(@CurrentUser() user: JwtPayload, @Query() query: AnalyticsQueryDto) {
    return this.analyticsService.getProductAnalytics(user.companyId!, query as never, user.sub, this.canViewAllSales(user));
  }

  @Get('top/products')
  @RequirePermissions('analytics.view')
  @ApiOperation({ summary: 'Top selling products' })
  topProducts(@CurrentUser() user: JwtPayload, @Query() query: AnalyticsQueryDto) {
    return this.analyticsService.getTopProducts(
      user.companyId!,
      query as never,
      user.sub,
      this.canViewAllSales(user),
      query.limit ?? 10,
    );
  }

  @Get('top/customers')
  @RequirePermissions('analytics.view')
  @ApiOperation({ summary: 'Top customers by revenue' })
  topCustomers(@CurrentUser() user: JwtPayload, @Query() query: AnalyticsQueryDto) {
    return this.analyticsService.getTopCustomers(
      user.companyId!,
      query as never,
      user.sub,
      this.canViewAllSales(user),
      query.limit ?? 10,
    );
  }

  @Get('top/suppliers')
  @RequirePermissions('analytics.view')
  @ApiOperation({ summary: 'Top suppliers by receipt volume' })
  topSuppliers(@CurrentUser() user: JwtPayload, @Query() query: AnalyticsQueryDto) {
    return this.analyticsService.getTopSuppliers(user.companyId!, query as never, query.limit ?? 10);
  }

  @Get('charts/revenue-profit')
  @RequirePermissions('analytics.view')
  @ApiOperation({ summary: 'Revenue and profit chart series' })
  revenueProfitChart(@CurrentUser() user: JwtPayload, @Query() query: AnalyticsQueryDto) {
    return this.analyticsService.getRevenueProfitChart(
      user.companyId!,
      query as never,
      user.sub,
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
