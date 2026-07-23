import { Injectable } from '@nestjs/common';
import {
  DeviceStatus,
  Prisma,
  UserCompanyStatus,
  UserStatus,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../../core/database/prisma.service';
import { AuditService } from '../../../core/audit/audit.service';
import { AppException } from '../../../core/exceptions/app.exception';
import { getAppVersion } from '../../../core/utils/app-version.util';
import {
  buildPaginationMeta,
  paginationSkip,
} from '../../../core/utils/pagination.util';
import {
  AdminAuditListQueryDto,
  AdminAuditLogResponseDto,
  AdminDeviceResponseDto,
  AdminListQueryDto,
  AdminOverviewResponseDto,
  AdminPermissionResponseDto,
  AdminRoleResponseDto,
  AdminSessionResponseDto,
  AdminUserResponseDto,
  CreateAdminUserDto,
} from '../api/dto/admin.dto';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async listUsers(companyId: string, query: AdminListQueryDto) {
    const page = query.resolvedPage();
    const limit = query.resolvedLimit();
    const where: Prisma.UserCompanyWhereInput = {
      companyId,
    };

    if (query.q) {
      where.user = {
        OR: [
          { email: { contains: query.q, mode: 'insensitive' } },
          { firstName: { contains: query.q, mode: 'insensitive' } },
          { lastName: { contains: query.q, mode: 'insensitive' } },
        ],
      };
    }

    const [rows, total] = await Promise.all([
      this.prisma.userCompany.findMany({
        where,
        skip: paginationSkip(page, limit),
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { user: true, role: true },
      }),
      this.prisma.userCompany.count({ where }),
    ]);

    const data: AdminUserResponseDto[] = rows.map((m) => ({
      id: m.user.id,
      email: m.user.email,
      firstName: m.user.firstName,
      lastName: m.user.lastName,
      role: m.role.name.toLowerCase(),
      roleId: m.role.id,
      status: m.status === UserCompanyStatus.ACTIVE ? 'active' : 'blocked',
      lastLoginAt: m.user.lastLoginAt?.toISOString() ?? null,
      createdAt: m.user.createdAt.toISOString(),
    }));

    return { data, meta: buildPaginationMeta(page, limit, total) };
  }

  async updateUserStatus(
    companyId: string,
    userId: string,
    status: UserStatus,
    actorId: string,
    ip?: string,
    requestId?: string,
  ) {
    const membership = await this.prisma.userCompany.findFirst({
      where: { companyId, userId },
    });
    if (!membership) {
      throw AppException.notFound('User', userId);
    }

    const membershipStatus =
      status === UserStatus.BLOCKED ? UserCompanyStatus.INACTIVE : UserCompanyStatus.ACTIVE;

    const updatedMembership = await this.prisma.userCompany.update({
      where: { id: membership.id },
      data: { status: membershipStatus },
      include: { user: true, role: true },
    });

    if (membershipStatus === UserCompanyStatus.INACTIVE) {
      await this.prisma.session.updateMany({
        where: { userId, companyId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }

    await this.audit.log({
      companyId,
      userId: actorId,
      action: status === UserStatus.BLOCKED ? 'BLOCK' : 'UNBLOCK',
      entityType: 'user',
      entityId: userId,
      ipAddress: ip ?? null,
      requestId: requestId ?? null,
      newValue: { status, membershipStatus },
    });

    return {
      id: updatedMembership.user.id,
      email: updatedMembership.user.email,
      firstName: updatedMembership.user.firstName,
      lastName: updatedMembership.user.lastName,
      role: updatedMembership.role.name.toLowerCase(),
      roleId: updatedMembership.role.id,
      status: membershipStatus === UserCompanyStatus.ACTIVE ? 'active' : 'blocked',
      lastLoginAt: updatedMembership.user.lastLoginAt?.toISOString() ?? null,
      createdAt: updatedMembership.user.createdAt.toISOString(),
    } satisfies AdminUserResponseDto;
  }

  async createUser(
    companyId: string,
    dto: CreateAdminUserDto,
    actorId: string,
    ip?: string,
    requestId?: string,
  ) {
    const role = await this.prisma.role.findFirst({
      where: { id: dto.roleId, companyId },
    });
    if (!role) {
      throw AppException.notFound('Role', dto.roleId);
    }

    const email = dto.email.toLowerCase().trim();
    const existingUser = await this.prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      const existingMembership = await this.prisma.userCompany.findUnique({
        where: { userId_companyId: { userId: existingUser.id, companyId } },
      });
      if (existingMembership) {
        throw AppException.conflict('DUPLICATE_EMAIL', 'User is already a member of this company');
      }
      const membership = await this.prisma.userCompany.create({
        data: {
          userId: existingUser.id,
          companyId,
          roleId: role.id,
          status: UserCompanyStatus.ACTIVE,
        },
        include: { user: true, role: true },
      });
      await this.audit.log({
        companyId,
        userId: actorId,
        action: 'CREATE',
        entityType: 'user',
        entityId: existingUser.id,
        ipAddress: ip ?? null,
        requestId: requestId ?? null,
        newValue: { email: existingUser.email, role: role.name, addedToCompany: true },
      });
      return {
        id: membership.user.id,
        email: membership.user.email,
        firstName: membership.user.firstName,
        lastName: membership.user.lastName,
        role: membership.role.name.toLowerCase(),
        roleId: membership.role.id,
        status: 'active',
        lastLoginAt: membership.user.lastLoginAt?.toISOString() ?? null,
        createdAt: membership.user.createdAt.toISOString(),
      } satisfies AdminUserResponseDto;
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase().trim(),
        passwordHash,
        firstName: dto.firstName.trim(),
        lastName: dto.lastName.trim(),
        status: UserStatus.ACTIVE,
        userCompanies: {
          create: {
            companyId,
            roleId: role.id,
            status: UserCompanyStatus.ACTIVE,
          },
        },
      },
      include: { userCompanies: { include: { role: true } } },
    });

    await this.audit.log({
      companyId,
      userId: actorId,
      action: 'CREATE',
      entityType: 'user',
      entityId: user.id,
      ipAddress: ip ?? null,
      requestId: requestId ?? null,
      newValue: { email: user.email, role: role.name },
    });

    const m = user.userCompanies[0]!;
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: m.role.name.toLowerCase(),
      roleId: m.role.id,
      status: user.status.toLowerCase(),
      lastLoginAt: null,
      createdAt: user.createdAt.toISOString(),
    } satisfies AdminUserResponseDto;
  }

  async listSessions(companyId: string, query: AdminListQueryDto) {
    const page = query.resolvedPage();
    const limit = query.resolvedLimit();
    const where: Prisma.SessionWhereInput = {
      companyId,
      revokedAt: null,
      expiresAt: { gt: new Date() },
    };

    const [rows, total] = await Promise.all([
      this.prisma.session.findMany({
        where,
        skip: paginationSkip(page, limit),
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { user: true, device: true },
      }),
      this.prisma.session.count({ where }),
    ]);

    const data: AdminSessionResponseDto[] = rows.map((s) => ({
      id: s.id,
      user: `${s.user.firstName} ${s.user.lastName}`.trim(),
      userId: s.userId,
      device: s.device.name,
      ip: s.ipAddress ?? '—',
      startedAt: s.createdAt.toISOString(),
      lastActivityAt: s.createdAt.toISOString(),
    }));

    return { data, meta: buildPaginationMeta(page, limit, total) };
  }

  async revokeSession(
    companyId: string,
    sessionId: string,
    actorId: string,
    ip?: string,
    requestId?: string,
  ) {
    const session = await this.prisma.session.findFirst({
      where: { id: sessionId, companyId, revokedAt: null },
    });
    if (!session) {
      throw AppException.notFound('Session', sessionId);
    }

    await this.prisma.session.update({
      where: { id: sessionId },
      data: { revokedAt: new Date() },
    });

    await this.audit.log({
      companyId,
      userId: actorId,
      action: 'REVOKE',
      entityType: 'session',
      entityId: sessionId,
      ipAddress: ip ?? null,
      requestId: requestId ?? null,
    });

    return { ok: true };
  }

  async listDevices(companyId: string, query: AdminListQueryDto) {
    const page = query.resolvedPage();
    const limit = query.resolvedLimit();

    const userIds = (
      await this.prisma.userCompany.findMany({
        where: { companyId, status: UserCompanyStatus.ACTIVE },
        select: { userId: true },
      })
    ).map((u) => u.userId);

    const where: Prisma.DeviceWhereInput = { userId: { in: userIds } };

    const [rows, total] = await Promise.all([
      this.prisma.device.findMany({
        where,
        skip: paginationSkip(page, limit),
        take: limit,
        orderBy: { lastSeenAt: 'desc' },
        include: { user: true },
      }),
      this.prisma.device.count({ where }),
    ]);

    const data: AdminDeviceResponseDto[] = rows.map((d) => ({
      id: d.id,
      name: d.name,
      platform: d.platform,
      user: `${d.user.firstName} ${d.user.lastName}`.trim(),
      userId: d.userId,
      status: d.status.toLowerCase(),
      lastSeenAt: d.lastSeenAt?.toISOString() ?? d.createdAt.toISOString(),
    }));

    return { data, meta: buildPaginationMeta(page, limit, total) };
  }

  async updateDeviceStatus(
    companyId: string,
    deviceId: string,
    status: DeviceStatus,
    actorId: string,
    ip?: string,
    requestId?: string,
  ) {
    const device = await this.prisma.device.findUnique({
      where: { id: deviceId },
      include: { user: { include: { userCompanies: true } } },
    });
    if (!device || !device.user.userCompanies.some((m) => m.companyId === companyId)) {
      throw AppException.notFound('Device', deviceId);
    }

    await this.prisma.device.update({
      where: { id: deviceId },
      data: { status },
    });

    await this.audit.log({
      companyId,
      userId: actorId,
      action: 'UPDATE',
      entityType: 'device',
      entityId: deviceId,
      ipAddress: ip ?? null,
      requestId: requestId ?? null,
      newValue: { status },
    });

    return { ok: true };
  }

  async listAuditLogs(companyId: string, query: AdminAuditListQueryDto) {
    const page = query.resolvedPage();
    const limit = query.resolvedLimit();
    const where: Prisma.AuditLogWhereInput = { companyId };

    if (query.action) where.action = query.action;
    if (query.entityType) where.entityType = query.entityType;

    const [rows, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip: paginationSkip(page, limit),
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { user: true },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    const data: AdminAuditLogResponseDto[] = rows.map((l) => ({
      id: l.id,
      action: l.action,
      entity: l.entityType,
      user: l.user ? `${l.user.firstName} ${l.user.lastName}`.trim() : 'Tizim',
      ip: l.ipAddress ?? '—',
      createdAt: l.createdAt.toISOString(),
      details: l.newValue ? JSON.stringify(l.newValue) : undefined,
    }));

    return { data, meta: buildPaginationMeta(page, limit, total) };
  }

  async listRoles(companyId: string) {
    const roles = await this.prisma.role.findMany({
      where: { OR: [{ companyId }, { companyId: null, isSystem: true }] },
      include: {
        rolePermissions: true,
        _count: { select: { userCompanies: { where: { companyId } } } },
      },
      orderBy: { name: 'asc' },
    });

    const data: AdminRoleResponseDto[] = roles
      .filter((r) => r.companyId === companyId || r.isSystem)
      .map((r) => ({
        id: r.id,
        name: r.name,
        description: r.description ?? '',
        userCount: r._count.userCompanies,
        permissionCount: r.rolePermissions.length,
      }));

    return { data };
  }

  async listPermissions() {
    const perms = await this.prisma.permission.findMany({ orderBy: { code: 'asc' } });
    const data: AdminPermissionResponseDto[] = perms.map((p) => ({
      id: p.id,
      code: p.code,
      module: p.module,
      description: p.description,
    }));
    return { data };
  }

  async getOverview(companyId: string): Promise<AdminOverviewResponseDto> {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const [activeUsers, activeSessions, totalProducts, todaySales] = await Promise.all([
      this.prisma.userCompany.count({
        where: { companyId, status: UserCompanyStatus.ACTIVE },
      }),
      this.prisma.session.count({
        where: { companyId, revokedAt: null, expiresAt: { gt: new Date() } },
      }),
      this.prisma.product.count({ where: { companyId, deletedAt: null } }),
      this.prisma.sale.count({
        where: { companyId, createdAt: { gte: startOfDay }, status: 'COMPLETED' },
      }),
    ]);

    return {
      activeUsers,
      activeSessions,
      totalProducts,
      todaySales,
      apiStatus: 'ok',
      version: getAppVersion(),
    };
  }
}
