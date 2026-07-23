import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { NotificationCategory, NotificationSeverity } from '@prisma/client';
import { Type, Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { PaginationQueryDto } from '../../../../core/dto/pagination-query.dto';

export class NotificationListQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return undefined;
  })
  @IsBoolean()
  read?: boolean;

  @ApiPropertyOptional({ enum: NotificationCategory })
  @IsOptional()
  @IsEnum(NotificationCategory)
  category?: NotificationCategory;
}

export class CreateNotificationRequestDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  body!: string;

  @ApiPropertyOptional({ enum: NotificationSeverity })
  @IsOptional()
  @IsEnum(NotificationSeverity)
  severity?: NotificationSeverity;

  @ApiProperty({ enum: NotificationCategory })
  @IsEnum(NotificationCategory)
  category!: NotificationCategory;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  user_id?: string;
}

export class NotificationResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  body!: string;

  @ApiProperty({ enum: NotificationSeverity })
  type!: NotificationSeverity;

  @ApiProperty()
  read!: boolean;

  @ApiProperty()
  createdAt!: string;

  @ApiPropertyOptional({ enum: NotificationCategory })
  category?: NotificationCategory;
}

export class UnreadCountResponseDto {
  @ApiProperty()
  count!: number;
}

export class MarkAllReadResponseDto {
  @ApiProperty()
  updated!: number;
}
