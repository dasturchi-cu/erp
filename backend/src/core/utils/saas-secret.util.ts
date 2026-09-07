import { InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const DEV_ONLY_FALLBACK_SECRET = 'dev-only-insecure-saas-secret-do-not-use-in-production';

/**
 * JWT_SAAS_SECRET must be set explicitly outside local development —
 * the old hardcoded default ('super-secret-saas-key-123') was public in
 * source control and let anyone forge SaaS-admin tokens in production.
 */
export function getSaasJwtSecret(config: ConfigService): string {
  const secret = config.get<string>('JWT_SAAS_SECRET');
  if (secret) {
    return secret;
  }
  if (config.get<string>('NODE_ENV') === 'production') {
    throw new InternalServerErrorException(
      'JWT_SAAS_SECRET environment variable is not set. Refusing to run SaaS-admin auth with a public default secret in production.',
    );
  }
  return DEV_ONLY_FALLBACK_SECRET;
}
