import { Inject, Injectable } from '@nestjs/common';
import {
  Prisma,
  SupplierDebtHistoryType,
  SupplierReceivePaymentType,
  SupplierStatus,
  OriginalCurrency,
} from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { RLS_PRISMA, RlsPrismaClient } from '../../../core/database/rls-prisma.service';
import { AppException } from '../../../core/exceptions/app.exception';
import { formatMoney, isPositiveMoney } from '../../../core/utils/money.util';

// Narrow structural type for the models this service touches — avoids the
// TS "excessive stack depth" error from directly unioning the RLS-extended
// client's complex type with the plain transaction client type.
type SupplierDebtDb = Pick<Prisma.TransactionClient, 'supplier' | 'supplierDebtHistory'>;

@Injectable()
export class SupplierDebtService {
  constructor(@Inject(RLS_PRISMA) private readonly prisma: RlsPrismaClient) {}

  async recordReceiptCredit(
    tx: Prisma.TransactionClient,
    input: {
      companyId: string;
      supplierId: string;
      productId: string;
      warehouseId: string;
      inventoryBatchId: string;
      quantity: Decimal;
      unitCostUzs: Decimal;
      unitCostUsd?: Decimal;
      originalCurrency?: OriginalCurrency;
      exchangeRateUsed?: Decimal;
      note: string | null;
      receivedBy: string;
    },
  ): Promise<void> {
    const originalCurrency = input.originalCurrency ?? OriginalCurrency.UZS;
    const exchangeRateUsed = input.exchangeRateUsed ?? new Decimal(1);
    
    const unitCostUzs = input.unitCostUzs;
    const unitCostUsd = input.unitCostUsd ?? (originalCurrency === OriginalCurrency.USD ? unitCostUzs : unitCostUzs.div(exchangeRateUsed));

    const totalCostUzs = unitCostUzs.mul(input.quantity).toDecimalPlaces(4);
    const totalCostUsd = unitCostUsd.mul(input.quantity).toDecimalPlaces(4);

    await tx.supplierReceipt.create({
      data: {
        companyId: input.companyId,
        supplierId: input.supplierId,
        productId: input.productId,
        warehouseId: input.warehouseId,
        inventoryBatchId: input.inventoryBatchId,
        quantity: input.quantity,
        originalCurrency,
        exchangeRateUsed,
        unitCostUzs,
        unitCostUsd,
        totalCostUzs,
        totalCostUsd,
        paymentType: SupplierReceivePaymentType.CREDIT,
        note: input.note,
        receivedBy: input.receivedBy,
      },
    });

    const supplier = await tx.supplier.update({
      where: { id: input.supplierId, companyId: input.companyId },
      data: { 
        totalDebtUzs: { increment: totalCostUzs },
        totalDebtUsd: { increment: totalCostUsd }
      },
    });

    const balanceAfterUzs = supplier.totalDebtUzs.sub(supplier.totalPaidUzs);
    const balanceAfterUsd = supplier.totalDebtUsd.sub(supplier.totalPaidUsd);

    await tx.supplierDebtHistory.create({
      data: {
        companyId: input.companyId,
        supplierId: input.supplierId,
        type: SupplierDebtHistoryType.receipt_credit,
        amountUzs: totalCostUzs,
        amountUsd: totalCostUsd,
        balanceAfterUzs,
        balanceAfterUsd,
        reference: input.inventoryBatchId,
        recordedBy: input.receivedBy,
      },
    });
  }

  async recordCashReceipt(
    tx: Prisma.TransactionClient,
    input: {
      companyId: string;
      supplierId: string;
      productId: string;
      warehouseId: string;
      inventoryBatchId: string;
      quantity: Decimal;
      unitCostUzs: Decimal;
      unitCostUsd?: Decimal;
      originalCurrency?: OriginalCurrency;
      exchangeRateUsed?: Decimal;
      note: string | null;
      receivedBy: string;
    },
  ): Promise<void> {
    const originalCurrency = input.originalCurrency ?? OriginalCurrency.UZS;
    const exchangeRateUsed = input.exchangeRateUsed ?? new Decimal(1);
    const unitCostUzs = input.unitCostUzs;
    const unitCostUsd = input.unitCostUsd ?? (originalCurrency === OriginalCurrency.USD ? unitCostUzs : unitCostUzs.div(exchangeRateUsed));
    const totalCostUzs = unitCostUzs.mul(input.quantity).toDecimalPlaces(4);
    const totalCostUsd = unitCostUsd.mul(input.quantity).toDecimalPlaces(4);

    await tx.supplierReceipt.create({
      data: {
        companyId: input.companyId,
        supplierId: input.supplierId,
        productId: input.productId,
        warehouseId: input.warehouseId,
        inventoryBatchId: input.inventoryBatchId,
        quantity: input.quantity,
        originalCurrency,
        exchangeRateUsed,
        unitCostUzs,
        unitCostUsd,
        totalCostUzs,
        totalCostUsd,
        paymentType: SupplierReceivePaymentType.CASH,
        note: input.note,
        receivedBy: input.receivedBy,
      },
    });
  }

