import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtPayload } from '../../modules/auth/interfaces/jwt-payload.interface';
import { AppException } from '../exceptions/app.exception';
import { CompanyContextService } from '../company/company-context.service';
import { PrismaService } from '../database/prisma.service';
import { AccessControlService } from '../access/access-control.service';
import { IS_PUBLIC_KEY } from '../decorators/auth.decorators';
import { Request } from 'express';

@Injectable()
export class CompanyIsolationGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly companyContext: CompanyContextService,
    private readonly prisma: PrismaService,
    private readonly accessControl: AccessControlService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<
      Request & { user?: JwtPayload; requestId?: string }
    >();
    const user = request.user;
    if (!user) {
      throw AppException.unauthorized('UNAUTHORIZED', 'Authentication required');
    }

    if (!user.companyId) {
      throw AppException.forbidden('FORBIDDEN', 'Company context required');
    }

    const headerCompanyId = request.headers['x-company-id'];
    if (typeof headerCompanyId === 'string' && headerCompanyId.length > 0) {
      if (headerCompanyId !== user.companyId) {
        throw AppException.forbidden('FORBIDDEN', 'X-Company-Id must match token company context');
      }
    }

    const access = await this.accessControl.resolveAccess(user.sub, user.companyId);
    if (!access.membershipActive) {
      throw AppException.forbidden('FORBIDDEN', 'No access to company');
    }

    user.permissions = access.permissions;
    user.modules = access.modules;

    this.companyContext.set({
      companyId: user.companyId,
      branchId: user.branchId,
      userId: user.sub,
      sessionId: user.sessionId,
      deviceId: user.deviceId,
      permissions: access.permissions,
      modules: access.modules,
    });

    await this.prisma.setCompanyContext(user.companyId);

    return true;
  }
}
