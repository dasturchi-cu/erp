import { Module } from '@nestjs/common';
import { ReportsController } from './api/reports.controller';
import { ReportsService } from './application/reports.service';
import { ReportExportService } from './application/report-export.service';
import { SalesReportProvider } from './application/providers/sales-report.provider';
import { ProductReportProvider } from './application/providers/product-report.provider';
import { InventoryReportProvider } from './application/providers/inventory-report.provider';
import { CustomerReportProvider } from './application/providers/customer-report.provider';
import { SupplierReportProvider } from './application/providers/supplier-report.provider';
import { DebtReportProvider } from './application/providers/debt-report.provider';
import { ExpenseReportProvider } from './application/providers/expense-report.provider';
import { ProfitReportProvider } from './application/providers/profit-report.provider';

@Module({
  controllers: [ReportsController],
  providers: [
    ReportsService,
    ReportExportService,
    SalesReportProvider,
    ProductReportProvider,
    InventoryReportProvider,
    CustomerReportProvider,
    SupplierReportProvider,
    DebtReportProvider,
    ExpenseReportProvider,
    ProfitReportProvider,
  ],
  exports: [ReportsService],
})
export class ReportsModule {}
