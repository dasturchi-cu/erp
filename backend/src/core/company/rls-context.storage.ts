import { AsyncLocalStorage } from 'node:async_hooks';

export interface RlsContext {
  companyId?: string;
  bypass?: boolean;
}

/**
 * Carries the current request's company (tenant) id — or an explicit bypass
 * flag for genuinely cross-tenant code (SaaS admin, backups, seed) — across
 * async boundaries so RlsPrismaService can set the matching Postgres session
 * variable on every query. AsyncLocalStorage (not NestJS `Scope.REQUEST`) so
 * every service stays a normal singleton; only the value read at query time
 * is request-specific.
 */
export const rlsContextStorage = new AsyncLocalStorage<RlsContext>();
