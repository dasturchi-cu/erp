import { Injectable } from '@nestjs/common';
import { NotificationCategory, NotificationSeverity } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { PrismaService } from '../../../core/database/prisma.service';
import { formatMoney } from '../../../core/utils/money.util';
import { NotificationsService } from './notifications.service';

@Injectable()
export class NotificationAlertsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async scanAndCreateAlerts(companyId: string): Promise<{ created: number }> {
    let created = 0;

    created += await this.scanLowStock(companyId);
    created += await this.scanStockAlerts(companyId);
    created += await this.scanCustomerDebt(companyId);
    created += await this.scanSupplierDebt(companyId);
    created += await this.scanExpiredProducts(companyId);
    created += await this.scanOverdueDebt(companyId);

    return { created };
  }

  private async scanLowStock(companyId: string): Promise<number> {
    const batches = await this.prisma.inventoryBatch.findMany({
      where: { companyId, remainingQty: { gt: 0 } },
      include: {
        product: { select: { id: true, name: true, sku: true, minStockLevel: true, deletedAt: true } },
      },
    });

    const stockMap = new Map<string, { product: typeof batches[0]['product']; qty: Decimal }>();
    for (const b of batches) {
      if (b.product.deletedAt) continue;
      const e = stockMap.get(b.productId) ?? { product: b.product, qty: new Decimal(0) };
      e.qty = e.qty.add(b.remainingQty);
      stockMap.set(b.productId, e);
    }

    let count = 0;
    for (const [, { product, qty }] of stockMap) {
      if (qty.gt(0) && qty.lt(product.minStockLevel)) {
        const result = await this.notifications.createIfNotDuplicate(companyId, {
          category: NotificationCategory.LOW_STOCK,
          severity: NotificationSeverity.warning,
          title: 'Kam qoldiq ogohlantirishi',
          body: `${product.name} (${product.sku}) qoldig'i ${formatMoney(qty)} — minimal ${formatMoney(product.minStockLevel)}`,
          entityType: 'product',
          entityId: product.id,
        });
        if (result) count += 1;
      }
    }
    return count;
  }

  private async scanStockAlerts(companyId: string): Promise<number> {
    const batches = await this.prisma.inventoryBatch.groupBy({
      by: ['productId'],
      where: { companyId },
      _sum: { remainingQty: true },
    });

    const products = await this.prisma.product.findMany({
      where: { companyId, deletedAt: null, status: 'ACTIVE' },
      select: { id: true, name: true, sku: true },
    });
    const stockByProduct = new Map(batches.map((b) => [b.productId, b._sum.remainingQty ?? new Decimal(0)]));

    let count = 0;
    for (const product of products) {
      const qty = stockByProduct.get(product.id) ?? new Decimal(0);
      if (qty.lte(0)) {
        const result = await this.notifications.createIfNotDuplicate(companyId, {
          category: NotificationCategory.STOCK_ALERT,
          severity: NotificationSeverity.error,
          title: 'Zaxira tugadi',
          body: `${product.name} (${product.sku}) omborda qolmagan`,
          entityType: 'product',
          entityId: product.id,
        });
        if (result) count += 1;
      }
    }
    return count;
  }

  private async scanCustomerDebt(companyId: string): Promise<number> {
    const customers = await this.prisma.customer.findMany({
      where: {
        companyId,
        deletedAt: null,
        OR: [{ totalDebtUzs: { gt: 0 } }, { totalDebtUsd: { gt: 0 } }],
      },
      select: { id: true, name: true, totalDebtUzs: true, totalDebtUsd: true },
      take: 50,
    });

    let count = 0;
    for (const c of customers) {
      const result = await this.notifications.createIfNotDuplicate(companyId, {
        category: NotificationCategory.CUSTOMER_DEBT,
        severity: NotificationSeverity.warning,
        title: 'Mijoz qarzi',
        body: `${c.name}: ${formatMoney(c.totalDebtUzs)} so'm${c.totalDebtUsd.gt(0) ? ` / $${formatMoney(c.totalDebtUsd)}` : ''}`,
        entityType: 'customer',
        entityId: c.id,
      });
      if (result) count += 1;
    }
    return count;
  }

  private async scanSupplierDebt(companyId: string): Promise<number> {
    const suppliers = await this.prisma.supplier.findMany({
      where: { companyId, deletedAt: null, totalDebtUzs: { gt: 0 } },
      select: { id: true, name: true, totalDebtUzs: true },
      take: 50,
    });

    let count = 0;
    for (const s of suppliers) {
      const result = await this.notifications.createIfNotDuplicate(companyId, {
        category: NotificationCategory.SUPPLIER_DEBT,
        severity: NotificationSeverity.warning,
        title: 'Yetkazib beruvchi qarzi',
        body: `${s.name}: ${formatMoney(s.totalDebtUzs)} so'm qarz`,
        entityType: 'supplier',
        entityId: s.id,
      });
      if (result) count += 1;
    }
    return count;
  }

  private async scanExpiredProducts(companyId: string): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const products = await this.prisma.product.findMany({
      where: {
        companyId,
        deletedAt: null,
        expiresAt: { lte: today },
      },
      select: { id: true, name: true, sku: true, expiresAt: true },
      take: 50,
    });

    let count = 0;
    for (const p of products) {
      const result = await this.notifications.createIfNotDuplicate(companyId, {
        category: NotificationCategory.EXPIRED_PRODUCT,
        severity: NotificationSeverity.error,
        title: 'Muddati o\'tgan mahsulot',
        body: `${p.name} (${p.sku}) muddati ${p.expiresAt?.toISOString().slice(0, 10)} da tugagan`,
        entityType: 'product',
        entityId: p.id,
      });
      if (result) count += 1;
    }
    return count;
  }

  private async scanOverdueDebt(companyId: string): Promise<number> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);
    const overdue = await this.prisma.debtHistory.findMany({
      where: {
        companyId,
        type: 'sale_credit',
        createdAt: { lte: thirtyDaysAgo },
        customer: { totalDebtUzs: { gt: 0 } },
      },
      include: { customer: { select: { id: true, name: true, totalDebtUzs: true } } },
      distinct: ['customerId'],
      take: 30,
    });

    let count = 0;
    for (const entry of overdue) {
      const result = await this.notifications.createIfNotDuplicate(companyId, {
        category: NotificationCategory.DEBT_ALERT,
        severity: NotificationSeverity.error,
        title: 'Muddat o\'tgan qarz',
        body: `${entry.customer.name} qarzi 30 kundan oshdi (${formatMoney(entry.customer.totalDebtUzs)} so'm)`,
        entityType: 'customer',
        entityId: entry.customer.id,
      });
      if (result) count += 1;
    }
    return count;
  }

  async createSystemNotification(
    companyId: string,
    actorUserId: string,
    title: string,
    body: string,
    userId?: string,
    ip?: string,
    requestId?: string,
  ) {
    return this.notifications.create(
      companyId,
      actorUserId,
      {
        category: NotificationCategory.SYSTEM,
        severity: NotificationSeverity.info,
        title,
        body,
        userId,
      },
      ip,
      requestId,
    );
  }
}
