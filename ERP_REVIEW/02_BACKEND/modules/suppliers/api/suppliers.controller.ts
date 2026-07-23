import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { SuppliersService } from '../application/suppliers.service';
import {
  CreateSupplierPaymentRequestDto,
  CreateSupplierRequestDto,
  SupplierListQueryDto,
  SupplierPaymentListQueryDto,
  SupplierReceiptListQueryDto,
  SupplierSearchQueryDto,
  UpdateSupplierRequestDto,
} from './dto/suppliers.dto';
import { CompanyIsolationGuard } from '../../../core/guards/company-isolation.guard';
import { RequireModule, RequirePermissions } from '../../../core/decorators/auth.decorators';
import { CurrentUser, ClientIp, RequestId } from '../../../core/decorators/current-user.decorator';
import { JwtPayload } from '../../auth/interfaces/jwt-payload.interface';

@Controller('suppliers')
@UseGuards(CompanyIsolationGuard)
@RequireModule('suppliers')
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  @Get()
  @RequirePermissions('suppliers.view')
  list(@CurrentUser() user: JwtPayload, @Query() query: SupplierListQueryDto) {
    return this.suppliersService.list(user.companyId!, query);
  }

  @Get('search')
  @RequirePermissions('suppliers.view')
  search(@CurrentUser() user: JwtPayload, @Query() query: SupplierSearchQueryDto) {
    return this.suppliersService.search(user.companyId!, query);
  }

  @Get('summary')
  @RequirePermissions('suppliers.view')
  summary(@CurrentUser() user: JwtPayload) {
    return this.suppliersService.getSummary(user.companyId!);
  }

  @Get('payments')
  @RequirePermissions('suppliers.payment')
  listPayments(@CurrentUser() user: JwtPayload, @Query() query: SupplierPaymentListQueryDto) {
    return this.suppliersService.listPayments(user.companyId!, query);
  }

  @Get('export/debts')
  @RequirePermissions('suppliers.view')
  async exportDebts(@CurrentUser() user: JwtPayload) {
    const data = await this.suppliersService.listDebtsForExport(user.companyId!);
    return { data };
  }

  @Get(':id')
  @RequirePermissions('suppliers.view')
  getById(@CurrentUser() user: JwtPayload, @Param('id', ParseUUIDPipe) id: string) {
    return this.suppliersService.getById(user.companyId!, id);
  }

  @Get(':id/receipts')
  @RequirePermissions('suppliers.view')
  getReceipts(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: SupplierReceiptListQueryDto,
  ) {
    return this.suppliersService.getReceipts(user.companyId!, id, query);
  }

  @Get(':id/debt-history')
  @RequirePermissions('suppliers.view')
  getDebtHistory(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: SupplierReceiptListQueryDto,
  ) {
    return this.suppliersService.getDebtHistory(user.companyId!, id, query);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions('suppliers.create')
  create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateSupplierRequestDto,
    @ClientIp() ip?: string,
    @RequestId() requestId?: string,
  ) {
    return this.suppliersService.create(user.companyId!, user.sub, dto, ip, requestId);
  }

  @Patch(':id')
  @RequirePermissions('suppliers.update')
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSupplierRequestDto,
    @ClientIp() ip?: string,
    @RequestId() requestId?: string,
  ) {
    return this.suppliersService.update(user.companyId!, id, user.sub, dto, ip, requestId);
  }

  @Post(':id/archive')
  @RequirePermissions('suppliers.update')
  archive(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @ClientIp() ip?: string,
    @RequestId() requestId?: string,
  ) {
    return this.suppliersService.archive(user.companyId!, id, user.sub, ip, requestId);
  }

  @Post(':id/restore')
  @RequirePermissions('suppliers.update')
  restore(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @ClientIp() ip?: string,
    @RequestId() requestId?: string,
  ) {
    return this.suppliersService.restore(user.companyId!, id, user.sub, ip, requestId);
  }

  @Post(':id/payments')
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions('suppliers.payment')
  recordPayment(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateSupplierPaymentRequestDto,
    @ClientIp() ip?: string,
    @RequestId() requestId?: string,
  ) {
    return this.suppliersService.recordPayment(user.companyId!, id, user.sub, dto, ip, requestId);
  }
}
