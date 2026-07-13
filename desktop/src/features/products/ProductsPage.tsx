import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, FormControl, InputLabel, MenuItem, Select, Box, Tooltip, Typography } from '@mui/material';
import { PageHeader } from '@/components/common/PageHeader';
import { FilterBar } from '@/components/common/FilterBar';
import { DataTable, StatusChip, type Column } from '@/components/common/DataTable';
import { ProductImportDialog } from '@/features/products/ProductImportDialog';
import { productsApi, customersApi, suppliersApi, inventoryApi, salesApi } from '@/api/services';
import { useCurrencyStore } from '@/stores/currencyStore';
import { productUnitLabel } from '@/constants/productUnits';
import { useNotification } from '@/components/feedback/NotificationProvider';
import { productUsdFromUzs } from '@/utils/currency';
import { formatUzs, formatUsd } from '@/utils/format';
import { downloadSpreadsheet, type ExportFormat } from '@/utils/spreadsheet';
import { API_BASE_URL } from '@/api/client';
import type { Product, Sale } from '@/types/entities';

const statusLabels: Record<Product['status'], string> = {
  active: 'Faol',
  inactive: 'Nofaol',
};

const statusColors: Record<Product['status'], 'success' | 'default'> = {
  active: 'success',
  inactive: 'default',
};

const SORT_FIELD_MAP: Record<string, string> = {
  sku: 'sku',
  barcode: 'sku',
  name: 'name',
  category: 'name',
  unitOfMeasure: 'name',
  stock: 'name',
  purchasePriceUzs: 'salePriceUzs',
  priceUzs: 'salePriceUzs',
  minStockLevel: 'name',
};

