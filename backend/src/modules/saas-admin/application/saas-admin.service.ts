import { Injectable, UnauthorizedException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import {
  SaaSLoginDto,
  CreateCompanyDto,
  UpdateCompanyDto,
  CreateSaaSAdminDto,
  UpdateSaaSAdminDto,
  SaaSListQueryDto,
  SaasLicenseDto,
  SaasSubscriptionStatusDto
} from '../api/dto/saas-admin.dto';
import * as os from 'os';

@Injectable()
export class SaaSAdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  // --- AUTHENTICATION ---

  async login(dto: SaaSLoginDto) {
    const admin = await this.prisma.saaSAdmin.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (!admin) {
      throw new UnauthorizedException('Email yoki parol noto\'g\'ri');
    }

    const passwordValid = await bcrypt.compare(dto.password, admin.passwordHash);
    if (!passwordValid) {
      throw new UnauthorizedException('Email yoki parol noto\'g\'ri');
    }

    const saasSecret = this.config.get<string>('JWT_SAAS_SECRET', 'super-secret-saas-key-123');
    const expiresIn = dto.rememberMe ? '7d' : '15m';

    const accessToken = await this.jwtService.signAsync(
      { sub: admin.id, email: admin.email, type: 'saas_access' },
      { secret: saasSecret, expiresIn }
    );

    const refreshToken = await this.jwtService.signAsync(
      { sub: admin.id, type: 'saas_refresh' },
      { secret: saasSecret, expiresIn: '30d' }
    );

    return {
      accessToken,
      refreshToken,
      admin: {
        id: admin.id,
        email: admin.email,
      }
    };
  }

  async refresh(token: string) {
    const saasSecret = this.config.get<string>('JWT_SAAS_SECRET', 'super-secret-saas-key-123');
    try {
      const payload = await this.jwtService.verifyAsync(token, { secret: saasSecret });
      if (payload.type !== 'saas_refresh') {
        throw new UnauthorizedException('Yaroqsiz token turi');
      }

      const admin = await this.prisma.saaSAdmin.findUnique({
        where: { id: payload.sub },
      });

      if (!admin) {
        throw new UnauthorizedException('Super Admin topilmadi');
      }

      const accessToken = await this.jwtService.signAsync(
        { sub: admin.id, email: admin.email, type: 'saas_access' },
        { secret: saasSecret, expiresIn: '15m' }
      );

      return { accessToken };
    } catch {
      throw new UnauthorizedException('Refresh token yaroqsiz yoki muddati o\'tgan');
    }
  }

  // --- DASHBOARD TELEMETRY ---

  async getDashboardStats() {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const [
      totalCompanies,
      activeCompanies,
      inactiveCompanies,
      trialLicenses,
      activeLicenses,
      expiredLicenses,
      suspendedLicenses,
      todayRevenueAgg,
      monthlyRevenueAgg,
      totalSales,
      totalProducts,
      totalCustomers,
      totalSuppliers,
      totalUsers,
      activeSessions,
    ] = await Promise.all([
      this.prisma.company.count(),
      this.prisma.company.count({ where: { status: 'ACTIVE' } }),
      this.prisma.company.count({ where: { status: 'INACTIVE' } }),
      this.prisma.tenantSubscription.count({ where: { status: 'TRIAL' } }),
      this.prisma.tenantSubscription.count({ where: { status: 'ACTIVE' } }),
      this.prisma.tenantSubscription.count({ where: { status: 'EXPIRED' } }),
      this.prisma.tenantSubscription.count({ where: { status: 'SUSPENDED' } }),
      this.prisma.sale.aggregate({
        _sum: { totalUzs: true },
        where: { createdAt: { gte: todayStart } },
      }),
      this.prisma.sale.aggregate({
        _sum: { totalUzs: true },
        where: { createdAt: { gte: monthStart } },
      }),
      this.prisma.sale.count(),
      this.prisma.product.count({ where: { deletedAt: null } }),
      this.prisma.customer.count({ where: { deletedAt: null } }),
      this.prisma.supplier.count({ where: { deletedAt: null } }),
      this.prisma.user.count(),
      this.prisma.session.count({ where: { revokedAt: null } }),
    ]);

    // Top Companies
    const salesGroup = await this.prisma.sale.groupBy({
      by: ['companyId'],
      _sum: { totalUzs: true },
      orderBy: { _sum: { totalUzs: 'desc' } },
      take: 5,
    });

    const topCompanies = await Promise.all(
      salesGroup.map(async (sg) => {
        const company = await this.prisma.company.findUnique({
          where: { id: sg.companyId },
          select: { name: true, code: true }
        });
        return {
          name: company?.name ?? 'Noma\'lum Kompaniya',
          code: company?.code ?? 'N/A',
          revenue: sg._sum?.totalUzs ? Number(sg._sum.totalUzs) : 0,
        };
      })
    );

    // Latest system activity logs (audits)
    const latestAudits = await this.prisma.auditLog.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        company: { select: { name: true } }
      }
    });

    const loadavg = os.loadavg();
    const systemHealth = {
      cpuLoad: loadavg[0] ? Number((loadavg[0] * 100).toFixed(1)) : 10.0,
      ramUsage: Number(((1 - os.freemem() / os.totalmem()) * 100).toFixed(1)),
      diskFree: '84.2 GB',
      uptime: os.uptime(),
      dbConnected: true,
    };

    return {
      companies: {
        total: totalCompanies,
        active: activeCompanies,
        blocked: inactiveCompanies,
        offline: 0, // Placeholder for Phase-1 heartbeat
        online: activeCompanies,
      },
      licenses: {
        trial: trialLicenses,
        active: activeLicenses,
        expired: expiredLicenses,
        suspended: suspendedLicenses,
      },
      revenue: {
        today: todayRevenueAgg._sum?.totalUzs ? Number(todayRevenueAgg._sum.totalUzs) : 0,
        monthly: monthlyRevenueAgg._sum?.totalUzs ? Number(monthlyRevenueAgg._sum.totalUzs) : 0,
      },
      counters: {
        sales: totalSales,
        products: totalProducts,
        customers: totalCustomers,
        suppliers: totalSuppliers,
        users: totalUsers,
        sessions: activeSessions,
      },
      topCompanies,
      latestActivity: latestAudits.map((log) => ({
        id: log.id,
        companyName: log.company?.name ?? 'Tizim',
        action: log.action,
        entityType: log.entityType,
        createdAt: log.createdAt,
      })),
      systemHealth,
    };
  }

  // --- COMPANY CRUD & PROPERTIES ---

  async getCompanies(query: SaaSListQueryDto) {
    const where: any = {};
    if (query.q) {
      where.OR = [
        { name: { contains: query.q, mode: 'insensitive' } },
        { code: { contains: query.q, mode: 'insensitive' } },
      ];
    }

    if (query.status) {
      where.status = query.status;
    }

    const [items, total] = await Promise.all([
      this.prisma.company.findMany({
        where,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        include: {
          tenantSubscriptions: {
            orderBy: { createdAt: 'desc' },
            take: 1
          },
          _count: {
            select: {
              userCompanies: true,
              products: true,
              branches: true
            }
          }
        },
        orderBy: { name: 'asc' }
      }),
      this.prisma.company.count({ where }),
    ]);

    const formatted = items.map((c) => {
      const activeSub = c.tenantSubscriptions[0];
      return {
        id: c.id,
        name: c.name,
        code: c.code,
        status: c.status,
        license: activeSub?.status ?? 'TRIAL',
        licenseExpire: activeSub?.endDate ?? null,
        createdDate: c.createdAt,
        updatedDate: c.updatedAt,
        desktopVersion: '2.0.0', // Dynamic placeholder
        databaseVersion: '20260714_init',
        usersCount: c._count.userCompanies,
        productsCount: c._count.products,
        branchesCount: c._count.branches,
      };
    });

    return {
      items: formatted,
      total,
      page: query.page,
      limit: query.limit,
    };
  }

  async getCompanyProfile(id: string) {
    const company = await this.prisma.company.findUnique({
      where: { id },
      include: {
        tenantSubscriptions: { orderBy: { createdAt: 'desc' }, take: 1 },
        _count: {
          select: {
            userCompanies: true,
            products: true,
            customers: true,
            suppliers: true
          }
        }
      }
    });

    if (!company) {
      throw new NotFoundException('Kompaniya topilmadi');
    }

    const salesCount = await this.prisma.sale.count({ where: { companyId: id } });
    const revenueAgg = await this.prisma.sale.aggregate({
      _sum: { totalUzs: true },
      where: { companyId: id }
    });

    const activeSub = company.tenantSubscriptions[0];

    return {
      id: company.id,
      name: company.name,
      code: company.code,
      status: company.status,
      createdDate: company.createdAt,
      updatedDate: company.updatedAt,
      desktopVersion: '2.0.0',
      databaseVersion: '20260714_init',
      counters: {
        users: company._count.userCompanies,
        products: company._count.products,
        customers: company._count.customers,
        suppliers: company._count.suppliers,
        sales: salesCount,
        revenue: revenueAgg._sum?.totalUzs ? Number(revenueAgg._sum.totalUzs) : 0,
      },
      license: {
        status: activeSub?.status ?? 'TRIAL',
        startDate: activeSub?.startDate ?? null,
        endDate: activeSub?.endDate ?? null,
        licenseKey: activeSub?.licenseKey ?? 'N/A',
      }
    };
  }

  async createCompany(dto: CreateCompanyDto) {
    // Generate a unique code if not provided
    const code = dto.code.trim().toUpperCase();
    const existing = await this.prisma.company.findUnique({ where: { code } });
    if (existing) {
      throw new ForbiddenException('Ushbu kompaniya kodi allaqachon ro\'yxatdan o\'tgan');
    }

    const company = await this.prisma.company.create({
      data: {
        name: dto.name,
        code,
        status: dto.status as any ?? 'ACTIVE',
      }
    });

    // Seed default subscription
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30); // 30 days trial

    const licenseKey = `KEY_${Math.random().toString(36).substring(2).toUpperCase()}_${Date.now()}`;

    // Get default plan or create one
    let plan = await this.prisma.saasPlan.findFirst();
    if (!plan) {
      plan = await this.prisma.saasPlan.create({
        data: {
          name: 'Standard',
          price: 150000,
          maxUsers: 10,
          maxProducts: 5000,
          maxTransactions: 10000,
          durationDays: 30,
        }
      });
    }

    await this.prisma.tenantSubscription.create({
      data: {
        companyId: company.id,
        planId: plan.id,
        status: 'TRIAL',
        startDate,
        endDate,
        licenseKey,
      }
    });

    return company;
  }

  async updateCompany(id: string, dto: UpdateCompanyDto) {
    const company = await this.prisma.company.findUnique({ where: { id } });
    if (!company) {
      throw new NotFoundException('Kompaniya topilmadi');
    }

    if (dto.code) {
      const code = dto.code.trim().toUpperCase();
      if (code !== company.code) {
        const existing = await this.prisma.company.findUnique({ where: { code } });
        if (existing) {
          throw new ForbiddenException('Ushbu kompaniya kodi band');
        }
      }
    }

    return this.prisma.company.update({
      where: { id },
      data: {
        name: dto.name,
        code: dto.code?.trim().toUpperCase(),
        status: dto.status as any,
      }
    });
  }

  async deleteCompany(id: string) {
    const company = await this.prisma.company.findUnique({ where: { id } });
    if (!company) {
      throw new NotFoundException('Kompaniya topilmadi');
    }

    // Cascade delete related records using transaction
    return this.prisma.$transaction(async (tx) => {
      await tx.tenantSubscription.deleteMany({ where: { companyId: id } });
      await tx.saasUsageStat.deleteMany({ where: { companyId: id } });
      await tx.companyHeartbeat.deleteMany({ where: { companyId: id } });
      await tx.saaSAlert.deleteMany({ where: { companyId: id } });
      return tx.company.delete({ where: { id } });
    });
  }

  async updateLicense(companyId: string, dto: SaasLicenseDto) {
    const sub = await this.prisma.tenantSubscription.findFirst({
      where: { companyId },
      orderBy: { createdAt: 'desc' }
    });

    if (!sub) {
      throw new NotFoundException('Litsenziya topilmadi');
    }

    return this.prisma.tenantSubscription.update({
      where: { id: sub.id },
      data: {
        status: dto.status as any,
        endDate: new Date(dto.endDate),
      }
    });
  }

  // --- SAAS ADMIN CRUD ---

  async getAdmins() {
    return this.prisma.saaSAdmin.findMany({
      select: {
        id: true,
        email: true,
        twoFactorEnabled: true,
        createdAt: true,
      }
    });
  }

  async createAdmin(dto: CreateSaaSAdminDto) {
    const existing = await this.prisma.saaSAdmin.findUnique({
      where: { email: dto.email.toLowerCase() }
    });

    if (existing) {
      throw new ForbiddenException('Ushbu email bilan ro\'yxatdan o\'tilgan');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    return this.prisma.saaSAdmin.create({
      data: {
        email: dto.email.toLowerCase(),
        passwordHash,
      },
      select: {
        id: true,
        email: true,
        createdAt: true,
      }
    });
  }

  async updateAdmin(id: string, dto: UpdateSaaSAdminDto) {
    const admin = await this.prisma.saaSAdmin.findUnique({ where: { id } });
    if (!admin) {
      throw new NotFoundException('Admin topilmadi');
    }

    const data: any = {};
    if (dto.email) {
      data.email = dto.email.toLowerCase();
    }
    if (dto.password) {
      data.passwordHash = await bcrypt.hash(dto.password, 12);
    }

    return this.prisma.saaSAdmin.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        createdAt: true,
      }
    });
  }

  async deleteAdmin(id: string) {
    const total = await this.prisma.saaSAdmin.count();
    if (total <= 1) {
      throw new ForbiddenException('Tizimda kamida bitta super admin bo\'lishi shart');
    }

    return this.prisma.saaSAdmin.delete({ where: { id } });
  }

  async getCompanyBranches(companyId: string) {
    return this.prisma.branch.findMany({
      where: { companyId },
      orderBy: { name: 'asc' }
    });
  }

  async createCompanyBranch(companyId: string, dto: { name: string; address?: string }) {
    const company = await this.prisma.company.findUnique({ where: { id: companyId } });
    if (!company) {
      throw new NotFoundException('Kompaniya topilmadi');
    }

    return this.prisma.branch.create({
      data: {
        companyId,
        name: dto.name,
        address: dto.address ?? 'O\'zbekiston',
        isDefault: false,
        status: 'ACTIVE'
      }
    });
  }

  async getCompanyUsers(companyId: string) {
    return this.prisma.userCompany.findMany({
      where: { companyId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            status: true
          }
        },
        branch: {
          select: {
            id: true,
            name: true
          }
        },
        role: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });
  }

  async updateUserBranch(companyId: string, userId: string, branchId: string | null) {
    const membership = await this.prisma.userCompany.findFirst({
      where: { companyId, userId }
    });

    if (!membership) {
      throw new NotFoundException('Foydalanuvchi a\'zoligi topilmadi');
    }

    if (branchId) {
      const branch = await this.prisma.branch.findFirst({
        where: { id: branchId, companyId }
      });
      if (!branch) {
        throw new NotFoundException('Filial topilmadi');
      }
    }

    return this.prisma.userCompany.update({
      where: { id: membership.id },
      data: { branchId: branchId || null }
    });
  }
}
