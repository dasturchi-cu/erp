/**
 * Human-readable message from anything a request can reject with: the plain
 * ApiError the apiClient interceptor produces, a raw AxiosError (clients
 * without that interceptor, e.g. saasClient), or an Error.
 */
export function getErrorMessage(err: unknown, fallback: string): string {
  if (typeof err === 'string' && err.trim()) return err;
  if (!err || typeof err !== 'object') return fallback;

  const e = err as {
    message?: unknown;
    response?: { data?: { message?: unknown; error?: { message?: unknown } } };
  };
  const data = e.response?.data;
  const candidates = [data?.error?.message, data?.message, e.message];
  for (const c of candidates) {
    if (Array.isArray(c) && c.length) return c.join('; ');
    if (typeof c === 'string' && c.trim()) return c;
  }
  return fallback;
}
