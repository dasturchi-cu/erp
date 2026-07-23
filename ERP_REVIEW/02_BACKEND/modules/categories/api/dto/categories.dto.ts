import { IsInt, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class CreateCategoryRequestDto {
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name!: string;

  @IsOptional()
  @IsUUID()
  parentId?: string | null;

  @IsOptional()
  @IsInt()
  sortOrder?: number;
}

export class UpdateCategoryRequestDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsUUID()
  parentId?: string | null;

  @IsOptional()
  @IsInt()
  sortOrder?: number;
}

export class CategoryResponseDto {
  id!: string;
  name!: string;
  parentId!: string | null;
  productCount!: number;
  sortOrder!: number;
}

export class CategoryListResponseDto {
  data!: CategoryResponseDto[];
}
