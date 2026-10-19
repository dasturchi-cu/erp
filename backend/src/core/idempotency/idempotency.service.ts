import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { createHash } from 'crypto';
import { Prisma } from '@prisma/client';
import { RLS_PRISMA, RlsPrismaClient } from '../database/rls-prisma.service';
import { rlsContextStorage } from '../company/rls-context.storage';
import { AppException } from '../exceptions/app.exception';

// Long enough to cover a phone that stays offline over a weekend: the mobile
// offline queue replays sales with their original key, and a replay after
// the key expired would be recorded as a second sale.
const TTL_MS = 7 * 24 * 60 * 60 * 1000;
/** Sentinel: handler in progress; not a valid HTTP status for clients. */
const IN_FLIGHT_STATUS = 0;
/**
 * An IN_FLIGHT row older than this belongs to a request whose process died
 * before it could record a result or delete the claim (the handler's own
 * failure path deletes it). Without this the key stayed "in progress" for
 * the full 24h TTL and the client could never retry it.
 */
const IN_FLIGHT_STALE_MS = 5 * 60 * 1000;
/** Claim attempts before giving up on a key that keeps getting raced. */
const MAX_CLAIM_ATTEMPTS = 3;

type IdempotencyRow = {
  id: string;
  requestHash: string | null;
  responseStatus: number;
  responseBody: Prisma.JsonValue;
  createdAt: Date;
  expiresAt: Date;
};

/** True when the row still decides the outcome (not expired / abandoned). */
function isLive(row: IdempotencyRow, now: Date): boolean {
  if (row.expiresAt <= now) return false;
  if (
    row.responseStatus === IN_FLIGHT_STATUS &&
    now.getTime() - row.createdAt.getTime() > IN_FLIGHT_STALE_MS
  ) {
    return false;
  }
  return true;
}

export interface IdempotencyExecuteResult<T> {
  cached: boolean;
  status: number;
  body: T;
}

@Injectable()
export class IdempotencyService {
  private readonly logger = new Logger(IdempotencyService.name);

  constructor(@Inject(RLS_PRISMA) private readonly prisma: RlsPrismaClient) {}

  /**
   * Wraps this service's own direct Prisma calls with the companyId it was
   * explicitly given — never the ambient per-request context — since this
   * runs both from within an already-scoped request AND is a cross-cutting
   * concern other bypass-context callers could invoke. `params.handler()`
   * itself is invoked outside this wrapper, so it keeps using whatever
   * ambient context is already active for the surrounding request.
   *
   * `fn` must itself `await` its Prisma call rather than just returning it:
   * Prisma Client calls are lazy thenables that don't start real work until
   * awaited, so a callback that merely returns the call would let the
   * actual execution happen one level up, after run()'s scope has closed.
   */
  private withCompany<T>(companyId: string, fn: () => Promise<T>): Promise<T> {
    return rlsContextStorage.run({ companyId }, fn);
  }

  hashRequest(body: unknown): string {
    let normalized: unknown = body ?? {};
    if (body && typeof body === 'object' && !Array.isArray(body)) {
      const sorted: Record<string, unknown> = {};
      for (const key of Object.keys(body as Record<string, unknown>).sort()) {
        sorted[key] = (body as Record<string, unknown>)[key];
      }
      normalized = sorted;
    }
    return createHash('sha256').update(JSON.stringify(normalized)).digest('hex');
  }

  requireKey(key: string | undefined): string {
    const trimmed = key?.trim();
    if (!trimmed) {
      throw AppException.validation('Validation failed', [
        {
          field: 'Idempotency-Key',
          message: 'Idempotency-Key header is required',
          code: 'MISSING_IDEMPOTENCY_KEY',
        },
      ]);
    }
    return trimmed;
  }

