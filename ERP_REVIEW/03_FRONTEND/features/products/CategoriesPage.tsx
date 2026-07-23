import { useCallback, useEffect, useMemo, useState } from 'react';
import { TextField } from '@mui/material';
import { PageHeader } from '@/components/common/PageHeader';
import { FilterBar } from '@/components/common/FilterBar';
import { DataTable, type Column } from '@/components/common/DataTable';
import { FormDialog } from '@/components/forms/FormDialog';
import { useListState, useDisclosure } from '@/hooks/useListState';
import { useNotification } from '@/components/feedback/NotificationProvider';
import { categoriesApi } from '@/api/services';
import type { Category } from '@/types/entities';

export function CategoriesPage() {
  const { success, error: notifyError } = useNotification();
  const [categories, setCategories] = useState<Category[]>([]);
  const [newName, setNewName] = useState('');
  const dialog = useDisclosure();

  const load = useCallback(async () => {
    try {
      setCategories(await categoriesApi.list());
    } catch (err: unknown) {
      notifyError((err as { message?: string }).message ?? 'Kategoriyalar yuklanmadi');
    }
  }, [notifyError]);

  useEffect(() => {
    void load();
  }, [load]);

  const searchFields = useCallback(
    (c: Category) => [c.name, c.parentId ?? ''],
    [],
  );

  const { search, setSearch, page, setPage, pageSize, setPageSize, sortBy, sortOrder, handleSort, paginated, total } =
    useListState(categories, searchFields);

  const parentMap = useMemo(() => {
    const map = new Map<string, string>();
    categories.forEach((c) => map.set(c.id, c.name));
    return map;
  }, [categories]);

  const columns: Column<Category>[] = useMemo(
    () => [
      { id: 'name', label: 'Kategoriya nomi', sortable: true, render: (r) => r.name },
      {
        id: 'parentId',
        label: 'Ota kategoriya',
        render: (r) => (r.parentId ? parentMap.get(r.parentId) ?? '—' : '—'),
      },
      {
        id: 'productCount',
        label: 'Mahsulotlar soni',
        sortable: true,
        align: 'right',
        render: (r) => r.productCount,
      },
    ],
    [parentMap],
  );

  const handleCreate = async () => {
    const name = newName.trim();
    if (!name) return;
    try {
      await categoriesApi.create({ name });
      setNewName('');
      dialog.onClose();
      success('Kategoriya qo\'shildi');
      await load();
    } catch (err: unknown) {
      notifyError((err as { message?: string }).message ?? 'Saqlashda xatolik');
    }
  };

  return (
    <>
      <PageHeader
        title="Kategoriyalar"
        subtitle="Mahsulot kategoriyalarini ko'rish va tashkil etish"
        primaryAction={{ label: 'Yangi kategoriya', onClick: dialog.onOpen }}
      />

      <FilterBar
        search={{ value: search, onChange: setSearch, placeholder: 'Kategoriya nomi…' }}
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
        onClose={dialog.onClose}
        title="Yangi kategoriya"
        onSubmit={handleCreate}
        submitLabel="Qo'shish"
      >
        <TextField
          autoFocus
          fullWidth
          label="Kategoriya nomi"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
        />
      </FormDialog>
    </>
  );
}
