import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  LinearProgress,
  Chip,
  Grid,
  Card,
  CardContent,
  Tabs,
  Tab,
  Alert,
  Tooltip
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  PlayArrow as StartIcon,
  Pause as PauseIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Warning as WarningIcon,
  CheckCircle as SuccessIcon,
  Cancel as CancelIcon,
  Dns as DnsIcon
} from '@mui/icons-material';
import { saasApi } from '@/api/services/saasApi';

export function SaaSReleasesPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [releases, setReleases] = useState<any[]>([]);
  const [healthScores, setHealthScores] = useState<any[]>([]);
  
  // Progress states
  const [selectedRelease, setSelectedRelease] = useState<any>(null);
  const [progressData, setProgressData] = useState<any>(null);
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [showProgressDialog, setShowProgressDialog] = useState(false);

  // Upload dialog states
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [version, setVersion] = useState('');
  const [status, setStatus] = useState('DRAFT');
  const [rolloutTarget, setRolloutTarget] = useState('GLOBAL');
  const [whatsNew, setWhatsNew] = useState('');
  const [bugFixes, setBugFixes] = useState('');
  const [breakingChanges, setBreakingChanges] = useState('');
  const [estUpdateTime, setEstUpdateTime] = useState('2');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const fetchReleases = async () => {
    try {
      const data = await saasApi.getReleases();
      setReleases(data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchHealthScores = async () => {
    try {
      const data = await saasApi.getHealthScores();
      setHealthScores(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchReleases();
    fetchHealthScores();
    const interval = setInterval(() => {
      fetchReleases();
      fetchHealthScores();
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!version || !file) {
      setUploadError('Tahrirlash maydonlari va ZIP fayl kiritilishi shart!');
      return;
    }

    setUploading(true);
    setUploadError(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('version', version);
    formData.append('status', status);
    formData.append('rolloutTarget', rolloutTarget);
    formData.append('whatsNew', whatsNew);
    formData.append('bugFixes', bugFixes);
    formData.append('breakingChanges', breakingChanges);
    formData.append('estUpdateTime', estUpdateTime);

    try {
      await saasApi.uploadRelease(formData);
      setShowUploadDialog(false);
      setVersion('');
      setWhatsNew('');
      setBugFixes('');
      setBreakingChanges('');
      setFile(null);
      fetchReleases();
    } catch (err: any) {
      setUploadError(err.response?.data?.message || 'Yuklashda xatolik yuz berdi');
    } finally {
      setUploading(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await saasApi.updateReleaseStatus(id, newStatus);
      fetchReleases();
    } catch (e) {
      console.error(e);
    }
  };

  const handleEmergencyStop = async (id: string) => {
    try {
      await saasApi.emergencyStop(id);
      fetchReleases();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Haqiqatan ham ushbu versiyani o\'chirib tashlamoqchimisiz?')) {
      try {
        await saasApi.deleteRelease(id);
        fetchReleases();
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleOpenProgress = async (release: any) => {
    setSelectedRelease(release);
    setShowProgressDialog(true);
    try {
      const progress = await saasApi.getReleaseProgress(release.id);
      const history = await saasApi.getReleaseHistory(release.id);
      setProgressData(progress);
      setHistoryData(history);
    } catch (e) {
      console.error(e);
    }
  };

  const getStatusChip = (s: string) => {
    switch (s) {
      case 'DRAFT': return <Chip label="Draft" color="default" size="small" />;
      case 'BETA': return <Chip label="Beta" color="warning" size="small" />;
      case 'STABLE': return <Chip label="Stable" color="success" size="small" />;
      case 'DEPRECATED': return <Chip label="Deprecated" color="error" size="small" />;
      case 'ROLLBACK': return <Chip label="Rollback" color="secondary" size="small" />;
      default: return <Chip label={s} size="small" />;
    }
  };

  const getRolloutLabel = (t: string) => {
    switch (t) {
      case 'GLOBAL': return 'Global (100%)';
      case 'TEST_STORE': return 'Test Store';
      case 'FIVE_STORES': return 'Canary (5%)';
      case 'TWENTY_STORES': return 'Canary (20%)';
      default: return t;
    }
  };

  const formatSize = (bytes: string) => {
    const size = parseInt(bytes, 10);
    if (isNaN(size)) return '0 B';
    const mb = size / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>
          Versiya va Yangilanishlar Boshqaruvi
        </Typography>
        <Button
          variant="contained"
          startIcon={<UploadIcon />}
          onClick={() => setShowUploadDialog(true)}
          sx={{ borderRadius: 2 }}
        >
          Yangi versiya chiqarish (ZIP)
        </Button>
      </Box>

      <Tabs value={activeTab} onChange={(_, val) => setActiveTab(val)} sx={{ mb: 3 }}>
        <Tab label="Nashr etilgan versiyalar (Releases)" />
        <Tab label="Tizim faolligi & Health Scores" />
      </Tabs>

      {activeTab === 0 && (
        <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'action.hover' }}>
                <TableCell sx={{ fontWeight: 600 }}>Versiya</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Tavsif (Changelog)</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Holat (Status)</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Rollout doirasi</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Fayl hajmi</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Yuklanish soni</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>O'rnatilgan do'konlar</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="right">Amallar</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {releases.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                    Yuklangan yangilanish paketlari mavjud emas.
                  </TableCell>
                </TableRow>
              ) : (
                releases.map((rel) => (
                  <TableRow key={rel.id} hover>
                    <TableCell sx={{ fontWeight: 600, color: 'primary.main' }}>{rel.version}</TableCell>
                    <TableCell>{rel.changelog}</TableCell>
                    <TableCell>{getStatusChip(rel.status)}</TableCell>
                    <TableCell>{getRolloutLabel(rel.rolloutTarget)}</TableCell>
                    <TableCell>{formatSize(rel.zipSize)}</TableCell>
                    <TableCell>{rel.downloadCount}</TableCell>
                    <TableCell>{rel.installedStores} do'kon</TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => handleOpenProgress(rel)}
                        >
                          Monitoring
                        </Button>
                        
                        {rel.status !== 'DEPRECATED' && rel.status !== 'ROLLBACK' && (
                          <Button
                            size="small"
                            variant="outlined"
                            color="error"
                            onClick={() => handleEmergencyStop(rel.id)}
                          >
                            STOP
                          </Button>
                        )}

                        <DialogActions sx={{ p: 0 }}>
                          <TextField
                            select
                            size="small"
                            value={rel.status}
                            onChange={(e) => handleStatusChange(rel.id, e.target.value)}
                            sx={{ width: 110 }}
                          >
                            <MenuItem value="DRAFT">Draft</MenuItem>
                            <MenuItem value="BETA">Beta</MenuItem>
                            <MenuItem value="STABLE">Stable</MenuItem>
                            <MenuItem value="ROLLBACK">Rollback</MenuItem>
                            <MenuItem value="DEPRECATED">Deprecated</MenuItem>
                          </TextField>
                        </DialogActions>

                        <IconButton color="error" size="small" onClick={() => handleDelete(rel.id)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {activeTab === 1 && (
        <Grid container spacing={3}>
          {healthScores.map((h) => {
            const scoreColor = h.healthScore >= 80 ? 'success.main' : h.healthScore >= 60 ? 'warning.main' : 'error.main';
            return (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={h.companyId}>
                <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box>
                        <Typography variant="subtitle1" fontWeight={700}>{h.companyName}</Typography>
                        <Typography variant="caption" color="text.secondary">ID: {h.companyId.slice(0, 8)}...</Typography>
                      </Box>
                      <Chip
                        label={h.status}
                        color={h.status === 'EXCELLENT' ? 'success' : h.status === 'WARNING' ? 'warning' : h.status === 'CRITICAL' ? 'error' : 'default'}
                        size="small"
                      />
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <Typography variant="h4" fontWeight={800} sx={{ color: scoreColor }}>
                        {h.healthScore}%
                      </Typography>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                          Health Score
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={h.healthScore}
                          color={h.healthScore >= 80 ? 'success' : h.healthScore >= 60 ? 'warning' : 'error'}
                          sx={{ height: 6, borderRadius: 3 }}
                        />
                      </Box>
                    </Box>

                    <Grid container spacing={1} sx={{ mt: 1, pt: 1, borderTop: '1px solid', borderColor: 'divider' }}>
                      <Grid size={6}>
                        <Typography variant="caption" color="text.secondary">CPU: </Typography>
                        <Typography variant="caption" fontWeight={600}>{h.cpu || 'N/A'}</Typography>
                      </Grid>
                      <Grid size={6}>
                        <Typography variant="caption" color="text.secondary">RAM: </Typography>
                        <Typography variant="caption" fontWeight={600}>{h.ram || 'N/A'}</Typography>
                      </Grid>
                      <Grid size={6}>
                        <Typography variant="caption" color="text.secondary">Ping Latency: </Typography>
                        <Typography variant="caption" fontWeight={600}>{h.responseTime || 'N/A'}</Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Upload Release Dialog */}
      <Dialog open={showUploadDialog} onClose={() => setShowUploadDialog(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleUploadSubmit}>
          <DialogTitle fontWeight={700}>Yangi yangilanish paketini yuklash (ZIP)</DialogTitle>
          <DialogContent dividers>
            {uploadError && <Alert severity="error" sx={{ mb: 2 }}>{uploadError}</Alert>}
            
            <Grid container spacing={2}>
              <Grid size={6}>
                <TextField
                  label="Versiya (masalan: v2.1.0)"
                  fullWidth
                  required
                  value={version}
                  onChange={(e) => setVersion(e.target.value)}
                  placeholder="v1.0.1"
                />
              </Grid>
              <Grid size={6}>
                <TextField
                  select
                  label="Boshlang'ich holat (Status)"
                  fullWidth
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <MenuItem value="DRAFT">Draft</MenuItem>
                  <MenuItem value="BETA">Beta</MenuItem>
                  <MenuItem value="STABLE">Stable</MenuItem>
                </TextField>
              </Grid>

              <Grid size={12}>
                <TextField
                  select
                  label="Rollout doirasi (Canary Targets)"
                  fullWidth
                  value={rolloutTarget}
                  onChange={(e) => setRolloutTarget(e.target.value)}
                >
                  <MenuItem value="GLOBAL">Global (100% do'konlar)</MenuItem>
                  <MenuItem value="TEST_STORE">Test Store (Faqat sinov do'konlar)</MenuItem>
                  <MenuItem value="FIVE_STORES">Canary 5% (Canary Rollout)</MenuItem>
                  <MenuItem value="TWENTY_STORES">Canary 20% (Canary Rollout)</MenuItem>
                </TextField>
              </Grid>

              <Grid size={12}>
                <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>Release Notes</Typography>
                <TextField
                  label="What's New (Yangi qo'shilganlar)"
                  fullWidth
                  multiline
                  rows={2}
                  value={whatsNew}
                  onChange={(e) => setWhatsNew(e.target.value)}
                  sx={{ mb: 1.5 }}
                />
                <TextField
                  label="Bug Fixes (Tuzatilgan xatoliklar)"
                  fullWidth
                  multiline
                  rows={2}
                  value={bugFixes}
                  onChange={(e) => setBugFixes(e.target.value)}
                  sx={{ mb: 1.5 }}
                />
                <TextField
                  label="Breaking Changes"
                  fullWidth
                  multiline
                  rows={2}
                  value={breakingChanges}
                  onChange={(e) => setBreakingChanges(e.target.value)}
                  sx={{ mb: 1.5 }}
                />
              </Grid>

              <Grid size={12}>
                <TextField
                  label="Taxminiy yangilanish vaqti (daqiqalarda)"
                  fullWidth
                  type="number"
                  value={estUpdateTime}
                  onChange={(e) => setEstUpdateTime(e.target.value)}
                />
              </Grid>

              <Grid size={12}>
                <Button variant="outlined" component="label" fullWidth startIcon={<UploadIcon />}>
                  {file ? file.name : 'Yangilanish ZIP faylini tanlang'}
                  <input type="file" accept=".zip" hidden onChange={handleFileChange} />
                </Button>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowUploadDialog(false)}>Bekor qilish</Button>
            <Button type="submit" variant="contained" disabled={uploading}>
              {uploading ? 'Yuklanmoqda...' : 'Yuklash & Imzolash'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Progress & Live Rollout Monitoring Dialog */}
      <Dialog open={showProgressDialog} onClose={() => setShowProgressDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle fontWeight={700}>
          Versiya {selectedRelease?.version} — Canary Rollout Monitoring
        </DialogTitle>
        <DialogContent dividers>
          {progressData && (
            <Box sx={{ mb: 4 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body1" fontWeight={600}>
                  Yangilangan do'konlar: {progressData.updated} / {progressData.totalStores}
                </Typography>
                <Typography variant="body1" fontWeight={700}>
                  {progressData.percent}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={progressData.percent}
                sx={{ height: 12, borderRadius: 6, mb: 3 }}
              />
              
              <Grid container spacing={2}>
                <Grid size={3}>
                  <Card sx={{ bgcolor: 'success.light', color: 'success.contrastText' }}>
                    <CardContent sx={{ textAlign: 'center', py: 1.5 }}>
                      <Typography variant="h5" fontWeight={800}>{progressData.updated}</Typography>
                      <Typography variant="caption">Muvaffaqiyatli (Updated)</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid size={3}>
                  <Card sx={{ bgcolor: 'info.light', color: 'info.contrastText' }}>
                    <CardContent sx={{ textAlign: 'center', py: 1.5 }}>
                      <Typography variant="h5" fontWeight={800}>{progressData.updating}</Typography>
                      <Typography variant="caption">Yangilanmoqda (Updating)</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid size={3}>
                  <Card sx={{ bgcolor: 'error.light', color: 'error.contrastText' }}>
                    <CardContent sx={{ textAlign: 'center', py: 1.5 }}>
                      <Typography variant="h5" fontWeight={800}>{progressData.failed}</Typography>
                      <Typography variant="caption">Muvaffaqiyatsiz (Failed)</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid size={3}>
                  <Card sx={{ bgcolor: 'secondary.light', color: 'secondary.contrastText' }}>
                    <CardContent sx={{ textAlign: 'center', py: 1.5 }}>
                      <Typography variant="h5" fontWeight={800}>{progressData.rolledBack}</Typography>
                      <Typography variant="caption">Qaytarilgan (Rolled Back)</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          )}

          <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
            Do'konlar kesimidagi batafsil tarix:
          </Typography>
          
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Do'kon</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Avvalgi versiya</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Joriy versiya</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Boshlangan vaqt</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Holat (Status)</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Xatolik sababi</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {historyData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 2, color: 'text.secondary' }}>
                      Ushbu versiya uchun yangilanish tarixi yo'q.
                    </TableCell>
                  </TableRow>
                ) : (
                  historyData.map((h) => (
                    <TableRow key={h.id}>
                      <TableCell sx={{ fontWeight: 600 }}>{h.companyName}</TableCell>
                      <TableCell>{h.previousVersion}</TableCell>
                      <TableCell>{h.currentVersion}</TableCell>
                      <TableCell>{new Date(h.startedAt).toLocaleString()}</TableCell>
                      <TableCell>
                        <Chip
                          label={h.status}
                          size="small"
                          color={h.status === 'SUCCESS' ? 'success' : h.status === 'UPDATING' ? 'info' : h.status === 'ROLLED_BACK' ? 'secondary' : 'error'}
                        />
                      </TableCell>
                      <TableCell color="error.main">{h.failureReason || '—'}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowProgressDialog(false)}>Yopish</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default SaaSReleasesPage;
