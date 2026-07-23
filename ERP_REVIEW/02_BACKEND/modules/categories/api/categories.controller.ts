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
  UseGuards,
} from '@nestjs/common';
import { CategoriesService } from '../application/categories.service';
import { CreateCategoryRequestDto, UpdateCategoryRequestDto } from './dto/categories.dto';
import { CompanyIsolationGuard } from '../../../core/guards/company-isolation.guard';
import { RequireModule, RequirePermissions } from '../../../core/decorators/auth.decorators';
import { CurrentUser, ClientIp, RequestId } from '../../../core/decorators/current-user.decorator';
import { JwtPayload } from '../../auth/interfaces/jwt-payload.interface';

@Controller('categories')
@UseGuards(CompanyIsolationGuard)
@RequireModule('products')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @RequirePermissions('products.view')
  list(@CurrentUser() user: JwtPayload) {
    return this.categoriesService.list(user.companyId!);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions('categories.manage')
  create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateCategoryRequestDto,
    @ClientIp() ip?: string,
    @RequestId() requestId?: string,
  ) {
    return this.categoriesService.create(user.companyId!, user.sub, dto, ip, requestId);
  }

  @Patch(':id')
  @RequirePermissions('categories.manage')
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCategoryRequestDto,
    @ClientIp() ip?: string,
    @RequestId() requestId?: string,
  ) {
    return this.categoriesService.update(user.companyId!, id, user.sub, dto, ip, requestId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions('categories.manage')
  async remove(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @ClientIp() ip?: string,
    @RequestId() requestId?: string,
  ): Promise<void> {
    await this.categoriesService.remove(user.companyId!, id, user.sub, ip, requestId);
  }
}
