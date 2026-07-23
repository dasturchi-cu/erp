export interface JwtPayload {
  sub: string;
  email: string;
  companyId?: string;
  branchId?: string;
  sessionId: string;
  deviceId: string;
  permissions: string[];
  modules: string[];
  type: 'access' | 'refresh';
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}
