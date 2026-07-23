import { create } from 'zustand';
import { adminApi } from '@/api/services/adminApi';
import type { AdminOverview, BackupSchedule } from '@/types/entities';
import type {
  AdminDevice,
  AdminSession,
  AuditLog,
  BackupJob,
  Permission,
  Role,
  SystemMetric,
  SystemLogEntry,
  User,
} from '@/types/entities';

interface AdminState {
  users: User[];
  devices: AdminDevice[];
  sessions: AdminSession[];
  backups: BackupJob[];
  backupSchedule: BackupSchedule | null;
  auditLogs: AuditLog[];
  systemLogs: SystemLogEntry[];
  roles: Role[];
  permissions: Permission[];
  overview: AdminOverview | null;
  metrics: SystemMetric[];
  systemStatus: 'healthy' | 'degraded' | 'critical' | null;
  isLoading: boolean;
  error: string | null;

  fetchOverview: () => Promise<void>;
  fetchMonitoring: () => Promise<void>;
  fetchUsers: () => Promise<void>;
  fetchSessions: () => Promise<void>;
  fetchDevices: () => Promise<void>;
  fetchAuditLogs: () => Promise<void>;
  fetchBackups: () => Promise<void>;
  fetchBackupSchedule: () => Promise<void>;
  fetchSystemLogs: () => Promise<void>;
  fetchRoles: () => Promise<void>;
  fetchPermissions: () => Promise<void>;
  fetchAll: () => Promise<void>;

  addUser: (input: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    roleId: string;
  }) => Promise<User>;
  toggleUserStatus: (id: string) => Promise<void>;
  toggleDeviceStatus: (id: string) => Promise<void>;
  revokeSession: (id: string) => Promise<void>;
  revokeAllSessions: () => Promise<void>;
  createBackup: (type?: 'full' | 'incremental') => Promise<BackupJob>;
  restoreBackup: (id: string) => Promise<void>;
  updateBackupSchedule: (input: Partial<BackupSchedule>) => Promise<void>;
  refreshMetrics: () => Promise<void>;
}

