import { Module } from '@nestjs/common';
import { SaasController } from './api/saas.controller';
import { SaasService } from './application/saas.service';
import { AdminModule } from '../admin/admin.module';

@Module({
  imports: [AdminModule],
  controllers: [SaasController],
  providers: [SaasService],
})
export class SaasModule {}
