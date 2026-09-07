import { useMemo } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { hasPermission, type ModuleCode } from '@/config/permissions';
import { useEffectivePermissions } from './useEffectivePermissions';

export function usePermissions() {
  const permissions = useEffectivePermissions();
  const enabledModules = useAuthStore((s) => s.enabledModules);
  const role = useAuthStore((s) => s.activeCompany?.role);

  return useMemo(
    () => ({
      permissions,
      role,
      can: (perm: string) => hasPermission(permissions, perm),
      isModuleEnabled: (module: ModuleCode) => enabledModules.includes(module),
    }),
    [permissions, enabledModules, role],
  );
}
