import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../core/database/prisma.service';
import { AuditService } from '../../../core/audit/audit.service';
import { AppException } from '../../../core/exceptions/app.exception';
import {
  CategoryListResponseDto,
  CategoryResponseDto,
  CreateCategoryRequestDto,
  UpdateCategoryRequestDto,
} from '../api/dto/categories.dto';

@Injectable()
export class CategoriesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async list(companyId: string): Promise<CategoryListResponseDto> {
    const categories = await this.prisma.productCategory.findMany({
      where: { companyId, deletedAt: null },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: {
        _count: {
          select: {
            products: { where: { deletedAt: null } },
          },
        },
      },
    });

    return {
      data: categories.map((c) => this.toResponse(c)),
    };
  }

  async create(
    companyId: string,
    userId: string,
    dto: CreateCategoryRequestDto,
    ip?: string,
    requestId?: string,
  ): Promise<CategoryResponseDto> {
    if (dto.parentId) {
      await this.ensureCategory(companyId, dto.parentId);
    }

    try {
      const created = await this.prisma.productCategory.create({
        data: {
          companyId,
          name: dto.name.trim(),
          parentId: dto.parentId ?? null,
          sortOrder: dto.sortOrder ?? 0,
        },
        include: {
          _count: { select: { products: { where: { deletedAt: null } } } },
        },
      });

      await this.audit.log({
        companyId,
        userId,
        action: 'CREATE',
        entityType: 'product_category',
        entityId: created.id,
        newValue: { name: created.name, parentId: created.parentId, sortOrder: created.sortOrder },
        ipAddress: ip,
        requestId,
      });

      return this.toResponse(created);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw AppException.conflict('DUPLICATE_CATEGORY', 'Category name already exists');
      }
      throw error;
    }
  }

  async update(
    companyId: string,
    id: string,
    userId: string,
    dto: UpdateCategoryRequestDto,
    ip?: string,
    requestId?: string,
  ): Promise<CategoryResponseDto> {
    const existing = await this.ensureCategory(companyId, id);

    if (dto.parentId) {
      if (dto.parentId === id) {
        throw AppException.businessRule('Category cannot be its own parent');
      }
      await this.ensureCategory(companyId, dto.parentId);
    }

    const updated = await this.prisma.productCategory.update({
      where: { id, companyId },
      data: {
        name: dto.name?.trim(),
        parentId: dto.parentId === undefined ? undefined : dto.parentId,
        sortOrder: dto.sortOrder,
      },
      include: {
        _count: { select: { products: { where: { deletedAt: null } } } },
      },
    });

    await this.audit.log({
      companyId,
      userId,
      action: 'UPDATE',
      entityType: 'product_category',
      entityId: id,
      oldValue: {
        name: existing.name,
        parentId: existing.parentId,
        sortOrder: existing.sortOrder,
      },
      newValue: {
        name: updated.name,
        parentId: updated.parentId,
        sortOrder: updated.sortOrder,
      },
      ipAddress: ip,
      requestId,
    });

    return this.toResponse(updated);
  }

  async remove(
    companyId: string,
    id: string,
    userId: string,
    ip?: string,
    requestId?: string,
  ): Promise<void> {
    const existing = await this.ensureCategory(companyId, id);

    const productCount = await this.prisma.product.count({
      where: { companyId, categoryId: id, deletedAt: null },
    });
    if (productCount > 0) {
      throw AppException.businessRule('Cannot delete category with assigned products', {
        productCount,
      });
    }

    const childCount = await this.prisma.productCategory.count({
      where: { companyId, parentId: id, deletedAt: null },
    });
    if (childCount > 0) {
      throw AppException.businessRule('Cannot delete category with child categories', {
        childCount,
      });
    }

    await this.prisma.productCategory.update({
      where: { id, companyId },
      data: { deletedAt: new Date() },
    });

    await this.audit.log({
      companyId,
      userId,
      action: 'DELETE',
      entityType: 'product_category',
      entityId: id,
      oldValue: { name: existing.name },
      ipAddress: ip,
      requestId,
    });
  }

  async ensureCategory(companyId: string, id: string) {
    const category = await this.prisma.productCategory.findFirst({
      where: { id, companyId, deletedAt: null },
    });
    if (!category) {
      throw AppException.notFound('Category', id);
    }
    return category;
  }

  async findOrCreateByName(companyId: string, name: string, userId: string): Promise<string> {
    return this.findOrCreateByNameInternal(this.prisma, companyId, name, userId);
  }

  async findOrCreateByNameInternal(
    tx: Prisma.TransactionClient,
    companyId: string,
    name: string,
    userId: string,
  ): Promise<string> {
    const trimmed = name.trim();
    const existing = await tx.productCategory.findFirst({
      where: { companyId, deletedAt: null, name: { equals: trimmed, mode: 'insensitive' } },
    });
    if (existing) return existing.id;

    const created = await tx.productCategory.create({
      data: { companyId, name: trimmed, sortOrder: 0 },
    });
    await this.audit.log({
      companyId,
      userId,
      action: 'CREATE',
      entityType: 'product_category',
      entityId: created.id,
      newValue: { name: created.name, source: 'import' },
    });
    return created.id;
  }

  private toResponse(category: {
    id: string;
    name: string;
    parentId: string | null;
    sortOrder: number;
    _count: { products: number };
  }): CategoryResponseDto {
    return {
      id: category.id,
      name: category.name,
      parentId: category.parentId,
      productCount: category._count.products,
      sortOrder: category.sortOrder,
    };
  }
}