export function ProductsPage() {
  const navigate = useNavigate();
  const { success, error: notifyError } = useNotification();
  const [zipUploading, setZipUploading] = useState(false);
  const exchangeRate = useCurrencyStore((s) => s.rates.find((r) => r.status === 'active')?.rate ?? 12_620);
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const handleZipImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setZipUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await (productsApi as any).bulkImportImages(formData);
      success(res.message || 'ZIP rasmlar muvaffaqiyatli import qilindi');
      void fetchProducts();
    } catch (err: any) {
      notifyError(err.message || 'ZIP importda xatolik yuz berdi');
    } finally {
      setZipUploading(false);
      e.target.value = '';
    }
  };
  const [search, setSearch] = useState('');
  const [searchDebounced, setSearchDebounced] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [stockFilter, setStockFilter] = useState<string>('all');
  const [importOpen, setImportOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<ExportFormat>('xlsx');

  useEffect(() => {
    const timer = setTimeout(() => setSearchDebounced(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const sortField = SORT_FIELD_MAP[sortBy] ?? 'name';
      const result = await productsApi.listPaginated({
        page: page + 1,
        limit: pageSize,
        q: searchDebounced || undefined,
        sort: `${sortField}:${sortOrder}`,
        status: statusFilter === 'all' ? undefined : statusFilter.toUpperCase(),
        stockLevel:
          stockFilter === 'all'
            ? undefined
            : stockFilter === 'in'
              ? 'in_stock'
              : stockFilter === 'low'
                ? 'low'
                : 'out',
      });
      setProducts(result.data);
      setTotal(result.meta.total);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, searchDebounced, sortBy, sortOrder, statusFilter, stockFilter]);

  useEffect(() => {
    void fetchProducts();
  }, [fetchProducts]);

  const handleSort = useCallback(
    (columnId: string) => {
      if (sortBy === columnId) {
        setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
      } else {
        setSortBy(columnId);
        setSortOrder('asc');
      }
      setPage(0);
    },
    [sortBy],
  );

  const columns: Column<Product>[] = useMemo(
    () => [
      {
        id: 'image',
        label: 'Rasm',
        width: 60,
        render: (r) => (
          <Tooltip
            title={
              r.imageUrl ? (
                <Box sx={{ p: 0.5 }}>
                  <img
                    src={`${API_BASE_URL}/products/image/served/medium/${r.imageUrl}`}
                    alt={r.name}
                    style={{ maxWidth: 200, maxHeight: 200, display: 'block', borderRadius: 4 }}
                  />
                </Box>
              ) : (
                'Rasm yo\'q'
              )
            }
            arrow
          >
            <Box sx={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'grey.100', borderRadius: 1, overflow: 'hidden' }}>
              {r.imageUrl ? (
                <img
                  src={`${API_BASE_URL}/products/image/served/thumb/${r.imageUrl}`}
                  alt={r.name}
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  loading="lazy"
                />
              ) : (
                <Typography component="span" variant="caption" color="text.disabled" sx={{ fontSize: '0.65rem' }}>—</Typography>
              )}
            </Box>
          </Tooltip>
        ),
      },
      { id: 'sku', label: 'SKU', sortable: true, width: 100, render: (r) => r.sku },
      {
        id: 'barcode',
        label: 'Barcode',
        sortable: true,
        width: 130,
        render: (r) => r.barcode ?? '—',
      },
      { id: 'name', label: 'Nomi', sortable: true, render: (r) => r.name },
      { id: 'category', label: 'Kategoriya', sortable: true, width: 120, render: (r) => r.category },
      {
        id: 'unitOfMeasure',
        label: "O'lchov",
        sortable: true,
        width: 80,
        render: (r) => productUnitLabel(r.unitOfMeasure),
      },
      { id: 'stock', label: 'Qoldiq', sortable: true, align: 'right', width: 80, render: (r) => r.stock },
      {
        id: 'purchasePriceUzs',
        label: 'Olish (UZS)',
        sortable: true,
        align: 'right',
        render: (r) => formatUzs(r.purchasePriceUzs),
      },
      {
        id: 'priceUzs',
        label: 'Sotish (UZS)',
        sortable: true,
        align: 'right',
        render: (r) => formatUzs(r.priceUzs),
      },
      {
        id: 'priceUsd',
        label: 'Sotish (USD)',
        align: 'right',
        render: (r) => formatUsd(productUsdFromUzs(r.priceUzs, exchangeRate)),
      },
      {
        id: 'minStockLevel',
        label: 'Min. qoldiq',
        sortable: true,
        align: 'right',
        width: 100,
        render: (r) => r.minStockLevel,
      },
      {
        id: 'status',
        label: 'Holat',
        width: 90,
        render: (r) => <StatusChip label={statusLabels[r.status]} color={statusColors[r.status]} />,
      },
    ],
    [exchangeRate],
  );

  const handleRowClick = useCallback((r: Product) => navigate(`/products/${r.id}`), [navigate]);

  const handleExportProducts = async () => {
    const list = await productsApi.list({ limit: 5000 });
    downloadSpreadsheet(
      'mahsulotlar',
      ['SKU', 'Barcode', 'Name', 'Category', 'Unit', 'Purchase Price', 'Selling Price', 'Stock'],
      list.map((p) => [
        p.sku,
        p.barcode ?? '',
        p.name,
        p.category,
        p.unitOfMeasure,
        p.purchasePriceUzs,
        p.priceUzs,
        p.stock,
      ]),
      exportFormat,
    );
  };

  const handleExportCustomers = async () => {
    const list = await customersApi.list({ limit: 5000 });
    downloadSpreadsheet(
      'mijozlar',
      ['Name', 'Phone', 'Debt UZS', 'Status'],
      list.map((c) => [c.name, c.phone, c.debtUzs, c.status]),
      exportFormat,
    );
  };

  const handleExportSupplierDebts = async () => {
    const rows = await suppliersApi.exportDebts();
    downloadSpreadsheet(
      'firma-qarzlari',
      ['Name', 'Phone', 'Contact', 'Total Debt', 'Paid', 'Remaining', 'Status'],
      rows.map((r) => [
        r.name,
        r.phone,
        r.contactPerson,
        r.totalDebtUzs,
        r.totalPaidUzs,
        r.remainingDebtUzs,
        r.status,
      ]),
      exportFormat,
    );
  };

  const handleExportSales = async () => {
    const data = await salesApi.list({ limit: 5000 });
    downloadSpreadsheet(
      'sotuvlar',
      ['Number', 'Customer', 'Total UZS', 'Payment Type', 'Status', 'Date'],
      data.map((s: Sale) => [s.number, s.customerName, s.totalUzs, s.paymentType, s.status, s.createdAt]),
      exportFormat,
    );
  };

  const handleExportInventory = async () => {
    const stock = await inventoryApi.listStock({ limit: 5000 });
    const rows = (stock.data as Array<Record<string, string>>) ?? [];
    downloadSpreadsheet(
      'zaxira',
      ['Product', 'SKU', 'Warehouse', 'Stock'],
      rows.map((r) => [r.productName ?? '', r.sku ?? '', r.warehouseId ?? '', r.stock ?? '']),
      exportFormat,
    );
  };

  return (
    <>
      <PageHeader
        title="Mahsulotlar"
        subtitle="Mahsulotlar katalogi va narxlarni boshqarish"
        primaryAction={{ label: 'Yangi mahsulot', onClick: () => navigate('/products/new') }}
        secondaryActions={
          <>
            <Button variant="outlined" onClick={() => setImportOpen(true)}>Import Excel</Button>
            <Button variant="outlined" component="label" disabled={zipUploading}>
              {zipUploading ? 'ZIP yuklanmoqda…' : 'ZIP Import'}
              <input type="file" accept=".zip" onChange={handleZipImport} hidden />
            </Button>
            <FormControl size="small" sx={{ minWidth: 90 }}>
              <InputLabel>Format</InputLabel>
              <Select value={exportFormat} label="Format" onChange={(e) => setExportFormat(e.target.value as ExportFormat)}>
                <MenuItem value="xlsx">Excel</MenuItem>
                <MenuItem value="csv">CSV</MenuItem>
              </Select>
            </FormControl>
            <Button variant="outlined" onClick={() => void handleExportProducts()}>Export</Button>
            <Button variant="outlined" onClick={() => void handleExportCustomers()}>Mijozlar</Button>
            <Button variant="outlined" onClick={() => void handleExportSupplierDebts()}>Firma qarzlari</Button>
            <Button variant="outlined" onClick={() => void handleExportSales()}>Sotuvlar</Button>
            <Button variant="outlined" onClick={() => void handleExportInventory()}>Zaxira</Button>
          </>
        }
      />

      <ProductImportDialog open={importOpen} onClose={() => setImportOpen(false)} onImported={() => void fetchProducts()} />

      <FilterBar
        search={{
          value: search,
          onChange: (v) => {
            setSearch(v);
            setPage(0);
          },
          placeholder: 'SKU, barcode, nom…',
        }}
        filters={
          <>
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel>Holat</InputLabel>
              <Select
                value={statusFilter}
                label="Holat"
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(0);
                }}
              >
                <MenuItem value="all">Barchasi</MenuItem>
                <MenuItem value="active">Faol</MenuItem>
                <MenuItem value="inactive">Nofaol</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel>Zaxira</InputLabel>
              <Select
                value={stockFilter}
                label="Zaxira"
                onChange={(e) => {
                  setStockFilter(e.target.value);
                  setPage(0);
                }}
              >
                <MenuItem value="all">Barchasi</MenuItem>
                <MenuItem value="in">Mavjud</MenuItem>
                <MenuItem value="low">Kam qolgan</MenuItem>
                <MenuItem value="out">Tugagan</MenuItem>
              </Select>
            </FormControl>
          </>
        }
      />

      <DataTable
        tableName="products-catalog"
        columns={columns}
        rows={products}
        rowKey={(r) => r.id}
        loading={loading}
        stickyHeader
        maxHeight="calc(100vh - 280px)"
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={setPage}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setPage(0);
        }}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={handleSort}
        onRowClick={handleRowClick}
      />
    </>
  );
}
