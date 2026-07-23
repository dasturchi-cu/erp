import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'crypto';
import { AuthTokens, JwtPayload } from '../interfaces/jwt-payload.interface';

@Injectable()
export class TokenService {
  private readonly accessExpiresIn: number;
  private readonly refreshExpiresIn: number;

  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {
    this.accessExpiresIn = parseInt(config.get<string>('JWT_ACCESS_EXPIRES_IN', '900'), 10);
    this.refreshExpiresIn = parseInt(config.get<string>('JWT_REFRESH_EXPIRES_IN', '604800'), 10);
  }

  get accessTtlSeconds(): number {
    return this.accessExpiresIn;
  }

  get refreshTtlSeconds(): number {
    return this.refreshExpiresIn;
  }

  async signAccessToken(payload: Omit<JwtPayload, 'type'>): Promise<string> {
    return this.jwtService.signAsync(
      { ...payload, type: 'access' },
      {
        secret: this.config.get<string>('JWT_ACCESS_SECRET'),
        expiresIn: this.accessExpiresIn,
        algorithm: 'HS256',
      },
    );
  }

  async signRefreshToken(payload: Omit<JwtPayload, 'type'>): Promise<string> {
    return this.jwtService.signAsync(
      { ...payload, type: 'refresh' },
      {
        secret: this.config.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.refreshExpiresIn,
        algorithm: 'HS256',
      },
    );
  }

  async verifyAccessToken(token: string): Promise<JwtPayload> {
    const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
      secret: this.config.get<string>('JWT_ACCESS_SECRET'),
    });
    if (payload.type !== 'access') {
      throw new Error('Invalid token type');
    }
    return payload;
  }

  async verifyRefreshToken(token: string): Promise<JwtPayload> {
    const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
      secret: this.config.get<string>('JWT_REFRESH_SECRET'),
    });
    if (payload.type !== 'refresh') {
      throw new Error('Invalid token type');
    }
    return payload;
  }

  hashRefreshToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  generateOpaqueToken(): string {
    return randomBytes(32).toString('hex');
  }

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  }

  async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  async buildTokenPair(base: Omit<JwtPayload, 'type'>): Promise<AuthTokens> {
    const [accessToken, refreshToken] = await Promise.all([
      this.signAccessToken(base),
      this.signRefreshToken(base),
    ]);
    return {
      accessToken,
      refreshToken,
      expiresIn: this.accessExpiresIn,
    };
  }
}
