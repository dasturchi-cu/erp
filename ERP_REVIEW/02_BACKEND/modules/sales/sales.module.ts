import { Module } from '@nestjs/common';
import { CurrencyModule } from '../currency/currency.module';
import { DebtModule } from '../debt/debt.module';
import { SalesController } from './api/sales.controller';
import { SalesService } from './application/sales.service';

@Module({
  imports: [CurrencyModule, DebtModule],
  controllers: [SalesController],
  providers: [SalesService],
  exports: [SalesService],
})
export class SalesModule {}
