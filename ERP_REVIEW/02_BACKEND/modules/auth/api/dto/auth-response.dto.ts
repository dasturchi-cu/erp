export class UserSummaryDto {
  id!: string;
  email!: string;
  firstName!: string;
  lastName!: string;
  role!: string;
  status!: string;
}

export class CompanySummaryDto {
  id!: string;
  name!: string;
  code!: string;
  role!: string;
  branchCount!: number;
}

export class LoginResponseDto {
  accessToken!: string;
  refreshToken!: string;
  expiresIn!: number;
  user!: UserSummaryDto;
  companies!: CompanySummaryDto[];
  permissions!: string[];
  modules!: string[];
}

export class SwitchCompanyResponseDto {
  accessToken!: string;
  refreshToken!: string;
  expiresIn!: number;
  activeCompany!: CompanySummaryDto;
  permissions!: string[];
  modules!: string[];
}

export class MeResponseDto {
  user!: UserSummaryDto;
  activeCompany!: CompanySummaryDto | null;
  permissions!: string[];
  modules!: string[];
}
