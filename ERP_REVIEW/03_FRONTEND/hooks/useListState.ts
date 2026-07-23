import { useState, useMemo, useCallback } from 'react';

export function useListState<T>(items: T[], searchFields: (item: T) => string[]) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [sortBy, setSortBy] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const filtered = useMemo(() => {
    let result = items;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((item) =>
        searchFields(item).some((f) => f.toLowerCase().includes(q)),
      );
    }
    if (sortBy) {
      result = [...result].sort((a, b) => {
        const av = String((a as Record<string, unknown>)[sortBy] ?? '');
        const bv = String((b as Record<string, unknown>)[sortBy] ?? '');
        const cmp = av.localeCompare(bv, undefined, { numeric: true });
        return sortOrder === 'asc' ? cmp : -cmp;
      });
    }
    return result;
  }, [items, search, sortBy, sortOrder, searchFields]);

  const paginated = useMemo(() => {
    const start = page * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  const handleSort = useCallback(
    (columnId: string) => {
      if (sortBy === columnId) {
        setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
      } else {
        setSortBy(columnId);
        setSortOrder('asc');
      }
    },
    [sortBy],
  );

  return {
    search,
    setSearch,
    page,
    setPage,
    pageSize,
    setPageSize,
    sortBy,
    sortOrder,
    handleSort,
    filtered,
    paginated,
    total: filtered.length,
  };
}

export function useDisclosure(initial = false) {
  const [open, setOpen] = useState(initial);
  const onOpen = useCallback(() => setOpen(true), []);
  const onClose = useCallback(() => setOpen(false), []);
  const toggle = useCallback(() => setOpen((v) => !v), []);

  return { open, onOpen, onClose, toggle };
}