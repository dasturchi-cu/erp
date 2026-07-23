import { Module } from '@nestjs/common';
import { CurrencyModule } from '../currency/currency.module';
import { SuppliersModule } from '../suppliers/suppliers.module';
import { InventoryController } from './api/inventory.controller';
import { InventoryService } from './application/inventory.service';

@Module({
  imports: [CurrencyModule, SuppliersModule],
  controllers: [InventoryController],
  providers: [InventoryService],
  exports: [InventoryService],
})
export class InventoryModule {}
