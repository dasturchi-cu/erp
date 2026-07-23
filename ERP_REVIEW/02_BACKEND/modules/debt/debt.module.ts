import { Module } from '@nestjs/common';
import { CurrencyModule } from '../currency/currency.module';
import { DebtAgingController } from './api/debt-aging.controller';
import { DebtPaymentsController } from './api/debt-payments.controller';
import { DebtAgingService } from './application/debt-aging.service';
import { DebtPaymentsService } from './application/debt-payments.service';
import { DebtService } from './application/debt.service';

@Module({
  imports: [CurrencyModule],
  controllers: [DebtPaymentsController, DebtAgingController],
  providers: [DebtPaymentsService, DebtService, DebtAgingService],
  exports: [DebtService, DebtPaymentsService, DebtAgingService],
})
export class DebtModule {}
