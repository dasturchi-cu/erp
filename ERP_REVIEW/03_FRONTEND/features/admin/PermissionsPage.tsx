import { useCallback, useEffect, useMemo, useState } from 'react';
import { FormControl, InputLabel, MenuItem, Select } from '@mui/material';
import { PageHeader } from '@/components/common/PageHeader';
import { FilterBar } from '@/components/common/FilterBar';
import { DataTable, type Column } from '@/components/common/DataTable';
import { useListState } from '@/hooks/useListState';
import { useAdminStore } from '@/stores/adminStore';
import type { Permission } from '@/types/entities';

export function PermissionsPage() {
  const permissions = useAdminStore((s) => s.permissions);
  const fetchPermissions = useAdminStore((s) => s.fetchPermissions);
  const [moduleFilter, setModuleFilter] = useState('all');

  useEffect(() => {
    void fetchPermissions();
  }, [fetchPermissions]);

  const modules = useMemo(
    () => [...new Set(permissions.map((p) => p.module))],
    [permissions],
  );

  const filtered = useMemo(
    () =>
      moduleFilter === 'all'
        ? permissions
        : permissions.filter((p) => p.module === moduleFilter),
    [permissions, moduleFilter],
  );

  const searchFields = useCallback(
    (p: Permission) => [p.code, p.module, p.description],
    [],
  );

  const { search, setSearch, page, setPage, pageSize, setPageSize, sortBy, sortOrder, handleSort, paginated, total } =
    useListState(filtered, searchFields);

  const columns: Column<Permission>[] = useMemo(
    () => [
      { id: 'code', label: 'Kod', sortable: true, width: 180, render: (r) => r.code },
      { id: 'module', label: 'Modul', sortable: true, render: (r) => r.module },
      { id: 'description', label: 'Tavsif', render: (r) => r.description },
    ],
    [],
  );

  return (
    <>
      <PageHeader
        title="Ruxsatlar"
        subtitle="Modul bo'yicha tizim ruxsatlari"
      />

      <FilterBar
        search={{ value: search, onChange: setSearch, placeholder: 'Kod yoki tavsif…' }}
        filters={
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Modul</InputLabel>
            <Select value={moduleFilter} label="Modul" onChange={(e) => setModuleFilter(e.target.value)}>
              <MenuItem value="all">Barchasi</MenuItem>
              {modules.map((mod) => (
                <MenuItem key={mod} value={mod}>
                  {mod}
                </MenuItem>
              ))}
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
        dense
      />
    </>
  );
}
