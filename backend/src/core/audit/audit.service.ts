import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
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

type PrismaClientOrTx = PrismaService | Prisma.TransactionClient;

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Pass the active `tx` from an enclosing `$transaction` so the audit row
   * commits atomically with the mutation it describes — otherwise a crash
   * between the transaction commit and this write silently loses the audit
   * trail for that action. Omit `tx` only for entries with no enclosing
   * transaction (e.g. LOGIN/LOGOUT).
   */
  async log(entry: AuditEntryInput, tx?: PrismaClientOrTx): Promise<void> {
    const client = tx ?? this.prisma;
    await client.auditLog.create({
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
