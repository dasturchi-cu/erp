import { Injectable } from '@nestjs/common';
import {
  NotificationCategory,
  NotificationSeverity,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../../../core/database/prisma.service';
import { AuditService } from '../../../core/audit/audit.service';
import { AppException } from '../../../core/exceptions/app.exception';
import {
  buildPaginationMeta,
  paginationSkip,
} from '../../../core/utils/pagination.util';
import {
  CreateNotificationInput,
  NotificationResponse,
  toNotificationResponse,
  userNotificationFilter,
} from './notification.types';

const DEDUP_HOURS = 24;

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async list(
    companyId: string,
    userId: string,
    params: {
      page: number;
      limit: number;
      read?: boolean;
      category?: NotificationCategory;
    },
  ) {
    const where: Prisma.NotificationWhereInput = {
      ...userNotificationFilter(companyId, userId),
    };
    if (params.read !== undefined) where.read = params.read;
    if (params.category) where.category = params.category;

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.notification.count({ where }),
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: paginationSkip(params.page, params.limit),
        take: params.limit,
      }),
    ]);

    return {
      data: rows.map(toNotificationResponse),
      meta: buildPaginationMeta(params.page, params.limit, total),
    };
  }

  async getUnreadCount(companyId: string, userId: string): Promise<{ count: number }> {
    const count = await this.prisma.notification.count({
      where: { ...userNotificationFilter(companyId, userId), read: false },
    });
    return { count };
  }

  async getById(companyId: string, userId: string, id: string): Promise<NotificationResponse> {
    const row = await this.findAccessible(companyId, userId, id);
    return toNotificationResponse(row);
  }

  async create(
    companyId: string,
    actorUserId: string,
    input: CreateNotificationInput,
    ip?: string,
    requestId?: string,
  ): Promise<NotificationResponse> {
    const row = await this.prisma.notification.create({
      data: {
        companyId,
        userId: input.userId ?? null,
        title: input.title,
        body: input.body,
        severity: input.severity ?? NotificationSeverity.info,
        category: input.category,
        entityType: input.entityType ?? null,
        entityId: input.entityId ?? null,
        metadata: (input.metadata ?? {}) as Prisma.InputJsonValue,
      },
    });

    await this.audit.log({
      companyId,
      userId: actorUserId,
      action: 'CREATE',
      entityType: 'notification',
      entityId: row.id,
      newValue: { category: input.category, title: input.title },
      ipAddress: ip,
      requestId,
    });

    return toNotificationResponse(row);
  }

  async createIfNotDuplicate(
    companyId: string,
    input: CreateNotificationInput,
  ): Promise<NotificationResponse | null> {
    if (input.entityId) {
      const since = new Date(Date.now() - DEDUP_HOURS * 3600000);
      const existing = await this.prisma.notification.findFirst({
        where: {
          companyId,
          category: input.category,
          entityId: input.entityId,
          deletedAt: null,
          read: false,
          createdAt: { gte: since },
          OR: input.userId
            ? [{ userId: input.userId }, { userId: null }]
            : [{ userId: null }],
        },
      });
      if (existing) return null;
    }

    const row = await this.prisma.notification.create({
      data: {
        companyId,
        userId: input.userId ?? null,
        title: input.title,
        body: input.body,
        severity: input.severity ?? NotificationSeverity.info,
        category: input.category,
        entityType: input.entityType ?? null,
        entityId: input.entityId ?? null,
        metadata: (input.metadata ?? {}) as Prisma.InputJsonValue,
      },
    });
    return toNotificationResponse(row);
  }

  async markRead(
    companyId: string,
    userId: string,
    id: string,
    ip?: string,
    requestId?: string,
  ): Promise<NotificationResponse> {
    const row = await this.findAccessible(companyId, userId, id);
    if (row.read) return toNotificationResponse(row);

    const updated = await this.prisma.notification.update({
      where: { id, companyId },
      data: { read: true, readAt: new Date() },
    });

    await this.audit.log({
      companyId,
      userId,
      action: 'UPDATE',
      entityType: 'notification',
      entityId: id,
      newValue: { read: true },
      ipAddress: ip,
      requestId,
    });

    return toNotificationResponse(updated);
  }

  async markUnread(
    companyId: string,
    userId: string,
    id: string,
    ip?: string,
    requestId?: string,
  ): Promise<NotificationResponse> {
    await this.findAccessible(companyId, userId, id);
    const updated = await this.prisma.notification.update({
      where: { id, companyId },
      data: { read: false, readAt: null },
    });

    await this.audit.log({
      companyId,
      userId,
      action: 'UPDATE',
      entityType: 'notification',
      entityId: id,
      newValue: { read: false },
      ipAddress: ip,
      requestId,
    });

    return toNotificationResponse(updated);
  }

  async toggleRead(
    companyId: string,
    userId: string,
    id: string,
    ip?: string,
    requestId?: string,
  ): Promise<NotificationResponse> {
    const row = await this.findAccessible(companyId, userId, id);
    return row.read
      ? this.markUnread(companyId, userId, id, ip, requestId)
      : this.markRead(companyId, userId, id, ip, requestId);
  }

  async markAllRead(
    companyId: string,
    userId: string,
    ip?: string,
    requestId?: string,
  ): Promise<{ updated: number }> {
    const result = await this.prisma.notification.updateMany({
      where: { ...userNotificationFilter(companyId, userId), read: false },
      data: { read: true, readAt: new Date() },
    });

    await this.audit.log({
      companyId,
      userId,
      action: 'UPDATE',
      entityType: 'notification',
      newValue: { markAllRead: true, updated: result.count },
      ipAddress: ip,
      requestId,
    });

    return { updated: result.count };
  }

  async delete(
    companyId: string,
    userId: string,
    id: string,
    ip?: string,
    requestId?: string,
  ): Promise<void> {
    await this.findAccessible(companyId, userId, id);
    await this.prisma.notification.update({
      where: { id, companyId },
      data: { deletedAt: new Date() },
    });

    await this.audit.log({
      companyId,
      userId,
      action: 'DELETE',
      entityType: 'notification',
      entityId: id,
      ipAddress: ip,
      requestId,
    });
  }

  async createLoginNotification(
    companyId: string,
    userId: string,
    deviceName: string,
    ipAddress?: string,
  ): Promise<void> {
    await this.createIfNotDuplicate(companyId, {
      userId,
      category: NotificationCategory.LOGIN,
      severity: NotificationSeverity.info,
      title: 'Tizimga kirish',
      body: `${deviceName} qurilmasidan tizimga kirdingiz${ipAddress ? ` (${ipAddress})` : ''}`,
      entityType: 'session',
      entityId: userId,
      metadata: { deviceName, ipAddress },
    });
  }

  private async findAccessible(companyId: string, userId: string, id: string) {
    const row = await this.prisma.notification.findFirst({
      where: { id, ...userNotificationFilter(companyId, userId) },
    });
    if (!row) throw AppException.notFound('Notification', id);
    return row;
  }
}
