import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrencyService } from '../application/currency.service';
import {
  ConvertCurrencyRequestDto,
  RateHistoryQueryDto,
  SetExchangeRateRequestDto,
} from './dto/currency.dto';
import { CompanyIsolationGuard } from '../../../core/guards/company-isolation.guard';
import { RequireModule, RequirePermissions } from '../../../core/decorators/auth.decorators';
import { CurrentUser, ClientIp, RequestId } from '../../../core/decorators/current-user.decorator';
import { JwtPayload } from '../../auth/interfaces/jwt-payload.interface';

@Controller('currency')
@UseGuards(CompanyIsolationGuard)
@RequireModule('currency')
export class CurrencyController {
  constructor(private readonly currencyService: CurrencyService) {}

  @Get('rate')
  @RequirePermissions('currency.view')
  getCurrentRate(@CurrentUser() user: JwtPayload) {
    return this.currencyService.getCurrentRate(user.companyId!);
  }

  @Get('rates')
  @RequirePermissions('currency.view')
  listRates(@CurrentUser() user: JwtPayload, @Query() query: RateHistoryQueryDto) {
    return this.currencyService.listRates(user.companyId!, query);
  }

  @Post('rates')
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions('currency.manage')
  setRate(
    @CurrentUser() user: JwtPayload,
    @Body() dto: SetExchangeRateRequestDto,
    @ClientIp() ip?: string,
    @RequestId() requestId?: string,
  ) {
    return this.currencyService.setRate(user.companyId!, user.sub, dto, ip, requestId);
  }

  @Post('convert')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('currency.view')
  convert(@CurrentUser() user: JwtPayload, @Body() dto: ConvertCurrencyRequestDto) {
    return this.currencyService.convert(user.companyId!, dto);
  }
}
