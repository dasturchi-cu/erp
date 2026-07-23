import {
  Body,
  Controller,
  Delete,
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
import { CustomersService } from '../application/customers.service';
import {
  CreateCustomerRequestDto,
  CustomerListQueryDto,
  CustomerSearchQueryDto,
  DebtHistoryQueryDto,
  UpdateCustomerRequestDto,
} from './dto/customers.dto';
import { CompanyIsolationGuard } from '../../../core/guards/company-isolation.guard';
import { RequireModule, RequirePermissions } from '../../../core/decorators/auth.decorators';
import { CurrentUser, ClientIp, RequestId } from '../../../core/decorators/current-user.decorator';
import { JwtPayload } from '../../auth/interfaces/jwt-payload.interface';

@Controller('customers')
@UseGuards(CompanyIsolationGuard)
@RequireModule('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  @RequirePermissions('customers.view')
  list(@CurrentUser() user: JwtPayload, @Query() query: CustomerListQueryDto) {
    return this.customersService.list(user.companyId!, query);
  }

  @Get('search')
  @RequirePermissions('customers.view')
  search(@CurrentUser() user: JwtPayload, @Query() query: CustomerSearchQueryDto) {
    return this.customersService.search(user.companyId!, query);
  }

  @Get(':id/debts')
  @RequirePermissions('debt.view')
  getDebts(@CurrentUser() user: JwtPayload, @Param('id', ParseUUIDPipe) id: string) {
    return this.customersService.getDebts(user.companyId!, id);
  }

  @Get(':id/debt-history')
  @RequirePermissions('debt.view')
  getDebtHistory(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: DebtHistoryQueryDto,
  ) {
    return this.customersService.getDebtHistory(user.companyId!, id, query);
  }

  @Get(':id')
  @RequirePermissions('customers.view')
  getById(@CurrentUser() user: JwtPayload, @Param('id', ParseUUIDPipe) id: string) {
    return this.customersService.getById(user.companyId!, id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions('customers.create')
  create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateCustomerRequestDto,
    @ClientIp() ip?: string,
    @RequestId() requestId?: string,
  ) {
    return this.customersService.create(user.companyId!, user.sub, dto, ip, requestId);
  }

  @Patch(':id')
  @RequirePermissions('customers.update')
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCustomerRequestDto,
    @ClientIp() ip?: string,
    @RequestId() requestId?: string,
  ) {
    return this.customersService.update(user.companyId!, id, user.sub, dto, ip, requestId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions('customers.delete')
  async remove(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @ClientIp() ip?: string,
    @RequestId() requestId?: string,
  ): Promise<void> {
    await this.customersService.remove(user.companyId!, id, user.sub, ip, requestId);
  }
}
