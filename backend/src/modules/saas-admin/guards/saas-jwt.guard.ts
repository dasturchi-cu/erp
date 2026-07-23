import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../core/database/prisma.service';

@Injectable()
export class SaasJwtGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    
    // Explicitly reject if cashier or normal ERP headers are sent or they are trying to mix sessions
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Autentifikatsiya tokeni topilmadi');
    }

    const token = authHeader.split(' ')[1];
    try {
      const secret = this.config.get<string>('JWT_SAAS_SECRET', 'super-secret-saas-key-123');
      const payload = await this.jwtService.verifyAsync(token, { secret });
      
      if (payload.type !== 'saas_access') {
        throw new ForbiddenException('Sizda Super Admin huquqi mavjud emas');
      }

      const saasAdmin = await this.prisma.saaSAdmin.findUnique({
        where: { id: payload.sub },
      });

      if (!saasAdmin) {
        throw new UnauthorizedException('SaaS Admin tizimdan topilmadi');
      }

      request.saasAdmin = saasAdmin;
      return true;
    } catch (err) {
      if (err instanceof ForbiddenException) {
        throw err;
      }
      throw new UnauthorizedException('Seans muddati tugagan yoki xato token');
    }
  }
}
