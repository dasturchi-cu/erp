import { Injectable } from '@nestjs/common';
import {
  Prisma,
  SupplierDebtHistoryType,
  SupplierReceivePaymentType,
  SupplierStatus,
  OriginalCurrency,
} from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { PrismaService } from '../../../core/database/prisma.service';
import { AppException } from '../../../core/exceptions/app.exception';
import { formatMoney, isPositiveMoney } from '../../../core/utils/money.util';

@Injectable()
export class SupplierDebtService {
  constructor(private readonly prisma: PrismaService) {}

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

  async applyPayment(
    companyId: string,
    supplierId: string,
    amount: Decimal,
    currency: OriginalCurrency,
    exchangeRate: Decimal,
    userId: string,
    paymentId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<Decimal> {
    const db = tx ?? this.prisma;
    const supplier = await db.supplier.findFirst({
      where: { id: supplierId, companyId, deletedAt: null },
    });
    if (!supplier) {
      throw AppException.notFound('Supplier', supplierId);
    }

    const remainingUzs = supplier.totalDebtUzs.sub(supplier.totalPaidUzs);
    const amountUzs = currency === OriginalCurrency.UZS ? amount : amount.mul(exchangeRate);
    const amountUsd = currency === OriginalCurrency.USD ? amount : amount.div(exchangeRate);

    if (amountUzs.gt(remainingUzs)) {
      const remainingInPaidCurrency = currency === OriginalCurrency.UZS ? remainingUzs : remainingUzs.div(exchangeRate);
      throw AppException.businessRule(`Payment exceeds remaining supplier debt in ${currency}`, {
        remaining: formatMoney(remainingInPaidCurrency),
        amount: formatMoney(amount),
      });
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

    return currency === OriginalCurrency.UZS ? balanceAfterUzs : balanceAfterUsd;
  }
}
