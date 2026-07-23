import { NotificationCategory, NotificationSeverity, Prisma } from '@prisma/client';

export interface NotificationResponse {
  id: string;
  title: string;
  body: string;
  type: NotificationSeverity;
  read: boolean;
  createdAt: string;
  category?: NotificationCategory;
}

export interface CreateNotificationInput {
  title: string;
  body: string;
  severity?: NotificationSeverity;
  category: NotificationCategory;
  userId?: string;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}

export function toNotificationResponse(row: {
  id: string;
  title: string;
  body: string;
  severity: NotificationSeverity;
  category: NotificationCategory;
  read: boolean;
  createdAt: Date;
}): NotificationResponse {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    type: row.severity,
    read: row.read,
    createdAt: row.createdAt.toISOString(),
    category: row.category,
  };
}

export function userNotificationFilter(companyId: string, userId: string): Prisma.NotificationWhereInput {
  return {
    companyId,
    deletedAt: null,
    OR: [{ userId }, { userId: null }],
  };
}
