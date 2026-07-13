import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Box,
  Chip,
  Paper,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Button,
  Divider,
} from '@mui/material';
import type { ReactNode } from 'react';

export interface Column<T> {
  id: string;
  label: string;
  width?: number | string;
  align?: 'left' | 'right' | 'center';
  sortable?: boolean;
  render: (row: T) => ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  loading?: boolean;
  emptyMessage?: string;
  page?: number;
  pageSize?: number;
  total?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onSort?: (columnId: string) => void;
  onRowClick?: (row: T) => void;
  selectedIds?: string[];
  dense?: boolean;
  stickyHeader?: boolean;
  maxHeight?: number | string;
  tableName?: string; // Cache key for layout persistence
}

function DataTableRowInner<T>({
  row,
  id,
  columns,
  selected,
  onRowClick,
  cellPadding,
}: {
  row: T;
  id: string;
  columns: Column<T>[];
  selected?: boolean;
  onRowClick?: (row: T) => void;
  cellPadding: any;
}) {
  return (
    <TableRow
      hover
      selected={selected}
      onClick={onRowClick ? () => onRowClick(row) : undefined}
      sx={{ cursor: onRowClick ? 'pointer' : 'default' }}
    >
      {columns.map((col) => (
        <TableCell key={col.id} align={col.align} sx={cellPadding}>
          {col.render(row)}
        </TableCell>
      ))}
    </TableRow>
  );
}

const DataTableRow = memo(DataTableRowInner) as typeof DataTableRowInner;

