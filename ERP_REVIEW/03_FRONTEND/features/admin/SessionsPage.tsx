import { useCallback, useEffect, useMemo } from 'react';
import { Button } from '@mui/material';
import { PageHeader } from '@/components/common/PageHeader';
import { FilterBar } from '@/components/common/FilterBar';
import { DataTable, type Column } from '@/components/common/DataTable';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { useListState, useDisclosure } from '@/hooks/useListState';
import { useAdminStore } from '@/stores/adminStore';
import { useNotification } from '@/components/feedback/NotificationProvider';
import type { AdminSession } from '@/types/entities';

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('uz-UZ', { dateStyle: 'short', timeStyle: 'short' });
}

export function SessionsPage() {
  const sessions = useAdminStore((s) => s.sessions);
  const fetchSessions = useAdminStore((s) => s.fetchSessions);
  const revokeSession = useAdminStore((s) => s.revokeSession);
  const revokeAllSessions = useAdminStore((s) => s.revokeAllSessions);
  const { success, error: notifyError } = useNotification();
  const confirmAll = useDisclosure();

  useEffect(() => {
    void fetchSessions();
  }, [fetchSessions]);

  const searchFields = useCallback(
    (s: AdminSession) => [s.user, s.device, s.ip],
    [],
  );

  const { search, setSearch, page, setPage, pageSize, setPageSize, sortBy, sortOrder, handleSort, paginated, total } =
    useListState(sessions, searchFields);

  const columns: Column<AdminSession>[] = useMemo(
    () => [
      { id: 'user', label: 'Foydalanuvchi', sortable: true, render: (r) => r.user },
      { id: 'device', label: 'Qurilma', render: (r) => r.device },
      { id: 'ip', label: 'IP manzil', render: (r) => r.ip },
      {
        id: 'startedAt',
        label: 'Boshlangan',
        sortable: true,
        render: (r) => formatDateTime(r.startedAt),
      },
      {
        id: 'lastActivityAt',
        label: 'Oxirgi faollik',
        sortable: true,
        render: (r) => formatDateTime(r.lastActivityAt),
      },
      {
        id: 'actions',
        label: 'Amallar',
        align: 'right',
        render: (r) => (
          <Button
            size="small"
            color="error"
            variant="outlined"
            onClick={(e) => {
              e.stopPropagation();
              void revokeSession(r.id)
                .then(() => success('Sessiya tugatildi'))
                .catch(() => notifyError('Sessiya tugatilmadi'));
            }}
          >
            Tugatish
          </Button>
        ),
      },
    ],
    [revokeSession, success, notifyError],
  );

  return (
    <>
      <PageHeader
        title="Sessiyalar"
        subtitle="Faol foydalanuvchi sessiyalari"
        primaryAction={{
          label: 'Barcha sessiyalarni tugatish',
          onClick: confirmAll.onOpen,
        }}
      />

      <FilterBar
        search={{ value: search, onChange: setSearch, placeholder: 'Foydalanuvchi yoki IP…' }}
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
        emptyMessage="Faol sessiya yo'q"
      />

      <ConfirmDialog
        open={confirmAll.open}
        title="Barcha sessiyalarni tugatish"
        message="Barcha foydalanuvchilar tizimdan chiqariladi. Davom etasizmi?"
        destructive
        confirmLabel="Tugatish"
        onConfirm={() => {
          void revokeAllSessions()
            .then(() => {
              success('Barcha sessiyalar tugatildi');
              confirmAll.onClose();
            })
            .catch(() => notifyError('Sessiyalar tugatilmadi'));
        }}
        onCancel={confirmAll.onClose}
      />
    </>
  );
}
