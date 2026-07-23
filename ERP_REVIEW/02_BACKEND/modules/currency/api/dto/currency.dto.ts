import { Type } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  ValidateIf,
} from 'class-validator';
import { PaginationQueryDto } from '../../../../core/dto/pagination-query.dto';

const MONEY_PATTERN = /^-?\d+(\.\d{1,4})?$/;

export class RateHistoryQueryDto extends PaginationQueryDto {
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

export class SetExchangeRateRequestDto {
  @IsString()
  @IsNotEmpty()
  @Matches(MONEY_PATTERN, { message: 'rate must be a decimal string with up to 4 fractional digits' })
  rate!: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export enum CurrencyCodeDto {
  UZS = 'UZS',
  USD = 'USD',
}

export class ConvertCurrencyRequestDto {
  @IsString()
  @IsNotEmpty()
  @Matches(MONEY_PATTERN)
  amount!: string;

  @IsEnum(CurrencyCodeDto)
  fromCurrency!: CurrencyCodeDto;

  @IsEnum(CurrencyCodeDto)
  toCurrency!: CurrencyCodeDto;
}

export class CurrentRateResponseDto {
  id!: string;
  rate!: string;
  effectiveFrom!: string;
  setBy!: string;
  status!: string;
}

export class ExchangeRateResponseDto {
  id!: string;
  rate!: string;
  effectiveFrom!: string;
  setBy!: string;
  status!: string;
  notes!: string | null;
  createdAt!: string;
}

export class ConvertCurrencyResponseDto {
  amount!: string;
  fromCurrency!: string;
  convertedAmount!: string;
  toCurrency!: string;
  rateUsed!: string;
}
