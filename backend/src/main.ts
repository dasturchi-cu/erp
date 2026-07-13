import { NestFactory } from '@nestjs/core';
import { RequestMethod, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './core/filters/http-exception.filter';
import { RequestIdInterceptor } from './core/interceptors/request-id.interceptor';
import { PilotErrorLogger } from './core/logging/pilot-error.logger';
import { getAppVersion } from './core/utils/app-version.util';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  const config = app.get(ConfigService);
  const port = config.get<number>('PORT', 3000);
  const corsOrigins = config
    .get<string>('CORS_ORIGINS', 'http://localhost:5173,http://127.0.0.1:5173,http://localhost:4173,http://127.0.0.1:4173')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  app.setGlobalPrefix('api/v1', {
    exclude: [{ path: '', method: RequestMethod.GET }],
  });
  app.enableCors({
    origin: corsOrigins,
    credentials: true,
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Company-Id',
      'X-Device-Id',
      'X-Pilot-Screen',
      'X-Pilot-Action',
      'Idempotency-Key',
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
