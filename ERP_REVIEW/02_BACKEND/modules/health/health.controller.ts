import { Controller, Get } from '@nestjs/common';
import { Public } from '../../core/decorators/auth.decorators';
import { getAppVersion } from '../../core/utils/app-version.util';

@Controller('health')
export class HealthController {
  @Public()
  @Get()
  check() {
    return { status: 'ok', version: getAppVersion() };
  }
}
