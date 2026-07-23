import React, { useEffect, useState } from 'react';
import { Box, Button, Grid, Card, CardContent, Typography, CircularProgress, Alert, Paper, Divider, TextField, MenuItem, Dialog, DialogTitle, DialogContent, DialogActions, Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowBack as ArrowBackIcon, Edit as EditIcon, Key as KeyIcon, TrendingUp as SalesIcon, Inventory as ProductIcon, People as PeopleIcon } from '@mui/icons-material';
import { saasApi } from '@/api/services/saasApi';

export function SaaSCompanyProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [branches, setBranches] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // License Edit State
  const [licenseOpen, setLicenseOpen] = useState(false);
  const [licenseStatus, setLicenseStatus] = useState('ACTIVE');
  const [expireDate, setExpireDate] = useState('');

  // Branch Add State
  const [branchOpen, setBranchOpen] = useState(false);
  const [branchName, setBranchName] = useState('');
  const [branchAddress, setBranchAddress] = useState('');

  // User Branch Assignment State
  const [userBranchOpen, setUserBranchOpen] = useState(false);
  const [selectedMembership, setSelectedMembership] = useState<any>(null);
  const [selectedUserBranchId, setSelectedUserBranchId] = useState('');

  const fetchProfileAndBranches = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [profileData, branchesData, usersData] = await Promise.all([
        saasApi.getCompanyProfile(id),
        saasApi.getCompanyBranches(id),
        saasApi.getCompanyUsers(id)
      ]);
      setProfile(profileData);
      setBranches(branchesData);
      setUsers(usersData);
      setLicenseStatus(profileData.license.status);
      if (profileData.license.endDate) {
        setExpireDate(new Date(profileData.license.endDate).toISOString().split('T')[0]);
      }
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Kompaniya ma\'lumotlarini yuklashda xatolik');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileAndBranches();
  }, [id]);

  const handleUpdateLicense = async () => {
    if (!id || !expireDate) return;
    try {
      await saasApi.updateLicense(id, {
        status: licenseStatus,
        endDate: new Date(expireDate).toISOString(),
      });
      setLicenseOpen(false);
      fetchProfileAndBranches();
    } catch (err: any) {
      alert(err.response?.data?.message ?? 'Litsenziyani tahrirlashda xatolik yuz berdi');
    }
  };

  const handleEditUserBranch = (membership: any) => {
    setSelectedMembership(membership);
    setSelectedUserBranchId(membership.branchId ?? 'all');
    setUserBranchOpen(true);
  };

  const handleUpdateUserBranch = async () => {
    if (!id || !selectedMembership) return;
    try {
      await saasApi.updateUserBranch(
        id,
        selectedMembership.userId,
        selectedUserBranchId === 'all' ? null : selectedUserBranchId
      );
      setUserBranchOpen(false);
      fetchProfileAndBranches();
    } catch (err: any) {
      alert(err.response?.data?.message ?? 'Foydalanuvchi filialini o\'zgartirishda xatolik');
    }
  };

  const handleAddBranch = async () => {
    if (!id || !branchName) return;
    try {
      await saasApi.createCompanyBranch(id, {
        name: branchName,
        address: branchAddress || undefined
      });
      setBranchOpen(false);
      setBranchName('');
      setBranchAddress('');
      fetchProfileAndBranches();
    } catch (err: any) {
      alert(err.response?.data?.message ?? 'Filial qo\'shishda xatolik yuz berdi');
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !profile) {
    return (
      <Box>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/super-admin/companies')} sx={{ mb: 2 }}>
          Orqaga qaytish
        </Button>
        <Alert severity="error">{error ?? 'Ma\'lumot topilmadi'}</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/super-admin/companies')} variant="outlined" sx={{ borderRadius: 2 }}>
          Orqaga
        </Button>
        <Typography variant="h5" fontWeight={700}>
          {profile.name} — Profil
        </Typography>
      </Box>

      {/* Grid containing Information Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Info */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3, borderRadius: 3, height: '100%' }}>
            <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
              Umumiy ma&apos;lumotlar
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">Kompaniya nomi:</Typography>
                <Typography variant="body2" fontWeight={600}>{profile.name}</Typography>
              </Box>
              <Divider />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">Kompaniya kodi:</Typography>
                <Typography variant="body2" fontWeight={600}>{profile.code}</Typography>
              </Box>
              <Divider />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">Holati:</Typography>
                <Typography variant="body2" fontWeight={600} color={profile.status === 'ACTIVE' ? 'success.main' : 'error.main'}>
                  {profile.status === 'ACTIVE' ? 'FAOL' : 'NOFAOL'}
                </Typography>
              </Box>
              <Divider />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">Yaratilgan sana:</Typography>
                <Typography variant="body2" fontWeight={600}>{new Date(profile.createdDate).toLocaleDateString()}</Typography>
              </Box>
              <Divider />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">Desktop versiya:</Typography>
                <Typography variant="body2" fontWeight={600}>{profile.desktopVersion}</Typography>
              </Box>
              <Divider />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">Baza migratsiyasi:</Typography>
                <Typography variant="body2" fontWeight={600}>{profile.databaseVersion}</Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* License */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3, borderRadius: 3, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" fontWeight={600} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <KeyIcon /> Litsenziya ma&apos;lumotlari
                </Typography>
                <Button startIcon={<EditIcon />} size="small" onClick={() => setLicenseOpen(true)}>
                  O&apos;zgartirish
                </Button>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Litsenziya holati:</Typography>
                  <Typography variant="body2" fontWeight={600} color={profile.license.status === 'ACTIVE' ? 'success.main' : 'warning.main'}>
                    {profile.license.status}
                  </Typography>
                </Box>
                <Divider />
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Boshlanish sanasi:</Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {profile.license.startDate ? new Date(profile.license.startDate).toLocaleDateString() : 'N/A'}
                  </Typography>
                </Box>
                <Divider />
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Tugash sanasi:</Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {profile.license.endDate ? new Date(profile.license.endDate).toLocaleDateString() : 'N/A'}
                  </Typography>
                </Box>
                <Divider />
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  <Typography variant="body2" color="text.secondary">Litsenziya kaliti (License Key):</Typography>
                  <Typography variant="caption" sx={{ p: 1, bgcolor: 'action.hover', borderRadius: 1, fontFamily: 'monospace', wordBreak: 'break-all' }}>
                    {profile.license.licenseKey}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Aggregate Counts */}
      <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
        Do&apos;kon Resurslari & Tranzaksiyalar
      </Typography>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 4, md: 2 }}>
          <Card sx={{ borderRadius: 2 }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <PeopleIcon color="primary" sx={{ mb: 1 }} />
              <Typography variant="h6" fontWeight={700}>{profile.counters.users}</Typography>
              <Typography variant="caption" color="text.secondary">Xodimlar</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 4, md: 2 }}>
          <Card sx={{ borderRadius: 2 }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <ProductIcon color="success" sx={{ mb: 1 }} />
              <Typography variant="h6" fontWeight={700}>{profile.counters.products}</Typography>
              <Typography variant="caption" color="text.secondary">Tovarlar</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 4, md: 2 }}>
          <Card sx={{ borderRadius: 2 }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <PeopleIcon color="info" sx={{ mb: 1 }} />
              <Typography variant="h6" fontWeight={700}>{profile.counters.customers}</Typography>
              <Typography variant="caption" color="text.secondary">Mijozlar</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 4, md: 2 }}>
          <Card sx={{ borderRadius: 2 }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <PeopleIcon color="secondary" sx={{ mb: 1 }} />
              <Typography variant="h6" fontWeight={700}>{profile.counters.suppliers}</Typography>
              <Typography variant="caption" color="text.secondary">Ta&apos;minotchilar</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 4, md: 2 }}>
          <Card sx={{ borderRadius: 2 }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <SalesIcon color="warning" sx={{ mb: 1 }} />
              <Typography variant="h6" fontWeight={700}>{profile.counters.sales}</Typography>
              <Typography variant="caption" color="text.secondary">Savdolar soni</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 4, md: 2 }}>
          <Card sx={{ borderRadius: 2 }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <SalesIcon color="error" sx={{ mb: 1 }} />
              <Typography variant="h6" fontWeight={700} noWrap sx={{ fontSize: '1.1rem' }}>
                {profile.counters.revenue.toLocaleString()}
              </Typography>
              <Typography variant="caption" color="text.secondary">Jami savdo (UZS)</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Edit License Dialog */}
      <Dialog open={licenseOpen} onClose={() => setLicenseOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Litsenziyani Tahrirlash</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <TextField select label="Litsenziya holati" fullWidth value={licenseStatus} onChange={(e) => setLicenseStatus(e.target.value)}>
            <MenuItem value="ACTIVE">Active</MenuItem>
            <MenuItem value="TRIAL">Trial</MenuItem>
            <MenuItem value="EXPIRED">Expired</MenuItem>
            <MenuItem value="SUSPENDED">Suspended</MenuItem>
          </TextField>
          <TextField
            label="Tugash muddati (Date)"
            type="date"
            fullWidth
            value={expireDate}
            onChange={(e) => setExpireDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLicenseOpen(false)}>Bekor qilish</Button>
          <Button onClick={handleUpdateLicense} variant="contained">Saqlash</Button>
        </DialogActions>
      </Dialog>

      {/* Branches Section */}
      <Box sx={{ mt: 5, mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" fontWeight={600}>
          Kompaniya Filiallari (Store Branches)
        </Typography>
        <Button variant="outlined" size="small" onClick={() => setBranchOpen(true)} sx={{ borderRadius: 2 }}>
          Yangi filial qo&apos;shish
        </Button>
      </Box>
      <Paper sx={{ p: 2, borderRadius: 3, overflow: 'hidden' }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell><Typography variant="body2" fontWeight={600}>Filial nomi</Typography></TableCell>
                <TableCell><Typography variant="body2" fontWeight={600}>Manzil</Typography></TableCell>
                <TableCell><Typography variant="body2" fontWeight={600}>Holat</Typography></TableCell>
                <TableCell align="right"><Typography variant="body2" fontWeight={600}>Yaratilgan sana</Typography></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {branches.map((b) => (
                <TableRow key={b.id}>
                  <TableCell>{b.name}</TableCell>
                  <TableCell>{b.address || '-'}</TableCell>
                  <TableCell>
                    <Chip
                      label={b.status === 'ACTIVE' ? 'Faol' : 'Nofaol'}
                      color={b.status === 'ACTIVE' ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">{new Date(b.createdAt).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
              {branches.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} align="center">Hozircha filiallar qo&apos;shilmagan</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Users Section */}
      <Box sx={{ mt: 5, mb: 3 }}>
        <Typography variant="h6" fontWeight={600}>
          Foydalanuvchilar va Filiallar (Users & Branch Assignments)
        </Typography>
      </Box>
      <Paper sx={{ p: 2, borderRadius: 3, overflow: 'hidden', mb: 3 }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell><Typography variant="body2" fontWeight={600}>Foydalanuvchi nomi</Typography></TableCell>
                <TableCell><Typography variant="body2" fontWeight={600}>Email</Typography></TableCell>
                <TableCell><Typography variant="body2" fontWeight={600}>Rol</Typography></TableCell>
                <TableCell><Typography variant="body2" fontWeight={600}>Biriktirilgan filial</Typography></TableCell>
                <TableCell align="right"><Typography variant="body2" fontWeight={600}>Amallar</Typography></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>{u.user.firstName} {u.user.lastName}</TableCell>
                  <TableCell>{u.user.email}</TableCell>
                  <TableCell>
                    <Chip label={u.role.name} size="small" color="primary" variant="outlined" />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={u.branch ? u.branch.name : 'Asosiy filial (Barchasi)'}
                      color={u.branch ? 'secondary' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Button
                      size="small"
                      startIcon={<EditIcon />}
                      onClick={() => handleEditUserBranch(u)}
                    >
                      Filialni o&apos;zgartirish
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {users.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center">Hozircha foydalanuvchilar topilmadi</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Edit User Branch Dialog */}
      <Dialog open={userBranchOpen} onClose={() => setUserBranchOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Foydalanuvchi Filialini Tanlash</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            {selectedMembership ? `${selectedMembership.user.firstName} ${selectedMembership.user.lastName}` : ''} uchun filialni tanlang:
          </Typography>
          <TextField
            select
            label="Biriktirilgan filial"
            fullWidth
            value={selectedUserBranchId}
            onChange={(e) => setSelectedUserBranchId(e.target.value)}
          >
            <MenuItem value="all">Asosiy filial (Bosh admin / Barchasi)</MenuItem>
            {branches.map((b) => (
              <MenuItem key={b.id} value={b.id}>
                {b.name}
              </MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUserBranchOpen(false)}>Bekor qilish</Button>
          <Button onClick={handleUpdateUserBranch} variant="contained">Saqlash</Button>
        </DialogActions>
      </Dialog>

      {/* Add Branch Dialog */}
      <Dialog open={branchOpen} onClose={() => setBranchOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Yangi Filial Qo&apos;shish</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <TextField label="Filial nomi" fullWidth value={branchName} onChange={(e) => setBranchName(e.target.value)} autoFocus />
          <TextField label="Manzil" fullWidth value={branchAddress} onChange={(e) => setBranchAddress(e.target.value)} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBranchOpen(false)}>Bekor qilish</Button>
          <Button onClick={handleAddBranch} variant="contained">Qo&apos;shish</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
export default SaaSCompanyProfilePage;
