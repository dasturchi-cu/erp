import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Button,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Box,
} from '@mui/material';
import { PageHeader } from '@/components/common/PageHeader';
import { FilterBar } from '@/components/common/FilterBar';
import { DataTable, StatusChip, type Column } from '@/components/common/DataTable';
import { FormDialog } from '@/components/forms/FormDialog';
import { useListState, useDisclosure } from '@/hooks/useListState';
import { useAdminStore } from '@/stores/adminStore';
import { useNotification } from '@/components/feedback/NotificationProvider';
import type { User } from '@/types/entities';

const roleLabels: Record<User['role'], string> = {
  admin: 'Administrator',
  manager: 'Menejer',
  cashier: 'Kassir',
  warehouse: 'Omborchi',
};

const statusLabels: Record<User['status'], string> = {
  active: 'Faol',
  blocked: 'Bloklangan',
  inactive: 'Nofaol',
};

const statusColors: Record<User['status'], 'success' | 'error' | 'default'> = {
  active: 'success',
  blocked: 'error',
  inactive: 'default',
};

function formatDateTime(iso?: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('uz-UZ', { dateStyle: 'short', timeStyle: 'short' });
}

export function UsersPage() {
  const users = useAdminStore((s) => s.users);
  const roles = useAdminStore((s) => s.roles);
  const isLoading = useAdminStore((s) => s.isLoading);
  const fetchUsers = useAdminStore((s) => s.fetchUsers);
  const fetchRoles = useAdminStore((s) => s.fetchRoles);
  const addUser = useAdminStore((s) => s.addUser);
  const toggleUserStatus = useAdminStore((s) => s.toggleUserStatus);
  const { success, error: notifyError } = useNotification();
  const dialog = useDisclosure();
  const [roleFilter, setRoleFilter] = useState('all');
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    roleId: '',
  });

  useEffect(() => {
    void fetchUsers();
    void fetchRoles();
  }, [fetchUsers, fetchRoles]);

  useEffect(() => {
    if (!form.roleId && roles.length > 0) {
      const cashier = roles.find((r) => r.name.toLowerCase() === 'cashier');
      setForm((f) => ({ ...f, roleId: cashier?.id ?? roles[0]!.id }));
    }
  }, [roles, form.roleId]);

  const filtered = useMemo(
    () => (roleFilter === 'all' ? users : users.filter((u) => u.role === roleFilter)),
    [users, roleFilter],
  );

  const searchFields = useCallback(
    (u: User) => [u.email, u.firstName, u.lastName, u.role],
    [],
  );

  const { search, setSearch, page, setPage, pageSize, setPageSize, sortBy, sortOrder, handleSort, paginated, total } =
    useListState(filtered, searchFields);

  const handleCreate = async () => {
    if (!form.email || !form.firstName || !form.password || !form.roleId) return;
    setSubmitting(true);
    try {
      await addUser({
        email: form.email,
        password: form.password,
        firstName: form.firstName,
        lastName: form.lastName,
        roleId: form.roleId,
      });
      success('Foydalanuvchi yaratildi');
      dialog.onClose();
      setForm({ firstName: '', lastName: '', email: '', password: '', roleId: roles[0]?.id ?? '' });
    } catch {
      notifyError('Foydalanuvchi yaratilmadi');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (user: User) => {
    try {
      await toggleUserStatus(user.id);
      success(user.status === 'blocked' ? 'Faollashtirildi' : 'Bloklandi');
    } catch {
      notifyError('Holat o\'zgartirilmadi');
    }
  };

  const columns: Column<User>[] = useMemo(
    () => [
      {
        id: 'name',
        label: 'Ism',
        sortable: true,
        render: (r) => `${r.firstName} ${r.lastName}`,
      },
      { id: 'email', label: 'Email', sortable: true, render: (r) => r.email },
      { id: 'role', label: 'Rol', render: (r) => roleLabels[r.role] },
      {
        id: 'status',
        label: 'Holat',
        render: (r) => <StatusChip label={statusLabels[r.status]} color={statusColors[r.status]} />,
      },
      {
        id: 'lastLoginAt',
        label: 'Oxirgi kirish',
        sortable: true,
        render: (r) => formatDateTime(r.lastLoginAt),
      },
      {
        id: 'actions',
        label: 'Amallar',
        align: 'right',
        render: (r) => (
          <Button
            size="small"
            color={r.status === 'blocked' ? 'success' : 'error'}
            variant="outlined"
            onClick={(e) => {
              e.stopPropagation();
              void handleToggleStatus(r);
            }}
          >
            {r.status === 'blocked' ? 'Faollashtirish' : 'Bloklash'}
          </Button>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  if (isLoading && users.length === 0) {
    return (
      <Box sx={{ display: 'grid', placeItems: 'center', minHeight: 240 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <PageHeader
        title="Foydalanuvchilar"
        subtitle="Tizim foydalanuvchilari va rollari"
        primaryAction={{ label: 'Yangi foydalanuvchi', onClick: dialog.onOpen }}
      />

      <FilterBar
        search={{ value: search, onChange: setSearch, placeholder: 'Ism yoki email…' }}
        filters={
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Rol</InputLabel>
            <Select value={roleFilter} label="Rol" onChange={(e) => setRoleFilter(e.target.value)}>
              <MenuItem value="all">Barchasi</MenuItem>
              <MenuItem value="admin">Administrator</MenuItem>
              <MenuItem value="manager">Menejer</MenuItem>
              <MenuItem value="cashier">Kassir</MenuItem>
              <MenuItem value="warehouse">Omborchi</MenuItem>
            </Select>
          </FormControl>
        }
      />

      <DataTable
        columns={columns}
        rows={paginated}
        rowKey={(r) => r.id}
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={handleSort}
      />

      <FormDialog
        open={dialog.open}
        title="Yangi foydalanuvchi"
        onClose={dialog.onClose}
        onSubmit={() => void handleCreate()}
        submitLabel={submitting ? 'Yaratilmoqda…' : 'Yaratish'}
        loading={submitting}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <TextField
            label="Ism"
            value={form.firstName}
            onChange={(e) => setForm({ ...form, firstName: e.target.value })}
            fullWidth
          />
          <TextField
            label="Familiya"
            value={form.lastName}
            onChange={(e) => setForm({ ...form, lastName: e.target.value })}
            fullWidth
          />
          <TextField
            label="Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            fullWidth
          />
          <TextField
            label="Parol"
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            fullWidth
          />
          <FormControl fullWidth>
            <InputLabel>Rol</InputLabel>
            <Select
              value={form.roleId}
              label="Rol"
              onChange={(e) => setForm({ ...form, roleId: e.target.value })}
            >
              {roles.map((role) => (
                <MenuItem key={role.id} value={role.id}>
                  {role.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </FormDialog>
    </>
  );
}
