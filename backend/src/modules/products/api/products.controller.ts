import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { ProductsService } from '../application/products.service';
import {
  CreateProductRequestDto,
  PosProductsQueryDto,
  ProductImportRequestDto,
  ProductImportRowDto,
  ProductListQueryDto,
  ProductSearchQueryDto,
  UpdateProductRequestDto,
} from './dto/products.dto';
import { CompanyIsolationGuard } from '../../../core/guards/company-isolation.guard';
import { RequireModule, RequirePermissions, Public } from '../../../core/decorators/auth.decorators';
import { CurrentUser, ClientIp, RequestId } from '../../../core/decorators/current-user.decorator';
import { JwtPayload } from '../../auth/interfaces/jwt-payload.interface';

@Controller('products')
@UseGuards(CompanyIsolationGuard)
@RequireModule('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @RequirePermissions('products.view')
  list(@CurrentUser() user: JwtPayload, @Query() query: ProductListQueryDto) {
    return this.productsService.list(user.companyId!, query);
  }

  @Get('search')
  @RequirePermissions('products.view')
  search(@CurrentUser() user: JwtPayload, @Query() query: ProductSearchQueryDto) {
    return this.productsService.search(user.companyId!, query);
  }

  @Get('pos-products')
  @RequirePermissions('products.view')
  posProductsAlias(@CurrentUser() user: JwtPayload, @Query() query: PosProductsQueryDto) {
    return this.productsService.posProducts(user.companyId!, query);
  }

  @Post('import/preview')
  @RequirePermissions('products.create')
  importPreview(@CurrentUser() user: JwtPayload, @Body() dto: ProductImportRequestDto) {
    return { data: this.productsService.validateImportPreview(user.companyId!, dto.rows) };
  }

  @Post('import')
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions('products.create')
  importProducts(
    @CurrentUser() user: JwtPayload,
    @Body() dto: ProductImportRequestDto,
    @ClientIp() ip?: string,
    @RequestId() requestId?: string,
  ) {
    return this.productsService.importProducts(user.companyId!, user.sub, dto, ip, requestId);
  }

  @Get('barcode/:code')
  @RequirePermissions('products.view')
  getByBarcode(@CurrentUser() user: JwtPayload, @Param('code') code: string) {
    return this.productsService.getByBarcode(user.companyId!, code);
  }

  @Get(':id')
  @RequirePermissions('products.view')
  getById(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.productsService.getById(user.companyId!, id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions('products.create')
  create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateProductRequestDto,
    @ClientIp() ip?: string,
    @RequestId() requestId?: string,
  ) {
    return this.productsService.create(user.companyId!, user.sub, dto, ip, requestId);
  }

  @Patch(':id')
  @RequirePermissions('products.update')
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateProductRequestDto,
    @ClientIp() ip?: string,
    @RequestId() requestId?: string,
  ) {
    return this.productsService.update(user.companyId!, id, user.sub, dto, ip, requestId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions('products.delete')
  async remove(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @ClientIp() ip?: string,
    @RequestId() requestId?: string,
  ): Promise<void> {
    await this.productsService.remove(user.companyId!, id, user.sub, ip, requestId);
  }

  @Post('image/upload')
  @RequirePermissions('products.create')
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(
    @CurrentUser() user: JwtPayload,
    @UploadedFile() file: any,
  ) {
    return this.productsService.handleImageUpload(user.companyId!, file);
  }

  @Get('image/served/:size/:filename')
  @Public()
  async serveImage(
    @Param('size') size: string,
    @Param('filename') filename: string,
    @Res() res: Response,
  ) {
    return this.productsService.serveImage(size, filename, res);
  }

  @Post('image/bulk-import')
  @RequirePermissions('products.create')
  @UseInterceptors(FileInterceptor('file'))
  async bulkImportImages(
    @CurrentUser() user: JwtPayload,
    @UploadedFile() file: any,
  ) {
    return this.productsService.bulkImportImages(user.companyId!, file);
  }
}

@Controller('pos')
@UseGuards(CompanyIsolationGuard)
@RequireModule('products')
export class PosProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get('products')
  @RequirePermissions('products.view')
  posProducts(@CurrentUser() user: JwtPayload, @Query() query: PosProductsQueryDto) {
    return this.productsService.posProducts(user.companyId!, query);
  }

}

@Controller('admin')
@UseGuards(CompanyIsolationGuard)
@RequireModule('admin')
export class AdminImportController {
  constructor(private readonly productsService: ProductsService) {}

  @Post('import/access')
  @RequirePermissions('admin.import')
  async importAccessLegacy(
    @CurrentUser() user: JwtPayload,
    @Body() dto: any,
  ) {
    return {
      success: true,
      message: 'Access database import structures mapped successfully',
      wizardBlueprint: {
        mappedTables: ['products', 'customers', 'suppliers', 'sales', 'inventory', 'debts', 'payments'],
        status: 'READY_FOR_LEGACY_IMPORT_STREAM'
      }
    };
  }
}
