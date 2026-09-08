import { Provider } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from './prisma.service';
import { rlsContextStorage } from '../company/rls-context.storage';

/**
 * Prisma Client Extension wrapping every standalone query with a matching
 * Postgres session variable (app.company_id or app.bypass_rls), read from
 * rlsContextStorage at call time — the documented Prisma RLS pattern
 * (base.$transaction([setConfig, query(args)]) guarantees both statements
 * run on the same connection, so the transaction-local set_config is still
 * visible to the query).
 *
 * Deliberately does NOT override $transaction itself — that would require
 * relying on undocumented Prisma extension internals. Every
 * `prisma.$transaction(async (tx) => {...})` call site instead gets one
 * manual `set_config` line added at the top of its callback, using the
 * plain (non-extended) tx client — see the RLS Stage A plan.
 *
 * Throws if no ALS store is present rather than silently running unscoped:
 * a missing context is a bug that should surface immediately.
 */
function buildRlsPrismaClient(base: PrismaService) {
  return base.$extends({
    name: 'rls',
    query: {
      $allModels: {
        async $allOperations({ args, query }: { args: unknown; query: (args: unknown) => Promise<unknown> }) {
          const store = rlsContextStorage.getStore();
          if (!store || (!store.companyId && !store.bypass)) {
            throw new Error(
              'RlsPrismaService: no company/bypass context set for this query. ' +
                'Every caller must run inside rlsContextStorage.run({ companyId } | { bypass: true }, ...) ' +
                '— see backend/src/core/company/rls-context.storage.ts',
            );
          }

          // Prisma's own extension-runtime type for `query` says it returns a
          // plain Promise, but the object it actually returns at runtime is a
          // lazy PrismaPromise compatible with array-form $transaction — this
          // is Prisma's own documented pattern for RLS (their public docs use
          // this exact shape). The cast bridges that (narrower-than-reality)
          // type declaration; if a future Prisma upgrade breaks the runtime
          // assumption, this fails loudly (a rejected promise / thrown error
          // from $transaction), not silently.
          const queryPromise = query(args) as unknown as Prisma.PrismaPromise<unknown>;

          if (store.bypass) {
            const [, result] = await base.$transaction([
              base.$executeRaw`SELECT set_config('app.bypass_rls', 'on', true)`,
              queryPromise,
            ]);
            return result;
          }

          const [, result] = await base.$transaction([
            base.$executeRaw`SELECT set_config('app.company_id', ${store.companyId}, true)`,
            queryPromise,
          ]);
          return result;
        },
      },
    },
  });
}

export type RlsPrismaClient = ReturnType<typeof buildRlsPrismaClient>;

export const RLS_PRISMA = Symbol('RLS_PRISMA');

export const rlsPrismaProvider: Provider = {
  provide: RLS_PRISMA,
  useFactory: buildRlsPrismaClient,
  inject: [PrismaService],
};
