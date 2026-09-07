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
      await this.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS sales_number_trgm_idx ON sales USING gin (sale_number gin_trgm_ops)`);
      await this.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS customers_name_trgm_idx ON customers USING gin (name gin_trgm_ops)`);
      await this.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS users_first_name_trgm_idx ON users USING gin (first_name gin_trgm_ops)`);
    } catch (err) {
      console.error('Error creating GIN indexes:', err);
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  /**
   * NOTE: this is currently a no-op in practice and NOT a real isolation
   * boundary. `set_config(..., true)` is transaction-local in Postgres, but
   * this call runs as its own standalone statement (no surrounding
   * `$transaction`), so the setting is discarded before any later query in
   * the same request can see it — doubly so with Prisma's pooled
   * connections, where a later query may not even reuse this connection.
   * There are no RLS policies in the schema that read `app.company_id`
   * today, so nothing is silently broken by this — but don't add RLS
   * policies assuming this plumbing works without first moving to a
   * per-request-pinned connection (e.g. wrapping the whole request in one
   * `$transaction`, or a raw `pg` client held for the request lifetime).
   * Company isolation is actually enforced today by every query explicitly
   * filtering `where: { companyId }` — see CompanyIsolationGuard.
   */
  async setCompanyContext(companyId: string): Promise<void> {
    await this.$executeRawUnsafe(
      `SELECT set_config('app.company_id', $1, true)`,
      companyId,
    );
  }
}
