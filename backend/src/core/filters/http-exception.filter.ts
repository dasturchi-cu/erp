import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Request, Response } from 'express';
import { AppException } from '../exceptions/app.exception';
import { PilotErrorLogger } from '../logging/pilot-error.logger';
import { JwtPayload } from '../../modules/auth/interfaces/jwt-payload.interface';

type PilotRequest = Request & {
  requestId?: string;
  user?: JwtPayload;
};

interface MappedError {
  status: number;
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

const NUMERIC_OVERFLOW_SQLSTATE = '22003';

function mapPrismaError(exception: unknown): MappedError | null {
  if (exception instanceof Prisma.PrismaClientKnownRequestError) {
    const meta = (exception.meta ?? {}) as Record<string, unknown>;
    switch (exception.code) {
      case 'P2025':
        return { status: HttpStatus.NOT_FOUND, code: 'NOT_FOUND', message: 'Record not found' };
      case 'P2002':
        return {
          status: HttpStatus.CONFLICT,
          code: 'CONFLICT',
          message: 'A record with these values already exists',
          details: meta.target ? { fields: meta.target } : undefined,
        };
      case 'P2003':
        return {
          status: HttpStatus.BAD_REQUEST,
          code: 'VALIDATION_ERROR',
          message: 'Referenced record does not exist',
        };
      case 'P2000':
      case 'P2020':
      case 'P2033':
        return {
          status: HttpStatus.BAD_REQUEST,
          code: 'VALIDATION_ERROR',
          message: 'Value is out of range for its field',
        };
      case 'P2010':
        if (meta.code === NUMERIC_OVERFLOW_SQLSTATE) {
          return {
            status: HttpStatus.BAD_REQUEST,
            code: 'VALIDATION_ERROR',
            message: 'Value is out of range for its field',
          };
        }
        return null;
      default:
        return null;
    }
  }
  // Decimal overflow inside a write surfaces as an unknown request error
  // carrying the Postgres SQLSTATE / message.
  if (
    exception instanceof Prisma.PrismaClientUnknownRequestError &&
    (exception.message.includes(NUMERIC_OVERFLOW_SQLSTATE) ||
      exception.message.includes('numeric field overflow'))
  ) {
    return {
      status: HttpStatus.BAD_REQUEST,
      code: 'VALIDATION_ERROR',
      message: 'Value is out of range for its field',
    };
  }
  return null;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(private readonly pilotLogger: PilotErrorLogger) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<PilotRequest>();

    const requestId = request.requestId ?? undefined;
    const pilotBase = this.buildPilotBase(request, requestId);

    if (exception instanceof AppException) {
      if (exception.httpStatus >= HttpStatus.INTERNAL_SERVER_ERROR) {
        void this.pilotLogger.log({
          ...pilotBase,
          error: exception.message,
          stackTrace: exception.stack ?? null,
          statusCode: exception.httpStatus,
          code: exception.code,
        });
      }
      return response.status(exception.httpStatus).json({
        error: {
          code: exception.code,
          message: exception.message,
          details: exception.details,
          requestId,
        },
      });
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();
      const message =
        typeof body === 'string'
          ? body
          : ((body as { message?: string | string[] }).message ?? 'Request failed');
      const text = Array.isArray(message) ? message.join('; ') : message;

      if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
        void this.pilotLogger.log({
          ...pilotBase,
          error: text,
          stackTrace: exception.stack ?? null,
          statusCode: status,
          code: status === HttpStatus.BAD_REQUEST ? 'VALIDATION_ERROR' : 'INTERNAL_ERROR',
        });
      }

      return response.status(status).json({
        error: {
          code: status === HttpStatus.BAD_REQUEST ? 'VALIDATION_ERROR' : 'INTERNAL_ERROR',
          message: text,
          requestId,
        },
      });
    }

    // Known Prisma/Postgres errors are client errors (missing row, unique
    // clash, bad reference, value too large), not 500s.
    const mapped = mapPrismaError(exception);
    if (mapped) {
      return response.status(mapped.status).json({
        error: {
          code: mapped.code,
          message: mapped.message,
          details: mapped.details,
          requestId,
        },
      });
    }

    const err = exception instanceof Error ? exception : new Error(String(exception));
    void this.pilotLogger.log({
      ...pilotBase,
      error: err.message,
      stackTrace: err.stack ?? null,
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      code: 'INTERNAL_ERROR',
    });

    return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Unexpected server error',
        requestId,
      },
    });
  }

  private buildPilotBase(request: PilotRequest, requestId?: string) {
    const screen = request.headers['x-pilot-screen'];
    const action = request.headers['x-pilot-action'];
    return {
      timestamp: new Date().toISOString(),
      source: 'backend' as const,
      user: request.user?.email ?? request.user?.sub ?? null,
      screen: typeof screen === 'string' ? screen : null,
      action:
        typeof action === 'string'
          ? action
          : `${request.method} ${request.originalUrl ?? request.url}`,
      requestId,
      method: request.method,
      path: request.originalUrl ?? request.url,
    };
  }
}
