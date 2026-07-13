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
import { SalesService } from '../application/sales.service';
import {
  CreateSaleRequestDto,
  CreateSaleReturnRequestDto,
  ReturnDecisionRequestDto,
  SaleListQueryDto,
  SaleReturnListQueryDto,
  VoidSaleRequestDto,
} from './dto/sales.dto';
import { CompanyIsolationGuard } from '../../../core/guards/company-isolation.guard';
import { RequireModule, RequirePermissions } from '../../../core/decorators/auth.decorators';
import { CurrentUser, ClientIp, RequestId } from '../../../core/decorators/current-user.decorator';
import { IdempotencyKeyHeader } from '../../../core/decorators/idempotency.decorator';
import { JwtPayload } from '../../auth/interfaces/jwt-payload.interface';

@Controller('sales')
@UseGuards(CompanyIsolationGuard)
@RequireModule('sales')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Get()
  @RequirePermissions('sales.view')
  list(@CurrentUser() user: JwtPayload, @Query() query: SaleListQueryDto) {
    return this.salesService.list(user.companyId!, user.sub, user.permissions, query);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions('sales.create')
  create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateSaleRequestDto,
    @IdempotencyKeyHeader() idempotencyKey: string,
    @ClientIp() ip?: string,
    @RequestId() requestId?: string,
  ) {
    return this.salesService.create(
      user.companyId!,
      user.sub,
      user.branchId,
      dto,
      idempotencyKey,
      ip,
      requestId,
    );
  }

  @Get('returns')
  @RequirePermissions('sales.view')
  listReturns(@CurrentUser() user: JwtPayload, @Query() query: SaleReturnListQueryDto) {
    return this.salesService.listReturns(user.companyId!, query);
  }

  @Get('returns/:id')
  @RequirePermissions('sales.view')
  getReturn(@CurrentUser() user: JwtPayload, @Param('id', ParseUUIDPipe) id: string) {
    return this.salesService.getReturnById(user.companyId!, id);
  }

  @Post('returns/:id/approve')
  @RequirePermissions('sales.return')
  approveReturn(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReturnDecisionRequestDto,
    @ClientIp() ip?: string,
    @RequestId() requestId?: string,
  ) {
    return this.salesService.approveReturn(user.companyId!, user.sub, id, dto, ip, requestId);
  }

  @Post('returns/:id/reject')
  @RequirePermissions('sales.return')
  rejectReturn(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReturnDecisionRequestDto,
    @ClientIp() ip?: string,
    @RequestId() requestId?: string,
  ) {
    return this.salesService.rejectReturn(user.companyId!, user.sub, id, dto, ip, requestId);
  }

  @Get('receipt-templates')
  @RequirePermissions('sales.view')
  getReceiptTemplates(@CurrentUser() user: JwtPayload) {
    return this.salesService.getReceiptTemplates(user.companyId!);
  }

  @Post('receipt-templates')
  @RequirePermissions('sales.create')
  saveReceiptTemplate(
    @CurrentUser() user: JwtPayload,
    @Body() dto: any,
  ) {
    return this.salesService.saveReceiptTemplate(user.companyId!, dto);
  }

  @Get(':id')
  @RequirePermissions('sales.view')
  getById(@CurrentUser() user: JwtPayload, @Param('id', ParseUUIDPipe) id: string) {
    return this.salesService.getById(user.companyId!, id);
  }

  @Post(':id/void')
  @RequirePermissions('sales.cancel')
  voidSale(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: VoidSaleRequestDto,
    @IdempotencyKeyHeader() idempotencyKey: string,
    @ClientIp() ip?: string,
    @RequestId() requestId?: string,
  ) {
    return this.salesService.voidSale(
      user.companyId!,
      user.sub,
      id,
      dto,
      idempotencyKey,
      ip,
      requestId,
    );
  }

  @Post(':id/returns')
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions('sales.return')
  createReturn(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateSaleReturnRequestDto,
    @IdempotencyKeyHeader() idempotencyKey: string,
    @ClientIp() ip?: string,
    @RequestId() requestId?: string,
  ) {
    return this.salesService.createReturn(
      user.companyId!,
      user.sub,
      id,
      dto,
      idempotencyKey,
      ip,
      requestId,
    );
  }
}
