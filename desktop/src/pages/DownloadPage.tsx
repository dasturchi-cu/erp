import React from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  Paper,
  Divider,
  Stack
} from '@mui/material';
import {
  DesktopWindows as WindowsIcon,
  Android as AndroidIcon,
  Language as WebIcon,
  Download as DownloadIcon,
  CheckCircle as CheckIcon,
  ArrowBack as BackIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

export function DownloadPage() {
  const navigate = useNavigate();

  const handleDownloadExe = () => {
    // Direct link to ERP Windows Release or GitHub raw artifact
    window.location.href = 'https://github.com/dasturchi-cu/erp/releases/latest/download/ERP-Desktop-Setup.exe';
  };

  const handleDownloadApk = () => {
    // Direct link to ERP Mobile Release APK
    window.location.href = 'https://raw.githubusercontent.com/dasturchi-cu/erp/main/mobile/ERP-Mobile.apk';
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: '#0F172A',
        color: '#F8FAFC',
        py: 6,
        px: 2
      }}
    >
      <Container maxWidth="lg">
        {/* Header navigation */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 6 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: 3,
                bgcolor: 'primary.main',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: 22,
                boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)'
              }}
            >
              E
            </Box>
            <Typography variant="h6" fontWeight={800} letterSpacing={0.5}>
              ERP Enterprise System
            </Typography>
          </Box>

          <Button
            variant="outlined"
            startIcon={<BackIcon />}
            onClick={() => navigate('/login')}
            sx={{
              borderColor: 'rgba(255,255,255,0.2)',
              color: '#F8FAFC',
              '&:hover': { borderColor: '#818CF8', bgcolor: 'rgba(99, 102, 241, 0.1)' }
            }}
          >
            Tizimga Kirish
          </Button>
        </Box>

        {/* Hero Section */}
        <Box sx={{ textAlign: 'center', mb: 8, maxWidth: 720, mx: 'auto' }}>
          <Chip
            label="Rasmiy Dasturlar Versiyasi v2.0"
            color="primary"
            size="small"
            sx={{ mb: 2, fontWeight: 700, px: 1 }}
          />
          <Typography variant="h3" fontWeight={900} sx={{ mb: 2, lineHeight: 1.2 }}>
            ERP Dasturini Barcha Qurilmalaringizga Yuklab Oling
          </Typography>
          <Typography variant="body1" sx={{ color: '#94A3B8', fontSize: '1.1rem' }}>
            Kompyuter uchun Windows (.exe) versiyasi va mobil telefonlar uchun Android (.apk) versiyasini bir bosishda yuklab oling.
          </Typography>
        </Box>

        {/* Cards Grid */}
        <Grid container spacing={4} justifyContent="center">
          {/* Windows Desktop App */}
          <Grid size={{ xs: 12, md: 5 }}>
            <Card
              sx={{
                height: '100%',
                bgcolor: '#1E293B',
                color: '#FFFFFF',
                borderRadius: 4,
                border: '1px solid rgba(255, 255, 255, 0.08)',
                boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
                transition: 'transform 0.2s, border-color 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  borderColor: '#818CF8'
                }
              }}
            >
              <CardContent sx={{ p: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 3,
                      bgcolor: 'rgba(59, 130, 246, 0.15)',
                      color: '#60A5FA'
                    }}
                  >
                    <WindowsIcon sx={{ fontSize: 36 }} />
                  </Box>
                  <Box>
                    <Typography variant="h5" fontWeight={800}>
                      Windows Desktop (.exe)
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#94A3B8' }}>
                      Windows 10 / 11 64-bit | Versiya 2.0.0
                    </Typography>
                  </Box>
                </Box>

                <Typography variant="body2" sx={{ color: '#CBD5E1', mb: 3, minHeight: 48 }}>
                  Kassa (POS), Ombor nazorati, kvitansiya chop etish (Thermal Printer) va to'liq oflayn ish rejimini qo'llab-quvvatlaydigan kompyuter dasturi.
                </Typography>

                <Stack spacing={1.5} sx={{ mb: 4 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CheckIcon color="success" fontSize="small" />
                    <Typography variant="body2">Ofitsiant va Kassir rejimida tegor ishlaydi</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CheckIcon color="success" fontSize="small" />
                    <Typography variant="body2">Chek va barkod skanerlarini qo'llaydi</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CheckIcon color="success" fontSize="small" />
                    <Typography variant="body2">Internet uzilsa ham oflayn savdo qiladi</Typography>
                  </Box>
                </Stack>

                <Button
                  variant="contained"
                  fullWidth
                  size="large"
                  startIcon={<DownloadIcon />}
                  onClick={handleDownloadExe}
                  sx={{
                    py: 1.8,
                    borderRadius: 3,
                    fontWeight: 800,
                    fontSize: '1rem',
                    bgcolor: '#3B82F6',
                    '&:hover': { bgcolor: '#2563EB' }
                  }}
                >
                  Windows (.exe) Yuklab Olish
                </Button>
              </CardContent>
            </Card>
          </Grid>

          {/* Android Mobile App */}
          <Grid size={{ xs: 12, md: 5 }}>
            <Card
              sx={{
                height: '100%',
                bgcolor: '#1E293B',
                color: '#FFFFFF',
                borderRadius: 4,
                border: '1px solid rgba(255, 255, 255, 0.08)',
                boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
                transition: 'transform 0.2s, border-color 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  borderColor: '#10B981'
                }
              }}
            >
              <CardContent sx={{ p: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 3,
                      bgcolor: 'rgba(16, 185, 129, 0.15)',
                      color: '#34D399'
                    }}
                  >
                    <AndroidIcon sx={{ fontSize: 36 }} />
                  </Box>
                  <Box>
                    <Typography variant="h5" fontWeight={800}>
                      Android Mobile (.apk)
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#94A3B8' }}>
                      Android 8.0+ | Hajmi: 18 MB
                    </Typography>
                  </Box>
                </Box>

                <Typography variant="body2" sx={{ color: '#CBD5E1', mb: 3, minHeight: 48 }}>
                  Smartfon va planshetlar uchun mobil ilova. Rahbar uchun real-vaqt moliyaviy hisobotlar va mobil kassa.
                </Typography>

                <Stack spacing={1.5} sx={{ mb: 4 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CheckIcon color="success" fontSize="small" />
                    <Typography variant="body2">Mobil kassa va mahsulot kirim qilish</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CheckIcon color="success" fontSize="small" />
                    <Typography variant="body2">Real-vaqt moliya va mijozlar qarzdorligi</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CheckIcon color="success" fontSize="small" />
                    <Typography variant="body2">Oflayn sinxronizatsiya va bildirishnomalar</Typography>
                  </Box>
                </Stack>

                <Button
                  variant="contained"
                  fullWidth
                  size="large"
                  startIcon={<DownloadIcon />}
                  onClick={handleDownloadApk}
                  sx={{
                    py: 1.8,
                    borderRadius: 3,
                    fontWeight: 800,
                    fontSize: '1rem',
                    bgcolor: '#10B981',
                    '&:hover': { bgcolor: '#059669' }
                  }}
                >
                  Android (.apk) Yuklab Olish
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Web Cloud Info Box */}
        <Paper
          sx={{
            mt: 6,
            p: 4,
            bgcolor: '#1E293B',
            borderRadius: 4,
            border: '1px solid rgba(255,255,255,0.05)',
            textAlign: 'center'
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 1, mb: 1 }}>
            <WebIcon color="primary" />
            <Typography variant="h6" fontWeight={700}>
              Web Cloud Portali Orqali Ishlash
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ color: '#94A3B8', mb: 3 }}>
            Ilova o'rnatmasdan brauzerning o'zidan barcha funksiyalardan foydalanishingiz mumkin.
          </Typography>
          <Button
            variant="contained"
            onClick={() => navigate('/login')}
            sx={{ px: 4, py: 1.2, borderRadius: 2.5, fontWeight: 700 }}
          >
            Vercel Cloud Portaliga Kirish
          </Button>
        </Paper>
      </Container>
    </Box>
  );
}

export default DownloadPage;
