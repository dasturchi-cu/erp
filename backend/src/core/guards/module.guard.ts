import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { MODULE_KEY, IS_PUBLIC_KEY } from '../decorators/auth.decorators';
import { JwtPayload } from '../../modules/auth/interfaces/jwt-payload.interface';
import { AppException } from '../exceptions/app.exception';
import { AccessControlService } from '../access/access-control.service';
import { Request } from 'express';

@Injectable()
export class ModuleGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
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

    const moduleCode = this.reflector.getAllAndOverride<string>(MODULE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!moduleCode) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request & { user?: JwtPayload }>();
    const user = request.user;
    if (!user) {
      throw AppException.unauthorized('UNAUTHORIZED', 'Authentication required');
    }

    if (!user.companyId) {
      throw AppException.forbidden('FORBIDDEN', 'Company context required for module check');
    }

    const access = await this.accessControl.resolveAccess(user.sub, user.companyId);
    if (!access.membershipActive) {
      throw AppException.forbidden('FORBIDDEN', 'No active company membership');
    }

    if (!access.modules.includes(moduleCode)) {
      throw AppException.forbidden('MODULE_DISABLED', `Module ${moduleCode} is disabled`, {
        moduleCode,
      });
    }

    user.permissions = access.permissions;
    user.modules = access.modules;

    return true;
  }
}
