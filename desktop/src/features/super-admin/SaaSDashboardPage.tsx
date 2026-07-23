import React, { useEffect, useState } from 'react';
import { Box, Grid, Card, CardContent, Typography, CircularProgress, Alert, Paper, LinearProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import { Business as BusinessIcon, Money as MoneyIcon, People as PeopleIcon, Speed as SpeedIcon, Warning as WarningIcon } from '@mui/icons-material';
import { saasApi } from '@/api/services/saasApi';

export function SaaSDashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    saasApi.getDashboardStats()
      .then((data) => {
        setStats(data);
      })
      .catch((err) => {
        setError(err.response?.data?.message ?? 'Statistikalarni yuklashda xatolik yuz berdi');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Typography variant="h5" fontWeight={700} sx={{ mb: 3 }}>
        SaaS Boshqaruv Paneli
      </Typography>

      {/* KPI Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'primary.light', color: 'primary.main' }}>
                <BusinessIcon />
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary" fontWeight={500}>
                  Kompaniyalar
                </Typography>
                <Typography variant="h5" fontWeight={700}>
                  {stats.companies.total}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Faol: {stats.companies.active} | Nofaol: {stats.companies.blocked}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'success.light', color: 'success.main' }}>
                <MoneyIcon />
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary" fontWeight={500}>
                  Bugungi tushum
                </Typography>
                <Typography variant="h5" fontWeight={700}>
                  {stats.revenue.today.toLocaleString()} UZS
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Joriy oy: {stats.revenue.monthly.toLocaleString()} UZS
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'info.light', color: 'info.main' }}>
                <PeopleIcon />
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary" fontWeight={500}>
                  Jami foydalanuvchilar
                </Typography>
                <Typography variant="h5" fontWeight={700}>
                  {stats.counters.users}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Faol seanslar: {stats.counters.sessions}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'warning.light', color: 'warning.main' }}>
                <WarningIcon />
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary" fontWeight={500}>
                  Faol litsenziyalar
                </Typography>
                <Typography variant="h5" fontWeight={700}>
                  {stats.licenses.active}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Trial: {stats.licenses.trial} | Tugagan: {stats.licenses.expired}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Top Companies Revenue */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3, borderRadius: 3, height: '100%' }}>
            <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
              Top Kompaniyalar (Savdo bo&apos;yicha)
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><Typography variant="body2" fontWeight={600}>Kompaniya</Typography></TableCell>
                    <TableCell><Typography variant="body2" fontWeight={600}>Kodi</Typography></TableCell>
                    <TableCell align="right"><Typography variant="body2" fontWeight={600}>Jami savdo</Typography></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {stats.topCompanies.map((c: any, i: number) => (
                    <TableRow key={i}>
                      <TableCell>{c.name}</TableCell>
                      <TableCell>{c.code}</TableCell>
                      <TableCell align="right">{c.revenue.toLocaleString()} UZS</TableCell>
                    </TableRow>
                  ))}
                  {stats.topCompanies.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} align="center">Ma&apos;lumotlar topilmadi</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        {/* Server & DB Health */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3, borderRadius: 3, height: '100%' }}>
            <Typography variant="h6" fontWeight={600} sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
              <SpeedIcon /> Server monitoring
            </Typography>

            <Box sx={{ mb: 3.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" fontWeight={500}>CPU yuklanishi</Typography>
                <Typography variant="body2" fontWeight={600}>{stats.systemHealth.cpuLoad}%</Typography>
              </Box>
              <LinearProgress variant="determinate" value={stats.systemHealth.cpuLoad} color="primary" sx={{ height: 6, borderRadius: 3 }} />
            </Box>

            <Box sx={{ mb: 3.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" fontWeight={500}>Tezkor xotira (RAM)</Typography>
                <Typography variant="body2" fontWeight={600}>{stats.systemHealth.ramUsage}%</Typography>
              </Box>
              <LinearProgress variant="determinate" value={stats.systemHealth.ramUsage} color="info" sx={{ height: 6, borderRadius: 3 }} />
            </Box>

            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid size={{ xs: 6 }}>
                <Typography variant="caption" color="text.secondary" display="block">Bo&apos;sh disk hajmi</Typography>
                <Typography variant="body1" fontWeight={600}>{stats.systemHealth.diskFree}</Typography>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography variant="caption" color="text.secondary" display="block">Bazaga ulanish</Typography>
                <Typography variant="body1" fontWeight={600} color="success.main">
                  {stats.systemHealth.dbConnected ? 'ONLINE' : 'OFFLINE'}
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* System activity log */}
        <Grid size={{ xs: 12 }}>
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
              Oxirgi Tizim Amallari (Activity Audit)
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell><Typography variant="body2" fontWeight={600}>Kompaniya</Typography></TableCell>
                    <TableCell><Typography variant="body2" fontWeight={600}>Amal</Typography></TableCell>
                    <TableCell><Typography variant="body2" fontWeight={600}>Modul</Typography></TableCell>
                    <TableCell align="right"><Typography variant="body2" fontWeight={600}>Sana</Typography></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {stats.latestActivity.map((log: any) => (
                    <TableRow key={log.id}>
                      <TableCell>{log.companyName}</TableCell>
                      <TableCell>{log.action}</TableCell>
                      <TableCell>{log.entityType}</TableCell>
                      <TableCell align="right">{new Date(log.createdAt).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                  {stats.latestActivity.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} align="center">Hozircha tizim faoliyatlari qayd etilmagan</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
export default SaaSDashboardPage;
