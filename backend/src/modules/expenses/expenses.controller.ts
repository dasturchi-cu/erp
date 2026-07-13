import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { CompanyIsolationGuard } from '../../core/guards/company-isolation.guard';
import { RequireModule, RequirePermissions } from '../../core/decorators/auth.decorators';
import { CurrentUser } from '../../core/decorators/current-user.decorator';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { ExpensesService } from './expenses.service';
import { CreateExpenseDto, ExpenseQueryDto } from './dto/expenses.dto';

@Controller('expenses')
@UseGuards(CompanyIsolationGuard)
@RequireModule('sales')
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Post()
  @RequirePermissions('sales.create')
  async create(@CurrentUser() user: JwtPayload, @Body() dto: CreateExpenseDto) {
    return this.expensesService.create(user.companyId!, user.sub, dto);
  }

  @Get()
  @RequirePermissions('sales.view')
  async findAll(@CurrentUser() user: JwtPayload, @Query() query: ExpenseQueryDto) {
    return this.expensesService.list(user.companyId!, query);
  }

  @Get('cash-register')
  @RequirePermissions('sales.view')
  async getCashRegisterStatus(@CurrentUser() user: JwtPayload) {
    return this.expensesService.getCashBalance(user.companyId!);
  }

  @Get('cash-transactions')
  @RequirePermissions('sales.view')
  async getCashTransactions(@CurrentUser() user: JwtPayload) {
    return this.expensesService.getCashTransactions(user.companyId!);
  }

  @Delete(':id')
  @RequirePermissions('sales.create')
  async remove(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.expensesService.delete(user.companyId!, id);
  }
}
