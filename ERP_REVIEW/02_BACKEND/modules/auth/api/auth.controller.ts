import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from '../application/auth.service';
import {
  LoginRequestDto,
  RefreshRequestDto,
  SwitchCompanyRequestDto,
} from '../api/dto/auth-request.dto';
import {
  LoginResponseDto,
  MeResponseDto,
  SwitchCompanyResponseDto,
} from '../api/dto/auth-response.dto';
import { Public } from '../../../core/decorators/auth.decorators';
import { CurrentUser, ClientIp, RequestId } from '../../../core/decorators/current-user.decorator';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { JwtAuthGuard } from '../../../core/guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 900000 } })
  login(
    @Body() dto: LoginRequestDto,
    @ClientIp() ip?: string,
    @RequestId() requestId?: string,
  ): Promise<LoginResponseDto> {
    return this.authService.login(dto.email, dto.password, dto.deviceInfo, ip, requestId);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 20, ttl: 900000 } })
  refresh(
    @Body() dto: RefreshRequestDto,
    @ClientIp() ip?: string,
  ): Promise<LoginResponseDto> {
    return this.authService.refresh(dto.refreshToken, ip);
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  async logout(
    @CurrentUser() user: JwtPayload,
    @RequestId() requestId?: string,
  ): Promise<void> {
    await this.authService.logout(user.sessionId, user.sub, requestId);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: JwtPayload): Promise<MeResponseDto> {
    return this.authService.me(user.sub, user.companyId, user.sessionId);
  }

  @Post('switch-company')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  switchCompany(
    @CurrentUser() user: JwtPayload,
    @Body() dto: SwitchCompanyRequestDto,
    @ClientIp() ip?: string,
    @RequestId() requestId?: string,
  ): Promise<SwitchCompanyResponseDto> {
    return this.authService.switchCompany(
      user.sub,
      user.sessionId,
      dto.companyId,
      user.deviceId,
      ip,
      requestId,
    );
  }
}
