import { Controller, Get } from '@nestjs/common';
import { Public } from '../../core/decorators/auth.decorators';
import { getAppVersion, getFrontendUrl } from '../../core/utils/app-version.util';

@Controller()
export class RootController {
  @Public()
  @Get()
  root() {
    return {
      name: 'ERP API',
      version: getAppVersion(),
      message: 'Bu backend API. ERP interfeysi uchun brauzerda frontend oching.',
      frontend: getFrontendUrl(),
      health: '/api/v1/health',
      api: '/api/v1',
    };
  }
}
