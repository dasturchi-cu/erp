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
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { InventoryService } from '../application/inventory.service';
import {
  AdjustStockRequestDto,
  CreateWarehouseRequestDto,
  InventoryListQueryDto,
  ReceiveStockRequestDto,
  TransferStockRequestDto,
  UpdateWarehouseRequestDto,
} from './dto/inventory.dto';
import { CompanyIsolationGuard } from '../../../core/guards/company-isolation.guard';
import { RequireModule, RequirePermissions } from '../../../core/decorators/auth.decorators';
import { CurrentUser, ClientIp, RequestId } from '../../../core/decorators/current-user.decorator';
import { JwtPayload } from '../../auth/interfaces/jwt-payload.interface';

@ApiTags('Inventory')
@ApiBearerAuth()
@Controller()
@UseGuards(CompanyIsolationGuard)
@RequireModule('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get('inventory/stock')
  @RequirePermissions('inventory.view')
  @ApiOperation({ summary: 'Stock levels by product and warehouse' })
  listStock(@CurrentUser() user: JwtPayload, @Query() query: InventoryListQueryDto) {
    return this.inventoryService.listStock(user.companyId!, query);
  }

  @Get('inventory/batches')
  @RequirePermissions('inventory.view')
  listBatches(@CurrentUser() user: JwtPayload, @Query() query: InventoryListQueryDto) {
    return this.inventoryService.listBatches(user.companyId!, query);
  }

  @Get('inventory/batches/:id')
  @RequirePermissions('inventory.view')
  getBatch(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.inventoryService.getBatch(user.companyId!, id);
  }

  @Get('inventory/movements')
  @RequirePermissions('inventory.view')
  listMovements(@CurrentUser() user: JwtPayload, @Query() query: InventoryListQueryDto) {
    return this.inventoryService.listMovements(user.companyId!, query);
  }

  @Get('inventory/transfers')
  @RequirePermissions('inventory.view')
  @ApiOperation({ summary: 'Transfer history (grouped)' })
  listTransfers(@CurrentUser() user: JwtPayload, @Query() query: InventoryListQueryDto) {
    return this.inventoryService.listTransfers(user.companyId!, query);
  }

  @Post('inventory/receive')
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions('inventory.receive')
  receive(
    @CurrentUser() user: JwtPayload,
    @Body() dto: ReceiveStockRequestDto,
    @ClientIp() ip?: string,
    @RequestId() requestId?: string,
  ) {
    return this.inventoryService.receive(user.companyId!, user.sub, dto, ip, requestId);
  }

  @Post('inventory/adjust')
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions('inventory.adjust')
  adjust(
    @CurrentUser() user: JwtPayload,
    @Body() dto: AdjustStockRequestDto,
    @ClientIp() ip?: string,
    @RequestId() requestId?: string,
  ) {
    return this.inventoryService.adjust(user.companyId!, user.sub, dto, ip, requestId);
  }

  @Post('inventory/transfers')
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions('inventory.transfer')
  @ApiOperation({ summary: 'Transfer stock between warehouses (FIFO, same branch)' })
  transfer(
    @CurrentUser() user: JwtPayload,
    @Body() dto: TransferStockRequestDto,
    @ClientIp() ip?: string,
    @RequestId() requestId?: string,
  ) {
    return this.inventoryService.transfer(user.companyId!, user.sub, dto, ip, requestId);
  }

  @Get('branches')
  @RequirePermissions('inventory.view')
  @ApiOperation({ summary: 'List branches for warehouse assignment' })
  listBranches(@CurrentUser() user: JwtPayload) {
    return this.inventoryService.listBranches(user.companyId!);
  }

  @Get('warehouses')
  @RequirePermissions('inventory.view')
  listWarehouses(@CurrentUser() user: JwtPayload) {
    return this.inventoryService.listWarehouses(user.companyId!);
  }

  @Post('warehouses')
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions('warehouses.manage')
  createWarehouse(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateWarehouseRequestDto,
    @ClientIp() ip?: string,
    @RequestId() requestId?: string,
  ) {
    return this.inventoryService.createWarehouse(user.companyId!, user.sub, dto, ip, requestId);
  }

  @Get('warehouses/:id/dashboard')
  @RequirePermissions('inventory.view')
  @ApiOperation({ summary: 'Warehouse dashboard KPIs' })
  @ApiParam({ name: 'id', format: 'uuid' })
  warehouseDashboard(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.inventoryService.getWarehouseDashboard(user.companyId!, id);
  }

  @Get('warehouses/:id/reports')
  @RequirePermissions('inventory.view')
  @ApiOperation({ summary: 'Warehouse inventory reports' })
  @ApiParam({ name: 'id', format: 'uuid' })
  warehouseReports(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.inventoryService.getWarehouseReports(user.companyId!, id);
  }

  @Get('warehouses/:id')
  @RequirePermissions('inventory.view')
  getWarehouse(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.inventoryService.getWarehouse(user.companyId!, id);
  }

  @Patch('warehouses/:id')
  @RequirePermissions('warehouses.manage')
  @ApiOperation({ summary: 'Update warehouse' })
  updateWarehouse(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateWarehouseRequestDto,
    @ClientIp() ip?: string,
    @RequestId() requestId?: string,
  ) {
    return this.inventoryService.updateWarehouse(
      user.companyId!,
      id,
      dto,
      user.sub,
      ip,
      requestId,
    );
  }

  @Post('warehouses/:id/deactivate')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('warehouses.manage')
  @ApiOperation({ summary: 'Deactivate warehouse (no stock allowed)' })
  deactivateWarehouse(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @ClientIp() ip?: string,
    @RequestId() requestId?: string,
  ) {
    return this.inventoryService.deactivateWarehouse(
      user.companyId!,
      id,
      user.sub,
      ip,
      requestId,
    );
  }
}
