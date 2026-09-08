import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { Request } from 'express';
import { rlsContextStorage } from './rls-context.storage';
import { JwtPayload } from '../../modules/auth/interfaces/jwt-payload.interface';

/**
 * Establishes the AsyncLocalStorage scope carrying the current request's
 * companyId for RlsPrismaService. Must be an interceptor, not a guard —
 * guards run before interceptors, and a guard's own AsyncLocalStorage.run()
 * scope would close before the rest of the pipeline (and the handler) runs.
 * Global, so it also covers routes with no companyId (health, auth, saas) —
 * those simply run with no ALS store, which is correct: RlsPrismaService is
 * only used by services that always expect one.
 */
@Injectable()
export class RlsContextInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') {
      return next.handle();
    }
    const req = context.switchToHttp().getRequest<Request & { user?: JwtPayload }>();
    const companyId = req.user?.companyId;
    if (!companyId) {
      return next.handle();
    }
    return new Observable((subscriber) => {
      rlsContextStorage.run({ companyId }, () => {
        next.handle().subscribe(subscriber);
      });
    });
  }
}
