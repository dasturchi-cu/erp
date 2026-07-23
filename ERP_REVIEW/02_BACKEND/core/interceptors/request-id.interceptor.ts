import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';
import { Request } from 'express';

@Injectable()
export class RequestIdInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<Request & { requestId?: string }>();
    const header = req.headers['x-request-id'];
    req.requestId = typeof header === 'string' && header.length > 0 ? header : uuidv4();
    return next.handle();
  }
}
