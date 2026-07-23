import type { UserRole } from '@/types/entities';

export function getHomePathForRole(role?: UserRole | null): string {
  switch (role) {
    case 'cashier':
      return '/sales/new';
    case 'warehouse':
      return '/inventory';
    default:
      return '/dashboard';
  }
}
