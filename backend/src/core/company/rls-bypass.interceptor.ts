import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { rlsContextStorage } from './rls-context.storage';

/**
 * Applied only to genuinely cross-tenant controllers (SaaS, SaaS-admin) —
 * runs the request with `{ bypass: true }` so RlsPrismaService sets
 * app.bypass_rls instead of app.company_id. Never register globally.
 */
@Injectable()
export class RlsBypassInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') {
      return next.handle();
    }
    return new Observable((subscriber) => {
      rlsContextStorage.run({ bypass: true }, () => {
        next.handle().subscribe(subscriber);
      });
    });
  }
}
