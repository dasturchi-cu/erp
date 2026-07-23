import { useEffect } from 'react';
import { Grid } from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import SecurityIcon from '@mui/icons-material/Security';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import DevicesIcon from '@mui/icons-material/Devices';
import LoginIcon from '@mui/icons-material/Login';
import ArticleIcon from '@mui/icons-material/Article';
import BackupIcon from '@mui/icons-material/Backup';
import MonitorHeartIcon from '@mui/icons-material/MonitorHeart';
import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined';
import { PageHeader } from '@/components/common/PageHeader';
import { AdminNavCard } from '@/components/admin/AdminNavCard';
import { useAdminStore } from '@/stores/adminStore';

export function AdminHomePage() {
  const users = useAdminStore((s) => s.users);
  const devices = useAdminStore((s) => s.devices);
  const sessions = useAdminStore((s) => s.sessions);
  const backups = useAdminStore((s) => s.backups);
  const auditLogs = useAdminStore((s) => s.auditLogs);
  const overview = useAdminStore((s) => s.overview);
  const fetchAll = useAdminStore((s) => s.fetchAll);

  useEffect(() => {
    void fetchAll();
  }, [fetchAll]);

  const activeDevices = devices.filter((d) => d.status === 'active').length;
  const completedBackups = backups.filter((b) => b.status === 'completed').length;
  const userCount = overview?.activeUsers ?? users.length;
  const sessionCount = overview?.activeSessions ?? sessions.length;
  const auditCount = auditLogs.length;

  const sections = [
    {
      title: 'Foydalanuvchilar',
      description: `${userCount} ta foydalanuvchi — yaratish, bloklash`,
      path: '/admin/users',
      icon: PeopleIcon,
      color: '#3B82F6',
    },
    {
      title: 'Rollar',
      description: 'Rol va ruxsatlar boshqaruvi',
      path: '/admin/roles',
      icon: SecurityIcon,
      color: '#8B5CF6',
    },
    {
      title: 'Ruxsatlar',
      description: 'Modul bo\'yicha ruxsatlar',
      path: '/admin/permissions',
      icon: VpnKeyIcon,
      color: '#06B6D4',
    },
    {
      title: 'Qurilmalar',
      description: `${activeDevices} ta faol qurilma`,
      path: '/admin/devices',
      icon: DevicesIcon,
      color: '#22C55E',
    },
    {
      title: 'Sessiyalar',
      description: `${sessionCount} ta faol sessiya`,
      path: '/admin/sessions',
      icon: LoginIcon,
      color: '#F59E0B',
    },
    {
      title: 'Audit jurnali',
      description: `${auditCount} ta yozuv`,
      path: '/admin/audit-logs',
      icon: ArticleIcon,
      color: '#64748B',
    },
    {
      title: 'Zaxira nusxa',
      description: `${completedBackups} ta muvaffaqiyatli`,
      path: '/admin/backup',
      icon: BackupIcon,
      color: '#2563EB',
    },
    {
      title: 'Monitoring',
      description: 'Tizim holati va metrikalar',
      path: '/admin/monitoring',
      icon: MonitorHeartIcon,
      color: '#EF4444',
    },
    {
      title: 'Log ko\'ruvchi',
      description: 'Tizim va audit loglari',
      path: '/admin/logs',
      icon: ArticleOutlinedIcon,
      color: '#0EA5E9',
    },
  ];

  return (
    <>
      <PageHeader
        title="Boshqaruv markazi"
        subtitle="Foydalanuvchilar, xavfsizlik va tizim monitoringi"
      />

      <Grid container spacing={2.5}>
        {sections.map((section) => (
          <Grid key={section.path} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
            <AdminNavCard {...section} />
          </Grid>
        ))}
      </Grid>
    </>
  );
}
