import { Module } from '@nestjs/common';
import { CurrencyController } from './api/currency.controller';
import { CurrencyService } from './application/currency.service';

@Module({
  controllers: [CurrencyController],
  providers: [CurrencyService],
  exports: [CurrencyService],
})
export class CurrencyModule {}
