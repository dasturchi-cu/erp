import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { AppException } from '../exceptions/app.exception';

export const IdempotencyKeyHeader = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const raw = request.headers['idempotency-key'];
    const key = Array.isArray(raw) ? raw[0] : raw;
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
  },
);