  async execute<T>(
    params: {
      companyId: string;
      key: string;
      endpoint: string;
      requestHash?: string;
      handler: () => Promise<{ status: number; body: T }>;
    },
  ): Promise<IdempotencyExecuteResult<T>> {
    const expiresAt = new Date(Date.now() + TTL_MS);
    const where = {
      companyId_idempotencyKey_endpoint: {
        companyId: params.companyId,
        idempotencyKey: params.key,
        endpoint: params.endpoint,
      },
    };

    let claimed = false;
    for (let attempt = 0; attempt < MAX_CLAIM_ATTEMPTS && !claimed; attempt++) {
      const existing = await this.withCompany(params.companyId, async () =>
        await this.prisma.idempotencyKey.findUnique({ where }),
      );

      if (existing) {
        const now = new Date();
        if (isLive(existing, now)) {
          return this.replayExisting<T>(existing, params.requestHash);
        }
        // Expired or abandoned: drop it and treat this as a fresh request.
        // Re-checked in the WHERE so a row that completed (or was re-claimed
        // under a new id) in the meantime is left alone.
        await this.withCompany(params.companyId, async () =>
          await this.prisma.idempotencyKey.deleteMany({
            where: {
              id: existing.id,
              OR: [
                { expiresAt: { lte: now } },
                {
                  responseStatus: IN_FLIGHT_STATUS,
                  createdAt: { lt: new Date(now.getTime() - IN_FLIGHT_STALE_MS) },
                },
              ],
            },
          }),
        );
      }

      try {
        await this.withCompany(params.companyId, async () =>
          await this.prisma.idempotencyKey.create({
            data: {
              companyId: params.companyId,
              idempotencyKey: params.key,
              endpoint: params.endpoint,
              requestHash: params.requestHash ?? null,
              responseStatus: IN_FLIGHT_STATUS,
              responseBody: {},
              expiresAt,
            },
          }),
        );
        claimed = true;
      } catch (err: unknown) {
        // Lost the race to another request with the same key: loop and
        // replay (or re-claim) whatever row it left.
        if (
          !(err instanceof Prisma.PrismaClientKnownRequestError) ||
          err.code !== 'P2002'
        ) {
          throw err;
        }
      }
    }
    if (!claimed) {
      throw AppException.conflict(
        'IDEMPOTENCY_IN_PROGRESS',
        'Request with this idempotency key is already in progress',
      );
    }

    try {
      const result = await params.handler();

      await this.withCompany(params.companyId, async () =>
        await this.prisma.idempotencyKey.update({
          where,
          data: {
            requestHash: params.requestHash ?? null,
            responseStatus: result.status,
            responseBody: result.body as object,
            expiresAt,
          },
        }),
      );

      return { cached: false, status: result.status, body: result.body };
    } catch (err) {
      await this.withCompany(params.companyId, async () =>
        await this.prisma.idempotencyKey.delete({ where }),
      ).catch(() => undefined);
      throw err;
    }
  }

  private replayExisting<T>(
    existing: IdempotencyRow,
    requestHash: string | undefined,
  ): IdempotencyExecuteResult<T> {
    if (requestHash && existing.requestHash && existing.requestHash !== requestHash) {
      throw AppException.conflict(
        'IDEMPOTENCY_KEY_MISMATCH',
        'Idempotency key reused with different request body',
      );
    }
    if (existing.responseStatus === IN_FLIGHT_STATUS) {
      throw AppException.conflict(
        'IDEMPOTENCY_IN_PROGRESS',
        'Request with this idempotency key is already in progress',
      );
    }
    return {
      cached: true,
      status: existing.responseStatus,
      body: existing.responseBody as T,
    };
  }

  /**
   * Expired keys are never replayed (execute() re-claims them), so they are
   * just dead weight on the unique index — purge them daily.
   */
  @Cron('15 4 * * *')
  async purgeExpiredKeys(): Promise<number> {
    try {
      const result = await rlsContextStorage.run({ bypass: true }, async () =>
        await this.prisma.idempotencyKey.deleteMany({
          where: { expiresAt: { lt: new Date() } },
        }),
      );
      if (result.count > 0) {
        this.logger.log(`Purged ${result.count} expired idempotency keys`);
      }
      return result.count;
    } catch (err) {
      this.logger.error(
        `Idempotency key purge failed: ${err instanceof Error ? err.message : String(err)}`,
      );
      return 0;
    }
  }
}
