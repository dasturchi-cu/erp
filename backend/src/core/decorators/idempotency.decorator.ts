import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { randomUUID } from 'crypto';

export const IdempotencyKeyHeader = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const raw = request.headers['idempotency-key'];
    const key = Array.isArray(raw) ? raw[0] : raw;
    const trimmed = key?.trim();
    if (trimmed && trimmed.length > 0) {
      return trimmed;
    }
    return randomUUID();
  },
);
