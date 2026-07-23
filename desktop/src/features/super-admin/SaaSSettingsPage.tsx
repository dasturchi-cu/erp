import React, { useEffect, useState } from 'react';
import { Box, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography, CircularProgress, Alert, Dialog, DialogTitle, DialogContent, DialogActions, TextField, IconButton } from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { saasApi } from '@/api/services/saasApi';

export function SaaSSettingsPage() {
  const [admins, setAdmins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dialog States
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  // Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const fetchAdmins = () => {
    setLoading(true);
    saasApi.getAdmins()
      .then((data) => {
        setAdmins(data);
      })
      .catch((err) => {
        setError(err.response?.data?.message ?? 'Adminlarni yuklashda xatolik yuz berdi');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const handleCreate = async () => {
    if (!email || !password) return;
    try {
      await saasApi.createAdmin({ email, password });
      setCreateOpen(false);
      setEmail('');
      setPassword('');
      fetchAdmins();
    } catch (err: any) {
      alert(err.response?.data?.message ?? 'Yangi admin qo\'shishda xatolik');
    }
  };

  const handleEditOpen = (admin: any) => {
    setSelectedId(admin.id);
    setEmail(admin.email);
    setPassword('');
    setEditOpen(true);
  };

  const handleEdit = async () => {
    if (!selectedId || !email) return;
    try {
      await saasApi.updateAdmin(selectedId, {
        email,
        password: password || undefined,
      });
      setEditOpen(false);
      fetchAdmins();
    } catch (err: any) {
      alert(err.response?.data?.message ?? 'Admin ma\'lumotlarini tahrirlashda xatolik');
    }
  };

  const handleDeleteOpen = (id: string) => {
    setSelectedId(id);
    setDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedId) return;
    try {
      await saasApi.deleteAdmin(selectedId);
      setDeleteOpen(false);
      fetchAdmins();
    } catch (err: any) {
      alert(err.response?.data?.message ?? 'Adminni o\'chirishda xatolik');
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>
          Super Adminstratorlar Boshqaruvi
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateOpen(true)}
          sx={{ borderRadius: 2 }}
        >
          Super Admin qo&apos;shish
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><Typography variant="body2" fontWeight={600}>Email Manzili</Typography></TableCell>
                  <TableCell><Typography variant="body2" fontWeight={600}>Yaratilgan Sana</Typography></TableCell>
                  <TableCell align="right"><Typography variant="body2" fontWeight={600}>Amallar</Typography></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {admins.map((admin) => (
                  <TableRow key={admin.id}>
                    <TableCell>{admin.email}</TableCell>
                    <TableCell>{new Date(admin.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell align="right">
                      <IconButton color="info" onClick={() => handleEditOpen(admin)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton color="error" onClick={() => handleDeleteOpen(admin.id)}>
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* Create Dialog */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Super Admin Qo&apos;shish</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <TextField label="Email" type="email" fullWidth value={email} onChange={(e) => setEmail(e.target.value)} />
          <TextField label="Parol" type="password" fullWidth value={password} onChange={(e) => setPassword(e.target.value)} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateOpen(false)}>Bekor qilish</Button>
          <Button onClick={handleCreate} variant="contained">Qo&apos;shish</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Adminni Tahrirlash</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <TextField label="Email" type="email" fullWidth value={email} onChange={(e) => setEmail(e.target.value)} />
          <TextField label="Parol (faqat o'zgartirish uchun)" type="password" fullWidth value={password} onChange={(e) => setPassword(e.target.value)} placeholder="O'zgarishsiz qoldirish uchun bo'sh qoldiring" />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)}>Bekor qilish</Button>
          <Button onClick={handleEdit} variant="contained">Saqlash</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)}>
        <DialogTitle>Tasdiqlang</DialogTitle>
        <DialogContent>
          Ushbu Super Admin hisobi o&apos;chirilishini tasdiqlaysizmi?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteOpen(false)}>Bekor qilish</Button>
          <Button onClick={handleDelete} color="error" variant="contained">O&apos;chirish</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
export default SaaSSettingsPage;
