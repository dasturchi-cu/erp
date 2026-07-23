import { Injectable, Scope } from '@nestjs/common';

export interface CompanyContext {
  companyId: string;
  branchId?: string;
  userId: string;
  sessionId: string;
  deviceId: string;
  permissions: string[];
  modules: string[];
}

@Injectable({ scope: Scope.REQUEST })
export class CompanyContextService {
  private context: CompanyContext | null = null;

  set(context: CompanyContext): void {
    this.context = context;
  }

  get(): CompanyContext {
    if (!this.context) {
      throw new Error('Company context not initialized');
    }
    return this.context;
  }

  tryGet(): CompanyContext | null {
    return this.context;
  }

  getCompanyId(): string {
    return this.get().companyId;
  }
}