export const useAdminStore = create<AdminState>((set, get) => ({
  users: [],
  devices: [],
  sessions: [],
  backups: [],
  backupSchedule: null,
  auditLogs: [],
  systemLogs: [],
  roles: [],
  permissions: [],
  overview: null,
  metrics: [],
  systemStatus: null,
  isLoading: false,
  error: null,

  fetchOverview: async () => {
    try {
      const overview = await adminApi.getOverview();
      set({ overview });
    } catch (err: unknown) {
      set({ error: (err as { message?: string }).message ?? 'Overview yuklanmadi' });
    }
  },

  fetchMonitoring: async () => {
    try {
      const data = await adminApi.getMonitoring();
      set({
        metrics: data.metrics,
        systemStatus: data.systemStatus,
      });
    } catch (err: unknown) {
      set({ error: (err as { message?: string }).message ?? 'Monitoring yuklanmadi' });
    }
  },

  fetchUsers: async () => {
    set({ isLoading: true, error: null });
    try {
      const users = await adminApi.listUsers();
      set({ users, isLoading: false });
    } catch (err: unknown) {
      set({
        isLoading: false,
        error: (err as { message?: string }).message ?? 'Foydalanuvchilar yuklanmadi',
      });
    }
  },

  fetchSessions: async () => {
    try {
      const sessions = await adminApi.listSessions();
      set({ sessions });
    } catch (err: unknown) {
      set({ error: (err as { message?: string }).message ?? 'Sessiyalar yuklanmadi' });
    }
  },

  fetchDevices: async () => {
    try {
      const devices = await adminApi.listDevices();
      set({ devices });
    } catch (err: unknown) {
      set({ error: (err as { message?: string }).message ?? 'Qurilmalar yuklanmadi' });
    }
  },

  fetchAuditLogs: async () => {
    try {
      const auditLogs = await adminApi.listAuditLogs();
      set({ auditLogs });
    } catch (err: unknown) {
      set({ error: (err as { message?: string }).message ?? 'Audit jurnali yuklanmadi' });
    }
  },

  fetchBackups: async () => {
    try {
      const backups = await adminApi.listBackups();
      set({ backups });
    } catch (err: unknown) {
      set({ error: (err as { message?: string }).message ?? 'Zaxira nusxalar yuklanmadi' });
    }
  },

  fetchBackupSchedule: async () => {
    try {
      const backupSchedule = await adminApi.getBackupSchedule();
      set({ backupSchedule });
    } catch (err: unknown) {
      set({ error: (err as { message?: string }).message ?? 'Zaxira jadvali yuklanmadi' });
    }
  },

  fetchSystemLogs: async () => {
    try {
      const systemLogs = await adminApi.listLogs();
      set({ systemLogs });
    } catch (err: unknown) {
      set({ error: (err as { message?: string }).message ?? 'Loglar yuklanmadi' });
    }
  },

  fetchRoles: async () => {
    try {
      const roles = await adminApi.listRoles();
      set({ roles });
    } catch (err: unknown) {
      set({ error: (err as { message?: string }).message ?? 'Rollar yuklanmadi' });
    }
  },

  fetchPermissions: async () => {
    try {
      const permissions = await adminApi.listPermissions();
      set({ permissions });
    } catch (err: unknown) {
      set({ error: (err as { message?: string }).message ?? 'Ruxsatlar yuklanmadi' });
    }
  },

  fetchAll: async () => {
    const { fetchOverview, fetchUsers, fetchSessions, fetchDevices, fetchAuditLogs, fetchBackups } =
      get();
    await Promise.all([
      fetchOverview(),
      fetchUsers(),
      fetchSessions(),
      fetchDevices(),
      fetchAuditLogs(),
      fetchBackups(),
    ]);
  },

  addUser: async (input) => {
    const user = await adminApi.createUser(input);
    set((s) => ({ users: [user, ...s.users] }));
    await get().fetchAuditLogs();
    return user;
  },

  toggleUserStatus: async (id) => {
    const prev = get().users.find((u) => u.id === id);
    if (!prev) return;
    const nextStatus = prev.status === 'blocked' ? 'ACTIVE' : 'BLOCKED';
    const updated = await adminApi.updateUserStatus(id, nextStatus);
    set((s) => ({
      users: s.users.map((u) => (u.id === id ? updated : u)),
    }));
    await get().fetchAuditLogs();
  },

  toggleDeviceStatus: async (id) => {
    const prev = get().devices.find((d) => d.id === id);
    if (!prev) return;
    const nextStatus = prev.status === 'blocked' ? 'ACTIVE' : 'BLOCKED';
    await adminApi.updateDeviceStatus(id, nextStatus);
    set((s) => ({
      devices: s.devices.map((d) =>
        d.id === id ? { ...d, status: nextStatus === 'ACTIVE' ? 'active' : 'blocked' } : d,
      ),
    }));
    await get().fetchAuditLogs();
  },

  revokeSession: async (id) => {
    await adminApi.revokeSession(id);
    set((s) => ({ sessions: s.sessions.filter((sess) => sess.id !== id) }));
    await get().fetchOverview();
  },

  revokeAllSessions: async () => {
    const ids = get().sessions.map((s) => s.id);
    await Promise.all(ids.map((id) => adminApi.revokeSession(id)));
    set({ sessions: [] });
    await get().fetchOverview();
  },

  createBackup: async (type = 'full') => {
    const backup = await adminApi.createBackup(type);
    set((s) => ({ backups: [backup, ...s.backups] }));
    return backup;
  },

  restoreBackup: async (id) => {
    await adminApi.restoreBackup(id);
    await get().fetchAuditLogs();
  },

  updateBackupSchedule: async (input) => {
    const backupSchedule = await adminApi.updateBackupSchedule(input);
    set({ backupSchedule });
  },

  refreshMetrics: async () => {
    await get().fetchMonitoring();
  },
}));
