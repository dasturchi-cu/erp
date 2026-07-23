import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum DevicePlatform {
  WINDOWS = 'windows',
  MACOS = 'macos',
  LINUX = 'linux',
  IOS = 'ios',
  ANDROID = 'android',
  WEB = 'web',
}

export class DeviceInfoDto {
  @IsUUID()
  deviceId!: string;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsEnum(DevicePlatform)
  platform!: DevicePlatform;

  @IsOptional()
  @IsString()
  osVersion?: string;
}

export class LoginRequestDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @ValidateNested()
  @Type(() => DeviceInfoDto)
  deviceInfo!: DeviceInfoDto;
}

export class RefreshRequestDto {
  @IsString()
  @IsNotEmpty()
  refreshToken!: string;
}

export class SwitchCompanyRequestDto {
  @IsUUID()
  companyId!: string;
}
