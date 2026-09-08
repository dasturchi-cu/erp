import { NestFactory } from '@nestjs/core';
import { RequestMethod, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './core/filters/http-exception.filter';
import { RequestIdInterceptor } from './core/interceptors/request-id.interceptor';
import { PilotErrorLogger } from './core/logging/pilot-error.logger';
import { getAppVersion } from './core/utils/app-version.util';

// Postgres BIGINT columns (diskFreeBytes, zipSize) come back from Prisma as
// native BigInt, which JSON.stringify cannot serialize — every response
// path that returns one of those columns would otherwise crash with "Do not
// know how to serialize a BigInt". None of this app's BigInt columns can
// realistically exceed Number.MAX_SAFE_INTEGER (they're byte counts), so a
// blanket safe conversion here is a reasonable global guard rather than
// patching every call site that might return one.
(BigInt.prototype as unknown as { toJSON(): number }).toJSON = function () {
  return Number(this);
};

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  const config = app.get(ConfigService);
  const rawPort = config.get<string | number>('PORT', 3000);
  const port = typeof rawPort === 'string' ? parseInt(rawPort.trim(), 10) || 3000 : rawPort;
  // CORS_ORIGINS is opt-in: leave it unset to keep reflecting any Origin (needed
  // today for the Electron desktop app's file:// origin and mobile clients that
  // send no Origin at all). Set it on Railway to a comma-separated allowlist to
  // lock this down once every client origin is known.
  const corsOrigins = config
    .get<string>('CORS_ORIGINS', '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  const restrictCorsOrigins = corsOrigins.length > 0;

  app.use((req: any, res: any, next: any) => {
    const origin = req.headers.origin;
    if (origin && (!restrictCorsOrigins || corsOrigins.includes(origin))) {
      res.header('Access-Control-Allow-Origin', origin);
    } else if (!origin) {
      res.header('Access-Control-Allow-Origin', '*');
    }
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD');
    const reqHeaders = req.headers['access-control-request-headers'];
    if (reqHeaders) {
      res.header('Access-Control-Allow-Headers', reqHeaders);
    } else {
      res.header('Access-Control-Allow-Headers', '*');
    }
    if (req.method === 'OPTIONS') {
      return res.sendStatus(204);
    }
    next();
  });

  app.setGlobalPrefix('api/v1', {
    exclude: [{ path: '', method: RequestMethod.GET }],
  });
  app.enableCors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Company-Id',
      'X-Device-Id',
      'X-Pilot-Screen',
      'X-Pilot-Action',
      'Idempotency-Key',
      'Accept',
      'Origin',
      'X-Requested-With',
    ],
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter(app.get(PilotErrorLogger)));
  app.useGlobalInterceptors(new RequestIdInterceptor());

  const swaggerConfig = new DocumentBuilder()
    .setTitle('ERP API')
    .setDescription('ERP REST API — modular monolith')
    .setVersion('1.0.0')
    .addBearerAuth()
    .addTag('Reports', 'Business reports, analytics exports')
    .addTag('Analytics', 'KPI dashboards and chart analytics')
    .addTag('Notifications', 'In-app notifications and alerts')
    .addTag('Admin', 'Administration, backup, monitoring')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(port, '0.0.0.0');
  console.log(`ERP API listening on http://localhost:${port}/api/v1`);
  console.log(`Swagger docs at http://localhost:${port}/api/docs`);
}

bootstrap();
