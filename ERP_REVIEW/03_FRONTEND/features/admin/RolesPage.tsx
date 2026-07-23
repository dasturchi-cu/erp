import { useCallback, useEffect, useMemo } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { FilterBar } from '@/components/common/FilterBar';
import { DataTable, type Column } from '@/components/common/DataTable';
import { useListState } from '@/hooks/useListState';
import { useAdminStore } from '@/stores/adminStore';
import type { Role } from '@/types/entities';

export function RolesPage() {
  const roles = useAdminStore((s) => s.roles);
  const fetchRoles = useAdminStore((s) => s.fetchRoles);

  useEffect(() => {
    void fetchRoles();
  }, [fetchRoles]);

  const searchFields = useCallback(
    (r: Role) => [r.name, r.description],
    [],
  );

  const { search, setSearch, page, setPage, pageSize, setPageSize, sortBy, sortOrder, handleSort, paginated, total } =
    useListState(roles, searchFields);

  const columns: Column<Role>[] = useMemo(
    () => [
      { id: 'name', label: 'Rol nomi', sortable: true, render: (r) => r.name },
      { id: 'description', label: 'Tavsif', render: (r) => r.description },
      {
        id: 'userCount',
        label: 'Foydalanuvchilar',
        sortable: true,
        align: 'right',
        render: (r) => r.userCount,
      },
      {
        id: 'permissionCount',
        label: 'Ruxsatlar',
        sortable: true,
        align: 'right',
        render: (r) => r.permissionCount,
      },
    ],
    [],
  );

  return (
    <>
      <PageHeader
        title="Rollar"
        subtitle="Kompaniya rollari va ruxsatlar to'plami (faqat ko'rish)"
      />

      <FilterBar search={{ value: search, onChange: setSearch, placeholder: 'Rol nomi…' }} />

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
    </>
  );
}
