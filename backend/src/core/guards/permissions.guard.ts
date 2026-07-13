import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY, IS_PUBLIC_KEY } from '../decorators/auth.decorators';
import { JwtPayload } from '../../modules/auth/interfaces/jwt-payload.interface';
import { AppException } from '../exceptions/app.exception';
import { AccessControlService } from '../access/access-control.service';
import { Request } from 'express';

function matchesPermission(permissions: string[], required: string): boolean {
  if (permissions.includes('admin.*')) return true;
  if (permissions.includes(required)) return true;
  const [module] = required.split('.');
  return permissions.includes(`${module}.*`);
}

@Injectable()
export class PermissionsGuard implements CanActivate {
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

    const required = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!required || required.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request & { user?: JwtPayload }>();
    const user = request.user;
    if (!user) {
      throw AppException.unauthorized('UNAUTHORIZED', 'Authentication required');
    }

    if (!user.companyId) {
      throw AppException.forbidden('FORBIDDEN', 'Company context required for permission check');
    }

    const access = await this.accessControl.resolveAccess(user.sub, user.companyId);
    if (!access.membershipActive) {
      throw AppException.forbidden('FORBIDDEN', 'No active company membership');
    }

    const hasAll = required.every((p) => matchesPermission(access.permissions, p));
    if (!hasAll) {
      throw AppException.forbidden('FORBIDDEN', 'Insufficient permissions');
    }

    user.permissions = access.permissions;
    user.modules = access.modules;

    return true;
  }
}
