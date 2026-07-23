import { Injectable } from '@nestjs/common';
import { createHash } from 'crypto';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { AppException } from '../exceptions/app.exception';

const TTL_MS = 24 * 60 * 60 * 1000;
/** Sentinel: handler in progress; not a valid HTTP status for clients. */
const IN_FLIGHT_STATUS = 0;

export interface IdempotencyExecuteResult<T> {
  cached: boolean;
  status: number;
  body: T;
}

@Injectable()
export class IdempotencyService {
  constructor(private readonly prisma: PrismaService) {}

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

    const existing = await this.prisma.idempotencyKey.findUnique({ where });

    if (existing && existing.expiresAt > new Date()) {
      if (
        params.requestHash &&
        existing.requestHash &&
        existing.requestHash !== params.requestHash
      ) {
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

    try {
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
      });
    } catch (err: unknown) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        const raced = await this.prisma.idempotencyKey.findUnique({ where });
        if (raced && raced.expiresAt > new Date()) {
          if (raced.responseStatus === IN_FLIGHT_STATUS) {
            throw AppException.conflict(
              'IDEMPOTENCY_IN_PROGRESS',
              'Request with this idempotency key is already in progress',
            );
          }
          return {
            cached: true,
            status: raced.responseStatus,
            body: raced.responseBody as T,
          };
        }
      }
      throw err;
    }

    try {
      const result = await params.handler();

      await this.prisma.idempotencyKey.update({
        where,
        data: {
          requestHash: params.requestHash ?? null,
          responseStatus: result.status,
          responseBody: result.body as object,
          expiresAt,
        },
      });

      return { cached: false, status: result.status, body: result.body };
    } catch (err) {
      await this.prisma.idempotencyKey.delete({ where }).catch(() => undefined);
      throw err;
    }
  }
}
