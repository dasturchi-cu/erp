import { IsString, IsEmail, IsOptional, IsBoolean, IsEnum, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export enum SaaSCompanyStatusDto {
  ACTIVE = 'ACTIVE',
  BLOCKED = 'BLOCKED',
  INACTIVE = 'INACTIVE'
}

export enum SaasSubscriptionStatusDto {
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  SUSPENDED = 'SUSPENDED',
  TRIAL = 'TRIAL'
}

export class SaaSLoginDto {
  @IsEmail({}, { message: 'Yaroqli email kiriting' })
  email!: string;

  @IsString({ message: 'Parol string bo\'lishi kerak' })
  password!: string;

  @IsOptional()
  @IsBoolean()
  rememberMe?: boolean;
}

export class CreateCompanyDto {
  @IsString()
  name!: string;

  @IsString()
  code!: string;

  @IsOptional()
  @IsEnum(SaaSCompanyStatusDto)
  status?: SaaSCompanyStatusDto;

  @IsOptional()
  @IsString()
  ownerName?: string;

  @IsOptional()
  @IsString()
  ownerPhone?: string;

  @IsOptional()
  @IsString()
  ownerAddress?: string;
}

export class UpdateCompanyDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsEnum(SaaSCompanyStatusDto)
  status?: SaaSCompanyStatusDto;

  @IsOptional()
  @IsString()
  ownerName?: string;

  @IsOptional()
  @IsString()
  ownerPhone?: string;

  @IsOptional()
  @IsString()
  ownerAddress?: string;
}

export class CreateSaaSAdminDto {
  @IsEmail()
  email!: string;

  @IsString()
  password!: string;
}

export class UpdateSaaSAdminDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  password?: string;
}

export class SaasLicenseDto {
  @IsEnum(SaasSubscriptionStatusDto)
  status!: SaasSubscriptionStatusDto;

  @IsString()
  endDate!: string;
}

export class SaaSListQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 20;

  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsString()
  status?: string;

  resolvedPage(): number {
    return this.page;
  }

  resolvedLimit(): number {
    return this.limit;
  }
}
