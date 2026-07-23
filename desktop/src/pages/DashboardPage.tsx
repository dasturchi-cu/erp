import { useMemo, useEffect } from 'react';
import { useInventoryStore } from '@/stores/inventoryStore';
import {
  Box,
  Card,
  FormControl,
  IconButton,
  InputLabel,
  List,
  ListItem,
  ListItemText,
  MenuItem,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { StatCard } from '@/components/organisms/StatCard';
import { SegmentedControl } from '@/components/molecules/SegmentedControl';
import { useUiStore } from '@/stores/uiStore';
import { useAuthStore } from '@/stores/authStore';
import { useCurrencyStore } from '@/stores/currencyStore';
import { useDashboardData } from '@/hooks/useDashboardData';
import { formatTime } from '@/utils/format';
import { formatRate } from '@/utils/currency';
import { t } from '@/i18n';
import type { CurrencyMode, DashboardPeriod } from '@/types';
import { useAppTheme } from '@/theme/ThemeProvider';
import { designTokens } from '@/theme/tokens';

const periodOptions: { value: DashboardPeriod; label: string }[] = [
  { value: 'daily', label: t('dashboard.period.daily') },
  { value: 'weekly', label: t('dashboard.period.weekly') },
  { value: 'monthly', label: t('dashboard.period.monthly') },
  { value: 'yearly', label: t('dashboard.period.yearly') },
];

const currencyOptions: { value: CurrencyMode; label: string }[] = [
  { value: 'UZS', label: 'UZS' },
  { value: 'USD', label: 'USD' },
  { value: 'both', label: t('dashboard.currency.both') },
];

export function DashboardPage() {
  const { activeCompany } = useAuthStore();
  const {
    dashboardPeriod,
    currencyMode,
    selectedBranch,
    lastUpdated,
    setDashboardPeriod,
    setCurrencyMode,
    setSelectedBranch,
    refreshDashboard,
  } = useUiStore();
  const { resolvedMode } = useAppTheme();
  const activeRate = useCurrencyStore((s) => s.rates.find((r) => r.status === 'active')?.rate ?? 12_620);
  const { data, loading, reload } = useDashboardData(dashboardPeriod, activeRate);

  const { branches, fetchBranches } = useInventoryStore();

  useEffect(() => {
    void fetchBranches();
  }, [fetchBranches]);

  const chartColors = useMemo(
    () => ({
      uzs: resolvedMode === 'light' ? designTokens.light.currency.uzs : designTokens.dark.currency.uzs,
      usd: resolvedMode === 'light' ? designTokens.light.currency.usd : designTokens.dark.currency.usd,
      grid: resolvedMode === 'light' ? designTokens.light.border.default : designTokens.dark.border.default,
      text: resolvedMode === 'light' ? designTokens.light.foreground.secondary : designTokens.dark.foreground.secondary,
    }),
    [resolvedMode],
  );

  if (!data) {
    return (
      <Box data-screen-id="SCR-010" sx={{ maxWidth: 1600, mx: 'auto', py: 4 }}>
        <Typography variant="h4" component="h1" fontWeight={700} gutterBottom>
          {t('dashboard.title')}
        </Typography>
        <Typography color="text.secondary">
          {loading ? 'Ma\'lumotlar yuklanmoqda…' : 'Dashboard ma\'lumotlari mavjud emas'}
        </Typography>
      </Box>
    );
  }

  const { suppliers } = data;

  const periodSuffix =
    dashboardPeriod === 'daily'
      ? t('dashboard.periodSuffix.daily')
      : dashboardPeriod === 'weekly'
        ? t('dashboard.periodSuffix.weekly')
        : dashboardPeriod === 'monthly'
          ? t('dashboard.periodSuffix.monthly')
          : dashboardPeriod === 'yearly'
            ? t('dashboard.periodSuffix.yearly')
            : '';

  const handleRefresh = () => {
    refreshDashboard();
    void reload();
  };

  const showUzs = currencyMode === 'UZS' || currencyMode === 'both';
  const showUsd = currencyMode === 'USD' || currencyMode === 'both';

  return (
    <Box data-screen-id="SCR-010" sx={{ maxWidth: 1600, mx: 'auto' }}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: { xs: 'flex-start', md: 'center' },
          justifyContent: 'space-between',
          gap: 2,
          mb: 3,
          minHeight: 72,
        }}
      >
        <Box>
          <Typography variant="h4" component="h1" fontWeight={700}>
            {t('dashboard.title')}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {activeCompany?.name ?? 'Kompaniya'} · {periodOptions.find((p) => p.value === dashboardPeriod)?.label}
          </Typography>
        </Box>

        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: 1.5,
          }}
        >
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>{t('dashboard.branch')}</InputLabel>
            <Select
              value={selectedBranch}
              label={t('dashboard.branch')}
              onChange={(e) => setSelectedBranch(e.target.value)}
            >
              <MenuItem value="all">{t('dashboard.allBranches')}</MenuItem>
              {branches.map((b) => (
                <MenuItem key={b.id} value={b.id}>
                  {b.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <SegmentedControl
            value={dashboardPeriod}
            options={periodOptions}
            onChange={setDashboardPeriod}
            aria-label="Davrni tanlash"
          />

          <SegmentedControl
            value={currencyMode}
            options={currencyOptions}
            onChange={setCurrencyMode}
            aria-label="Valyutani tanlash"
          />

          <Tooltip title={t('dashboard.refresh')}>
            <IconButton onClick={handleRefresh} aria-label={t('dashboard.refresh')}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>

          {lastUpdated && (
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
              {t('dashboard.updated', { time: formatTime(lastUpdated) })}
            </Typography>
          )}
        </Box>
      </Box>

      {/* 1. Savdo davrlari (Sales Periods) */}
      <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
        Savdolar hisoboti
      </Typography>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: 'repeat(4, 1fr)' },
          gap: 2,
          mb: 3,
        }}
      >
        <StatCard
          label="Bugungi savdo"
          value={showUzs ? data.todaySales.uzs : data.todaySales.usd}
          secondaryValue={currencyMode === 'both' ? data.todaySales.usd : undefined}
          trend={data.todaySales.trend}
          currencyColor={showUzs ? 'uzs' : 'usd'}
          loading={loading}
        />
        <StatCard
          label="Haftalik savdo"
          value={showUzs ? data.weeklySales.uzs : data.weeklySales.usd}
          secondaryValue={currencyMode === 'both' ? data.weeklySales.usd : undefined}
          trend={data.weeklySales.trend}
          currencyColor={showUzs ? 'uzs' : 'usd'}
          loading={loading}
        />
        <StatCard
          label="Oylik savdo"
          value={showUzs ? data.monthlySales.uzs : data.monthlySales.usd}
          secondaryValue={currencyMode === 'both' ? data.monthlySales.usd : undefined}
          trend={data.monthlySales.trend}
          currencyColor={showUzs ? 'uzs' : 'usd'}
          loading={loading}
        />
        <StatCard
          label="Yillik savdo"
          value={showUzs ? data.yearlySales.uzs : data.yearlySales.usd}
          secondaryValue={currencyMode === 'both' ? data.yearlySales.usd : undefined}
          trend={data.yearlySales.trend}
          currencyColor={showUzs ? 'uzs' : 'usd'}
          loading={loading}
        />
      </Box>

      {/* 2. Zaxira va Qarzdorliklar */}
      <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
        Ombor va Moliyaviy Holat
      </Typography>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: 'repeat(4, 1fr)' },
          gap: 2,
          mb: 3,
        }}
      >
        <StatCard
          label="Ombordagi mahsulotlar soni"
          value={String(data.totalStockQuantity)}
          meta="Jami dona qoldiq"
          loading={loading}
        />
        <StatCard
          label="FIFO bo'yicha Ombor qiymati"
          value={showUzs ? data.warehouseValueAtCost.uzs : data.warehouseValueAtCost.usd}
          secondaryValue={currencyMode === 'both' ? data.warehouseValueAtCost.usd : undefined}
          currencyColor={showUzs ? 'uzs' : 'usd'}
          loading={loading}
        />
        <StatCard
          label="Supplier qarzi"
          value={showUzs ? data.totalSupplierDebt.uzs : data.totalSupplierDebt.usd}
          secondaryValue={currencyMode === 'both' ? data.totalSupplierDebt.usd : undefined}
          currencyColor={showUzs ? 'uzs' : 'usd'}
          loading={loading}
        />
        <StatCard
          label="Customer qarzi"
          value={showUzs ? data.totalCustomerDebt.uzs : data.totalCustomerDebt.usd}
          secondaryValue={currencyMode === 'both' ? data.totalCustomerDebt.usd : undefined}
          currencyColor={showUzs ? 'uzs' : 'usd'}
          loading={loading}
        />
      </Box>

      {/* 3. Foyda va Eng ko'p sotilgan mahsulot */}
      <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
        Sof Foyda va Tahlillar
      </Typography>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: 'repeat(3, 1fr)' },
          gap: 2,
          mb: 4,
        }}
      >
        <StatCard
          label="Sof foyda"
          value={showUzs ? data.netProfit.uzs : data.netProfit.usd}
          secondaryValue={currencyMode === 'both' ? data.netProfit.usd : undefined}
          trend={data.netProfit.trend}
          currencyColor={showUzs ? 'uzs' : 'usd'}
          loading={loading}
        />
        <StatCard
          label="Eng ko'p sotilgan mahsulot"
          value={data.bestSellerProduct.name}
          meta={`Sotilgan miqdor: ${data.bestSellerProduct.quantity} dona`}
          loading={loading}
        />
        <Card sx={{ p: 2, minHeight: 120 }}>
          <Typography variant="body2" color="text.secondary" sx={{ textTransform: 'uppercase', fontSize: '0.75rem', mb: 1 }}>
            So&apos;nggi firma to&apos;lovlari
          </Typography>
          {suppliers.recentPayments.length === 0 ? (
            <Typography variant="body2" color="text.secondary">To&apos;lovlar yo&apos;q</Typography>
          ) : (
            <List dense disablePadding>
              {suppliers.recentPayments.slice(0, 3).map((p: any) => (
                <ListItem key={p.id} disablePadding sx={{ py: 0.25 }}>
                  <ListItemText primary={p.text} secondary={p.time} primaryTypographyProps={{ variant: 'body2' }} />
                </ListItem>
              ))}
            </List>
          )}
        </Card>
      </Box>

      {/* Charts Row */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' },
          gap: 2,
          mb: 3,
        }}
      >
        <Card sx={{ p: 2, minHeight: 320 }}>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            Grafik: Savdo va Foyda Tahlili (Oxirgi 30 kun)
          </Typography>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={data.salesTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
              <XAxis dataKey="date" tick={{ fill: chartColors.text, fontSize: 12 }} />
              <YAxis tick={{ fill: chartColors.text, fontSize: 12 }} />
              <RechartsTooltip
                contentStyle={{
                  backgroundColor: resolvedMode === 'light' ? '#fff' : '#1E293B',
                  border: `1px solid ${chartColors.grid}`,
                  borderRadius: 6,
                }}
              />
              <Legend />
              {showUzs && (
                <Area
                  type="monotone"
                  dataKey="uzs"
                  name="Savdo (UZS)"
                  stroke={chartColors.uzs}
                  fill={chartColors.uzs}
                  fillOpacity={0.08}
                />
              )}
              {showUzs && (
                <Area
                  type="monotone"
                  dataKey="profitUzs"
                  name="Foyda (UZS)"
                  stroke="#10B981"
                  fill="#10B981"
                  fillOpacity={0.12}
                />
              )}
              {showUsd && (
                <Area
                  type="monotone"
                  dataKey="usd"
                  name="Savdo (USD)"
                  stroke={chartColors.usd}
                  fill={chartColors.usd}
                  fillOpacity={0.08}
                />
              )}
              {showUsd && (
                <Area
                  type="monotone"
                  dataKey="profitUsd"
                  name="Foyda (USD)"
                  stroke="#3B82F6"
                  fill="#3B82F6"
                  fillOpacity={0.12}
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card sx={{ p: 2, minHeight: 320 }}>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            {t('dashboard.paymentVsCredit')}
          </Typography>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={data.paymentSplit}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={2}
                dataKey="value"
                label={({ name, value }) => `${name} ${value}%`}
              >
                {data.paymentSplit.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <RechartsTooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </Box>

      {/* Bottom Row */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' },
          gap: 2,
        }}
      >
        <Card sx={{ p: 2 }}>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            Top Mijozlar
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Mijoz</TableCell>
                  {(currencyMode === 'UZS' || currencyMode === 'both') && (
                    <TableCell align="right">Hajm (UZS)</TableCell>
                  )}
                  {(currencyMode === 'USD' || currencyMode === 'both') && (
                    <TableCell align="right">Hajm (USD)</TableCell>
                  )}
                </TableRow>
              </TableHead>
              <TableBody>
                {data.topCustomers.map((customer) => (
                  <TableRow key={customer.name} hover>
                    <TableCell>{customer.name}</TableCell>
                    {(currencyMode === 'UZS' || currencyMode === 'both') && (
                      <TableCell align="right" sx={{ color: chartColors.uzs, fontFamily: 'monospace', fontSize: '0.8125rem' }}>
                        {customer.revenueUzs}
                      </TableCell>
                    )}
                    {(currencyMode === 'USD' || currencyMode === 'both') && (
                      <TableCell align="right" sx={{ color: chartColors.usd, fontFamily: 'monospace', fontSize: '0.8125rem' }}>
                        {customer.revenueUsd}
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>

        <Card sx={{ p: 2 }}>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            {t('dashboard.topProducts')}
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>{t('dashboard.productCol')}</TableCell>
                  <TableCell align="right">{t('dashboard.qtyCol')}</TableCell>
                  {(currencyMode === 'UZS' || currencyMode === 'both') && (
                    <TableCell align="right">{t('dashboard.revenueUzs')}</TableCell>
                  )}
                  {(currencyMode === 'USD' || currencyMode === 'both') && (
                    <TableCell align="right">{t('dashboard.revenueUsd')}</TableCell>
                  )}
                </TableRow>
              </TableHead>
              <TableBody>
                {data.topProducts.map((product) => (
                  <TableRow key={product.name} hover>
                    <TableCell>{product.name}</TableCell>
                    <TableCell align="right">{product.qty}</TableCell>
                    {(currencyMode === 'UZS' || currencyMode === 'both') && (
                      <TableCell align="right" sx={{ color: chartColors.uzs, fontFamily: 'monospace', fontSize: '0.8125rem' }}>
                        {product.revenueUzs}
                      </TableCell>
                    )}
                    {(currencyMode === 'USD' || currencyMode === 'both') && (
                      <TableCell align="right" sx={{ color: chartColors.usd, fontFamily: 'monospace', fontSize: '0.8125rem' }}>
                        {product.revenueUsd}
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      </Box>
    </Box>
  );
}
