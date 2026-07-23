import type { Company } from '@/types';
import type { User } from '@/types/entities';

export const mockUser: User = {
  id: 'user-1',
  email: 'dilshod@market.uz',
  firstName: 'Dilshod',
  lastName: 'Karimov',
  role: 'manager',
  status: 'active',
};

export const mockCompanies: Company[] = [
  {
    id: 'co-1',
    name: 'Market — Tashkent',
    role: 'manager',
    branchCount: 3,
    lastAccessedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'co-2',
    name: 'Somafix',
    role: 'admin',
    branchCount: 1,
    lastAccessedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'co-3',
    name: 'Xitoy Tovar',
    role: 'cashier',
    branchCount: 2,
    lastAccessedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

export const DEMO_CREDENTIALS = {
  email: 'dilshod@market.uz',
  password: 'demo1234',
};
