export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

/** @deprecated Use PaginatedResponse with meta */
export interface LegacyPaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ApiErrorEnvelope {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
    requestId?: string;
  };
}

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
  details?: Record<string, unknown>;
  requestId?: string;
}

export interface ListParams {
  page?: number;
  limit?: number;
  q?: string;
  sort?: string;
  [key: string]: string | number | boolean | undefined;
}
