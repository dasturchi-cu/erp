import { useAuthStore } from '@/stores/authStore';
import { getPermissionsForRole } from '@/config/permissions';

export function useEffectivePermissions(): string[] {
  const permissions = useAuthStore((s) => s.permissions);
  const activeCompany = useAuthStore((s) => s.activeCompany);
  const userRole = useAuthStore((s) => s.user?.role);

  if (permissions.length > 0) return permissions;

  const role = activeCompany?.role ?? userRole;
  return role ? getPermissionsForRole(role) : [];
}
