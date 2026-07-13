import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CircularProgress,
  Divider,
  FormControl,
  FormControlLabel,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Switch,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable, StatusChip, type Column } from '@/components/common/DataTable';
import { useAuthStore } from '@/stores/authStore';
import { inventoryApi } from '@/api/services/domainApi';
import { salesApi } from '@/api/services/salesApi';
import { useAppTheme } from '@/theme/ThemeProvider';
import { useNotification } from '@/components/feedback/NotificationProvider';

const branchColumns: Column<any>[] = [
  { id: 'name', label: 'Filial nomi', render: (r) => r.name },
  { id: 'code', label: 'Filial kodi', render: (r) => r.code || '—' },
  {
    id: 'status',
    label: 'Holat',
    render: (r) => (
      <StatusChip
        label={r.status === 'ACTIVE' ? 'Faol' : 'Nofaol'}
        color={r.status === 'ACTIVE' ? 'success' : 'default'}
      />
    ),
  },
];

export function SettingsPage() {
  const [tab, setTab] = useState(0);
  const { activeCompany } = useAuthStore();
  const { resolvedMode, setMode } = useAppTheme();
  const [notifications, setNotifications] = useState(() => {
    return localStorage.getItem('setting-notifications') !== 'false';
  });
  const { success, error: notifyError } = useNotification();

  const [branches, setBranches] = useState<any[]>([]);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [branchError, setBranchError] = useState<string | null>(null);

  const [companyDetails, setCompanyDetails] = useState({
    name: '',
    tin: '—',
    address: 'O\'zbekiston, Toshkent sh.',
    phone: '+998 (--) --- -- --',
    email: 'info@erp.uz',
    defaultCurrency: 'both',
  });

  const [template, setTemplate] = useState<any>({
    name: 'Standart Chek',
    isDefault: true,
    logoUrl: '',
    phone: '+998 90 123-45-67',
    address: 'Tashkent, Uzbekistan',
    telegram: '@erp_market',
    instagram: '@erp_market',
    website: 'www.erp-market.uz',
    footerText: 'Xaridingiz uchun rahmat!',
    showQrCode: true,
    showBarcode: true,
  });
  const [loadingTemplate, setLoadingTemplate] = useState(false);

  // Printer settings
  const [printerPaperSize, setPrinterPaperSize] = useState<'58mm' | '80mm' | 'A4'>(() => {
    return (localStorage.getItem('setting-printer-paper-size') as any) || '80mm';
  });
  const [printerAutoPrint, setPrinterAutoPrint] = useState<boolean>(() => {
    return localStorage.getItem('setting-printer-auto-print') !== 'false';
  });
  const [printerCopies, setPrinterCopies] = useState<number>(() => {
    return parseInt(localStorage.getItem('setting-printer-copies') || '1', 10);
  });

  // Backup settings
  const [backupAuto, setBackupAuto] = useState<boolean>(() => {
    return localStorage.getItem('setting-backup-auto') !== 'false';
  });
  const [backupTime, setBackupTime] = useState<string>(() => {
    return localStorage.getItem('setting-backup-time') || '02:00';
  });
  const [backupRetention, setBackupRetention] = useState<number>(() => {
    return parseInt(localStorage.getItem('setting-backup-retention') || '30', 10);
  });

  const updateNotifications = (val: boolean) => {
    setNotifications(val);
    localStorage.setItem('setting-notifications', String(val));
    success('Bildirishnomalar sozlamalari saqlandi');
  };

  const updatePrinterPaperSize = (val: '58mm' | '80mm' | 'A4') => {
    setPrinterPaperSize(val);
    localStorage.setItem('setting-printer-paper-size', val);
    success('Printer qog\'oz o\'lchami yangilandi');
  };

  const updatePrinterAutoPrint = (val: boolean) => {
    setPrinterAutoPrint(val);
    localStorage.setItem('setting-printer-auto-print', String(val));
    success('Avtomatik chop etish sozlamasi yangilandi');
  };

  const updatePrinterCopies = (val: number) => {
    setPrinterCopies(val);
    localStorage.setItem('setting-printer-copies', String(val));
    success('Chek nusxalari soni saqlandi');
  };

  const updateBackupAuto = (val: boolean) => {
    setBackupAuto(val);
    localStorage.setItem('setting-backup-auto', String(val));
    success('Avtomatik zaxiralash rejimi yangilandi');
  };

  const updateBackupTime = (val: string) => {
    setBackupTime(val);
    localStorage.setItem('setting-backup-time', val);
    success('Zaxiralash vaqti belgilandi');
  };

  const updateBackupRetention = (val: number) => {
    setBackupRetention(val);
    localStorage.setItem('setting-backup-retention', String(val));
    success('Zaxiralarni saqlash muddati yangilandi');
  };

  const handleSaveTemplate = async () => {
    try {
      await salesApi.saveReceiptTemplate(template);
      success('Chek shabloni muvaffaqiyatli saqlandi!');
    } catch (err) {
      notifyError('Shablonni saqlashda xatolik yuz berdi');
    }
  };

  useEffect(() => {
    if (activeCompany) {
      setCompanyDetails((prev) => ({
        ...prev,
        name: activeCompany.name,
      }));
    }
  }, [activeCompany]);

  useEffect(() => {
    if (tab === 2) {
      setLoadingBranches(true);
      setBranchError(null);
      inventoryApi
        .listBranches()
        .then((data) => {
          setBranches(data);
        })
        .catch((err) => {
          setBranchError((err as { message?: string }).message ?? 'Filiallarni yuklashda xatolik yuz berdi');
        })
        .finally(() => {
          setLoadingBranches(false);
        });
    } else if (tab === 3) {
      setLoadingTemplate(true);
      salesApi.getReceiptTemplates()
        .then((data) => {
          if (data && data.length > 0) {
            const def = data.find((t) => t.isDefault) || data[0];
            setTemplate(def);
          }
        })
        .catch((err) => {
          notifyError('Chek shablonlarini yuklashda xatolik');
        })
        .finally(() => {
          setLoadingTemplate(false);
        });
    }
  }, [tab, notifyError]);

  return (
    <>
      <PageHeader title="Sozlamalar" subtitle="Kompaniya, afzalliklar va filiallar" />

      <Card variant="outlined" sx={{ mb: 3 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
          <Tab label="Kompaniya" />
          <Tab label="Afzalliklar" />
          <Tab label="Filiallar" />
          <Tab label="Chek Dizayneri" />
          <Tab label="Printer Sozlamalari" />
          <Tab label="Zaxira Sozlamalari" />
        </Tabs>

        <Box sx={{ p: 3 }}>
          {tab === 0 && (
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Kompaniya nomi"
                  value={companyDetails.name}
                  disabled
                  helperText="Kompaniya nomini o'zgartirish faqat tizim administratori orqali amalga oshiriladi"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="STIR (TIN)"
                  value={companyDetails.tin}
                  disabled
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Manzil"
                  value={companyDetails.address}
                  disabled
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Telefon"
                  value={companyDetails.phone}
                  disabled
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Email"
                  value={companyDetails.email}
                  disabled
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth disabled>
                  <InputLabel>Asosiy valyuta</InputLabel>
                  <Select
                    value={companyDetails.defaultCurrency}
                    label="Asosiy valyuta"
                    readOnly
                  >
                    <MenuItem value="UZS">Faqat UZS</MenuItem>
                    <MenuItem value="USD">Faqat USD</MenuItem>
                    <MenuItem value="both">UZS va USD (Ikkala valyuta)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField fullWidth label="Vaqt mintaqasi" value="Asia/Tashkent" disabled />
              </Grid>
            </Grid>
          )}

          {tab === 1 && (
            <Box sx={{ maxWidth: 480 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={resolvedMode === 'dark'}
                    onChange={(e) => setMode(e.target.checked ? 'dark' : 'light')}
                  />
                }
                label="Qorong'u mavzu (Tungi rejim)"
              />
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2, ml: 4 }}>
                Interfeys rang sxemasini o&apos;zgartirish
              </Typography>
              <FormControlLabel
                control={<Switch checked={notifications} onChange={(e) => updateNotifications(e.target.checked)} />}
                label="Bildirishnomalar"
              />
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2, ml: 4 }}>
                Past qoldiq va to&apos;lovlar haqida xabarlar
              </Typography>
              <FormControlLabel control={<Switch defaultChecked disabled />} label="Avtomatik zaxira nusxa" />
              <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
                Har kecha soat 02:00 da zaxira nusxa olish (Tizim tomonidan avtomatlashtirilgan)
              </Typography>
            </Box>
          )}

          {tab === 2 && (
            <>
              {loadingBranches ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress size={24} />
                </Box>
              ) : branchError ? (
                <Typography color="error">{branchError}</Typography>
              ) : (
                <DataTable columns={branchColumns} rows={branches} rowKey={(r) => r.id} dense />
              )}
            </>
          )}

          {tab === 3 && (
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                  Chek Sozlamalari
                </Typography>
                {loadingTemplate ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress size={24} />
                  </Box>
                ) : (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Shablon nomi"
                      value={template.name}
                      onChange={(e) => setTemplate({ ...template, name: e.target.value })}
                    />
                    <TextField
                      fullWidth
                      size="small"
                      label="Logo URL"
                      value={template.logoUrl || ''}
                      onChange={(e) => setTemplate({ ...template, logoUrl: e.target.value })}
                      placeholder="Masalan: https://site.uz/logo.png"
                    />
                    <TextField
                      fullWidth
                      size="small"
                      label="Telefon raqami"
                      value={template.phone || ''}
                      onChange={(e) => setTemplate({ ...template, phone: e.target.value })}
                    />
                    <TextField
                      fullWidth
                      size="small"
                      label="Manzil"
                      value={template.address || ''}
                      onChange={(e) => setTemplate({ ...template, address: e.target.value })}
                    />
                    <TextField
                      fullWidth
                      size="small"
                      label="Telegram kanal/bot"
                      value={template.telegram || ''}
                      onChange={(e) => setTemplate({ ...template, telegram: e.target.value })}
                    />
                    <TextField
                      fullWidth
                      size="small"
                      label="Instagram sahifa"
                      value={template.instagram || ''}
                      onChange={(e) => setTemplate({ ...template, instagram: e.target.value })}
                    />
                    <TextField
                      fullWidth
                      size="small"
                      label="Veb-sayt"
                      value={template.website || ''}
                      onChange={(e) => setTemplate({ ...template, website: e.target.value })}
                    />
                    <TextField
                      fullWidth
                      size="small"
                      label="Chek osti yozuvi (Footer)"
                      value={template.footerText || ''}
                      onChange={(e) => setTemplate({ ...template, footerText: e.target.value })}
                      multiline
                      rows={2}
                    />
                    <Box sx={{ display: 'flex', gap: 4 }}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={template.showQrCode}
                            onChange={(e) => setTemplate({ ...template, showQrCode: e.target.checked })}
                          />
                        }
                        label="QR kodni ko'rsatish"
                      />
                      <FormControlLabel
                        control={
                          <Switch
                            checked={template.showBarcode}
                            onChange={(e) => setTemplate({ ...template, showBarcode: e.target.checked })}
                          />
                        }
                        label="Shtrix-kodni ko'rsatish"
                      />
                    </Box>
                    <Box sx={{ mt: 1 }}>
                      <Button variant="contained" onClick={handleSaveTemplate}>
                        Shablonni saqlash
                      </Button>
                    </Box>
                  </Box>
                )}
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                  Jonli ko'rinish (Live Preview)
                </Typography>
                <Paper
                  sx={{
                    p: 3,
                    maxWidth: 320,
                    mx: 'auto',
                    fontFamily: 'monospace',
                    border: '1px solid',
                    borderColor: 'divider',
                    boxShadow: 3,
                    backgroundColor: '#fff',
                    color: '#000',
                  }}
                >
                  {template.logoUrl && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                      <img src={template.logoUrl} alt="Logo" style={{ maxHeight: 55, maxWidth: 160 }} />
                    </Box>
                  )}
                  <Typography align="center" fontWeight={700} sx={{ fontSize: '1.1rem', mb: 0.5 }}>
                    {companyDetails.name.toUpperCase()}
                  </Typography>
                  <Typography align="center" variant="caption" display="block">
                    {template.address || 'Manzil kiritilmagan'}
                  </Typography>
                  <Typography align="center" variant="caption" display="block" sx={{ mb: 1 }}>
                    Tel: {template.phone || 'Telefon kiritilmagan'}
                  </Typography>
                  <Divider sx={{ borderStyle: 'dashed', my: 1, borderColor: '#000' }} />
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="caption">1. Mahsulot A</Typography>
                    <Typography variant="caption">15,000 UZS</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="caption">   2.0 x 7,500</Typography>
                  </Box>
                  
                  <Divider sx={{ borderStyle: 'dashed', my: 1, borderColor: '#000' }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                    <Typography variant="body2">JAMI:</Typography>
                    <Typography variant="body2">15,000 UZS</Typography>
                  </Box>
                  <Divider sx={{ borderStyle: 'dashed', my: 1, borderColor: '#000' }} />

                  {template.telegram && (
                    <Typography variant="caption" display="block">Telegram: {template.telegram}</Typography>
                  )}
                  {template.instagram && (
                    <Typography variant="caption" display="block">Instagram: {template.instagram}</Typography>
                  )}
                  {template.website && (
                    <Typography variant="caption" display="block">Website: {template.website}</Typography>
                  )}
                  
                  {template.footerText && (
                    <Typography align="center" variant="caption" display="block" sx={{ mt: 1.5, fontStyle: 'italic' }}>
                      {template.footerText}
                    </Typography>
                  )}

                  {template.showQrCode && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 2 }}>
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=MOCK-RECEIPT-URL`}
                        alt="QR Code"
                        style={{ width: 80, height: 80 }}
                      />
                      <Typography variant="caption" sx={{ fontSize: '0.65rem', mt: 0.5 }}>
                        Chek haqiqiyligini tekshirish
                      </Typography>
                    </Box>
                  )}

                  {template.showBarcode && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 2 }}>
                      <img
                        src={`https://bwipjs-api.metafloor.com/?bcid=code128&text=SAL-10001&scale=1`}
                        alt="Barcode"
                        style={{ maxWidth: '100%', height: 40 }}
                      />
                      <Typography variant="caption" sx={{ fontSize: '0.65rem', mt: 0.25 }}>
                        * SAL-10001 *
                      </Typography>
                    </Box>
                  )}
                </Paper>
              </Grid>
            </Grid>
          )}

          {tab === 4 && (
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                  Printer Sozlamalari
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Qog'oz o'lchami</InputLabel>
                    <Select
                      value={printerPaperSize}
                      label="Qog'oz o'lchami"
                      onChange={(e) => updatePrinterPaperSize(e.target.value as any)}
                    >
                      <MenuItem value="58mm">58mm (Kichik termal chek)</MenuItem>
                      <MenuItem value="80mm">80mm (Standart termal chek)</MenuItem>
                      <MenuItem value="A4">A4 Hujjat (Ofis varag'i)</MenuItem>
                    </Select>
                  </FormControl>

                  <FormControlLabel
                    control={
                      <Switch
                        checked={printerAutoPrint}
                        onChange={(e) => updatePrinterAutoPrint(e.target.checked)}
                      />
                    }
                    label="Sotuvdan keyin avtomatik chop etish"
                  />

                  <TextField
                    fullWidth
                    size="small"
                    type="number"
                    label="Chop etiladigan nusxalar soni"
                    value={printerCopies}
                    onChange={(e) => updatePrinterCopies(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    slotProps={{ htmlInput: { min: 1, max: 5 } }}
                  />
                </Box>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                  O'lcham vizualizatsiyasi
                </Typography>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    p: 4,
                    border: '1px dashed',
                    borderColor: 'divider',
                    borderRadius: 2,
                    minHeight: 280,
                    bgcolor: 'action.hover',
                  }}
                >
                  <Box
                    sx={{
                      width: printerPaperSize === '58mm' ? 140 : printerPaperSize === '80mm' ? 200 : 260,
                      height: printerPaperSize === '58mm' ? 180 : printerPaperSize === '80mm' ? 240 : 300,
                      bgcolor: '#fff',
                      boxShadow: 2,
                      border: '1px solid #ddd',
                      borderRadius: 1,
                      p: 2,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      transition: 'all 0.3s ease',
                    }}
                  >
                    <Box>
                      <Box sx={{ height: 6, bgcolor: '#eee', mb: 1, width: '40%' }} />
                      <Box sx={{ height: 6, bgcolor: '#eee', mb: 1, width: '80%' }} />
                      <Box sx={{ height: 6, bgcolor: '#eee', mb: 1, width: '60%' }} />
                    </Box>
                    <Typography align="center" variant="caption" sx={{ color: '#888', fontWeight: 600 }}>
                      {printerPaperSize} format
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                      <Box sx={{ height: 20, width: 20, bgcolor: '#ddd' }} />
                    </Box>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          )}

          {tab === 5 && (
            <Box sx={{ maxWidth: 480 }}>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                Zaxira Sozlamalari
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={backupAuto}
                      onChange={(e) => updateBackupAuto(e.target.checked)}
                    />
                  }
                  label="Har kuni avtomatik zaxiralash (Auto backup)"
                />
                
                <TextField
                  fullWidth
                  size="small"
                  type="time"
                  label="Kundalik zaxiralash vaqti"
                  value={backupTime}
                  onChange={(e) => updateBackupTime(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  disabled={!backupAuto}
                />

                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  label="Zaxira nusxalarini saqlash muddati (Kun)"
                  value={backupRetention}
                  onChange={(e) => updateBackupRetention(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  helperText="Ushbu muddatdan eski zaxira fayllari disk to'lib ketishini oldini olish uchun avtomatik o'chiriladi"
                />
              </Box>
            </Box>
          )}
        </Box>
      </Card>
    </>
  );
}
