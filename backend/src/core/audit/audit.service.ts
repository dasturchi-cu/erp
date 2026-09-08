import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { RLS_PRISMA, RlsPrismaClient } from '../database/rls-prisma.service';
import { rlsContextStorage } from '../company/rls-context.storage';

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

// Callers always pass the plain tx from a base-client $transaction callback
// (never the RLS-extended client) — see the RLS Stage A plan.
type PrismaTx = Prisma.TransactionClient;

@Injectable()
export class AuditService {
  constructor(@Inject(RLS_PRISMA) private readonly prisma: RlsPrismaClient) {}

  /**
   * Pass the active `tx` from an enclosing `$transaction` so the audit row
   * commits atomically with the mutation it describes — otherwise a crash
   * between the transaction commit and this write silently loses the audit
   * trail for that action. Omit `tx` only for entries with no enclosing
   * transaction (e.g. LOGIN/LOGOUT).
   *
   * When `tx` is given, it already carries the right `set_config` (the
   * enclosing transaction sets it). When it's absent, this wraps the write
   * itself with the entry's own `companyId` — never the ambient context,
   * since audit entries must never be silently dropped by a mismatched or
   * missing scope — falling back to `bypass` for intentionally system-level
   * entries (`companyId: null`, e.g. a pre-company-context LOGIN failure).
   */
  async log(entry: AuditEntryInput, tx?: PrismaTx): Promise<void> {
    const data = {
      companyId: entry.companyId ?? null,
      userId: entry.userId ?? null,
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId ?? null,
      oldValue: entry.oldValue !== undefined ? (entry.oldValue as object) : undefined,
      newValue: entry.newValue !== undefined ? (entry.newValue as object) : undefined,
      ipAddress: entry.ipAddress ?? null,
      requestId: entry.requestId ?? null,
    };

    if (tx) {
      await tx.auditLog.create({ data });
      return;
    }

    // The callback must itself `await` the Prisma call — Prisma Client calls
    // are lazy thenables that don't start real work until awaited, so just
    // returning the call here would let the actual execution happen one
    // level up (in this method's own `await`), after run()'s scope closed.
    const rlsContext = entry.companyId ? { companyId: entry.companyId } : { bypass: true };
    await rlsContextStorage.run(rlsContext, async () => await this.prisma.auditLog.create({ data }));
  }
}
