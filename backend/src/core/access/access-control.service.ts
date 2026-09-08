import { Inject, Injectable } from '@nestjs/common';
import { UserCompanyStatus } from '@prisma/client';
import { RLS_PRISMA, RlsPrismaClient } from '../database/rls-prisma.service';
import { rlsContextStorage } from '../company/rls-context.storage';

export interface ResolvedAccess {
  permissions: string[];
  modules: string[];
  roleName: string;
  membershipActive: boolean;
}

@Injectable()
export class AccessControlService {
  constructor(@Inject(RLS_PRISMA) private readonly prisma: RlsPrismaClient) {}

  async resolveAccess(userId: string, companyId: string | undefined): Promise<ResolvedAccess> {
    if (!companyId) {
      return {
        permissions: [],
        modules: [],
        roleName: 'user',
        membershipActive: false,
      };
    }

    // This runs from CompanyIsolationGuard, before RlsContextInterceptor (which
    // runs after guards) has established the ambient per-request ALS scope —
    // so it must open its own, using the companyId it's already given.
    return rlsContextStorage.run({ companyId }, () => this.doResolveAccess(userId, companyId));
  }

  private async doResolveAccess(userId: string, companyId: string): Promise<ResolvedAccess> {
    const membership = await this.prisma.userCompany.findUnique({
      where: { userId_companyId: { userId, companyId } },
      include: {
        role: {
          include: {
            rolePermissions: { include: { permission: true } },
          },
        },
      },
    });

    if (!membership || membership.status !== UserCompanyStatus.ACTIVE) {
      return {
        permissions: [],
        modules: [],
        roleName: 'user',
        membershipActive: false,
      };
    }

    const enabledModules = await this.prisma.companyModule.findMany({
      where: { companyId, enabled: true },
      include: { module: true },
    });

    return {
      permissions: membership.role.rolePermissions.map((rp) => rp.permission.code),
      modules: enabledModules.map((cm) => cm.module.code),
      roleName: membership.role.name.toLowerCase(),
      membershipActive: true,
    };
  }
}
