import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
    try {
      await this.$executeRawUnsafe(`CREATE EXTENSION IF NOT EXISTS pg_trgm`);
      await this.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS products_name_trgm_idx ON products USING gin (name gin_trgm_ops)`);
      await this.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS products_sku_trgm_idx ON products USING gin (sku gin_trgm_ops)`);
      await this.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS products_barcode_trgm_idx ON products USING gin (barcode gin_trgm_ops)`);
      await this.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS product_barcodes_barcode_trgm_idx ON product_barcodes USING gin (barcode gin_trgm_ops)`);
      await this.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS product_aliases_alias_trgm_idx ON product_aliases USING gin (alias gin_trgm_ops)`);
      await this.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS sales_number_trgm_idx ON sales USING gin (number gin_trgm_ops)`);
      await this.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS sales_customer_name_trgm_idx ON sales USING gin (customer_name gin_trgm_ops)`);
      await this.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS sales_cashier_trgm_idx ON sales USING gin (cashier gin_trgm_ops)`);
    } catch (err) {
      console.error('Error creating GIN indexes:', err);
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  async setCompanyContext(companyId: string): Promise<void> {
    await this.$executeRawUnsafe(
      `SELECT set_config('app.company_id', $1, true)`,
      companyId,
    );
  }
}
