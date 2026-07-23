import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { SaaSAdminController } from './api/saas-admin.controller';
import { SaaSAdminService } from './application/saas-admin.service';
import { SaasJwtGuard } from './guards/saas-jwt.guard';

@Module({
  imports: [
    JwtModule.register({}),
  ],
  controllers: [SaaSAdminController],
  providers: [
    SaaSAdminService,
    SaasJwtGuard,
  ],
  exports: [
    SaaSAdminService,
    SaasJwtGuard,
  ],
})
export class SaaSAdminModule {}
