import { IsEnum, IsOptional, IsString, IsBoolean, IsInt, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../../../core/dto/pagination-query.dto';
import { UserStatus, DeviceStatus, BackupType } from '@prisma/client';

export class AdminListQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  q?: string;
}

export class AdminAuditListQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  action?: string;

  @IsOptional()
  @IsString()
  entityType?: string;
}

export class UpdateUserStatusDto {
  @IsEnum(UserStatus)
  status!: UserStatus;
}

export class UpdateDeviceStatusDto {
  @IsEnum(DeviceStatus)
  status!: DeviceStatus;
}

export class CreateAdminUserDto {
  @IsString()
  email!: string;

  @IsString()
  password!: string;

  @IsString()
  firstName!: string;

  @IsString()
  lastName!: string;

  @IsString()
  roleId!: string;
}

export class AdminUserResponseDto {
  id!: string;
  email!: string;
  firstName!: string;
  lastName!: string;
  role!: string;
  roleId!: string;
  status!: string;
  lastLoginAt?: string | null;
  createdAt!: string;
}

export class AdminSessionResponseDto {
  id!: string;
  user!: string;
  userId!: string;
  device!: string;
  ip!: string;
  startedAt!: string;
  lastActivityAt!: string;
}

export class AdminDeviceResponseDto {
  id!: string;
  name!: string;
  platform!: string;
  user!: string;
  userId!: string;
  status!: string;
  lastSeenAt!: string;
}

export class AdminAuditLogResponseDto {
  id!: string;
  action!: string;
  entity!: string;
  user!: string;
  ip!: string;
  createdAt!: string;
  details?: string;
}

export class AdminRoleResponseDto {
  id!: string;
  name!: string;
  description!: string;
  userCount!: number;
  permissionCount!: number;
}

export class AdminPermissionResponseDto {
  id!: string;
  code!: string;
  module!: string;
  description!: string;
}

export class AdminOverviewResponseDto {
  activeUsers!: number;
  activeSessions!: number;
  totalProducts!: number;
  todaySales!: number;
  apiStatus!: string;
  version!: string;
}

export class CreateBackupRequestDto {
  @ApiPropertyOptional({ enum: BackupType, default: BackupType.FULL })
  @IsOptional()
  @IsEnum(BackupType)
  type?: BackupType;
}

export class UpdateBackupScheduleDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @ApiPropertyOptional({ minimum: 0, maximum: 23 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(23)
  hourUtc?: number;

  @ApiPropertyOptional({ enum: ['full', 'incremental'] })
  @IsOptional()
  @IsString()
  type?: 'full' | 'incremental';

  @ApiPropertyOptional({ minimum: 1, maximum: 365 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(365)
  retentionDays?: number;
}

export class BackupJobResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  type!: string;

  @ApiProperty()
  status!: string;

  @ApiProperty()
  trigger!: string;

  @ApiProperty()
  size!: string;

  @ApiProperty()
  createdAt!: string;
}

export class SystemMetricDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  label!: string;

  @ApiProperty()
  value!: string;

  @ApiProperty()
  status!: string;
}

export class LogEntryDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  level!: string;

  @ApiProperty()
  message!: string;

  @ApiProperty()
  source!: string;

  @ApiProperty()
  user!: string;

  @ApiProperty()
  ip!: string;

  @ApiProperty()
  createdAt!: string;
}
