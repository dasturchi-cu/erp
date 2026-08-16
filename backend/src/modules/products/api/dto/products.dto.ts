import { ProductStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { PaginationQueryDto } from '../../../../core/dto/pagination-query.dto';

const MONEY_PATTERN = /^\d+(\.\d{1,4})?$/;

export class ProductListQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsString()
  stockLevel?: 'in_stock' | 'low' | 'out';

  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsString()
  sort?: string;
}

export class ProductSearchQueryDto {
  @IsString()
  @MinLength(1)
  q!: string;
}

export class PosProductsQueryDto {
  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsString()
  limit?: string;
}

export class CreateProductRequestDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  sku!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(500)
  name!: string;

  @IsUUID()
  categoryId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  barcode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  unitOfMeasure?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d+$/)
  unitsPerBox?: string;

  @IsOptional()
  @IsString()
  @Matches(MONEY_PATTERN)
  minStockLevel?: string;

  @IsString()
  @Matches(MONEY_PATTERN)
  purchasePriceUzs!: string;

  @IsString()
  @Matches(MONEY_PATTERN)
  salePriceUzs!: string;

  @IsOptional()
  @IsString()
  @Matches(MONEY_PATTERN)
  purchasePriceUsd?: string;

  @IsOptional()
  @IsString()
  @Matches(MONEY_PATTERN)
  salePriceUsd?: string;

  @IsOptional()
  @IsString()
  @Matches(MONEY_PATTERN)
  wholesalePriceUzs?: string;

  @IsOptional()
  @IsString()
  @Matches(MONEY_PATTERN)
  wholesalePriceUsd?: string;

  @IsOptional()
  @IsString()
  @Matches(MONEY_PATTERN)
  recommendedPriceUzs?: string;

  @IsOptional()
  @IsString()
  @Matches(MONEY_PATTERN)
  recommendedPriceUsd?: string;

  @IsOptional()
  @IsString()
  @Matches(MONEY_PATTERN)
  minPriceUzs?: string;

  @IsOptional()
  @IsString()
  @Matches(MONEY_PATTERN)
  minPriceUsd?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsString()
  pdfCatalogUrl?: string;

  @IsOptional()
  @IsString()
  techPassportUrl?: string;

  @IsOptional()
  @IsString()
  userManualUrl?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  barcodes?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  aliases?: string[];

  @IsOptional()
  @IsArray()
  unitConversions?: Array<{ fromUnit: string; toUnit: string; conversionFactor: string }>;

  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;

  @IsOptional()
  @IsString()
  @Matches(MONEY_PATTERN)
  initialStock?: string;

  @IsOptional()
  @IsUUID()
  initialWarehouseId?: string;
}

export class UpdateProductRequestDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  name?: string;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  barcode?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  unitOfMeasure?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d+$/)
  unitsPerBox?: string;

  @IsOptional()
  @IsString()
  @Matches(MONEY_PATTERN)
  minStockLevel?: string | null;

  @IsOptional()
  @IsString()
  @Matches(MONEY_PATTERN)
  purchasePriceUzs?: string;

  @IsOptional()
  @IsString()
  @Matches(MONEY_PATTERN)
  salePriceUzs?: string;

  @IsOptional()
  @IsString()
  @Matches(MONEY_PATTERN)
  purchasePriceUsd?: string;

  @IsOptional()
  @IsString()
  @Matches(MONEY_PATTERN)
  salePriceUsd?: string;

  @IsOptional()
  @IsString()
  @Matches(MONEY_PATTERN)
  wholesalePriceUzs?: string;

  @IsOptional()
  @IsString()
  @Matches(MONEY_PATTERN)
  wholesalePriceUsd?: string;

  @IsOptional()
  @IsString()
  @Matches(MONEY_PATTERN)
  recommendedPriceUzs?: string;

  @IsOptional()
  @IsString()
  @Matches(MONEY_PATTERN)
  recommendedPriceUsd?: string;

  @IsOptional()
  @IsString()
  @Matches(MONEY_PATTERN)
  minPriceUzs?: string;

  @IsOptional()
  @IsString()
  @Matches(MONEY_PATTERN)
  minPriceUsd?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string | null;

  @IsOptional()
  @IsString()
  pdfCatalogUrl?: string | null;

  @IsOptional()
  @IsString()
  techPassportUrl?: string | null;

  @IsOptional()
  @IsString()
  userManualUrl?: string | null;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  barcodes?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  aliases?: string[];

  @IsOptional()
  @IsArray()
  unitConversions?: Array<{ fromUnit: string; toUnit: string; conversionFactor: string }>;

  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;
}

export class ProductImportRowDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  sku!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  barcode?: string;

  @IsString()
  @MinLength(1)
  @MaxLength(500)
  name!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(255)
  category!: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  unit?: string;

  @IsString()
  @Matches(MONEY_PATTERN)
  purchasePrice!: string;

  @IsString()
  @Matches(MONEY_PATTERN)
  sellingPrice!: string;

  @IsOptional()
  @IsString()
  @Matches(MONEY_PATTERN)
  purchasePriceUzs?: string;

  @IsOptional()
  @IsString()
  @Matches(MONEY_PATTERN)
  sellingPriceUzs?: string;

  @IsOptional()
  @IsString()
  @Matches(MONEY_PATTERN)
  purchasePriceUsd?: string;

  @IsOptional()
  @IsString()
  @Matches(MONEY_PATTERN)
  sellingPriceUsd?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  legacyId?: string;

  @IsOptional()
  @IsString()
  @Matches(MONEY_PATTERN)
  stock?: string;
}

export class ProductImportRequestDto {
  @IsOptional()
  @IsUUID()
  warehouseId?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductImportRowDto)
  rows!: ProductImportRowDto[];
}

export class ProductResponseDto {
  id!: string;
  sku!: string;
  barcode!: string | null;
  name!: string;
  categoryId!: string;
  categoryName!: string;
  status!: string;
  purchasePriceUzs!: string;
  purchasePriceUsd!: string;
  salePriceUzs!: string;
  salePriceUsd!: string;
  stock!: string;
  totalStock?: string;
  wholesalePriceUzs?: string;
  wholesalePriceUsd?: string;
  recommendedPriceUzs?: string;
  recommendedPriceUsd?: string;
  minPriceUzs?: string;
  minPriceUsd?: string;
  imageUrl?: string | null;
  pdfCatalogUrl?: string | null;
  techPassportUrl?: string | null;
  userManualUrl?: string | null;
  barcodes?: string[];
  aliases?: string[];
  unitConversions?: Array<{ fromUnit: string; toUnit: string; conversionFactor: string }>;
  unitOfMeasure!: string;
  unitsPerBox!: string;
  minStockLevel!: string;
  createdAt!: string;
  updatedAt!: string;
}

export class ProductSearchResponseDto {
  data!: ProductResponseDto[];
}