  async ensureSupplier(companyId: string, supplierId: string) {
    const supplier = await this.prisma.supplier.findFirst({
      where: { id: supplierId, companyId, deletedAt: null, status: SupplierStatus.ACTIVE },
    });
    if (!supplier) {
      throw AppException.notFound('Supplier', supplierId);
    }
    return supplier;
  }

  validatePaymentAmount(amount: Decimal): void {
    if (!isPositiveMoney(amount)) {
      throw AppException.validation('Validation failed', [
        { field: 'amount', message: 'Must be > 0', code: 'INVALID_AMOUNT' },
      ]);
    }
  }

  /**
   * Must run inside the caller's transaction: the supplier row is locked
   * FOR UPDATE before the remaining debt is read, so two concurrent
   * payments can't both pass the overpay check against the same balance.
   * Returns the UZS/USD amounts actually booked, for the payment row.
   */
  async applyPayment(
    companyId: string,
    supplierId: string,
    amount: Decimal,
    currency: OriginalCurrency,
    exchangeRate: Decimal,
    userId: string,
    paymentId: string,
    tx: Prisma.TransactionClient,
  ): Promise<{ amountUzs: Decimal; amountUsd: Decimal; balanceAfter: Decimal }> {
    const db: SupplierDebtDb = tx;
    await tx.$executeRaw`
      SELECT id FROM suppliers
      WHERE id = ${supplierId}::uuid AND company_id = ${companyId}::uuid AND deleted_at IS NULL
      FOR UPDATE
    `;
    const supplier = await db.supplier.findFirst({
      where: { id: supplierId, companyId, deletedAt: null },
    });
    if (!supplier) {
      throw AppException.notFound('Supplier', supplierId);
    }

    // Compare in the payment's own currency. Debt is booked in both
    // currencies at each receipt's rate; checking amount × today's rate
    // against the UZS remainder rejected (or allowed) USD payments purely
    // because the rate moved since the goods were received.
    const remainingUzs = supplier.totalDebtUzs.sub(supplier.totalPaidUzs);
    const remainingUsd = supplier.totalDebtUsd.sub(supplier.totalPaidUsd);
    const remainingInPaidCurrency = currency === OriginalCurrency.UZS ? remainingUzs : remainingUsd;

    if (amount.gt(remainingInPaidCurrency)) {
      throw AppException.businessRule(`Payment exceeds remaining supplier debt in ${currency}`, {
        remaining: formatMoney(Decimal.max(0, remainingInPaidCurrency)),
        amount: formatMoney(amount),
      });
    }

    // The other currency moves by the same share of its own remainder, so
    // paying off the debt in either currency clears both totals (instead of
    // leaving a UZS/USD residue from the rate difference).
    let amountUzs: Decimal;
    let amountUsd: Decimal;
    if (currency === OriginalCurrency.UZS) {
      amountUzs = amount;
      amountUsd = remainingUzs.gt(0) && remainingUsd.gt(0)
        ? remainingUsd.mul(amount).div(remainingUzs).toDecimalPlaces(4)
        : amount.div(exchangeRate).toDecimalPlaces(4);
    } else {
      amountUsd = amount;
      amountUzs = remainingUsd.gt(0) && remainingUzs.gt(0)
        ? remainingUzs.mul(amount).div(remainingUsd).toDecimalPlaces(4)
        : amount.mul(exchangeRate).toDecimalPlaces(4);
    }

    const updated = await db.supplier.update({
      where: { id: supplierId, companyId },
      data: { 
        totalPaidUzs: { increment: amountUzs },
        totalPaidUsd: { increment: amountUsd }
      },
    });

    const balanceAfterUzs = updated.totalDebtUzs.sub(updated.totalPaidUzs);
    const balanceAfterUsd = updated.totalDebtUsd.sub(updated.totalPaidUsd);

    await db.supplierDebtHistory.create({
      data: {
        companyId,
        supplierId,
        type: SupplierDebtHistoryType.payment,
        amountUzs,
        amountUsd,
        balanceAfterUzs,
        balanceAfterUsd,
        reference: paymentId,
        recordedBy: userId,
      },
    });

    return {
      amountUzs,
      amountUsd,
      balanceAfter: currency === OriginalCurrency.UZS ? balanceAfterUzs : balanceAfterUsd,
    };
  }
}
