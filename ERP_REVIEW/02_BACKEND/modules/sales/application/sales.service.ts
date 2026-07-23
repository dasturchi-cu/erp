import { Injectable } from '@nestjs/common';
import {
  CompanyStatus,
  InventoryBatchSourceType,
  InventoryMovementType,
  OriginalCurrency,
  Prisma,
  ProductStatus,
  SalePaymentType,
  SaleReturnStatus,
  SaleStatus,
} from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { PrismaService } from '../../../core/database/prisma.service';
import { AuditService } from '../../../core/audit/audit.service';
import { IdempotencyService } from '../../../core/idempotency/idempotency.service';
import { AppException } from '../../../core/exceptions/app.exception';
import {
  formatMoney,
  isPositiveMoney,
  parseMoney,
  usdToUzs,
  uzsToUsd,
} from '../../../core/utils/money.util';
import {
  buildPaginationMeta,
  paginationSkip,
  parseSort,
} from '../../../core/utils/pagination.util';
import { CurrencyService } from '../../currency/application/currency.service';
import { DebtService } from '../../debt/application/debt.service';
import {
  createMovement,
  createReceiptBatch,
  deductFifo,
  restoreFifoAllocations,
} from '../../inventory/application/inventory.helpers';
import {
  CreateSaleRequestDto,
  CreateSaleReturnRequestDto,
  ReturnDecisionRequestDto,
  SaleListQueryDto,
  SaleResponseDto,
  SaleReturnListQueryDto,
  SaleReturnResponseDto,
  VoidSaleRequestDto,
} from '../api/dto/sales.dto';

type SaleWithRelations = Prisma.SaleGetPayload<{
  include: {
    customer: true;
    cashier: true;
    items: { include: { product: true } };
    fifoAllocations: { include: { product: true } };
  };
}>;

type ReturnWithRelations = Prisma.SaleReturnGetPayload<{
  include: {
    sale: true;
    customer: true;
    items: { include: { product: true } };
  };
}>;

