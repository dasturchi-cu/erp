import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { CoreModule } from './core/core.module';
import { AuthModule } from './modules/auth/auth.module';
import { HealthModule } from './modules/health/health.module';
import { CurrencyModule } from './modules/currency/currency.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { ProductsModule } from './modules/products/products.module';
import { CustomersModule } from './modules/customers/customers.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { SalesModule } from './modules/sales/sales.module';
import { DebtModule } from './modules/debt/debt.module';
import { SuppliersModule } from './modules/suppliers/suppliers.module';
import { AdminModule } from './modules/admin/admin.module';
import { ReportsModule } from './modules/reports/reports.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { ExpensesModule } from './modules/expenses/expenses.module';
import { SaasModule } from './modules/saas/saas.module';
import { SaaSAdminModule } from './modules/saas-admin/saas-admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([
      {
        ttl: parseInt(process.env.THROTTLE_TTL ?? '900000', 10),
        limit: parseInt(process.env.THROTTLE_LIMIT ?? '1000', 10),
      },
    ]),
    CoreModule,
    AuthModule,
    HealthModule,
    CurrencyModule,
    CategoriesModule,
    ProductsModule,
    CustomersModule,
    InventoryModule,
    SalesModule,
    DebtModule,
    SuppliersModule,
    AdminModule,
    ReportsModule,
    AnalyticsModule,
    NotificationsModule,
    ExpensesModule,
    SaasModule,
    SaaSAdminModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
