import { Module } from '@nestjs/common';
import { CategoriesModule } from '../categories/categories.module';
import { CurrencyModule } from '../currency/currency.module';
import { InventoryModule } from '../inventory/inventory.module';
import { PosProductsController, ProductsController, AdminImportController } from './api/products.controller';
import { ProductsService } from './application/products.service';

@Module({
  imports: [CategoriesModule, CurrencyModule, InventoryModule],
  controllers: [ProductsController, PosProductsController, AdminImportController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}
