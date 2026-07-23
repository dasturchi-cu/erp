import { Injectable } from '@nestjs/common';
import { UserStatus, DeviceStatus, UserCompanyStatus } from '@prisma/client';
import { PrismaService } from '../../../core/database/prisma.service';
import { AppException } from '../../../core/exceptions/app.exception';
import { AuditService } from '../../../core/audit/audit.service';
import { AccessControlService } from '../../../core/access/access-control.service';
import { NotificationsService } from '../../notifications/application/notifications.service';
import { TokenService } from './token.service';
import { DeviceInfoDto } from '../api/dto/auth-request.dto';
import {
  LoginResponseDto,
  MeResponseDto,
  SwitchCompanyResponseDto,
  CompanySummaryDto,
  UserSummaryDto,
} from '../api/dto/auth-response.dto';

type UserWithMemberships = Awaited<ReturnType<AuthService['loadUserByEmail']>>;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tokens: TokenService,
    private readonly audit: AuditService,
    private readonly accessControl: AccessControlService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async login(
    email: string,
    password: string,
    deviceInfo: DeviceInfoDto,
    ipAddress?: string,
    requestId?: string,
  ): Promise<LoginResponseDto> {
    const user = await this.loadUserByEmail(email.toLowerCase());
    if (!user) {
      throw AppException.unauthorized('UNAUTHORIZED', 'Invalid email or password');
    }

    if (user.status === UserStatus.BLOCKED) {
      throw AppException.forbidden('USER_BLOCKED', 'User account is blocked');
    }

    const valid = await this.tokens.comparePassword(password, user.passwordHash);
    if (!valid) {
      throw AppException.unauthorized('UNAUTHORIZED', 'Invalid email or password');
    }

    const deviceUuid = deviceInfo?.deviceId ?? '00000000-0000-0000-0000-000000000000';
    const deviceName = deviceInfo?.name ?? 'Unknown Device';
    const devicePlatform = deviceInfo?.platform ?? 'windows';
    const deviceOs = deviceInfo?.osVersion ?? 'unknown';

    const device = await this.prisma.device.upsert({
      where: {
        userId_deviceUuid: {
          userId: user.id,
          deviceUuid,
        },
      },
      create: {
        userId: user.id,
        deviceUuid,
        name: deviceName,
        platform: devicePlatform,
        osVersion: deviceOs,
        ipAddress: ipAddress ?? null,
        lastSeenAt: new Date(),
      },
      update: {
        name: deviceName,
        platform: devicePlatform,
        osVersion: deviceOs,
        ipAddress: ipAddress ?? null,
        lastSeenAt: new Date(),
      },
    });

    if (device.status === DeviceStatus.BLOCKED) {
      throw AppException.forbidden('DEVICE_BLOCKED', 'Device is blocked');
    }

    const activeMembership = user.userCompanies.find((m) => m.status === UserCompanyStatus.ACTIVE);
    const companyId = activeMembership?.companyId;
    const branchId = activeMembership?.branchId ?? undefined;

    const { permissions, modules, roleName } = companyId
      ? await this.accessControl.resolveAccess(user.id, companyId)
      : { permissions: [] as string[], modules: [] as string[], roleName: 'user' };

    const session = await this.createSession(user.id, device.id, companyId ?? null, ipAddress);

    const tokenPair = await this.tokens.buildTokenPair({
      sub: user.id,
      email: user.email,
      companyId,
      branchId,
      sessionId: session.id,
      deviceId: deviceUuid,
      permissions,
      modules,
    });

    await this.prisma.session.update({
      where: { id: session.id },
      data: { refreshTokenHash: this.tokens.hashRefreshToken(tokenPair.refreshToken) },
    });

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    await this.audit.log({
      companyId: companyId ?? null,
      userId: user.id,
      action: 'LOGIN',
      entityType: 'session',
      entityId: session.id,
      newValue: { deviceId: deviceUuid },
      ipAddress: ipAddress ?? null,
      requestId: requestId ?? null,
    });

    if (companyId) {
      await this.notificationsService.createLoginNotification(
        companyId,
        user.id,
        deviceName,
        ipAddress,
      );
    }

    const companies = await this.buildCompanySummaries(user);

    return {
      accessToken: tokenPair.accessToken,
      refreshToken: tokenPair.refreshToken,
      expiresIn: tokenPair.expiresIn,
      user: this.toUserSummary(user, roleName),
      companies,
      permissions,
      modules,
    };
  }

  async refresh(refreshToken: string, ipAddress?: string): Promise<LoginResponseDto> {
    let payload;
    try {
      payload = await this.tokens.verifyRefreshToken(refreshToken);
    } catch {
      throw AppException.unauthorized('TOKEN_EXPIRED', 'Refresh token invalid or expired');
    }

    const session = await this.prisma.session.findUnique({
      where: { id: payload.sessionId },
      include: { user: true, device: true },
    });

    if (!session || session.revokedAt) {
      throw AppException.unauthorized('SESSION_REVOKED', 'Session has been revoked');
    }

    if (session.expiresAt < new Date()) {
      throw AppException.unauthorized('TOKEN_EXPIRED', 'Session expired');
    }

    const hash = this.tokens.hashRefreshToken(refreshToken);
    if (hash !== session.refreshTokenHash) {
      await this.prisma.session.update({
        where: { id: session.id },
        data: { revokedAt: new Date() },
      });
      throw AppException.unauthorized('SESSION_REVOKED', 'Invalid refresh token');
    }

    if (session.user.status === UserStatus.BLOCKED) {
      throw AppException.forbidden('USER_BLOCKED', 'User account is blocked');
    }

    if (session.device.status === DeviceStatus.BLOCKED) {
      throw AppException.forbidden('DEVICE_BLOCKED', 'Device is blocked');
    }

    const companyId = session.companyId ?? payload.companyId;
    if (!companyId) {
      throw AppException.forbidden('FORBIDDEN', 'No company context on session');
    }

    const access = await this.accessControl.resolveAccess(session.userId, companyId);
    if (!access.membershipActive) {
      throw AppException.forbidden('FORBIDDEN', 'Company membership inactive');
    }

    const branchId = (
      await this.prisma.userCompany.findUnique({
        where: { userId_companyId: { userId: session.userId, companyId } },
      })
    )?.branchId ?? undefined;

    const { permissions, modules, roleName } = {
      permissions: access.permissions,
      modules: access.modules,
      roleName: access.roleName,
    };

    const tokenPair = await this.tokens.buildTokenPair({
      sub: session.userId,
      email: session.user.email,
      companyId: companyId ?? undefined,
      branchId,
      sessionId: session.id,
      deviceId: session.device.deviceUuid,
      permissions,
      modules,
    });

    await this.prisma.session.update({
      where: { id: session.id },
      data: {
        refreshTokenHash: this.tokens.hashRefreshToken(tokenPair.refreshToken),
        expiresAt: new Date(Date.now() + this.tokens.refreshTtlSeconds * 1000),
        ipAddress: ipAddress ?? session.ipAddress,
      },
    });

    await this.audit.log({
      companyId,
      userId: session.userId,
      action: 'REFRESH',
      entityType: 'session',
      entityId: session.id,
      ipAddress: ipAddress ?? null,
    });

    const user = await this.loadUserById(session.userId);
    const companies = user ? await this.buildCompanySummaries(user) : [];

    return {
      accessToken: tokenPair.accessToken,
      refreshToken: tokenPair.refreshToken,
      expiresIn: tokenPair.expiresIn,
      user: this.toUserSummary(session.user, roleName),
      companies,
      permissions,
      modules,
    };
  }

  async logout(sessionId: string, userId: string, requestId?: string): Promise<void> {
    const session = await this.prisma.session.findFirst({
      where: { id: sessionId, userId, revokedAt: null },
    });

    if (session) {
      await this.prisma.session.update({
        where: { id: session.id },
        data: { revokedAt: new Date() },
      });

      await this.audit.log({
        companyId: session.companyId,
        userId,
        action: 'LOGOUT',
        entityType: 'session',
        entityId: session.id,
        requestId: requestId ?? null,
      });
    }
  }

  async me(userId: string, companyId?: string, sessionId?: string): Promise<MeResponseDto> {
    const user = await this.loadUserById(userId);
    if (!user) {
      throw AppException.notFound('user', userId);
    }

    let activeCompany: CompanySummaryDto | null = null;
    let permissions: string[] = [];
    let modules: string[] = [];
    let roleName = 'user';

    if (companyId) {
      const access = await this.accessControl.resolveAccess(userId, companyId);
      permissions = access.permissions;
      modules = access.modules;
      roleName = access.roleName;
      activeCompany = (await this.buildCompanySummaries(user)).find((c) => c.id === companyId) ?? null;
    }

    return {
      user: this.toUserSummary(user, roleName),
      activeCompany,
      permissions,
      modules,
    };
  }

  async switchCompany(
    userId: string,
    sessionId: string,
    companyId: string,
    deviceUuid: string,
    ipAddress?: string,
    requestId?: string,
  ): Promise<SwitchCompanyResponseDto> {
    const membership = await this.prisma.userCompany.findUnique({
      where: { userId_companyId: { userId, companyId } },
      include: { role: true, company: true },
    });

    if (!membership || membership.status !== UserCompanyStatus.ACTIVE) {
      throw AppException.forbidden('FORBIDDEN', 'No access to company');
    }

    const user = await this.loadUserById(userId);
    if (!user) {
      throw AppException.notFound('user', userId);
    }

    const access = await this.accessControl.resolveAccess(userId, companyId);
    const { permissions, modules } = access;

    await this.prisma.session.update({
      where: { id: sessionId },
      data: { companyId },
    });

    const tokenPair = await this.tokens.buildTokenPair({
      sub: userId,
      email: user.email,
      companyId,
      branchId: membership.branchId ?? undefined,
      sessionId,
      deviceId: deviceUuid,
      permissions,
      modules,
    });

    await this.prisma.session.update({
      where: { id: sessionId },
      data: { refreshTokenHash: this.tokens.hashRefreshToken(tokenPair.refreshToken) },
    });

    const branchCount = await this.prisma.branch.count({ where: { companyId } });

    await this.audit.log({
      companyId,
      userId,
      action: 'SWITCH_COMPANY',
      entityType: 'company',
      entityId: companyId,
      ipAddress: ipAddress ?? null,
      requestId: requestId ?? null,
    });

    return {
      accessToken: tokenPair.accessToken,
      refreshToken: tokenPair.refreshToken,
      expiresIn: tokenPair.expiresIn,
      activeCompany: {
        id: membership.company.id,
        name: membership.company.name,
        code: membership.company.code,
        role: membership.role.name.toLowerCase(),
        branchCount,
      },
      permissions,
      modules,
    };
  }

  private async createSession(
    userId: string,
    deviceId: string,
    companyId: string | null,
    ipAddress?: string,
  ) {
    return this.prisma.session.create({
      data: {
        userId,
        deviceId,
        companyId,
        refreshTokenHash: '',
        ipAddress: ipAddress ?? null,
        expiresAt: new Date(Date.now() + this.tokens.refreshTtlSeconds * 1000),
      },
    });
  }

  private async buildCompanySummaries(user: NonNullable<UserWithMemberships>): Promise<CompanySummaryDto[]> {
    const summaries: CompanySummaryDto[] = [];
    for (const m of user.userCompanies) {
      if (m.status !== UserCompanyStatus.ACTIVE) continue;
      const branchCount = await this.prisma.branch.count({ where: { companyId: m.companyId } });
      summaries.push({
        id: m.company.id,
        name: m.company.name,
        code: m.company.code,
        role: m.role.name.toLowerCase(),
        branchCount,
      });
    }
    return summaries;
  }

  private toUserSummary(
    user: { id: string; email: string; firstName: string; lastName: string; status: UserStatus },
    roleName: string,
  ): UserSummaryDto {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: roleName,
      status: user.status,
    };
  }

  private loadUserByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      include: {
        userCompanies: {
          where: { status: UserCompanyStatus.ACTIVE },
          include: { company: true, role: true },
        },
      },
    });
  }

  private loadUserById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        userCompanies: {
          where: { status: UserCompanyStatus.ACTIVE },
          include: { company: true, role: true },
        },
      },
    });
  }
}