function DataTableInner<T>({
  columns,
  rows,
  rowKey,
  loading,
  emptyMessage = "Ma'lumot topilmadi",
  page = 0,
  pageSize = 20,
  total,
  onPageChange,
  onPageSizeChange,
  sortBy,
  sortOrder = 'asc',
  onSort,
  onRowClick,
  selectedIds,
  dense,
  stickyHeader = false,
  maxHeight = 640,
  tableName,
}: DataTableProps<T>) {
  const showPagination = onPageChange !== undefined;
  const totalCount = total ?? rows.length;
  const onRowClickRef = useRef(onRowClick);
  onRowClickRef.current = onRowClick;

  const stableOnRowClick = useCallback((row: T) => {
    onRowClickRef.current?.(row);
  }, []);

  const [widths, setWidths] = useState<Record<string, number>>({});
  const [visibleIds, setVisibleIds] = useState<string[]>(columns.map((c) => c.id));
  const [colOrder, setColOrder] = useState<string[]>(columns.map((c) => c.id));
  const [density, setDensity] = useState<'compact' | 'comfortable' | 'large'>('comfortable');

  const [scrollTop, setScrollTop] = useState(0);
  const requestRef = useRef<number | null>(null);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const targetScrollTop = e.currentTarget.scrollTop;
    if (requestRef.current !== null) {
      cancelAnimationFrame(requestRef.current);
    }
    requestRef.current = requestAnimationFrame(() => {
      setScrollTop(targetScrollTop);
    });
  }, []);

  useEffect(() => {
    return () => {
      if (requestRef.current !== null) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, []);

  const rowHeight = useMemo(() => {
    if (dense || density === 'compact') return 34;
    if (density === 'large') return 60;
    return 46;
  }, [density, dense]);

  const storageKey = tableName ? `grid-layout-${tableName}` : null;

  // Hydrate layout
  useEffect(() => {
    if (!storageKey) return;
    try {
      const cached = localStorage.getItem(storageKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.widths) setWidths(parsed.widths);
        if (parsed.visibleIds) setVisibleIds(parsed.visibleIds);
        if (parsed.colOrder) setColOrder(parsed.colOrder);
        if (parsed.density) setDensity(parsed.density);
      }
    } catch {
      // ignore
    }
  }, [storageKey]);

  // Persist layout
  const saveLayout = (updates: {
    widths?: Record<string, number>;
    visibleIds?: string[];
    colOrder?: string[];
    density?: 'compact' | 'comfortable' | 'large';
  }) => {
    if (!storageKey) return;
    try {
      const current = {
        widths: updates.widths ?? widths,
        visibleIds: updates.visibleIds ?? visibleIds,
        colOrder: updates.colOrder ?? colOrder,
        density: updates.density ?? density,
      };
      localStorage.setItem(storageKey, JSON.stringify(current));
    } catch {
      // ignore
    }
  };

  // Reordered & Filtered columns
  const orderedColumns = useMemo(() => {
    const colMap = new Map(columns.map((c) => [c.id, c]));
    const list: Column<T>[] = [];
    for (const id of colOrder) {
      const col = colMap.get(id);
      if (col && visibleIds.includes(id)) {
        list.push(col);
      }
    }
    for (const col of columns) {
      if (!colOrder.includes(col.id) && visibleIds.includes(col.id)) {
        list.push(col);
      }
    }
    return list;
  }, [columns, colOrder, visibleIds]);

  // Settings anchor state
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const handleOpenSettings = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleCloseSettings = () => {
    setAnchorEl(null);
  };

  const toggleVisibility = (colId: string) => {
    const next = visibleIds.includes(colId)
      ? visibleIds.filter((id) => id !== colId)
      : [...visibleIds, colId];
    if (next.length === 0) return;
    setVisibleIds(next);
    saveLayout({ visibleIds: next });
  };

  const moveColumn = (colId: string, direction: 'up' | 'down') => {
    const idx = colOrder.indexOf(colId);
    if (idx === -1) return;
    const nextIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (nextIdx < 0 || nextIdx >= colOrder.length) return;

    const nextOrder = [...colOrder];
    const temp = nextOrder[idx];
    nextOrder[idx] = nextOrder[nextIdx];
    nextOrder[nextIdx] = temp;

    setColOrder(nextOrder);
    saveLayout({ colOrder: nextOrder });
  };

  const cellPadding = useMemo(() => {
    if (dense || density === 'compact') return { py: 0.5, px: 1, fontSize: '0.8125rem' };
    if (density === 'large') return { py: 2, px: 3, fontSize: '0.9375rem' };
    return { py: 1.25, px: 2, fontSize: '0.875rem' };
  }, [density, dense]);

  const viewportHeight = typeof maxHeight === 'number' ? maxHeight : 600;
  const startIndex = Math.max(0, Math.floor(scrollTop / rowHeight) - 3);
  const endIndex = Math.min(rows.length, Math.ceil((scrollTop + viewportHeight) / rowHeight) + 3);

  const visibleRows = useMemo(() => {
    return rows.slice(startIndex, endIndex);
  }, [rows, startIndex, endIndex]);

  const paddingTop = startIndex * rowHeight;
  const paddingBottom = (rows.length - endIndex) * rowHeight;

  if (loading) {
    return (
      <Paper variant="outlined" sx={{ p: 2 }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} height={40} sx={{ mb: 1 }} />
        ))}
      </Paper>
    );
  }

  return (
    <Paper variant="outlined" sx={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {storageKey && (
        <Box
          sx={{
            p: 1,
            display: 'flex',
            gap: 1,
            justifyContent: 'flex-end',
            bgcolor: 'action.hover',
            borderBottom: 1,
            borderColor: 'divider',
          }}
        >
          <Button size="small" onClick={handleOpenSettings} variant="text" sx={{ textTransform: 'none' }}>
            Ustunlar va Sozlamalar
          </Button>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleCloseSettings}
            PaperProps={{ sx: { width: 280, maxHeight: 400, p: 1 } }}
          >
            <Typography variant="subtitle2" sx={{ px: 2, py: 1 }}>Density</Typography>
            <Box sx={{ px: 2, pb: 1, display: 'flex', gap: 1 }}>
              {(['compact', 'comfortable', 'large'] as const).map((d) => (
                <Button
                  key={d}
                  size="small"
                  variant={density === d ? 'contained' : 'outlined'}
                  onClick={() => { setDensity(d); saveLayout({ density: d }); }}
                  sx={{ textTransform: 'none', flex: 1 }}
                >
                  {d === 'compact' ? 'Compact' : d === 'comfortable' ? 'Comfort' : 'Large'}
                </Button>
              ))}
            </Box>
            <Divider sx={{ my: 1 }} />
            <Typography variant="subtitle2" sx={{ px: 2, py: 1 }}>Visible Columns</Typography>
            {columns.map((col) => {
              const idx = colOrder.indexOf(col.id);
              return (
                <MenuItem key={col.id} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        size="small"
                        checked={visibleIds.includes(col.id)}
                        onChange={() => toggleVisibility(col.id)}
                      />
                    }
                    label={<Typography variant="body2">{col.label}</Typography>}
                    sx={{ m: 0 }}
                  />
                  <Box>
                    <IconButton
                      size="small"
                      disabled={idx <= 0}
                      onClick={(e) => { e.stopPropagation(); moveColumn(col.id, 'up'); }}
                    >
                      ↑
                    </IconButton>
                    <IconButton
                      size="small"
                      disabled={idx === -1 || idx >= colOrder.length - 1}
                      onClick={(e) => { e.stopPropagation(); moveColumn(col.id, 'down'); }}
                    >
                      ↓
                    </IconButton>
                  </Box>
                </MenuItem>
              );
            })}
          </Menu>
        </Box>
      )}
      <TableContainer onScroll={handleScroll} sx={{ maxHeight: stickyHeader ? maxHeight : undefined, overflowY: 'auto' }}>
        <Table size={(dense || density === 'compact') ? 'small' : 'medium'} stickyHeader={stickyHeader}>
          <TableHead>
            <TableRow>
              {orderedColumns.map((col) => (
                <TableCell
                  key={col.id}
                  align={col.align}
                  width={widths[col.id] || col.width}
                  sx={{
                    fontWeight: 600,
                    bgcolor: 'background.paper',
                    position: 'relative',
                    ...cellPadding,
                  }}
                >
                  {col.sortable && onSort ? (
                    <TableSortLabel
                      active={sortBy === col.id}
                      direction={sortBy === col.id ? sortOrder : 'asc'}
                      onClick={() => onSort(col.id)}
                    >
                      {col.label}
                    </TableSortLabel>
                  ) : (
                    col.label
                  )}
                  {storageKey && (
                    <Box
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const startX = e.clientX;
                        const startWidth = widths[col.id] || (typeof col.width === 'number' ? col.width : 150);
                        const handleMouseMove = (moveEvent: MouseEvent) => {
                          const newWidth = Math.max(50, startWidth + (moveEvent.clientX - startX));
                          setWidths((prev) => {
                            const next = { ...prev, [col.id]: newWidth };
                            saveLayout({ widths: next });
                            return next;
                          });
                        };
                        const handleMouseUp = () => {
                          document.removeEventListener('mousemove', handleMouseMove);
                          document.removeEventListener('mouseup', handleMouseUp);
                        };
                        document.addEventListener('mousemove', handleMouseMove);
                        document.addEventListener('mouseup', handleMouseUp);
                      }}
                      sx={{
                        position: 'absolute',
                        top: 0,
                        right: 0,
                        bottom: 0,
                        width: 4,
                        cursor: 'col-resize',
                        '&:hover': { bgcolor: 'primary.main', width: 6 },
                        zIndex: 10,
                      }}
                    />
                  )}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={orderedColumns.length} align="center" sx={{ py: 6 }}>
                  <Typography color="text.secondary">{emptyMessage}</Typography>
                </TableCell>
              </TableRow>
            ) : (
              <>
                {paddingTop > 0 && (
                  <TableRow style={{ height: paddingTop }}>
                    <TableCell colSpan={orderedColumns.length} style={{ padding: 0, border: 0 }} />
                  </TableRow>
                )}
                {visibleRows.map((row) => {
                  const id = rowKey(row);
                  return (
                    <DataTableRow
                      key={id}
                      id={id}
                      row={row}
                      columns={orderedColumns}
                      selected={selectedIds?.includes(id)}
                      onRowClick={onRowClick ? stableOnRowClick : undefined}
                      cellPadding={cellPadding}
                    />
                  );
                })}
                {paddingBottom > 0 && (
                  <TableRow style={{ height: paddingBottom }}>
                    <TableCell colSpan={orderedColumns.length} style={{ padding: 0, border: 0 }} />
                  </TableRow>
                )}
              </>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      {showPagination && (
        <TablePagination
          component="div"
          count={totalCount}
          page={page}
          onPageChange={(_, p) => onPageChange!(p)}
          rowsPerPage={pageSize}
          onRowsPerPageChange={(e) => onPageSizeChange?.(parseInt(e.target.value, 10))}
          rowsPerPageOptions={[10, 20, 50, 100]}
          labelRowsPerPage="Sahifada:"
          labelDisplayedRows={({ from, to, count }) => `${from}–${to} / ${count}`}
        />
      )}
    </Paper>
  );
}

export const DataTable = memo(DataTableInner) as typeof DataTableInner;

export function StatusChip({
  label,
  color = 'default',
}: {
  label: string;
  color?: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info';
}) {
  return <Chip label={label} size="small" color={color} variant="outlined" />;
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <Box sx={{ textAlign: 'center', py: 8, px: 2 }}>
      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>
      {description && (
        <Typography variant="body2" color="text.secondary" mb={2}>
          {description}
        </Typography>
      )}
      {action}
    </Box>
  );
}