@Injectable()
export class SalesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly currencyService: CurrencyService,
    private readonly debtService: DebtService,
    private readonly idempotency: IdempotencyService,
  ) {}

  async create(
    companyId: string,
    userId: string,
    branchId: string | undefined,
    dto: CreateSaleRequestDto,
    idempotencyKey: string,
    ip?: string,
    requestId?: string,
  ): Promise<SaleResponseDto> {
    const endpoint = 'POST /sales';
    const requestHash = this.idempotency.hashRequest(dto);

    const result = await this.idempotency.execute({
      companyId,
      key: idempotencyKey,
      endpoint,
      requestHash,
      handler: async () => {
        const body = await this.executeCreateSale(companyId, userId, branchId, dto, ip, requestId);
        return { status: 201, body };
      },
    });

    return result.body;
  }

  async list(companyId: string, userId: string, permissions: string[], query: SaleListQueryDto) {
    const page = query.resolvedPage();
    const limit = query.resolvedLimit();
    const where: Prisma.SaleWhereInput = { companyId };

    if (query.status) where.status = query.status;
    if (query.paymentType) where.paymentType = query.paymentType;
    if (query.customerId) where.customerId = query.customerId;
    if (query.cashierId) where.cashierId = query.cashierId;

    if (!permissions.includes('sales.view_all')) {
      where.cashierId = userId;
    }

    if (query.from || query.to) {
      where.createdAt = {};
      if (query.from) where.createdAt.gte = new Date(query.from);
      if (query.to) {
        const toDate = new Date(query.to);
        toDate.setHours(23, 59, 59, 999);
        where.createdAt.lte = toDate;
      }
    }

    if (query.q) {
      where.OR = [
        { saleNumber: { contains: query.q, mode: 'insensitive' } },
        { customer: { name: { contains: query.q, mode: 'insensitive' } } },
      ];
    }

    const sort = parseSort(query.sort, ['createdAt', 'totalUzs', 'number'], [
      { field: 'createdAt', direction: 'desc' },
    ]);

    const orderBy = sort.map((s) => {
      if (s.field === 'number') return { saleNumber: s.direction };
      if (s.field === 'totalUzs') return { totalUzs: s.direction };
      return { createdAt: s.direction };
    }) as Prisma.SaleOrderByWithRelationInput[];

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.sale.count({ where }),
      this.prisma.sale.findMany({
        where,
        include: {
          customer: true,
          cashier: true,
          items: { include: { product: true } },
          fifoAllocations: { include: { product: true } },
        },
        orderBy: orderBy.length ? orderBy : [{ createdAt: 'desc' }],
        skip: paginationSkip(page, limit),
        take: limit,
      }),
    ]);

    return {
      data: rows.map((row) => this.toSaleResponse(row)),
      meta: buildPaginationMeta(page, limit, total),
    };
  }

  async getById(companyId: string, id: string): Promise<SaleResponseDto> {
    const sale = await this.findSaleOrThrow(companyId, id);
    return this.toSaleResponse(sale);
  }

  async voidSale(
    companyId: string,
    userId: string,
    saleId: string,
    dto: VoidSaleRequestDto,
    idempotencyKey: string,
    ip?: string,
    requestId?: string,
  ): Promise<SaleResponseDto> {
    const endpoint = `POST /sales/${saleId}/void`;
    const requestHash = this.idempotency.hashRequest(dto);

    const result = await this.idempotency.execute({
      companyId,
      key: idempotencyKey,
      endpoint,
      requestHash,
      handler: async () => {
        const body = await this.executeVoidSale(
          companyId,
          userId,
          saleId,
          dto,
          ip,
          requestId,
        );
        return { status: 200, body };
      },
    });

    return result.body;
  }

  async createReturn(
    companyId: string,
    userId: string,
    saleId: string,
    dto: CreateSaleReturnRequestDto,
    idempotencyKey: string,
    ip?: string,
    requestId?: string,
  ): Promise<SaleReturnResponseDto> {
    const endpoint = `POST /sales/${saleId}/returns`;
    const requestHash = this.idempotency.hashRequest(dto);

    const result = await this.idempotency.execute({
      companyId,
      key: idempotencyKey,
      endpoint,
      requestHash,
      handler: async () => {
        const body = await this.executeCreateReturn(
          companyId,
          userId,
          saleId,
          dto,
          ip,
          requestId,
        );
        return { status: 201, body };
      },
    });

    return result.body;
  }

  async listReturns(companyId: string, query: SaleReturnListQueryDto) {
    const page = query.resolvedPage();
    const limit = query.resolvedLimit();
    const where: Prisma.SaleReturnWhereInput = { companyId };
    if (query.status) where.status = query.status;

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.saleReturn.count({ where }),
      this.prisma.saleReturn.findMany({
        where,
        include: {
          sale: true,
          customer: true,
          items: { include: { product: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: paginationSkip(page, limit),
        take: limit,
      }),
    ]);

    return {
      data: rows.map((row) => this.toReturnResponse(row)),
      meta: buildPaginationMeta(page, limit, total),
    };
  }

  async getReturnById(companyId: string, id: string): Promise<SaleReturnResponseDto> {
    const ret = await this.findReturnOrThrow(companyId, id);
    return this.toReturnResponse(ret);
  }

  async approveReturn(
    companyId: string,
    userId: string,
    returnId: string,
    dto: ReturnDecisionRequestDto,
    ip?: string,
    requestId?: string,
  ): Promise<SaleReturnResponseDto> {
    const ret = await this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`
        SELECT id FROM sale_returns
        WHERE id = ${returnId}::uuid AND company_id = ${companyId}::uuid
        FOR UPDATE
      `;
      const existing = await tx.saleReturn.findFirst({
        where: { id: returnId, companyId },
        include: {
          sale: { include: { items: true } },
          customer: true,
          items: { include: { product: true } },
        },
      });
      if (!existing) {
        throw AppException.notFound('SaleReturn', returnId);
      }
      if (existing.status !== SaleReturnStatus.PENDING) {
        throw AppException.businessRule('Return is not pending approval');
      }
      await this.lockSaleForUpdate(tx, companyId, existing.saleId);
      if (
        existing.sale.status !== SaleStatus.COMPLETED &&
        existing.sale.status !== SaleStatus.PARTIALLY_RETURNED
      ) {
        throw AppException.businessRule('Original sale must be completed or partially returned');
      }

      const warehouse = await this.resolveWarehouse(
        tx,
        companyId,
        userId,
        existing.sale.branchId,
      );
      const warehouseId = warehouse.id;

      for (const item of existing.items) {
        const saleItem = existing.sale.items.find((si) => si.productId === item.productId);
        if (!saleItem) {
          throw AppException.businessRule(`Product ${item.productId} not found on original sale`);
        }

        const unitCostUzs = saleItem.quantity.gt(0)
          ? saleItem.cogsUzs.div(saleItem.quantity)
          : new Decimal(0);
        const unitCostUsd = saleItem.quantity.gt(0)
          ? saleItem.cogsUsd.div(saleItem.quantity)
          : new Decimal(0);

        const batch = await createReceiptBatch(tx, {
          companyId,
          productId: item.productId,
          warehouseId,
          quantity: item.quantity,
          unitCostUzs,
          unitCostUsd,
          sourceType: InventoryBatchSourceType.RETURN,
          sourceId: existing.id,
        });

        await createMovement(tx, {
          companyId,
          productId: item.productId,
          warehouseId,
          batchId: batch.id,
          type: InventoryMovementType.RETURN,
          quantity: item.quantity,
          referenceType: 'sale_return',
          referenceId: existing.id,
          note: dto.note ?? existing.reason,
          performedBy: userId,
        });
      }

      if (
        existing.customerId &&
        (existing.sale.paymentType === SalePaymentType.CREDIT ||
          existing.sale.paymentType === SalePaymentType.MIXED)
      ) {
        await this.debtService.applyReturnCredit(tx, {
          companyId,
          customerId: existing.customerId,
          amountUzs: existing.amountUzs,
          exchangeRate: existing.exchangeRateUsed,
          referenceType: 'sale_return',
          referenceId: existing.id,
          referenceLabel: existing.sale.saleNumber,
          recordedBy: userId,
        });
      }

      const cumulativeAfterApprove = await this.getCumulativeReturnedQtyByProduct(
        tx,
        existing.saleId,
        [SaleReturnStatus.APPROVED],
      );
      for (const item of existing.items) {
        const current = cumulativeAfterApprove.get(item.productId) ?? new Decimal(0);
        cumulativeAfterApprove.set(item.productId, current.add(item.quantity));
      }
      const newSaleStatus = this.computeSaleStatusAfterReturns(
        existing.sale.items,
        cumulativeAfterApprove,
      );

      await tx.sale.update({
        where: { id: existing.saleId },
        data: { status: newSaleStatus },
      });

      return tx.saleReturn.update({
        where: { id: returnId },
        data: {
          status: SaleReturnStatus.APPROVED,
          approvedBy: userId,
          decisionNote: dto.note ?? null,
          decidedAt: new Date(),
        },
        include: {
          sale: true,
          customer: true,
          items: { include: { product: true } },
        },
      });
    });

    await this.audit.log({
      companyId,
      userId,
      action: 'UPDATE',
      entityType: 'sale_return',
      entityId: returnId,
      newValue: { status: 'APPROVED' },
      ipAddress: ip,
      requestId,
    });

    return this.toReturnResponse(ret);
  }

  async rejectReturn(
    companyId: string,
    userId: string,
    returnId: string,
    dto: ReturnDecisionRequestDto,
    ip?: string,
    requestId?: string,
  ): Promise<SaleReturnResponseDto> {
    const existing = await this.findReturnOrThrow(companyId, returnId);
    if (existing.status !== SaleReturnStatus.PENDING) {
      throw AppException.businessRule('Return is not pending');
    }

    const ret = await this.prisma.saleReturn.update({
      where: { id: returnId },
      data: {
        status: SaleReturnStatus.REJECTED,
        rejectedBy: userId,
        decisionNote: dto.note ?? null,
        decidedAt: new Date(),
      },
      include: {
        sale: true,
        customer: true,
        items: { include: { product: true } },
      },
    });

    await this.audit.log({
      companyId,
      userId,
      action: 'UPDATE',
      entityType: 'sale_return',
      entityId: returnId,
      newValue: { status: 'REJECTED' },
      ipAddress: ip,
      requestId,
    });

    return this.toReturnResponse(ret);
  }

  private async executeCreateSale(
    companyId: string,
    userId: string,
    branchId: string | undefined,
    dto: CreateSaleRequestDto,
    ip?: string,
    requestId?: string,
  ): Promise<SaleResponseDto> {
    this.validateCreateSale(dto);

    const activeRate = await this.currencyService.getActiveRateOrThrow(companyId);
    const exchangeRate = activeRate.rate;

    const saleId = await this.prisma.$transaction(async (tx) => {
      const resolvedBranchId = await this.resolveBranchId(tx, companyId, branchId);
      const warehouse = await this.resolveWarehouse(tx, companyId, userId, resolvedBranchId);
      const saleNumber = await this.generateSaleNumber(tx, companyId);

      const lineData: Array<{
        productId: string;
        quantity: Decimal;
        unitPriceUzs: Decimal;
        unitPriceUsd: Decimal;
        totalUzs: Decimal;
        totalUsd: Decimal;
        cogsUzs: Decimal;
        cogsUsd: Decimal;
      }> = [];

      for (const line of dto.lineItems) {
        const quantity = parseMoney(line.quantity);
        if (!isPositiveMoney(quantity)) {
          throw AppException.validation('Validation failed', [
            { field: 'lineItems.quantity', message: 'Must be > 0', code: 'INVALID_QUANTITY' },
          ]);
        }

        const product = await tx.product.findFirst({
          where: { id: line.productId, companyId, deletedAt: null, status: ProductStatus.ACTIVE },
          include: { prices: true },
        });
        if (!product?.prices) {
          throw AppException.notFound('Product', line.productId);
        }

        const unitPriceUzs = line.unitPriceUzs
          ? parseMoney(line.unitPriceUzs)
          : product.prices.salePriceUzs;
        if (!isPositiveMoney(unitPriceUzs)) {
          throw AppException.validation('Validation failed', [
            { field: 'lineItems.unitPriceUzs', message: 'Must be > 0', code: 'INVALID_PRICE' },
          ]);
        }
        const unitPriceUsd = product.prices.salePriceUsd.gt(0) && !line.unitPriceUzs
          ? product.prices.salePriceUsd
          : uzsToUsd(unitPriceUzs, exchangeRate);
        const totalUzs = unitPriceUzs.mul(quantity).toDecimalPlaces(4);
        const totalUsd = uzsToUsd(totalUzs, exchangeRate);

        lineData.push({
          productId: line.productId,
          quantity,
          unitPriceUzs,
          unitPriceUsd,
          totalUzs,
          totalUsd,
          cogsUzs: new Decimal(0),
          cogsUsd: new Decimal(0),
        });
      }

      const subtotalUzs = lineData.reduce((s, l) => s.add(l.totalUzs), new Decimal(0));
      const subtotalUsd = uzsToUsd(subtotalUzs, exchangeRate);
      const totalUzs = subtotalUzs;
      const totalUsd = subtotalUsd;

      const amountPaidUzs = parseMoney(dto.amountPaidUzs ?? '0');
      const amountPaidUsd = parseMoney(dto.amountPaidUsd ?? '0');

      this.validateSalePaymentAmounts(
        dto.paymentType,
        totalUzs,
        amountPaidUzs,
        amountPaidUsd,
        exchangeRate,
      );

      const sale = await tx.sale.create({
        data: {
          companyId,
          branchId: resolvedBranchId,
          saleNumber,
          customerId: dto.customerId ?? null,
          cashierId: userId,
          originalCurrency: dto.originalCurrency,
          exchangeRateUsed: exchangeRate,
          subtotalUzs,
          subtotalUsd,
          totalUzs,
          totalUsd,
          paymentType: dto.paymentType,
          amountPaidUzs,
          amountPaidUsd,
          notes: dto.notes ?? null,
          status: SaleStatus.COMPLETED,
        },
      });

      for (const line of lineData) {
        const fifoResults = await deductFifo(tx, {
          companyId,
          productId: line.productId,
          warehouseId: warehouse.id,
          quantity: line.quantity,
        });

        let cogsUzs = new Decimal(0);
        let cogsUsd = new Decimal(0);

        const saleItem = await tx.saleItem.create({
          data: {
            saleId: sale.id,
            productId: line.productId,
            quantity: line.quantity,
            unitPriceUzs: line.unitPriceUzs,
            unitPriceUsd: line.unitPriceUsd,
            totalUzs: line.totalUzs,
            totalUsd: line.totalUsd,
            cogsUzs: new Decimal(0),
            cogsUsd: new Decimal(0),
          },
        });

        for (const alloc of fifoResults) {
          const costUzs = alloc.unitCostUzs.mul(alloc.quantity).toDecimalPlaces(4);
          const costUsd = alloc.unitCostUsd.mul(alloc.quantity).toDecimalPlaces(4);
          cogsUzs = cogsUzs.add(costUzs);
          cogsUsd = cogsUsd.add(costUsd);

          await tx.saleFifoAllocation.create({
            data: {
              companyId,
              saleId: sale.id,
              saleItemId: saleItem.id,
              batchId: alloc.batchId,
              productId: line.productId,
              quantity: alloc.quantity,
              unitCostUzs: alloc.unitCostUzs,
              unitCostUsd: alloc.unitCostUsd,
              costUzs,
              costUsd,
            },
          });
        }

        await tx.saleItem.update({
          where: { id: saleItem.id },
          data: { cogsUzs, cogsUsd },
        });

        await createMovement(tx, {
          companyId,
          productId: line.productId,
          warehouseId: warehouse.id,
          type: InventoryMovementType.SALE,
          quantity: line.quantity.neg(),
          referenceType: 'sale',
          referenceId: sale.id,
          note: dto.notes ?? null,
          performedBy: userId,
        });
      }

      if (dto.customerId) {
        const creditUzs = this.getSaleCreditUzs(
          dto.paymentType,
          totalUzs,
          amountPaidUzs,
          amountPaidUsd,
          exchangeRate,
        );
        if (creditUzs.gt(0)) {
          await this.debtService.applySaleCredit(tx, {
            companyId,
            customerId: dto.customerId,
            amountUzs: creditUzs,
            exchangeRate,
            referenceType: 'sale',
            referenceId: sale.id,
            referenceLabel: saleNumber,
            recordedBy: userId,
          });
        }

        await tx.customer.update({
          where: { id: dto.customerId },
          data: {
            totalPurchasesUzs: { increment: totalUzs },
            lastPurchaseAt: new Date(),
          },
        });
      }

      return sale.id;
    });

    await this.audit.log({
      companyId,
      userId,
      action: 'CREATE',
      entityType: 'sale',
      entityId: saleId,
      newValue: { saleId },
      ipAddress: ip,
      requestId,
    });

    return this.getById(companyId, saleId);
  }

  private async executeVoidSale(
    companyId: string,
    userId: string,
    saleId: string,
    dto: VoidSaleRequestDto,
    ip?: string,
    requestId?: string,
  ): Promise<SaleResponseDto> {
    await this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`
        SELECT id FROM sales
        WHERE id = ${saleId}::uuid AND company_id = ${companyId}::uuid
        FOR UPDATE
      `;
      const sale = await tx.sale.findFirst({
        where: { id: saleId, companyId },
        include: { fifoAllocations: true },
      });
      if (!sale) {
        throw AppException.notFound('Sale', saleId);
      }
      if (sale.status !== SaleStatus.COMPLETED) {
        throw AppException.businessRule('Only completed sales can be voided');
      }

      await this.assertVoidWindow(tx, companyId, sale.completedAt);

      const warehouse = await this.resolveWarehouse(tx, companyId, userId, sale.branchId);

      await restoreFifoAllocations(tx, {
        companyId,
        saleId: sale.id,
        warehouseId: warehouse.id,
        allocations: sale.fifoAllocations.map((a) => ({
          batchId: a.batchId,
          productId: a.productId,
          warehouseId: warehouse.id,
          quantity: a.quantity,
          unitCostUzs: a.unitCostUzs,
          unitCostUsd: a.unitCostUsd,
        })),
        performedBy: userId,
        note: dto.note ?? `Savdo bekor qilindi: ${sale.saleNumber}`,
      });

      if (sale.customerId) {
        const creditUzs = this.getSaleCreditUzs(
          sale.paymentType,
          sale.totalUzs,
          sale.amountPaidUzs,
          sale.amountPaidUsd,
          sale.exchangeRateUsed,
        );
        if (creditUzs.gt(0)) {
          await this.debtService.reverseSaleCredit(tx, {
            companyId,
            customerId: sale.customerId,
            amountUzs: creditUzs,
            exchangeRate: sale.exchangeRateUsed,
            referenceType: 'sale_void',
            referenceId: sale.id,
            referenceLabel: sale.saleNumber,
            recordedBy: userId,
          });
        }

        await tx.customer.update({
          where: { id: sale.customerId },
          data: {
            totalPurchasesUzs: {
              decrement: sale.totalUzs,
            },
          },
        });
      }

      await tx.sale.update({
        where: { id: saleId },
        data: {
          status: SaleStatus.CANCELLED,
          voidedAt: new Date(),
          voidedBy: userId,
        },
      });
    });

    await this.audit.log({
      companyId,
      userId,
      action: 'UPDATE',
      entityType: 'sale_void',
      entityId: saleId,
      newValue: { status: 'CANCELLED' },
      ipAddress: ip,
      requestId,
    });

    return this.getById(companyId, saleId);
  }

  private async executeCreateReturn(
    companyId: string,
    userId: string,
    saleId: string,
    dto: CreateSaleReturnRequestDto,
    ip?: string,
    requestId?: string,
  ): Promise<SaleReturnResponseDto> {
    const ret = await this.prisma.$transaction(async (tx) => {
      await this.lockSaleForUpdate(tx, companyId, saleId);
      const sale = await tx.sale.findFirst({
        where: { id: saleId, companyId },
        include: { items: true },
      });
      if (!sale) {
        throw AppException.notFound('Sale', saleId);
      }
      if (
        sale.status !== SaleStatus.COMPLETED &&
        sale.status !== SaleStatus.PARTIALLY_RETURNED
      ) {
        throw AppException.businessRule(
          'Returns only allowed on completed or partially returned sales',
        );
      }

      const cumulativeReturned = await this.getCumulativeReturnedQtyByProduct(
        tx,
        sale.id,
        [SaleReturnStatus.APPROVED, SaleReturnStatus.PENDING],
      );

      const returnItems: Array<{
        productId: string;
        quantity: Decimal;
        amountUzs: Decimal;
      }> = [];

      for (const line of dto.lineItems) {
        const quantity = parseMoney(line.quantity);
        if (!isPositiveMoney(quantity)) {
          throw AppException.validation('Validation failed', [
            { field: 'lineItems.quantity', message: 'Must be > 0', code: 'INVALID_QUANTITY' },
          ]);
        }

        const saleItem = sale.items.find((si) => si.productId === line.productId);
        if (!saleItem) {
          throw AppException.businessRule(`Product ${line.productId} not on original sale`);
        }
        const alreadyReturned = cumulativeReturned.get(line.productId) ?? new Decimal(0);
        const remainingQty = saleItem.quantity.sub(alreadyReturned);
        if (quantity.gt(remainingQty)) {
          throw AppException.businessRule('Return quantity exceeds remaining returnable quantity');
        }

        const unitPriceUzs = saleItem.unitPriceUzs;
        const amountUzs = unitPriceUzs.mul(quantity).toDecimalPlaces(4);

        returnItems.push({ productId: line.productId, quantity, amountUzs });
      }

      const amountUzs = returnItems.reduce((s, i) => s.add(i.amountUzs), new Decimal(0));
      const amountUsd = uzsToUsd(amountUzs, sale.exchangeRateUsed);

      const created = await tx.saleReturn.create({
        data: {
          companyId,
          saleId: sale.id,
          customerId: sale.customerId,
          exchangeRateUsed: sale.exchangeRateUsed,
          amountUzs,
          amountUsd,
          reason: dto.reason,
          status: SaleReturnStatus.PENDING,
          createdBy: userId,
          items: {
            create: returnItems.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              amountUzs: item.amountUzs,
            })),
          },
        },
        include: {
          sale: true,
          customer: true,
          items: { include: { product: true } },
        },
      });

      return created;
    });

    await this.audit.log({
      companyId,
      userId,
      action: 'CREATE',
      entityType: 'sale_return',
      entityId: ret.id,
      newValue: { saleId, status: 'PENDING' },
      ipAddress: ip,
      requestId,
    });

    return this.toReturnResponse(ret);
  }

  private validateCreateSale(dto: CreateSaleRequestDto): void {
    if (
      (dto.paymentType === SalePaymentType.CREDIT || dto.paymentType === SalePaymentType.MIXED) &&
      !dto.customerId
    ) {
      throw AppException.validation('Validation failed', [
        {
          field: 'customerId',
          message: 'Required for credit and mixed payments',
          code: 'REQUIRED_CUSTOMER',
        },
      ]);
    }
  }

  private validateSalePaymentAmounts(
    paymentType: SalePaymentType,
    totalUzs: Decimal,
    amountPaidUzs: Decimal,
    amountPaidUsd: Decimal,
    exchangeRate: Decimal,
  ): void {
    const paidTotalUzs = amountPaidUzs.add(usdToUzs(amountPaidUsd, exchangeRate));

    if (paymentType === SalePaymentType.CASH && paidTotalUzs.lt(totalUzs)) {
      throw AppException.businessRule('Cash payment less than sale total', {
        totalUzs: formatMoney(totalUzs),
        amountPaidUzs: formatMoney(paidTotalUzs),
      });
    }

    if (paymentType === SalePaymentType.CREDIT && paidTotalUzs.gt(0)) {
      throw AppException.businessRule('Credit payment must not include amount paid', {
        amountPaidUzs: formatMoney(paidTotalUzs),
      });
    }

    if (paymentType === SalePaymentType.MIXED) {
      if (paidTotalUzs.lte(0)) {
        throw AppException.businessRule('Mixed payment requires a positive amount paid');
      }
      if (paidTotalUzs.gte(totalUzs)) {
        throw AppException.businessRule('Mixed payment paid amount must be less than sale total', {
          totalUzs: formatMoney(totalUzs),
          amountPaidUzs: formatMoney(paidTotalUzs),
        });
      }
    }
  }

  private getSaleCreditUzs(
    paymentType: SalePaymentType,
    totalUzs: Decimal,
    amountPaidUzs: Decimal,
    amountPaidUsd: Decimal,
    exchangeRate: Decimal,
  ): Decimal {
    if (paymentType === SalePaymentType.CREDIT) {
      return totalUzs;
    }
    if (paymentType === SalePaymentType.MIXED) {
      const paidUzs = amountPaidUzs.add(usdToUzs(amountPaidUsd, exchangeRate));
      return Decimal.max(0, totalUzs.sub(paidUzs));
    }
    return new Decimal(0);
  }

  private async generateSaleNumber(
    tx: Prisma.TransactionClient,
    companyId: string,
  ): Promise<string> {
    const year = new Date().getFullYear();
    const seq = await tx.saleNumberSequence.upsert({
      where: { companyId_year: { companyId, year } },
      create: { companyId, year, lastValue: 1 },
      update: { lastValue: { increment: 1 } },
    });
    return `S-${year}-${String(seq.lastValue).padStart(6, '0')}`;
  }

  private async resolveBranchId(
    tx: Prisma.TransactionClient,
    companyId: string,
    branchId?: string,
  ): Promise<string> {
    if (branchId) {
      const branch = await tx.branch.findFirst({ where: { id: branchId, companyId } });
      if (branch) return branch.id;
    }

    const defaultBranch = await tx.branch.findFirst({
      where: { companyId, isDefault: true, status: CompanyStatus.ACTIVE },
    });
    if (defaultBranch) return defaultBranch.id;

    const anyBranch = await tx.branch.findFirst({
      where: { companyId, status: CompanyStatus.ACTIVE },
    });
    if (!anyBranch) {
      throw AppException.businessRule('No active branch configured');
    }
    return anyBranch.id;
  }

  private async resolveWarehouse(
    tx: Prisma.TransactionClient,
    companyId: string,
    userId: string,
    branchId?: string,
  ) {
    const userCompany = await tx.userCompany.findUnique({
      where: { userId_companyId: { userId, companyId } },
    });

    const targetBranchId = branchId ?? userCompany?.branchId ?? undefined;

    if (targetBranchId) {
      const branchWarehouse = await tx.warehouse.findFirst({
        where: { companyId, branchId: targetBranchId, status: CompanyStatus.ACTIVE },
        orderBy: { createdAt: 'asc' },
      });
      if (branchWarehouse) return branchWarehouse;
    }

    const defaultBranch = await tx.branch.findFirst({
      where: { companyId, isDefault: true, status: CompanyStatus.ACTIVE },
    });
    if (defaultBranch) {
      const defaultWarehouse = await tx.warehouse.findFirst({
        where: { companyId, branchId: defaultBranch.id, status: CompanyStatus.ACTIVE },
        orderBy: { createdAt: 'asc' },
      });
      if (defaultWarehouse) return defaultWarehouse;
    }

    const anyWarehouse = await tx.warehouse.findFirst({
      where: { companyId, status: CompanyStatus.ACTIVE },
      orderBy: { createdAt: 'asc' },
    });
    if (!anyWarehouse) {
      throw AppException.businessRule('No active warehouse configured');
    }
    return anyWarehouse;
  }

  private async assertVoidWindow(
    tx: Prisma.TransactionClient,
    companyId: string,
    completedAt: Date,
  ): Promise<void> {
    const company = await tx.company.findFirst({ where: { id: companyId } });
    const settings = (company?.settings ?? {}) as Record<string, unknown>;
    const voidWindowHours =
      typeof settings.voidWindowHours === 'number' ? settings.voidWindowHours : 72;

    const deadline = new Date(completedAt);
    deadline.setHours(deadline.getHours() + voidWindowHours);

    if (new Date() > deadline) {
      throw AppException.businessRule('Void window has expired', { voidWindowHours });
    }
  }

  private async findSaleOrThrow(companyId: string, id: string): Promise<SaleWithRelations> {
    const sale = await this.prisma.sale.findFirst({
      where: { id, companyId },
      include: {
        customer: true,
        cashier: true,
        items: { include: { product: true } },
        fifoAllocations: { include: { product: true } },
      },
    });
    if (!sale) {
      throw AppException.notFound('Sale', id);
    }
    return sale;
  }

  private async findReturnOrThrow(companyId: string, id: string): Promise<ReturnWithRelations> {
    const ret = await this.prisma.saleReturn.findFirst({
      where: { id, companyId },
      include: {
        sale: true,
        customer: true,
        items: { include: { product: true } },
      },
    });
    if (!ret) {
      throw AppException.notFound('SaleReturn', id);
    }
    return ret;
  }

  private toSaleResponse(sale: SaleWithRelations): SaleResponseDto {
    const paidTotalUzs = sale.amountPaidUzs.add(
      usdToUzs(sale.amountPaidUsd, sale.exchangeRateUsed),
    );
    const cashDue =
      sale.paymentType === SalePaymentType.MIXED
        ? sale.totalUzs.sub(
            this.getSaleCreditUzs(
              sale.paymentType,
              sale.totalUzs,
              sale.amountPaidUzs,
              sale.amountPaidUsd,
              sale.exchangeRateUsed,
            ),
          )
        : sale.paymentType === SalePaymentType.CASH
          ? sale.totalUzs
          : new Decimal(0);
    const changeUzs = Decimal.max(0, paidTotalUzs.sub(cashDue));

    return {
      id: sale.id,
      number: sale.saleNumber,
      customerId: sale.customerId,
      customerName: sale.customer?.name ?? null,
      cashierId: sale.cashierId,
      cashierName: `${sale.cashier.firstName} ${sale.cashier.lastName}`.trim(),
      originalCurrency: sale.originalCurrency,
      exchangeRateUsed: formatMoney(sale.exchangeRateUsed),
      totalUzs: formatMoney(sale.totalUzs),
      totalUsd: formatMoney(sale.totalUsd),
      paymentType: sale.paymentType,
      amountPaidUzs: formatMoney(sale.amountPaidUzs),
      amountPaidUsd: formatMoney(sale.amountPaidUsd),
      status: sale.status,
      createdAt: sale.createdAt.toISOString(),
      lineItems: sale.items.map((item) => ({
        id: item.id,
        productId: item.productId,
        productName: item.product.name,
        sku: item.product.sku,
        quantity: formatMoney(item.quantity),
        unitPriceUzs: formatMoney(item.unitPriceUzs),
        unitPriceUsd: formatMoney(item.unitPriceUsd),
        totalUzs: formatMoney(item.totalUzs),
        totalUsd: formatMoney(item.totalUsd),
        cogsUzs: formatMoney(item.cogsUzs),
        cogsUsd: formatMoney(item.cogsUsd),
      })),
      fifoAllocations: sale.fifoAllocations.map((alloc) => ({
        id: alloc.id,
        saleItemId: alloc.saleItemId,
        batchId: alloc.batchId,
        productId: alloc.productId,
        productName: alloc.product.name,
        quantity: formatMoney(alloc.quantity),
        unitCostUzs: formatMoney(alloc.unitCostUzs),
        unitCostUsd: formatMoney(alloc.unitCostUsd),
        costUzs: formatMoney(alloc.costUzs),
        costUsd: formatMoney(alloc.costUsd),
      })),
      payments: [
        {
          method: sale.paymentType,
          amountUzs: formatMoney(sale.totalUzs),
          amountUsd: formatMoney(sale.totalUsd),
          receivedUzs: formatMoney(paidTotalUzs),
          changeUzs: formatMoney(changeUzs),
        },
      ],
    };
  }

  private toReturnResponse(ret: ReturnWithRelations): SaleReturnResponseDto {
    return {
      id: ret.id,
      saleId: ret.saleId,
      saleNumber: ret.sale.saleNumber,
      customerId: ret.customerId,
      customerName: ret.customer?.name ?? null,
      amountUzs: formatMoney(ret.amountUzs),
      amountUsd: formatMoney(ret.amountUsd),
      exchangeRateUsed: formatMoney(ret.exchangeRateUsed),
      reason: ret.reason,
      status: ret.status,
      createdAt: ret.createdAt.toISOString(),
      lineItems: ret.items.map((item) => ({
        productId: item.productId,
        productName: item.product.name,
        quantity: formatMoney(item.quantity),
        amountUzs: formatMoney(item.amountUzs),
      })),
    };
  }

  private async lockSaleForUpdate(
    tx: Prisma.TransactionClient,
    companyId: string,
    saleId: string,
  ): Promise<void> {
    await tx.$executeRaw`
      SELECT id FROM sales
      WHERE id = ${saleId}::uuid AND company_id = ${companyId}::uuid
      FOR UPDATE
    `;
  }

  private async getCumulativeReturnedQtyByProduct(
    tx: Prisma.TransactionClient,
    saleId: string,
    statuses: SaleReturnStatus[],
  ): Promise<Map<string, Decimal>> {
    const returns = await tx.saleReturn.findMany({
      where: { saleId, status: { in: statuses } },
      include: { items: true },
    });
    const map = new Map<string, Decimal>();
    for (const ret of returns) {
      for (const item of ret.items) {
        const current = map.get(item.productId) ?? new Decimal(0);
        map.set(item.productId, current.add(item.quantity));
      }
    }
    return map;
  }

  private computeSaleStatusAfterReturns(
    saleItems: Array<{ productId: string; quantity: Decimal }>,
    returnedByProduct: Map<string, Decimal>,
  ): SaleStatus {
    let totalReturned = new Decimal(0);
    let allFullyReturned = true;
    for (const item of saleItems) {
      const returned = returnedByProduct.get(item.productId) ?? new Decimal(0);
      totalReturned = totalReturned.add(returned);
      if (returned.lt(item.quantity)) {
        allFullyReturned = false;
      }
    }
    if (totalReturned.isZero()) {
      return SaleStatus.COMPLETED;
    }
    return allFullyReturned ? SaleStatus.RETURNED : SaleStatus.PARTIALLY_RETURNED;
  }

  async getReceiptTemplates(companyId: string) {
    const templates = await this.prisma.receiptTemplate.findMany({
      where: { companyId },
    });
    if (templates.length === 0) {
      const defaultTemplate = {
        name: 'Standart Chek',
        isDefault: true,
        logoUrl: null,
        phone: '+998 90 123-45-67',
        address: 'Tashkent, Uzbekistan',
        telegram: '@erp_market',
        instagram: '@erp_market',
        website: 'www.erp-market.uz',
        footerText: 'Xaridingiz uchun rahmat!',
        showQrCode: true,
        showBarcode: true,
      };
      return [defaultTemplate];
    }
    return templates;
  }

  async saveReceiptTemplate(companyId: string, dto: any) {
    const name = dto.name || 'Standart Chek';
    if (dto.isDefault) {
      await this.prisma.receiptTemplate.updateMany({
        where: { companyId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const template = await this.prisma.receiptTemplate.upsert({
      where: {
        companyId_name: {
          companyId,
          name,
        },
      },
      create: {
        companyId,
        name,
        isDefault: dto.isDefault ?? true,
        logoUrl: dto.logoUrl || null,
        phone: dto.phone || null,
        address: dto.address || null,
        telegram: dto.telegram || null,
        instagram: dto.instagram || null,
        website: dto.website || null,
        footerText: dto.footerText || null,
        showQrCode: dto.showQrCode ?? true,
        showBarcode: dto.showBarcode ?? true,
      },
      update: {
        isDefault: dto.isDefault ?? undefined,
        logoUrl: dto.logoUrl !== undefined ? dto.logoUrl : undefined,
        phone: dto.phone !== undefined ? dto.phone : undefined,
        address: dto.address !== undefined ? dto.address : undefined,
        telegram: dto.telegram !== undefined ? dto.telegram : undefined,
        instagram: dto.instagram !== undefined ? dto.instagram : undefined,
        website: dto.website !== undefined ? dto.website : undefined,
        footerText: dto.footerText !== undefined ? dto.footerText : undefined,
        showQrCode: dto.showQrCode !== undefined ? dto.showQrCode : undefined,
        showBarcode: dto.showBarcode !== undefined ? dto.showBarcode : undefined,
      },
    });

    return template;
  }
}
