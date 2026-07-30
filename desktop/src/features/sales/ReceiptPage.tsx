import { useParams, useNavigate } from 'react-router-dom';
import { Box, Button, Divider, Paper, Typography, CircularProgress } from '@mui/material';
import PrintIcon from '@mui/icons-material/Print';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useSalesStore } from '@/stores/salesStore';
import { formatUzs, formatUsd } from '@/utils/format';
import { useNotification } from '@/components/feedback/NotificationProvider';
import { useEffect, useState } from 'react';
import { salesApi } from '@/api/services/salesApi';
import type { SaleDetail } from '@/types/sales';

export function ReceiptPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { success, error: notifyError } = useNotification();
  const storeSale = useSalesStore((s) => s.getSaleById(id ?? ''));

  const [sale, setSale] = useState<SaleDetail | null>(storeSale || null);
  const [loading, setLoading] = useState(!storeSale);
  const [template, setTemplate] = useState<any>({
    name: 'Standart Chek',
    isDefault: true,
    logoUrl: null,
    phone: '+998 90 123-45-67',
    address: 'Tashkent, Uzbekistan',
    telegram: '@erp_market',
    instagram: '@erp_market',
    website: 'www.erp-market.uz',
    footerText: 'Xaridingiz uchun rahmat!',
    showQrCode: true,
    showBarcode: true,
  });

  useEffect(() => {
    salesApi.getReceiptTemplates()
      .then((data) => {
        if (data && data.length > 0) {
          const def = data.find((t) => t.isDefault) || data[0];
          setTemplate(def);
        }
      })
      .catch((err) => {
        console.error('Chek shablonini yuklashda xatolik:', err);
      });
  }, []);

  useEffect(() => {
    if (!id) return;
    if (!sale) {
      setLoading(true);
      salesApi.getById(id)
        .then((data) => {
          setSale(data);
        })
        .catch((err) => {
          console.error('Chek yuklashda xatolik:', err);
          notifyError('Chek ma\'lumotlarini yuklab bo\'lmadi');
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [id, sale, notifyError]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!sale) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h6">Chek topilmadi</Typography>
        <Button sx={{ mt: 2 }} onClick={() => navigate(-1)}>Orqaga</Button>
      </Box>
    );
  }

  const handlePrint = () => {
    window.print();
    success('Chop etish dialogi ochildi');
  };

  const receiptUrl = `${window.location.origin}/sales/receipt/${sale.id}`;

  return (
    <Box sx={{ maxWidth: 420, mx: 'auto', py: 3 }}>
      {/* Action Buttons (Hidden when printing) */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          mb: 3,
          px: 1,
          '@media print': { display: 'none' },
        }}
      >
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(`/sales/history/${sale.id}`)}
        >
          Tafsilotlar
        </Button>
        <Button
          variant="contained"
          color="primary"
          startIcon={<PrintIcon />}
          onClick={handlePrint}
          sx={{ px: 3 }}
        >
          Chop etish
        </Button>
      </Box>

      {/* Styled Printable Receipt */}
      <Paper
        id="receipt"
        sx={{
          p: 4,
          fontFamily: 'monospace',
          backgroundColor: '#fff',
          color: '#000',
          boxShadow: 2,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
          '@media print': {
            boxShadow: 'none',
            border: 'none',
            p: 0,
            width: '100%',
            maxWidth: '100%',
          },
        }}
      >
        {/* Company Logo */}
        {template.logoUrl && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
            <img
              src={template.logoUrl}
              alt="Kompaniya Logosi"
              style={{ maxHeight: 60, maxWidth: 180, objectFit: 'contain' }}
            />
          </Box>
        )}

        {/* Company Headers */}
        <Typography align="center" fontWeight={800} fontSize={20} sx={{ letterSpacing: 1, mb: 0.5 }}>
          {template.logoUrl ? '' : 'ERP MARKET'}
        </Typography>
        <Typography align="center" variant="body2" sx={{ fontSize: '0.85rem' }}>
          {template.address || 'O\'zbekiston'}
        </Typography>
        <Typography align="center" variant="body2" sx={{ fontSize: '0.85rem', mb: 1.5 }}>
          Tel: {template.phone}
        </Typography>

        <Divider sx={{ borderStyle: 'dashed', my: 1.5, borderColor: '#000' }} />

        {/* Sale Meta Information */}
        <Box sx={{ mb: 2, fontSize: '0.8rem' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>Chek №:</Typography>
            <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>{sale.number}</Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>Sana:</Typography>
            <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>{new Date(sale.createdAt).toLocaleString('uz-UZ')}</Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>Kassir:</Typography>
            <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>{sale.cashier}</Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>Mijoz:</Typography>
            <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>{sale.customerName}</Typography>
          </Box>
        </Box>

        <Divider sx={{ borderStyle: 'dashed', my: 1.5, borderColor: '#000' }} />

        {/* Products Title */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, fontWeight: 700, fontSize: '0.8rem' }}>
          <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 'bold' }}>Mahsulot nomi</Typography>
          <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 'bold' }}>Jami</Typography>
        </Box>

        {/* Line Items */}
        {sale.lineItems.map((l) => (
          <Box key={l.productId} sx={{ mb: 1.5, fontSize: '0.8rem' }}>
            <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
              {l.productName}
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="caption" sx={{ fontFamily: 'monospace', color: '#444' }}>
                {l.quantity} x {formatUzs(l.unitPriceUzs)}
              </Typography>
              <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
                {formatUzs(l.totalUzs)}
              </Typography>
            </Box>
          </Box>
        ))}

        <Divider sx={{ borderStyle: 'dashed', my: 1.5, borderColor: '#000' }} />

        {/* Total Summaries */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5, fontWeight: 700 }}>
          <Typography variant="body1" sx={{ fontFamily: 'monospace', fontWeight: 'bold' }}>JAMI (UZS):</Typography>
          <Typography variant="body1" sx={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{formatUzs(sale.totalUzs)}</Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
          <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>Jami (USD equivalent):</Typography>
          <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>{formatUsd(sale.totalUsd)}</Typography>
        </Box>

        <Divider sx={{ borderStyle: 'dashed', my: 1.5, borderColor: '#000' }} />

        {/* Branding & Social Links */}
        <Box sx={{ textAlign: 'center', fontSize: '0.75rem', mb: 2 }}>
          {template.telegram && (
            <Typography variant="caption" display="block" sx={{ fontFamily: 'monospace' }}>
              Telegram: {template.telegram}
            </Typography>
          )}
          {template.instagram && (
            <Typography variant="caption" display="block" sx={{ fontFamily: 'monospace' }}>
              Instagram: {template.instagram}
            </Typography>
          )}
          {template.website && (
            <Typography variant="caption" display="block" sx={{ fontFamily: 'monospace' }}>
              Website: {template.website}
            </Typography>
          )}
        </Box>

        {/* Custom Footer */}
        {template.footerText && (
          <Typography
            align="center"
            variant="body2"
            sx={{ fontStyle: 'italic', fontSize: '0.8rem', mt: 1, mb: 2, display: 'block' }}
          >
            {template.footerText}
          </Typography>
        )}

        {/* QR Code */}
        {template.showQrCode && (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 3, mb: 2 }}>
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=110x110&data=${encodeURIComponent(receiptUrl)}`}
              alt="Chek QR kodi"
              style={{ width: 100, height: 100 }}
            />
            <Typography variant="caption" sx={{ fontSize: '0.65rem', mt: 0.5, letterSpacing: 0.5 }}>
              Skanerlang: Chek Haqiqiyligi
            </Typography>
          </Box>
        )}

        {/* Barcode */}
        {template.showBarcode && (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 2 }}>
            <img
              src={`https://bwipjs-api.metafloor.com/?bcid=code128&text=${encodeURIComponent(sale.number)}&scale=1`}
              alt="Chek shtrix kodi"
              style={{ maxWidth: '100%', height: 45 }}
            />
            <Typography variant="caption" sx={{ fontSize: '0.65rem', mt: 0.25 }}>
              * {sale.number} *
            </Typography>
          </Box>
        )}
      </Paper>

      {/* Global CSS for seamless print window print margins and page breaks */}
      <style>{`
        @media print {
          body {
            background: none;
            color: #000;
          }
          #receipt {
            box-shadow: none !important;
            border: none !important;
            padding: 0 !important;
            margin: 0 !important;
          }
        }
      `}</style>
    </Box>
  );
}
