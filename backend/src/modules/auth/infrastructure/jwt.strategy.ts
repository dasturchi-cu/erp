import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UserStatus } from '@prisma/client';
import { RLS_PRISMA, RlsPrismaClient } from '../../../core/database/rls-prisma.service';
import { rlsContextStorage } from '../../../core/company/rls-context.storage';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    @Inject(RLS_PRISMA) private readonly prisma: RlsPrismaClient,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_ACCESS_SECRET'),
      algorithms: ['HS256'],
    });
  }

  async validate(payload: JwtPayload): Promise<JwtPayload> {
    if (payload.type !== 'access') {
      throw new UnauthorizedException('Invalid token type');
    }

    if (!payload.sessionId || !payload.sub) {
      throw new UnauthorizedException('Invalid token payload');
    }

    // Runs on every authenticated request, before any company context is
    // known (it's what establishes req.user) — same rationale as AuthService.
    const session = await rlsContextStorage.run({ bypass: true }, () =>
      this.prisma.session.findUnique({
        where: { id: payload.sessionId },
        include: { user: true },
      }),
    );

    if (!session || session.revokedAt) {
      throw new UnauthorizedException('Session revoked or expired');
    }

    if (session.userId !== payload.sub) {
      throw new UnauthorizedException('Session subject mismatch');
    }

    if (session.user.status === UserStatus.BLOCKED) {
      throw new UnauthorizedException('User account is blocked');
    }

    return payload;
  }
}
