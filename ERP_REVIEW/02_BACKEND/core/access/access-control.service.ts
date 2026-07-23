import { Injectable } from '@nestjs/common';
import { UserCompanyStatus } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';

export interface ResolvedAccess {
  permissions: string[];
  modules: string[];
  roleName: string;
  membershipActive: boolean;
}

@Injectable()
export class AccessControlService {
  constructor(private readonly prisma: PrismaService) {}

  async resolveAccess(userId: string, companyId: string | undefined): Promise<ResolvedAccess> {
    if (!companyId) {
      return {
        permissions: [],
        modules: [],
        roleName: 'user',
        membershipActive: false,
      };
    }

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
