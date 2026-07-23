export class AppException extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly httpStatus: number,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'AppException';
  }

  static unauthorized(code: string, message: string): AppException {
    return new AppException(code, message, 401);
  }

  static forbidden(code: string, message: string, details?: Record<string, unknown>): AppException {
    return new AppException(code, message, 403, details);
  }

  static notFound(resource: string, id?: string): AppException {
    return new AppException('NOT_FOUND', `${resource} not found`, 404, {
      resource,
      id,
    });
  }

  static validation(message: string, fields: Array<{ field: string; message: string; code: string }>): AppException {
    return new AppException('VALIDATION_ERROR', message, 400, { fields });
  }

  static rateLimited(retryAfterSeconds: number): AppException {
    return new AppException('RATE_LIMITED', 'Too many requests', 429, {
      retryAfterSeconds,
    });
  }

  static conflict(code: string, message: string, details?: Record<string, unknown>): AppException {
    return new AppException(code, message, 409, details);
  }

  static unprocessable(
    code: string,
    message: string,
    details?: Record<string, unknown>,
  ): AppException {
    return new AppException(code, message, 422, details);
  }

  static duplicateSku(sku: string): AppException {
    return new AppException('DUPLICATE_SKU', 'SKU already exists for this company', 409, { sku });
  }

  static duplicateBarcode(barcode: string): AppException {
    return new AppException('DUPLICATE_BARCODE', 'Barcode already exists for this company', 409, {
      barcode,
    });
  }

  static insufficientStock(
    productId: string,
    available: string,
    requested: string,
  ): AppException {
    return new AppException('INSUFFICIENT_STOCK', 'Insufficient stock', 422, {
      productId,
      available,
      requested,
    });
  }

  static invalidCurrency(message = 'Invalid currency'): AppException {
    return new AppException('INVALID_CURRENCY', message, 422);
  }

  static businessRule(message: string, details?: Record<string, unknown>): AppException {
    return new AppException('BUSINESS_RULE_VIOLATION', message, 422, details);
  }
}
