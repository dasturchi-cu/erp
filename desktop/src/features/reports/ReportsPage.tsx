import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormHelperText,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import { PageHeader } from '@/components/common/PageHeader';
import { FilterBar } from '@/components/common/FilterBar';
import { DataTable, type Column } from '@/components/common/DataTable';
import { useListState } from '@/hooks/useListState';
import { useNotification } from '@/components/feedback/NotificationProvider';
import type { ReportItem } from '@/types/entities';
import { reportsApi } from '@/api/services/reportsApi';
import { inventoryApi } from '@/api/services/domainApi';
import { apiClient } from '@/api/client';

function formatDateTime(iso?: string) {
  if (!iso) return 'Hali yaratilmagan';
  return new Date(iso).toLocaleString('uz-UZ', { dateStyle: 'short', timeStyle: 'short' });
}

async function downloadReportFile(jobId: string, filename: string) {
  const response = await apiClient.get(`/reports/${jobId}/download`, {
    responseType: 'blob',
  });
  const contentType = response.headers['content-type'];
  const mimeType = typeof contentType === 'string' ? contentType : undefined;
  const blob = new Blob([response.data], { type: mimeType });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export function ReportsPage() {
  const { info, error: notifyError, success } = useNotification();
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState('all');

  const [activeTab, setActiveTab] = useState(0);
  const [historyList, setHistoryList] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyPageSize, setHistoryPageSize] = useState(10);
  const [historyTotal, setHistoryTotal] = useState(0);

  const fetchHistory = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const data = await reportsApi.listHistory({
        page: historyPage,
        limit: historyPageSize,
      });
      setHistoryList(data.data || []);
      setHistoryTotal(data.meta?.total || 0);
    } catch (err) {
      console.error('History fetch error:', err);
    } finally {
      setLoadingHistory(false);
    }
  }, [historyPage, historyPageSize]);

  useEffect(() => {
    if (activeTab === 1) {
      void fetchHistory();
    }
  }, [activeTab, fetchHistory]);

  const historyColumns = useMemo(
    () => [
      { id: 'reportName', label: 'Hisobot nomi', render: (r: any) => r.reportName },
      { id: 'category', label: 'Kategoriya', render: (r: any) => r.category },
      { id: 'format', label: 'Format', render: (r: any) => r.format },
      {
        id: 'status',
        label: 'Holat',
        render: (r: any) => (
          <Typography
            variant="body2"
            sx={{
              color:
                r.status === 'COMPLETED'
                  ? 'success.main'
                  : r.status === 'FAILED'
                    ? 'error.main'
                    : 'warning.main',
              fontWeight: 600,
            }}
          >
            {r.status === 'COMPLETED'
              ? 'Tayyor'
              : r.status === 'FAILED'
                ? 'Xatolik'
                : 'Tayyorlanmoqda'}
          </Typography>
        ),
      },
      { id: 'rowCount', label: 'Qatorlar', render: (r: any) => r.rowCount ?? '—' },
      {
        id: 'createdAt',
        label: 'Sana',
        render: (r: any) => formatDateTime(r.createdAt),
      },
      {
        id: 'actions',
        label: 'Yuklab olish',
        render: (r: any) => (
          <Button
            size="small"
            variant="outlined"
            disabled={r.status !== 'COMPLETED'}
            onClick={() => {
              if (r.downloadUrl) {
                const parts = r.downloadUrl.split('/');
                const jobId = parts[parts.length - 2];
                const filename = `${r.reportName.replace(/\s+/g, '_')}.${r.format.toLowerCase()}`;
                downloadReportFile(jobId, filename)
                  .then(() => success('Hujjat yuklab olindi!'))
                  .catch((err) => notifyError('Yuklab olishda xatolik yuz berdi'));
              }
            }}
          >
            Yuklash
          </Button>
        ),
      },
    ],
    [success, notifyError],
  );

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<ReportItem | null>(null);
  const [format, setFormat] = useState<'PDF' | 'XLSX' | 'CSV'>('PDF');
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom'>('monthly');
  const [dateFrom, setDateFrom] = useState(new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString().slice(0, 10));
  const [dateTo, setDateTo] = useState(new Date().toISOString().slice(0, 10));
  const [branchId, setBranchId] = useState('all');
  const [warehouseId, setWarehouseId] = useState('all');
  const [branches, setBranches] = useState<Array<{ id: string; name: string }>>([]);
  const [warehouses, setWarehouses] = useState<Array<{ id: string; name: string }>>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationError, setGenerationError] = useState<string | null>(null);

  const fetchCatalog = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await reportsApi.listCatalog();
      setReports(data);
    } catch (err) {
      setError((err as { message?: string }).message ?? 'Catalog yuklanmadi');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchFilters = useCallback(async () => {
    try {
      const [bList, wList] = await Promise.all([
        inventoryApi.listBranches(),
        inventoryApi.listWarehouses(),
      ]);
      setBranches(bList);
      setWarehouses(wList);
    } catch (err) {
      console.error('Filter ma\'lumotlarini yuklashda xatolik:', err);
    }
  }, []);

  useEffect(() => {
    void fetchCatalog();
    void fetchFilters();
  }, [fetchCatalog, fetchFilters]);

  const categories = useMemo(
    () => [...new Set(reports.map((r) => r.category))],
    [reports],
  );

  const filtered = useMemo(
    () =>
      categoryFilter === 'all'
        ? reports
        : reports.filter((r) => r.category === categoryFilter),
    [categoryFilter, reports],
  );

  const searchFields = useCallback(
    (r: ReportItem) => [r.name, r.category, r.description],
    [],
  );

  const { search, setSearch, page, setPage, pageSize, setPageSize, sortBy, sortOrder, handleSort, paginated, total } =
    useListState(filtered, searchFields);

  const handleOpenGenerate = (report: ReportItem) => {
    setSelectedReport(report);
    setFormat('PDF');
    setPeriod('monthly');
    setBranchId('all');
    setWarehouseId('all');
    setGenerationError(null);
    setGenerationProgress(0);
    setIsGenerating(false);
    setDialogOpen(true);
  };

  const handleGenerate = async () => {
    if (!selectedReport) return;
    setIsGenerating(true);
    setGenerationProgress(0);
    setGenerationError(null);

    const parts = selectedReport.id.split('_');
    const categoryCode = parts[0];
    const template = parts.slice(1).join('_');

    const extension = format.toLowerCase();
    const filename = `${selectedReport.name.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0,10)}.${extension}`;

    try {
      const res = await reportsApi.generate({
        category: categoryCode,
        template,
        format,
        period: period,
        date_from: period === 'custom' ? dateFrom : undefined,
        date_to: period === 'custom' ? dateTo : undefined,
        branch_id: branchId === 'all' ? undefined : branchId,
        warehouse_id: warehouseId === 'all' ? undefined : warehouseId,
      });

      const jobId = res.jobId;
      
      const poll = async () => {
        try {
          const statusRes = await reportsApi.getJobStatus(jobId);
          if (statusRes.status === 'COMPLETED') {
            setGenerationProgress(100);
            setIsGenerating(false);
            setDialogOpen(false);
            success('Hisobot tayyor! Yuklab olinmoqda...');
            await downloadReportFile(jobId, filename);
            void fetchCatalog(); // Refresh list to update lastGenerated date
            void fetchHistory(); // Update generated history list
          } else if (statusRes.status === 'FAILED') {
            setIsGenerating(false);
            setGenerationError(statusRes.errorMessage ?? 'Hisobot yaratish muvaffaqiyatsiz yakunlandi');
          } else {
            setGenerationProgress(statusRes.progress);
            setTimeout(poll, 1500);
          }
        } catch (err) {
          setIsGenerating(false);
          setGenerationError((err as { message?: string }).message ?? 'Hisobot holatini tekshirishda xatolik');
        }
      };

      setTimeout(poll, 1000);
    } catch (err) {
      setIsGenerating(false);
      setGenerationError((err as { message?: string }).message ?? 'Hisobot generatsiyasi boshlanmadi');
    }
  };

  const columns: Column<ReportItem>[] = useMemo(
    () => [
      { id: 'name', label: 'Hisobot nomi', sortable: true, render: (r) => r.name },
      { id: 'category', label: 'Kategoriya', sortable: true, render: (r) => r.category },
      { id: 'description', label: 'Tavsif', render: (r) => r.description },
      {
        id: 'lastGenerated',
        label: 'Oxirgi yaratilgan',
        sortable: true,
        render: (r) => formatDateTime(r.lastGenerated),
      },
      {
        id: 'actions',
        label: 'Amallar',
        render: (r) => (
          <Button size="small" variant="outlined" onClick={() => handleOpenGenerate(r)}>
            Yaratish
          </Button>
        ),
      },
    ],
    [fetchCatalog],
  );

  return (
    <>
      <PageHeader
        title="Hisobotlar"
        subtitle="Savdo, moliya va ombor hisobotlari"
      />

      <Card variant="outlined" sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(_, val) => setActiveTab(val)}
          sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}
        >
          <Tab label="Hisobot shablonlari" />
          <Tab label="Generatsiya tarixi (Excel / PDF)" />
        </Tabs>

        <Box sx={{ p: 2 }}>
          {activeTab === 0 ? (
            <>
              <FilterBar
                search={{ value: search, onChange: setSearch, placeholder: 'Hisobot nomi…' }}
                filters={
                  <FormControl size="small" sx={{ minWidth: 160 }}>
                    <InputLabel>Kategoriya</InputLabel>
                    <Select value={categoryFilter} label="Kategoriya" onChange={(e) => setCategoryFilter(e.target.value)}>
                      <MenuItem value="all">Barchasi</MenuItem>
                      {categories.map((cat) => (
                        <MenuItem key={cat} value={cat}>
                          {cat}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                }
              />

              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                  <CircularProgress />
                </Box>
              ) : error ? (
                <Box sx={{ p: 4, textAlign: 'center' }}>
                  <Typography color="error">{error}</Typography>
                </Box>
              ) : (
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
              )}
            </>
          ) : (
            <>
              {loadingHistory ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <DataTable
                  columns={historyColumns}
                  rows={historyList}
                  rowKey={(r) => r.id}
                  page={historyPage}
                  pageSize={historyPageSize}
                  total={historyTotal}
                  onPageChange={setHistoryPage}
                  onPageSizeChange={setHistoryPageSize}
                />
              )}
            </>
          )}
        </Box>
      </Card>

      {/* Generate Report Dialog */}
      <Dialog open={dialogOpen} onClose={() => !isGenerating && setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Hisobotni sozlash</DialogTitle>
        <DialogContent dividers>
          {selectedReport && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" fontWeight={600}>
                {selectedReport.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {selectedReport.description}
              </Typography>
            </Box>
          )}

          {generationError && (
            <Box sx={{ mb: 2, p: 2, bgcolor: 'error.light', color: 'error.contrastText', borderRadius: 1 }}>
              <Typography variant="body2">{generationError}</Typography>
            </Box>
          )}

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Format</InputLabel>
                <Select value={format} label="Format" onChange={(e) => setFormat(e.target.value as typeof format)} disabled={isGenerating}>
                  <MenuItem value="PDF">PDF hujjat</MenuItem>
                  <MenuItem value="XLSX">Excel jadvali</MenuItem>
                  <MenuItem value="CSV">CSV matnli jadval</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Davr</InputLabel>
                <Select value={period} label="Davr" onChange={(e) => setPeriod(e.target.value as typeof period)} disabled={isGenerating}>
                  <MenuItem value="daily">Bugun</MenuItem>
                  <MenuItem value="weekly">Shu hafta</MenuItem>
                  <MenuItem value="monthly">Shu oy</MenuItem>
                  <MenuItem value="yearly">Shu yil</MenuItem>
                  <MenuItem value="custom">Boshqa davr...</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {period === 'custom' && (
              <>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Boshlanish sanasi"
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    disabled={isGenerating}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Tugash sanasi"
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    disabled={isGenerating}
                  />
                </Grid>
              </>
            )}

            {/* Filter by Branch */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Filial</InputLabel>
                <Select value={branchId} label="Filial" onChange={(e) => setBranchId(e.target.value)} disabled={isGenerating}>
                  <MenuItem value="all">Barcha filiallar</MenuItem>
                  {branches.map((b) => (
                    <MenuItem key={b.id} value={b.id}>
                      {b.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Filter by Warehouse */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Ombor</InputLabel>
                <Select value={warehouseId} label="Ombor" onChange={(e) => setWarehouseId(e.target.value)} disabled={isGenerating}>
                  <MenuItem value="all">Barcha omborlar</MenuItem>
                  {warehouses.map((w) => (
                    <MenuItem key={w.id} value={w.id}>
                      {w.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          {isGenerating && (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 3, gap: 1 }}>
              <CircularProgress variant="determinate" value={generationProgress} size={40} />
              <Typography variant="body2" color="text.secondary">
                Hisobot tayyorlanmoqda: {generationProgress}%
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} disabled={isGenerating}>
            Bekor qilish
          </Button>
          <Button onClick={handleGenerate} variant="contained" disabled={isGenerating}>
            Yaratish
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
