import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

export interface AuditEntryInput {
  companyId?: string | null;
  userId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  oldValue?: unknown;
  newValue?: unknown;
  ipAddress?: string | null;
  requestId?: string | null;
}

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(entry: AuditEntryInput): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        companyId: entry.companyId ?? null,
        userId: entry.userId ?? null,
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId ?? null,
        oldValue: entry.oldValue !== undefined ? (entry.oldValue as object) : undefined,
        newValue: entry.newValue !== undefined ? (entry.newValue as object) : undefined,
        ipAddress: entry.ipAddress ?? null,
        requestId: entry.requestId ?? null,
      },
    });
  }
}
