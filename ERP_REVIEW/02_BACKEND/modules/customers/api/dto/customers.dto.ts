import { CustomerStatus } from '@prisma/client';
import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { PaginationQueryDto } from '../../../../core/dto/pagination-query.dto';
import { DebtHistoryType } from '@prisma/client';

export class CustomerListQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(CustomerStatus)
  status?: CustomerStatus;

  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsString()
  sort?: string;
}

export class CustomerSearchQueryDto {
  @IsString()
  @MinLength(2)
  q!: string;
}

export class CreateCustomerRequestDto {
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  name!: string;

  @IsString()
  @Matches(/^\+[1-9]\d{1,14}$/, { message: 'phone must be E.164 format' })
  phone!: string;

  @IsOptional()
  @IsString()
  @Matches(/^\+[1-9]\d{1,14}$/)
  phoneSecondary?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  address?: string;

  @IsOptional()
  @IsDateString()
  partnershipStartDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  @IsOptional()
  @IsEnum(CustomerStatus)
  status?: CustomerStatus;
}

export class UpdateCustomerRequestDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\+[1-9]\d{1,14}$/)
  phone?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\+[1-9]\d{1,14}$/)
  phoneSecondary?: string | null;

  @IsOptional()
  @IsEmail()
  email?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  address?: string | null;

  @IsOptional()
  @IsDateString()
  partnershipStartDate?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string | null;

  @IsOptional()
  @IsEnum(CustomerStatus)
  status?: CustomerStatus;
}

export class DebtHistoryQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(DebtHistoryType)
  type?: DebtHistoryType;

  @IsOptional()
  @IsString()
  from?: string;

  @IsOptional()
  @IsString()
  to?: string;

  @IsOptional()
  @IsString()
  sort?: string;
}

export class CustomerResponseDto {
  id!: string;
  name!: string;
  phone!: string;
  phoneSecondary!: string | null;
  email!: string | null;
  address!: string | null;
  partnershipStartDate!: string | null;
  notes!: string | null;
  status!: string;
  debtUzs!: string;
  debtUsd!: string;
  totalPurchasesUzs!: string;
  lastPurchaseAt!: string | null;
  createdAt!: string;
  updatedAt!: string;
}

export class CustomerDebtsResponseDto {
  customerId!: string;
  debtUzs!: string;
  debtUsd!: string;
  lastPaymentAt!: string | null;
}

export class DebtHistoryEntryDto {
  id!: string;
  customerId!: string;
  type!: string;
  amountUzs!: string;
  amountUsd!: string;
  balanceAfterUzs!: string;
  balanceAfterUsd!: string;
  reference!: string | null;
  createdAt!: string;
  recordedBy!: string;
}
