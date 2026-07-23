import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { DebtPaymentsService } from '../application/debt-payments.service';
import {
  CreateDebtPaymentRequestDto,
  DebtPaymentListQueryDto,
  ReverseDebtPaymentRequestDto,
} from './dto/debt.dto';
import { PaginationQueryDto } from '../../../core/dto/pagination-query.dto';
import { CompanyIsolationGuard } from '../../../core/guards/company-isolation.guard';
import { RequireModule, RequirePermissions } from '../../../core/decorators/auth.decorators';
import { CurrentUser, ClientIp, RequestId } from '../../../core/decorators/current-user.decorator';
import { IdempotencyKeyHeader } from '../../../core/decorators/idempotency.decorator';
import { JwtPayload } from '../../auth/interfaces/jwt-payload.interface';

@Controller()
@UseGuards(CompanyIsolationGuard)
@RequireModule('debt')
export class DebtPaymentsController {
  constructor(private readonly debtPaymentsService: DebtPaymentsService) {}

  @Get('debt-payments')
  @RequirePermissions('debt.view')
  list(@CurrentUser() user: JwtPayload, @Query() query: DebtPaymentListQueryDto) {
    return this.debtPaymentsService.list(user.companyId!, query);
  }

  @Post('debt-payments')
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions('debt.payment')
  create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateDebtPaymentRequestDto,
    @IdempotencyKeyHeader() idempotencyKey: string,
    @ClientIp() ip?: string,
    @RequestId() requestId?: string,
  ) {
    return this.debtPaymentsService.create(
      user.companyId!,
      user.sub,
      dto,
      idempotencyKey,
      ip,
      requestId,
    );
  }

  @Post('debt-payments/:id/reverse')
  @RequirePermissions('debt.reverse')
  reverse(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReverseDebtPaymentRequestDto,
    @ClientIp() ip?: string,
    @RequestId() requestId?: string,
  ) {
    return this.debtPaymentsService.reverse(user.companyId!, user.sub, id, dto, ip, requestId);
  }

  @Get('debt/summary')
  @RequirePermissions('debt.view')
  summary(@CurrentUser() user: JwtPayload) {
    return this.debtPaymentsService.getSummary(user.companyId!);
  }

  @Get('debt/customers')
  @RequirePermissions('debt.view')
  debtCustomers(@CurrentUser() user: JwtPayload, @Query() query: PaginationQueryDto) {
    return this.debtPaymentsService.listDebtCustomers(
      user.companyId!,
      query.resolvedPage(),
      query.resolvedLimit(),
    );
  }
}
