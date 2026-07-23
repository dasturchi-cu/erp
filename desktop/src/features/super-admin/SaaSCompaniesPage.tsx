import React, { useEffect, useState } from 'react';
import { Box, Button, TextField, MenuItem, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TablePagination, Paper, Typography, CircularProgress, Alert, Dialog, DialogTitle, DialogContent, DialogActions, Chip, IconButton } from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, OpenInNew as OpenIcon, Archive as ArchiveIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { saasApi } from '@/api/services/saasApi';

export function SaaSCompaniesPage() {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Table state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Dialog states
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [status, setStatus] = useState('ACTIVE');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const fetchCompanies = () => {
    setLoading(true);
    saasApi.getCompanies({
      page: page + 1,
      limit: rowsPerPage,
      q: search || undefined,
      status: statusFilter || undefined,
    })
      .then((res) => {
        setCompanies(res.items);
        setTotal(res.total);
      })
      .catch((err) => {
        setError(err.response?.data?.message ?? 'Kompaniyalarni yuklashda xatolik yuz berdi');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchCompanies();
  }, [page, rowsPerPage, statusFilter]);

  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      setPage(0);
      fetchCompanies();
    }
  };

  const handleCreate = async () => {
    if (!name || !code) return;
    try {
      await saasApi.createCompany({ name, code, status });
      setCreateOpen(false);
      setName('');
      setCode('');
      fetchCompanies();
    } catch (err: any) {
      alert(err.response?.data?.message ?? 'Kompaniya yaratishda xatolik yuz berdi');
    }
  };

  const handleEditOpen = (company: any) => {
    setSelectedId(company.id);
    setName(company.name);
    setCode(company.code);
    setStatus(company.status);
    setEditOpen(true);
  };

  const handleEdit = async () => {
    if (!selectedId || !name || !code) return;
    try {
      await saasApi.updateCompany(selectedId, { name, code, status });
      setEditOpen(false);
      fetchCompanies();
    } catch (err: any) {
      alert(err.response?.data?.message ?? 'Kompaniyani tahrirlashda xatolik yuz berdi');
    }
  };

  const handleDeleteOpen = (id: string) => {
    setSelectedId(id);
    setDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedId) return;
    try {
      await saasApi.deleteCompany(selectedId);
      setDeleteOpen(false);
      fetchCompanies();
    } catch (err: any) {
      alert(err.response?.data?.message ?? 'Kompaniyani o\'chirishda xatolik yuz berdi');
    }
  };

  const handleArchive = async (company: any) => {
    const nextStatus = company.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await saasApi.updateCompany(company.id, { status: nextStatus });
      fetchCompanies();
    } catch (err: any) {
      alert(err.response?.data?.message ?? 'Kompaniya holatini o\'zgartirishda xatolik');
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>
          Kompaniyalar Boshqaruvi
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateOpen(true)}
          sx={{ borderRadius: 2 }}
        >
          Kompaniya qo&apos;shish
        </Button>
      </Box>

      {/* Filter and Search Bar */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 2, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField
          size="small"
          label="Qidirish (Nomi yoki Kodi)"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyPress={handleSearchKeyPress}
          sx={{ minWidth: 260 }}
        />
        <TextField
          select
          size="small"
          label="Holat"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(0);
          }}
          sx={{ minWidth: 160 }}
        >
          <MenuItem value="">Barchasi</MenuItem>
          <MenuItem value="ACTIVE">Faol</MenuItem>
          <MenuItem value="INACTIVE">Nofaol</MenuItem>
          <MenuItem value="ARCHIVED">Arxivlangan</MenuItem>
        </TextField>
        <Button variant="outlined" onClick={() => { setPage(0); fetchCompanies(); }}>
          Saralash
        </Button>
      </Paper>

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
                  <TableCell><Typography variant="body2" fontWeight={600}>Kompaniya nomi</Typography></TableCell>
                  <TableCell><Typography variant="body2" fontWeight={600}>Kodi</Typography></TableCell>
                  <TableCell><Typography variant="body2" fontWeight={600}>Holat</Typography></TableCell>
                  <TableCell><Typography variant="body2" fontWeight={600}>Litsenziya</Typography></TableCell>
                  <TableCell><Typography variant="body2" fontWeight={600}>Foydalanuvchilar</Typography></TableCell>
                  <TableCell><Typography variant="body2" fontWeight={600}>Mahsulotlar</Typography></TableCell>
                  <TableCell align="right"><Typography variant="body2" fontWeight={600}>Amallar</Typography></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {companies.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>{c.name}</TableCell>
                    <TableCell>
                      <Chip label={c.code} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={c.status === 'ACTIVE' ? 'Faol' : c.status === 'INACTIVE' ? 'Nofaol' : 'Arxiv'}
                        color={c.status === 'ACTIVE' ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={c.license}
                        color={c.license === 'ACTIVE' ? 'success' : c.license === 'TRIAL' ? 'info' : 'error'}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>{c.usersCount}</TableCell>
                    <TableCell>{c.productsCount}</TableCell>
                    <TableCell align="right">
                      <IconButton color="primary" onClick={() => navigate(`/super-admin/company/${c.id}`)}>
                        <OpenIcon />
                      </IconButton>
                      <IconButton color="info" onClick={() => handleEditOpen(c)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton color="default" onClick={() => handleArchive(c)}>
                        <ArchiveIcon />
                      </IconButton>
                      <IconButton color="error" onClick={() => handleDeleteOpen(c.id)}>
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {companies.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} align="center">Kompaniyalar topilmadi</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div"
            count={total}
            page={page}
            onPageChange={(_, p) => setPage(p)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
          />
        </Paper>
      )}

      {/* Create Dialog */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Kompaniya Qo&apos;shish</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <TextField label="Kompaniya nomi" fullWidth value={name} onChange={(e) => setName(e.target.value)} />
          <TextField label="Kompaniya kodi (e.g. MKT-TAS)" fullWidth value={code} onChange={(e) => setCode(e.target.value)} />
          <TextField select label="Holat" fullWidth value={status} onChange={(e) => setStatus(e.target.value)}>
            <MenuItem value="ACTIVE">Faol</MenuItem>
            <MenuItem value="INACTIVE">Nofaol</MenuItem>
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateOpen(false)}>Bekor qilish</Button>
          <Button onClick={handleCreate} variant="contained">Yaratish</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Kompaniyani Tahrirlash</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <TextField label="Kompaniya nomi" fullWidth value={name} onChange={(e) => setName(e.target.value)} />
          <TextField label="Kompaniya kodi" fullWidth value={code} onChange={(e) => setCode(e.target.value)} />
          <TextField select label="Holat" fullWidth value={status} onChange={(e) => setStatus(e.target.value)}>
            <MenuItem value="ACTIVE">Faol</MenuItem>
            <MenuItem value="INACTIVE">Nofaol</MenuItem>
            <MenuItem value="ARCHIVED">Arxivlangan</MenuItem>
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)}>Bekor qilish</Button>
          <Button onClick={handleEdit} variant="contained">Saqlash</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)}>
        <DialogTitle>O&apos;chirishni Tasdiqlang</DialogTitle>
        <DialogContent>
          Ushbu kompaniya va unga tegishli barcha ma&apos;lumotlar butunlay o&apos;chiriladi. Ushbu amalni ortga qaytarib bo&apos;lmaydi!
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteOpen(false)}>Bekor qilish</Button>
          <Button onClick={handleDelete} color="error" variant="contained">O&apos;chirish</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
export default SaaSCompaniesPage;
