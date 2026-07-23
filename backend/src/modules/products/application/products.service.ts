import { Injectable } from '@nestjs/common';
import { Prisma, ProductStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { writeFileSync, existsSync, mkdirSync, unlinkSync } from 'fs';
import { join, extname, resolve, basename } from 'path';
import { randomUUID } from 'crypto';
import AdmZip from 'adm-zip';
import { Response } from 'express';
const Jimp = require('jimp');
import { PrismaService } from '../../../core/database/prisma.service';
import { AuditService } from '../../../core/audit/audit.service';
import { AppException } from '../../../core/exceptions/app.exception';
import {
  formatMoney,
  isNonNegativeMoney,
  parseMoney,
  uzsToUsd,
} from '../../../core/utils/money.util';
import {
  buildPaginationMeta,
  paginationSkip,
  parseSort,
} from '../../../core/utils/pagination.util';
import { CategoriesService } from '../../categories/application/categories.service';
import { CurrencyService } from '../../currency/application/currency.service';
import { InventoryService } from '../../inventory/application/inventory.service';
import { getProductStockTotal } from '../../inventory/application/inventory.helpers';
import {
  CreateProductRequestDto,
  PosProductsQueryDto,
  ProductImportRequestDto,
  ProductImportRowDto,
  ProductListQueryDto,
  ProductResponseDto,
  ProductSearchQueryDto,
  UpdateProductRequestDto,
} from '../api/dto/products.dto';

type ProductWithRelations = Prisma.ProductGetPayload<{
  include: {
    category: true;
    prices: true;
    images: true;
    barcodes: true;
    unitConversions: true;
    aliases: true;
  };
}>;

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly categoriesService: CategoriesService,
    private readonly currencyService: CurrencyService,
    private readonly inventoryService: InventoryService,
  ) {}

  async list(companyId: string, query: ProductListQueryDto) {
    const page = query.resolvedPage();
    const limit = query.resolvedLimit();
    const where: Prisma.ProductWhereInput = { companyId, deletedAt: null };

    if (query.status) where.status = query.status;
    if (query.categoryId) where.categoryId = query.categoryId;
    if (query.q) {
      where.OR = [
        { name: { contains: query.q, mode: 'insensitive' } },
        { sku: { contains: query.q, mode: 'insensitive' } },
        { barcode: { contains: query.q, mode: 'insensitive' } },
        { barcodes: { some: { barcode: { contains: query.q, mode: 'insensitive' } } } },
        { aliases: { some: { alias: { contains: query.q, mode: 'insensitive' } } } },
      ];
    }

    const sort = parseSort(
      query.sort,
      ['name', 'sku', 'salePriceUzs', 'createdAt'],
      [{ field: 'name', direction: 'asc' }],
    );

    if (query.stockLevel) {
      if (query.stockLevel === 'in_stock') {
        where.inventoryBatches = { some: { remainingQty: { gt: 0 } } };
      } else if (query.stockLevel === 'out') {
        where.inventoryBatches = { none: { remainingQty: { gt: 0 } } };
      } else if (query.stockLevel === 'low') {
        const lowStockRows = await this.prisma.$queryRawUnsafe<Array<{ product_id: string }>>(
          `SELECT product_id
           FROM inventory_batches
           WHERE company_id = $1::uuid AND remaining_qty > 0
           GROUP BY product_id
           HAVING SUM(remaining_qty) > 0 AND SUM(remaining_qty) <= 10`,
          companyId,
        );
        const lowStockIds = lowStockRows.map((r) => r.product_id);
        if (lowStockIds.length === 0) {
          return { data: [], meta: buildPaginationMeta(page, limit, 0) };
        }
        where.id = { in: lowStockIds };
      }
    }

    const orderBy = this.buildProductOrderBy(sort);

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.product.count({ where }),
      this.prisma.product.findMany({
        where,
        include: { category: true, prices: true, images: true, barcodes: true, unitConversions: true, aliases: true },
        orderBy,
        skip: paginationSkip(page, limit),
        take: limit,
      }),
    ]);

    const stockMap = await this.getStockMap(companyId, rows.map((r) => r.id));
    const data = await Promise.all(
      rows.map((row) => this.toProductResponse(companyId, row, stockMap.get(row.id))),
    );

    return { data, meta: buildPaginationMeta(page, limit, total) };
  }

  async search(companyId: string, query: ProductSearchQueryDto) {
    let ids: string[] | null = null;
    if (query.q) {
      const pattern = `%${query.q}%`;
      const matches: any[] = await this.prisma.$queryRawUnsafe(`
        SELECT DISTINCT p.id FROM products p
        LEFT JOIN product_barcodes pb ON pb.product_id = p.id
        LEFT JOIN product_aliases pa ON pa.product_id = p.id
        WHERE p.company_id = $1::uuid AND p.deleted_at IS NULL AND (
          p.name ILIKE $2 OR
          p.sku ILIKE $2 OR
          p.barcode ILIKE $2 OR
          pb.barcode ILIKE $2 OR
          pa.alias ILIKE $2
        )
        LIMIT 100
      `, companyId, pattern);
      ids = matches.map((m) => m.id);
      if (ids.length === 0) {
        return { data: [] };
      }
    }

    const rows = await this.prisma.product.findMany({
      where: {
        companyId,
        deletedAt: null,
        ...(ids ? { id: { in: ids } } : {}),
      },
      include: { category: true, prices: true, images: true, barcodes: true, unitConversions: true, aliases: true },
      take: 20,
      orderBy: { name: 'asc' },
    });

    const stockMap = await this.getStockMap(companyId, rows.map((r) => r.id));
    const data = await Promise.all(
      rows.map((row) => this.toProductResponse(companyId, row, stockMap.get(row.id))),
    );
    return { data };
  }

  async posProducts(companyId: string, query: PosProductsQueryDto) {
    const limit = Math.min(50, Math.max(1, parseInt(query.limit ?? '20', 10) || 20));
    
    let ids: string[] | null = null;
    if (query.q) {
      const pattern = `%${query.q}%`;
      const matches: any[] = await this.prisma.$queryRawUnsafe(`
        SELECT DISTINCT p.id FROM products p
        LEFT JOIN product_barcodes pb ON pb.product_id = p.id
        LEFT JOIN product_aliases pa ON pa.product_id = p.id
        WHERE p.company_id = $1::uuid AND p.deleted_at IS NULL AND p.status = 'ACTIVE' AND (
          p.name ILIKE $2 OR
          p.sku ILIKE $2 OR
          p.barcode ILIKE $2 OR
          pb.barcode ILIKE $2 OR
          pa.alias ILIKE $2
        )
        LIMIT 100
      `, companyId, pattern);
      ids = matches.map((m) => m.id);
      if (ids.length === 0) {
        return { data: [] };
      }
    }

    const where: Prisma.ProductWhereInput = {
      companyId,
      deletedAt: null,
      status: ProductStatus.ACTIVE,
      ...(ids ? { id: { in: ids } } : {}),
    };

    const rows = await this.prisma.product.findMany({
      where,
      include: { category: true, prices: true, images: true, barcodes: true, unitConversions: true, aliases: true },
      take: limit,
      orderBy: { name: 'asc' },
    });

    const stockMap = await this.getStockMap(companyId, rows.map((r) => r.id));
    const data = await Promise.all(
      rows.map((row) => this.toProductResponse(companyId, row, stockMap.get(row.id))),
    );
    return { data };
  }

  async getByBarcode(companyId: string, code: string): Promise<ProductResponseDto> {
    const product = await this.prisma.product.findFirst({
      where: {
        companyId,
        deletedAt: null,
        OR: [
          { barcode: code },
          { barcodes: { some: { barcode: code } } },
        ],
      },
      include: { category: true, prices: true, images: true, barcodes: true, unitConversions: true, aliases: true },
    });
    if (!product) {
      throw AppException.notFound('Product', code);
    }
    return this.toProductResponse(companyId, product);
  }

  async getById(companyId: string, id: string): Promise<ProductResponseDto> {
    const product = await this.findProductOrThrow(companyId, id);
    return this.toProductResponse(companyId, product);
  }

  async create(
    companyId: string,
    userId: string,
    dto: CreateProductRequestDto & { legacyId?: string },
    ip?: string,
    requestId?: string,
  ): Promise<ProductResponseDto> {
    try {
      const product = await this.prisma.$transaction(async (tx) => {
        return this.createInternal(tx, companyId, userId, dto);
      });

      await this.audit.log({
        companyId,
        userId,
        action: 'CREATE',
        entityType: 'product',
        entityId: product.id,
        newValue: { sku: product.sku, name: product.name },
        ipAddress: ip,
        requestId,
      });

      return this.toProductResponse(companyId, product);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        const target = (error.meta?.target as string[] | undefined) ?? [];
        if (target.includes('sku')) {
          throw AppException.duplicateSku(dto.sku);
        }
        if (target.includes('barcode')) {
          throw AppException.duplicateBarcode(dto.barcode ?? '');
        }
      }
      throw error;
    }
  }

  async createInternal(
    tx: Prisma.TransactionClient,
    companyId: string,
    userId: string,
    dto: CreateProductRequestDto & { legacyId?: string },
  ) {
    await this.categoriesService.ensureCategory(companyId, dto.categoryId);

    const purchasePriceUzs = parseMoney(dto.purchasePriceUzs);
    const salePriceUzs = parseMoney(dto.salePriceUzs);
    if (!isNonNegativeMoney(purchasePriceUzs) || !isNonNegativeMoney(salePriceUzs)) {
      throw AppException.validation('Validation failed', [
        { field: 'purchasePriceUzs', message: 'Must be >= 0', code: 'INVALID_PRICE' },
      ]);
    }

    const rate = await this.currencyService.getActiveRateOrThrow(companyId);
    const purchasePriceUsd = dto.purchasePriceUsd
      ? parseMoney(dto.purchasePriceUsd)
      : uzsToUsd(purchasePriceUzs, rate.rate);
    const salePriceUsd = dto.salePriceUsd
      ? parseMoney(dto.salePriceUsd)
      : uzsToUsd(salePriceUzs, rate.rate);

    const initialStock = dto.initialStock ? parseMoney(dto.initialStock) : new Decimal(0);
    if (initialStock.gt(0) && !dto.initialWarehouseId) {
      throw AppException.validation('Validation failed', [
        {
          field: 'initialWarehouseId',
          message: 'Required when initialStock > 0',
          code: 'REQUIRED',
        },
      ]);
    }

    if (initialStock.gt(0) && dto.initialWarehouseId) {
      const warehouse = await tx.warehouse.findFirst({
        where: { id: dto.initialWarehouseId, companyId, status: 'ACTIVE' },
      });
      if (!warehouse) {
        throw AppException.notFound('Warehouse', dto.initialWarehouseId);
      }
    }

    const created = await tx.product.create({
      data: {
        companyId,
        sku: dto.sku.trim(),
        barcode: dto.barcode?.trim() ?? null,
        name: dto.name.trim(),
        categoryId: dto.categoryId,
        legacyId: dto.legacyId?.trim() ?? null,
        unitOfMeasure: dto.unitOfMeasure ?? 'pcs',
        unitsPerBox: dto.unitsPerBox ? parseInt(dto.unitsPerBox, 10) : 1,
        minStockLevel: dto.minStockLevel ? parseMoney(dto.minStockLevel) : new Decimal(0),
        status: dto.status ?? ProductStatus.ACTIVE,
        pdfCatalogUrl: dto.pdfCatalogUrl?.trim() || null,
        techPassportUrl: dto.techPassportUrl?.trim() || null,
        userManualUrl: dto.userManualUrl?.trim() || null,
        prices: {
          create: {
            purchasePriceUzs,
            purchasePriceUsd,
            salePriceUzs,
            salePriceUsd,
            wholesalePriceUzs: dto.wholesalePriceUzs ? parseMoney(dto.wholesalePriceUzs) : new Decimal(0),
            wholesalePriceUsd: dto.wholesalePriceUsd ? parseMoney(dto.wholesalePriceUsd) : new Decimal(0),
            recommendedPriceUzs: dto.recommendedPriceUzs ? parseMoney(dto.recommendedPriceUzs) : new Decimal(0),
            recommendedPriceUsd: dto.recommendedPriceUsd ? parseMoney(dto.recommendedPriceUsd) : new Decimal(0),
            minPriceUzs: dto.minPriceUzs ? parseMoney(dto.minPriceUzs) : new Decimal(0),
            minPriceUsd: dto.minPriceUsd ? parseMoney(dto.minPriceUsd) : new Decimal(0),
          },
        },
        images: dto.imageUrl ? {
          create: {
            fileName: dto.imageUrl,
            originalName: dto.imageUrl,
            mimeType: 'image/png',
            size: 0,
            isPrimary: true
          }
        } : undefined,
        barcodes: dto.barcodes && dto.barcodes.length ? {
          create: dto.barcodes.map(b => ({ barcode: b.trim() }))
        } : undefined,
        aliases: dto.aliases && dto.aliases.length ? {
          create: dto.aliases.map(a => ({ alias: a.trim() }))
        } : undefined,
        unitConversions: dto.unitConversions && dto.unitConversions.length ? {
          create: dto.unitConversions.map(c => ({
            fromUnit: c.fromUnit,
            toUnit: c.toUnit,
            conversionFactor: parseMoney(c.conversionFactor)
          }))
        } : undefined
      },
      include: { category: true, prices: true, images: true, barcodes: true, unitConversions: true, aliases: true },
    });

    if (initialStock.gt(0) && dto.initialWarehouseId) {
      await this.inventoryService.receiveInternal(tx, companyId, userId, {
        productId: created.id,
        warehouseId: dto.initialWarehouseId,
        quantity: initialStock,
        unitCostUzs: purchasePriceUzs,
        unitCostUsd: purchasePriceUsd,
        note: 'Initial stock on product create',
        referenceType: 'product_create',
      });
    }

    return created;
  }

  async update(
    companyId: string,
    id: string,
    userId: string,
    dto: UpdateProductRequestDto,
    ip?: string,
    requestId?: string,
  ): Promise<ProductResponseDto> {
    const existing = await this.findProductOrThrow(companyId, id);

    if (dto.categoryId) {
      await this.categoriesService.ensureCategory(companyId, dto.categoryId);
    }

    const rate = await this.currencyService.getActiveRateOrThrow(companyId);

    const purchasePriceUzs = dto.purchasePriceUzs
      ? parseMoney(dto.purchasePriceUzs)
      : existing.prices?.purchasePriceUzs;
    const salePriceUzs = dto.salePriceUzs
      ? parseMoney(dto.salePriceUzs)
      : existing.prices?.salePriceUzs;

    const purchasePriceUsd = dto.purchasePriceUsd
      ? parseMoney(dto.purchasePriceUsd)
      : dto.purchasePriceUzs
        ? uzsToUsd(parseMoney(dto.purchasePriceUzs), rate.rate)
        : existing.prices?.purchasePriceUsd;
    const salePriceUsd = dto.salePriceUsd
      ? parseMoney(dto.salePriceUsd)
      : dto.salePriceUzs
        ? uzsToUsd(parseMoney(dto.salePriceUzs), rate.rate)
        : existing.prices?.salePriceUsd;

    const wholesalePriceUzs = dto.wholesalePriceUzs ? parseMoney(dto.wholesalePriceUzs) : undefined;
    const wholesalePriceUsd = dto.wholesalePriceUsd ? parseMoney(dto.wholesalePriceUsd) : undefined;
    const recommendedPriceUzs = dto.recommendedPriceUzs ? parseMoney(dto.recommendedPriceUzs) : undefined;
    const recommendedPriceUsd = dto.recommendedPriceUsd ? parseMoney(dto.recommendedPriceUsd) : undefined;
    const minPriceUzs = dto.minPriceUzs ? parseMoney(dto.minPriceUzs) : undefined;
    const minPriceUsd = dto.minPriceUsd ? parseMoney(dto.minPriceUsd) : undefined;

    try {
      const updated = await this.prisma.$transaction(async (tx) => {
        // If image is changing
        if (dto.imageUrl !== undefined) {
          const oldImages = await tx.productImage.findMany({
            where: { productId: id },
          });
          for (const img of oldImages) {
            if (img.fileName !== dto.imageUrl) {
              this.deleteImageFiles(img.fileName);
            }
          }
          await tx.productImage.deleteMany({ where: { productId: id } });
          if (dto.imageUrl) {
            await tx.productImage.create({
              data: {
                productId: id,
                fileName: dto.imageUrl,
                originalName: dto.imageUrl,
                mimeType: 'image/png',
                size: 0,
                isPrimary: true,
              },
            });
          }
        }

        // Barcodes update
        if (dto.barcodes !== undefined) {
          await tx.productBarcode.deleteMany({ where: { productId: id } });
          if (dto.barcodes && dto.barcodes.length) {
            await tx.productBarcode.createMany({
              data: dto.barcodes.map((b) => ({ productId: id, barcode: b.trim() })),
            });
          }
        }

        // Aliases update
        if (dto.aliases !== undefined) {
          await tx.productAlias.deleteMany({ where: { productId: id } });
          if (dto.aliases && dto.aliases.length) {
            await tx.productAlias.createMany({
              data: dto.aliases.map((a) => ({ productId: id, alias: a.trim() })),
            });
          }
        }

        // Unit conversions update
        if (dto.unitConversions !== undefined) {
          await tx.productUnitConversion.deleteMany({ where: { productId: id } });
          if (dto.unitConversions && dto.unitConversions.length) {
            await tx.productUnitConversion.createMany({
              data: dto.unitConversions.map((c) => ({
                productId: id,
                fromUnit: c.fromUnit,
                toUnit: c.toUnit,
                conversionFactor: parseMoney(c.conversionFactor),
              })),
            });
          }
        }

        // Log price history changes
        const oldPrice = existing.prices?.salePriceUzs || new Decimal(0);
        const newPrice = salePriceUzs || oldPrice;
        if (!newPrice.equals(oldPrice)) {
          const oldPriceUsd = existing.prices?.salePriceUsd || new Decimal(0);
          const newPriceUsd = dto.salePriceUsd
            ? parseMoney(dto.salePriceUsd)
            : uzsToUsd(newPrice, rate.rate);

          await tx.productPriceHistory.create({
            data: {
              productId: id,
              companyId,
              oldPriceUzs: oldPrice,
              newPriceUzs: newPrice,
              oldPriceUsd,
              newPriceUsd,
              exchangeRate: rate.rate,
              reason: dto.name ? 'Product Update' : 'Price Sync',
              userId,
            },
          });
        }

        return tx.product.update({
          where: { id, companyId },
          data: {
            name: dto.name?.trim(),
            categoryId: dto.categoryId,
            barcode: dto.barcode === undefined ? undefined : dto.barcode?.trim() || null,
            unitOfMeasure: dto.unitOfMeasure,
            unitsPerBox: dto.unitsPerBox ? parseInt(dto.unitsPerBox, 10) : undefined,
            minStockLevel:
              dto.minStockLevel != null && dto.minStockLevel !== ''
                ? parseMoney(dto.minStockLevel)
                : undefined,
            pdfCatalogUrl: dto.pdfCatalogUrl === undefined ? undefined : dto.pdfCatalogUrl?.trim() || null,
            techPassportUrl: dto.techPassportUrl === undefined ? undefined : dto.techPassportUrl?.trim() || null,
            userManualUrl: dto.userManualUrl === undefined ? undefined : dto.userManualUrl?.trim() || null,
            status: dto.status,
            prices: {
              upsert: {
                create: {
                  purchasePriceUzs: purchasePriceUzs ?? new Decimal(0),
                  purchasePriceUsd: purchasePriceUsd ?? new Decimal(0),
                  salePriceUzs: salePriceUzs ?? new Decimal(0),
                  salePriceUsd: salePriceUsd ?? new Decimal(0),
                  wholesalePriceUzs: wholesalePriceUzs ?? new Decimal(0),
                  wholesalePriceUsd: wholesalePriceUsd ?? new Decimal(0),
                  recommendedPriceUzs: recommendedPriceUzs ?? new Decimal(0),
                  recommendedPriceUsd: recommendedPriceUsd ?? new Decimal(0),
                  minPriceUzs: minPriceUzs ?? new Decimal(0),
                  minPriceUsd: minPriceUsd ?? new Decimal(0),
                },
                update: {
                  purchasePriceUzs: purchasePriceUzs ?? undefined,
                  purchasePriceUsd: purchasePriceUsd ?? undefined,
                  salePriceUzs: salePriceUzs ?? undefined,
                  salePriceUsd: salePriceUsd ?? undefined,
                  wholesalePriceUzs: wholesalePriceUzs ?? undefined,
                  wholesalePriceUsd: wholesalePriceUsd ?? undefined,
                  recommendedPriceUzs: recommendedPriceUzs ?? undefined,
                  recommendedPriceUsd: recommendedPriceUsd ?? undefined,
                  minPriceUzs: minPriceUzs ?? undefined,
                  minPriceUsd: minPriceUsd ?? undefined,
                },
              },
            },
          },
          include: { category: true, prices: true, images: true, barcodes: true, unitConversions: true, aliases: true },
        });
      });

      await this.audit.log({
        companyId,
        userId,
        action: 'UPDATE',
        entityType: 'product',
        entityId: id,
        oldValue: { name: existing.name, status: existing.status },
        newValue: { name: updated.name, status: updated.status },
        ipAddress: ip,
        requestId,
      });

      return this.toProductResponse(companyId, updated);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw AppException.duplicateBarcode(dto.barcode ?? '');
      }
      throw error;
    }
  }

  async remove(
    companyId: string,
    id: string,
    userId: string,
    ip?: string,
    requestId?: string,
  ): Promise<void> {
    const existing = await this.findProductOrThrow(companyId, id);

    await this.prisma.product.update({
      where: { id, companyId },
      data: { deletedAt: new Date(), status: ProductStatus.ARCHIVED },
    });

    await this.audit.log({
      companyId,
      userId,
      action: 'DELETE',
      entityType: 'product',
      entityId: id,
      oldValue: { sku: existing.sku, name: existing.name },
      ipAddress: ip,
      requestId,
    });
  }

  async importProducts(
    companyId: string,
    userId: string,
    dto: ProductImportRequestDto,
    ip?: string,
    requestId?: string,
  ) {
    const hasStock = dto.rows.some((r) => parseMoney(r.stock ?? '0').gt(0));
    if (hasStock && !dto.warehouseId) {
      throw AppException.validation('Validation failed', [
        { field: 'warehouseId', message: 'Required when importing stock', code: 'REQUIRED' },
      ]);
    }

    if (dto.warehouseId) {
      const warehouse = await this.prisma.warehouse.findFirst({
        where: { id: dto.warehouseId, companyId, status: 'ACTIVE' },
      });
      if (!warehouse) {
        throw AppException.notFound('Warehouse', dto.warehouseId);
      }
    }

    // Load database duplicates before importing
    const existingDbProducts = await this.prisma.product.findMany({
      where: { companyId, deletedAt: null },
      select: { sku: true, barcode: true, legacyId: true },
    });
    const dbSkus = new Set(existingDbProducts.map(p => p.sku.toLowerCase()));
    const dbBarcodes = new Set(existingDbProducts.map(p => p.barcode?.toLowerCase()).filter(Boolean));
    const dbLegacyIds = new Set(existingDbProducts.map(p => p.legacyId?.toLowerCase()).filter(Boolean));

    const seenSkus = new Set<string>();
    const seenBarcodes = new Set<string>();
    const seenLegacyIds = new Set<string>();

    const rowErrors: Array<{ row: number; errors: string[] }> = [];

    // Pre-validate all rows to ensure zero failures before executing writes
    for (let i = 0; i < dto.rows.length; i++) {
      const row = dto.rows[i];
      const rowNum = i + 1;
      const errors: string[] = [];

      const sku = row.sku?.trim();
      const name = row.name?.trim();
      const category = row.category?.trim();
      const barcode = row.barcode?.trim();
      const legacyId = row.legacyId?.trim();

      if (!sku) errors.push('SKU is required');
      if (!name) errors.push('Name is required');
      if (!category) errors.push('Category is required');

      const pPriceUzs = row.purchasePriceUzs || row.purchasePrice;
      const sPriceUzs = row.sellingPriceUzs || row.sellingPrice;

      if (!pPriceUzs || !isNonNegativeMoney(parseMoney(pPriceUzs))) {
        errors.push('Invalid purchase price UZS');
      }
      if (!sPriceUzs || !isNonNegativeMoney(parseMoney(sPriceUzs))) {
        errors.push('Invalid selling price UZS');
      }
      if (row.purchasePriceUsd && !isNonNegativeMoney(parseMoney(row.purchasePriceUsd))) {
        errors.push('Invalid purchase price USD');
      }
      if (row.sellingPriceUsd && !isNonNegativeMoney(parseMoney(row.sellingPriceUsd))) {
        errors.push('Invalid selling price USD');
      }
      if (row.stock && !isNonNegativeMoney(parseMoney(row.stock))) {
        errors.push('Invalid stock quantity');
      }

      // Check sheet duplicates
      if (sku) {
        const skuLower = sku.toLowerCase();
        if (seenSkus.has(skuLower)) {
          errors.push(`Duplicate SKU in Excel: ${sku}`);
        } else {
          seenSkus.add(skuLower);
        }
      }
      if (barcode) {
        const barLower = barcode.toLowerCase();
        if (seenBarcodes.has(barLower)) {
          errors.push(`Duplicate Barcode in Excel: ${barcode}`);
        } else {
          seenBarcodes.add(barLower);
        }
      }
      if (legacyId) {
        const legLower = legacyId.toLowerCase();
        if (seenLegacyIds.has(legLower)) {
          errors.push(`Duplicate Legacy ID in Excel: ${legacyId}`);
        } else {
          seenLegacyIds.add(legLower);
        }
      }

      // Check DB duplicates
      if (sku && dbSkus.has(sku.toLowerCase())) {
        errors.push(`SKU already exists in database: ${sku}`);
      }
      if (barcode && dbBarcodes.has(barcode.toLowerCase())) {
        errors.push(`Barcode already exists in database: ${barcode}`);
      }
      if (legacyId && dbLegacyIds.has(legacyId.toLowerCase())) {
        errors.push(`Legacy ID already exists in database: ${legacyId}`);
      }

      if (errors.length) {
        rowErrors.push({ row: rowNum, errors });
      }
    }

    if (rowErrors.length > 0) {
      // Abort import immediately with validation exception to ensure rollback
      const details = rowErrors.map((re) => ({
        field: `row_${re.row}`,
        message: re.errors.join('; '),
        code: 'IMPORT_VALIDATION_ERROR',
      }));
      throw AppException.validation('Import pre-validation failed. No rows were imported.', details);
    }

    // If pre-validation succeeded, execute imports inside a single transaction
    const results = await this.prisma.$transaction(async (tx) => {
      const imported: Array<{
        row: number;
        sku: string;
        productId: string;
      }> = [];

      for (let i = 0; i < dto.rows.length; i++) {
        const row = dto.rows[i];
        const rowNum = i + 1;

        const categoryId = await this.categoriesService.findOrCreateByNameInternal(
          tx,
          companyId,
          row.category.trim(),
          userId,
        );

        const pPriceUzs = row.purchasePriceUzs || row.purchasePrice;
        const sPriceUzs = row.sellingPriceUzs || row.sellingPrice;

        const product = await this.createInternal(tx, companyId, userId, {
          sku: row.sku.trim(),
          barcode: row.barcode?.trim() ?? undefined,
          name: row.name.trim(),
          categoryId,
          unitOfMeasure: row.unit?.trim() || 'pcs',
          purchasePriceUzs: pPriceUzs,
          salePriceUzs: sPriceUzs,
          purchasePriceUsd: row.purchasePriceUsd || undefined,
          salePriceUsd: row.sellingPriceUsd || undefined,
          legacyId: row.legacyId || undefined,
          initialStock: row.stock || undefined,
          initialWarehouseId: dto.warehouseId,
        });

        imported.push({
          row: rowNum,
          sku: row.sku,
          productId: product.id,
        });
      }

      return imported;
    });

    const created = results.length;

    await this.audit.log({
      companyId,
      userId,
      action: 'IMPORT',
      entityType: 'product',
      newValue: { created, failed: 0, totalRows: dto.rows.length },
      ipAddress: ip,
      requestId,
    });

    return {
      success: true,
      created,
      failed: 0,
      totalRows: dto.rows.length,
      report: {
        importedAt: new Date().toISOString(),
        operatorId: userId,
        companyId,
        items: dto.rows.map((row, idx) => ({
          row: idx + 1,
          sku: row.sku,
          name: row.name,
          legacyId: row.legacyId || null,
          purchasePriceUzs: row.purchasePriceUzs || row.purchasePrice,
          sellingPriceUzs: row.sellingPriceUzs || row.sellingPrice,
          purchasePriceUsd: row.purchasePriceUsd || null,
          sellingPriceUsd: row.sellingPriceUsd || null,
          initialStock: row.stock || '0',
        })),
      },
    };
  }

  async validateImportPreview(companyId: string, rows: ProductImportRowDto[]) {
    const existingDbProducts = await this.prisma.product.findMany({
      where: { companyId, deletedAt: null },
      select: { sku: true, barcode: true, legacyId: true },
    });
    const dbSkus = new Set(existingDbProducts.map(p => p.sku.toLowerCase()));
    const dbBarcodes = new Set(existingDbProducts.map(p => p.barcode?.toLowerCase()).filter(Boolean));
    const dbLegacyIds = new Set(existingDbProducts.map(p => p.legacyId?.toLowerCase()).filter(Boolean));

    const seenSkus = new Set<string>();
    const seenBarcodes = new Set<string>();
    const seenLegacyIds = new Set<string>();

    return rows.map((row, index) => {
      const errors: string[] = [];
      const sku = row.sku?.trim();
      const name = row.name?.trim();
      const category = row.category?.trim();
      const barcode = row.barcode?.trim();
      const legacyId = row.legacyId?.trim();

      if (!sku) errors.push('SKU required');
      if (!name) errors.push('Name required');
      if (!category) errors.push('Category required');

      const pPriceUzs = row.purchasePriceUzs || row.purchasePrice;
      const sPriceUzs = row.sellingPriceUzs || row.sellingPrice;

      if (!pPriceUzs || !isNonNegativeMoney(parseMoney(pPriceUzs))) {
        errors.push('Invalid purchase price UZS');
      }
      if (!sPriceUzs || !isNonNegativeMoney(parseMoney(sPriceUzs))) {
        errors.push('Invalid selling price UZS');
      }
      if (row.purchasePriceUsd && !isNonNegativeMoney(parseMoney(row.purchasePriceUsd))) {
        errors.push('Invalid purchase price USD');
      }
      if (row.sellingPriceUsd && !isNonNegativeMoney(parseMoney(row.sellingPriceUsd))) {
        errors.push('Invalid selling price USD');
      }
      if (row.stock && !isNonNegativeMoney(parseMoney(row.stock))) {
        errors.push('Invalid stock');
      }

      // Check sheet duplicates
      if (sku) {
        const skuLower = sku.toLowerCase();
        if (seenSkus.has(skuLower)) {
          errors.push(`Duplicate SKU in Excel: ${sku}`);
        } else {
          seenSkus.add(skuLower);
        }
      }
      if (barcode) {
        const barLower = barcode.toLowerCase();
        if (seenBarcodes.has(barLower)) {
          errors.push(`Duplicate Barcode in Excel: ${barcode}`);
        } else {
          seenBarcodes.add(barLower);
        }
      }
      if (legacyId) {
        const legLower = legacyId.toLowerCase();
        if (seenLegacyIds.has(legLower)) {
          errors.push(`Duplicate Legacy ID in Excel: ${legacyId}`);
        } else {
          seenLegacyIds.add(legLower);
        }
      }

      // Check DB duplicates
      if (sku && dbSkus.has(sku.toLowerCase())) {
        errors.push(`SKU already exists in database: ${sku}`);
      }
      if (barcode && dbBarcodes.has(barcode.toLowerCase())) {
        errors.push(`Barcode already exists in database: ${barcode}`);
      }
      if (legacyId && dbLegacyIds.has(legacyId.toLowerCase())) {
        errors.push(`Legacy ID already exists in database: ${legacyId}`);
      }

      return {
        row: index + 1,
        sku: sku || 'N/A',
        name: name || 'N/A',
        valid: errors.length === 0,
        errors,
      };
    });
  }

  private async findProductOrThrow(companyId: string, id: string): Promise<ProductWithRelations> {
    const product = await this.prisma.product.findFirst({
      where: { id, companyId, deletedAt: null },
      include: { category: true, prices: true, images: true, barcodes: true, unitConversions: true, aliases: true },
    });
    if (!product) {
      throw AppException.notFound('Product', id);
    }
    return product;
  }

  private buildProductOrderBy(
    sortFields: ReturnType<typeof parseSort>,
  ): Prisma.ProductOrderByWithRelationInput[] {
    const orderBy: Prisma.ProductOrderByWithRelationInput[] = [];
    for (const sort of sortFields) {
      if (sort.field === 'salePriceUzs') {
        orderBy.push({ prices: { salePriceUzs: sort.direction } });
      } else if (sort.field !== 'stock') {
        orderBy.push({ [sort.field]: sort.direction });
      }
    }
    return orderBy.length ? orderBy : [{ name: 'asc' }];
  }

  private async getStockMap(companyId: string, productIds: string[]): Promise<Map<string, Decimal>> {
    const stockSums = await this.prisma.inventoryBatch.groupBy({
      by: ['productId'],
      where: {
        companyId,
        productId: { in: productIds },
      },
      _sum: {
        remainingQty: true,
      },
    });

    const map = new Map<string, Decimal>();
    for (const sum of stockSums) {
      if (sum.productId) {
        map.set(sum.productId, sum._sum?.remainingQty ?? new Decimal(0));
      }
    }
    return map;
  }

  private async toProductResponse(
    companyId: string,
    product: ProductWithRelations,
    precalculatedStock?: Decimal,
  ): Promise<ProductResponseDto> {
    const stock = precalculatedStock ?? await getProductStockTotal(this.prisma, companyId, product.id);

    return {
      id: product.id,
      sku: product.sku,
      barcode: product.barcode,
      name: product.name,
      categoryId: product.categoryId ?? '',
      categoryName: product.category?.name ?? '',
      status: product.status,
      purchasePriceUzs: formatMoney(product.prices?.purchasePriceUzs),
      purchasePriceUsd: formatMoney(product.prices?.purchasePriceUsd),
      salePriceUzs: formatMoney(product.prices?.salePriceUzs),
      salePriceUsd: formatMoney(product.prices?.salePriceUsd),
      stock: formatMoney(stock),
      wholesalePriceUzs: formatMoney(product.prices?.wholesalePriceUzs ?? new Decimal(0)),
      wholesalePriceUsd: formatMoney(product.prices?.wholesalePriceUsd ?? new Decimal(0)),
      recommendedPriceUzs: formatMoney(product.prices?.recommendedPriceUzs ?? new Decimal(0)),
      recommendedPriceUsd: formatMoney(product.prices?.recommendedPriceUsd ?? new Decimal(0)),
      minPriceUzs: formatMoney(product.prices?.minPriceUzs ?? new Decimal(0)),
      minPriceUsd: formatMoney(product.prices?.minPriceUsd ?? new Decimal(0)),
      imageUrl: product.images?.find((img) => img.isPrimary)?.fileName || null,
      pdfCatalogUrl: product.pdfCatalogUrl,
      techPassportUrl: product.techPassportUrl,
      userManualUrl: product.userManualUrl,
      barcodes: product.barcodes?.map((b) => b.barcode) ?? [],
      aliases: product.aliases?.map((a) => a.alias) ?? [],
      unitConversions: product.unitConversions?.map((c) => ({
        fromUnit: c.fromUnit,
        toUnit: c.toUnit,
        conversionFactor: formatMoney(c.conversionFactor),
      })) ?? [],
      unitOfMeasure: product.unitOfMeasure,
      unitsPerBox: String(product.unitsPerBox ?? 1),
      minStockLevel: formatMoney(product.minStockLevel ?? new Decimal(0)),
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString(),
    };
  }

  private deleteImageFiles(filename: string) {
    try {
      const baseDir = join(process.cwd(), 'storage/products');
      const dirs = ['original', 'medium', 'thumb'];
      for (const d of dirs) {
        const path = join(baseDir, d, filename);
        if (existsSync(path)) {
          unlinkSync(path);
        }
      }
    } catch {
      // safe ignore
    }
  }

  private isValidImageHeader(buffer: Buffer): boolean {
    if (!buffer || buffer.length < 12) return false;
    // JPEG: FF D8 FF
    if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
      return true;
    }
    // PNG: 89 50 4E 47
    if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
      return true;
    }
    // WEBP: RIFF....WEBP
    const isRiff = buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46; // RIFF
    const isWebp = buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50; // WEBP
    if (isRiff && isWebp) {
      return true;
    }
    return false;
  }

  async handleImageUpload(companyId: string, file: any) {
    if (!file) throw AppException.validation('File is required', []);
    
    // File size check: 5MB limit
    if (file.size > 5 * 1024 * 1024) {
      throw AppException.validation('Image size must be less than 5MB', []);
    }

    // Extension validation
    const fileExt = extname(file.originalname).toLowerCase();
    if (!['.jpg', '.jpeg', '.png', '.webp'].includes(fileExt)) {
      throw AppException.validation('Only JPG, PNG and WEBP image extensions are allowed', []);
    }

    // MIME type validation
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw AppException.validation('Only JPG, PNG and WEBP images are allowed', []);
    }

    // Magic bytes validation
    if (!this.isValidImageHeader(file.buffer)) {
      throw AppException.validation('File signature does not match a valid JPG, PNG, or WEBP image', []);
    }

    const baseDir = join(process.cwd(), 'storage/products');
    const dirs = ['original', 'medium', 'thumb'];
    for (const d of dirs) {
      const path = join(baseDir, d);
      if (!existsSync(path)) {
        mkdirSync(path, { recursive: true });
      }
    }

    const filename = `${randomUUID()}${fileExt}`;

    const originalPath = join(baseDir, 'original', filename);
    writeFileSync(originalPath, file.buffer);

    try {
      const jimpImage = await Jimp.read(file.buffer);
      const mediumPath = join(baseDir, 'medium', filename);
      const mediumImg = jimpImage.clone().resize(600, Jimp.AUTO);
      await mediumImg.writeAsync(mediumPath);

      const thumbPath = join(baseDir, 'thumb', filename);
      const thumbImg = jimpImage.clone().resize(100, Jimp.AUTO);
      await thumbImg.writeAsync(thumbPath);
    } catch (err) {
      // Clean up original file on error
      if (existsSync(originalPath)) {
        try { unlinkSync(originalPath); } catch {}
      }
      throw AppException.validation('Failed to process image file. File may be corrupted or invalid.', []);
    }

    return {
      fileName: filename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
    };
  }

  async serveImage(size: string, filename: string, res: Response) {
    const allowedSizes = ['original', 'medium', 'thumb'];
    if (!allowedSizes.includes(size)) {
      res.status(400).send('Invalid size');
      return;
    }

    // Path traversal sanitization
    const safeFilename = basename(filename);
    
    // Whitelist check: ensure filename matches an allowed extension
    const fileExt = extname(safeFilename).toLowerCase();
    if (!['.jpg', '.jpeg', '.png', '.webp'].includes(fileExt)) {
      res.status(400).send('Invalid file extension');
      return;
    }

    const baseDir = join(process.cwd(), 'storage/products');
    const sizeDir = join(baseDir, size);
    const filePath = resolve(sizeDir, safeFilename);

    // Strict traversal protection: make sure resolved path starts with the size directory
    if (!filePath.startsWith(sizeDir)) {
      res.status(400).send('Invalid path traversal attempt');
      return;
    }

    if (!existsSync(filePath)) {
      res.status(404).send('Not Found');
      return;
    }

    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.sendFile(filePath);
  }

  async bulkImportImages(companyId: string, file: any) {
    if (!file) throw AppException.validation('Zip file is required', []);
    if (file.mimetype !== 'application/zip' && extname(file.originalname).toLowerCase() !== '.zip') {
      throw AppException.validation('Only ZIP archives are allowed', []);
    }

    const zip = new AdmZip(file.buffer);
    const zipEntries = zip.getEntries();

    const baseDir = join(process.cwd(), 'storage/products');
    const dirs = ['original', 'medium', 'thumb'];
    for (const d of dirs) {
      const path = join(baseDir, d);
      if (!existsSync(path)) {
        mkdirSync(path, { recursive: true });
      }
    }

    let matchedCount = 0;

    for (const entry of zipEntries) {
      if (entry.isDirectory) continue;
      const entryName = entry.entryName;
      const baseNameWithExt = entryName.split('/').pop() || entryName;
      const ext = extname(baseNameWithExt).toLowerCase();
      if (!['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) continue;

      const baseName = baseNameWithExt.slice(0, -ext.length);

      const product = await this.prisma.product.findFirst({
        where: {
          companyId,
          deletedAt: null,
          OR: [
            { sku: baseName },
            { barcode: baseName },
            { id: baseName },
          ],
        },
      });

      if (!product) continue;

      const fileBuffer = entry.getData();
      const filename = `${randomUUID()}${ext}`;

      writeFileSync(join(baseDir, 'original', filename), fileBuffer);

      try {
        const jimpImage = await Jimp.read(fileBuffer);
        const mediumImg = jimpImage.clone().resize(600, Jimp.AUTO);
        await mediumImg.writeAsync(join(baseDir, 'medium', filename));
        const thumbImg = jimpImage.clone().resize(100, Jimp.AUTO);
        await thumbImg.writeAsync(join(baseDir, 'thumb', filename));
      } catch {
        writeFileSync(join(baseDir, 'medium', filename), fileBuffer);
        writeFileSync(join(baseDir, 'thumb', filename), fileBuffer);
      }

      await this.prisma.$transaction(async (tx) => {
        await tx.productImage.updateMany({
          where: { productId: product.id, isPrimary: true },
          data: { isPrimary: false },
        });

        await tx.productImage.create({
          data: {
            productId: product.id,
            fileName: filename,
            originalName: baseNameWithExt,
            mimeType: ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg',
            size: fileBuffer.length,
            isPrimary: true,
          },
        });
      });

      matchedCount++;
    }

    return {
      success: true,
      message: `${matchedCount} images successfully matched and imported`,
      matchedCount,
    };
  }
}
