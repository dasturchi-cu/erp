import { Injectable } from '@nestjs/common';
import { DebtHistoryType, OriginalCurrency, Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { formatMoney, usdToUzs, uzsToUsd } from '../../../core/utils/money.util';
import { lockCustomerForDebtUpdate } from './debt-lock.util';

@Injectable()
export class DebtService {
  async applySaleCredit(
    tx: Prisma.TransactionClient,
    params: {
      companyId: string;
      customerId: string;
      amountUzs: Decimal;
      exchangeRate: Decimal;
      referenceType: string;
      referenceId: string;
      referenceLabel: string;
      recordedBy: string;
    },
  ): Promise<void> {
    await lockCustomerForDebtUpdate(tx, params.companyId, params.customerId);
    const customer = await tx.customer.findFirstOrThrow({
      where: { id: params.customerId, companyId: params.companyId, deletedAt: null },
    });

    const amountUsd = uzsToUsd(params.amountUzs, params.exchangeRate);
    const newDebtUzs = customer.totalDebtUzs.add(params.amountUzs);
    const newDebtUsd = uzsToUsd(newDebtUzs, params.exchangeRate);

    await tx.debtHistory.create({
      data: {
        companyId: params.companyId,
        customerId: params.customerId,
        type: DebtHistoryType.sale_credit,
        amountUzs: params.amountUzs,
        amountUsd,
        balanceAfterUzs: newDebtUzs,
        balanceAfterUsd: newDebtUsd,
        referenceType: params.referenceType,
        referenceId: params.referenceId,
        referenceLabel: params.referenceLabel,
        recordedBy: params.recordedBy,
      },
    });

    await tx.customer.update({
      where: { id: params.customerId, companyId: params.companyId },
      data: {
        totalDebtUzs: newDebtUzs,
        totalDebtUsd: newDebtUsd,
      },
    });
  }

  async reverseSaleCredit(
    tx: Prisma.TransactionClient,
    params: {
      companyId: string;
      customerId: string;
      amountUzs: Decimal;
      exchangeRate: Decimal;
      referenceType: string;
      referenceId: string;
      referenceLabel: string;
      recordedBy: string;
    },
  ): Promise<void> {
    await lockCustomerForDebtUpdate(tx, params.companyId, params.customerId);
    const customer = await tx.customer.findFirstOrThrow({
      where: { id: params.customerId, companyId: params.companyId, deletedAt: null },
    });

    const amountUsd = uzsToUsd(params.amountUzs, params.exchangeRate);
    const newDebtUzs = Decimal.max(0, customer.totalDebtUzs.sub(params.amountUzs));
    const newDebtUsd = uzsToUsd(newDebtUzs, params.exchangeRate);

    await tx.debtHistory.create({
      data: {
        companyId: params.companyId,
        customerId: params.customerId,
        type: DebtHistoryType.sale_void,
        amountUzs: params.amountUzs,
        amountUsd,
        balanceAfterUzs: newDebtUzs,
        balanceAfterUsd: newDebtUsd,
        referenceType: params.referenceType,
        referenceId: params.referenceId,
        referenceLabel: params.referenceLabel,
        recordedBy: params.recordedBy,
      },
    });

    await tx.customer.update({
      where: { id: params.customerId, companyId: params.companyId },
      data: {
        totalDebtUzs: newDebtUzs,
        totalDebtUsd: newDebtUsd,
      },
    });
  }

  async applyPayment(
    tx: Prisma.TransactionClient,
    params: {
      companyId: string;
      customerId: string;
      amount: Decimal;
      currency: OriginalCurrency;
      exchangeRate: Decimal;
      referenceType: string;
      referenceId: string;
      referenceLabel: string;
      recordedBy: string;
    },
  ): Promise<void> {
    await lockCustomerForDebtUpdate(tx, params.companyId, params.customerId);
    const customer = await tx.customer.findFirstOrThrow({
      where: { id: params.customerId, companyId: params.companyId, deletedAt: null },
    });

    let amountUzs: Decimal;
    let amountUsd: Decimal;
    let newDebtUzs: Decimal;

    if (params.currency === OriginalCurrency.UZS) {
      amountUzs = params.amount;
      amountUsd = uzsToUsd(params.amount, params.exchangeRate);
      newDebtUzs = Decimal.max(0, customer.totalDebtUzs.sub(params.amount));
    } else {
      amountUsd = params.amount;
      amountUzs = usdToUzs(params.amount, params.exchangeRate);
      newDebtUzs = Decimal.max(0, customer.totalDebtUzs.sub(amountUzs));
    }

    const newDebtUsd = uzsToUsd(newDebtUzs, params.exchangeRate);

    await tx.debtHistory.create({
      data: {
        companyId: params.companyId,
        customerId: params.customerId,
        type: DebtHistoryType.payment,
        amountUzs,
        amountUsd,
        balanceAfterUzs: newDebtUzs,
        balanceAfterUsd: newDebtUsd,
        referenceType: params.referenceType,
        referenceId: params.referenceId,
        referenceLabel: params.referenceLabel,
        recordedBy: params.recordedBy,
      },
    });

    await tx.customer.update({
      where: { id: params.customerId, companyId: params.companyId },
      data: {
        totalDebtUzs: newDebtUzs,
        totalDebtUsd: newDebtUsd,
        lastPaymentAt: new Date(),
      },
    });
  }

  async reversePayment(
    tx: Prisma.TransactionClient,
    params: {
      companyId: string;
      customerId: string;
      amount: Decimal;
      currency: OriginalCurrency;
      exchangeRate: Decimal;
      referenceType: string;
      referenceId: string;
      referenceLabel: string;
      recordedBy: string;
    },
  ): Promise<void> {
    await lockCustomerForDebtUpdate(tx, params.companyId, params.customerId);
    const customer = await tx.customer.findFirstOrThrow({
      where: { id: params.customerId, companyId: params.companyId, deletedAt: null },
    });

    let amountUzs: Decimal;
    let amountUsd: Decimal;
    let newDebtUzs: Decimal;

    if (params.currency === OriginalCurrency.UZS) {
      amountUzs = params.amount;
      amountUsd = uzsToUsd(params.amount, params.exchangeRate);
      newDebtUzs = customer.totalDebtUzs.add(params.amount);
    } else {
      amountUsd = params.amount;
      amountUzs = usdToUzs(params.amount, params.exchangeRate);
      newDebtUzs = customer.totalDebtUzs.add(amountUzs);
    }

    const newDebtUsd = uzsToUsd(newDebtUzs, params.exchangeRate);

    await tx.debtHistory.create({
      data: {
        companyId: params.companyId,
        customerId: params.customerId,
        type: DebtHistoryType.adjustment,
        amountUzs,
        amountUsd,
        balanceAfterUzs: newDebtUzs,
        balanceAfterUsd: newDebtUsd,
        referenceType: params.referenceType,
        referenceId: params.referenceId,
        referenceLabel: params.referenceLabel,
        recordedBy: params.recordedBy,
      },
    });

    await tx.customer.update({
      where: { id: params.customerId, companyId: params.companyId },
      data: {
        totalDebtUzs: newDebtUzs,
        totalDebtUsd: newDebtUsd,
      },
    });
  }

  async applyReturnCredit(
    tx: Prisma.TransactionClient,
    params: {
      companyId: string;
      customerId: string;
      amountUzs: Decimal;
      exchangeRate: Decimal;
      referenceType: string;
      referenceId: string;
      referenceLabel: string;
      recordedBy: string;
    },
  ): Promise<void> {
    await lockCustomerForDebtUpdate(tx, params.companyId, params.customerId);
    const customer = await tx.customer.findFirstOrThrow({
      where: { id: params.customerId, companyId: params.companyId, deletedAt: null },
    });

    const amountUsd = uzsToUsd(params.amountUzs, params.exchangeRate);
    const newDebtUzs = Decimal.max(0, customer.totalDebtUzs.sub(params.amountUzs));
    const newDebtUsd = uzsToUsd(newDebtUzs, params.exchangeRate);

    await tx.debtHistory.create({
      data: {
        companyId: params.companyId,
        customerId: params.customerId,
        type: DebtHistoryType.return,
        amountUzs: params.amountUzs,
        amountUsd,
        balanceAfterUzs: newDebtUzs,
        balanceAfterUsd: newDebtUsd,
        referenceType: params.referenceType,
        referenceId: params.referenceId,
        referenceLabel: params.referenceLabel,
        recordedBy: params.recordedBy,
      },
    });

    await tx.customer.update({
      where: { id: params.customerId, companyId: params.companyId },
      data: {
        totalDebtUzs: newDebtUzs,
        totalDebtUsd: newDebtUsd,
      },
    });
  }

  static formatBalances(debtUzs: Decimal, debtUsd: Decimal) {
    return {
      debtUzs: formatMoney(debtUzs),
      debtUsd: formatMoney(debtUsd),
    };
  }
}
