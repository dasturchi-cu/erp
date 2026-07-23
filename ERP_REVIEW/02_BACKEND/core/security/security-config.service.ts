import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const INSECURE_SECRET_MARKERS = [
  'change-me',
  'erp-dev-access-secret',
  'erp-dev-refresh-secret',
];

@Injectable()
export class SecurityConfigService implements OnModuleInit {
  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    const nodeEnv = this.config.get<string>('NODE_ENV', 'development');
    if (nodeEnv !== 'production') {
      return;
    }

    const accessSecret = this.config.get<string>('JWT_ACCESS_SECRET', '');
    const refreshSecret = this.config.get<string>('JWT_REFRESH_SECRET', '');

    this.assertStrongSecret('JWT_ACCESS_SECRET', accessSecret);
    this.assertStrongSecret('JWT_REFRESH_SECRET', refreshSecret);

    if (accessSecret === refreshSecret) {
      throw new Error('JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must differ in production');
    }
  }

  private assertStrongSecret(name: string, value: string) {
    if (value.length < 32) {
      throw new Error(`${name} must be at least 32 characters in production`);
    }
    const lower = value.toLowerCase();
    if (INSECURE_SECRET_MARKERS.some((marker) => lower.includes(marker))) {
      throw new Error(`${name} uses a known insecure default; set a unique production secret`);
    }
  }
}
