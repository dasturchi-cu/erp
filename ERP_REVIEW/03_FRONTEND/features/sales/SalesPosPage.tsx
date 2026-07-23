import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Card,
  Chip,
  Divider,
  Grid,
  IconButton,
  Paper,
  TextField,
  Typography,
  InputAdornment,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import CloseIcon from '@mui/icons-material/Close';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import SearchIcon from '@mui/icons-material/Search';
import PaymentIcon from '@mui/icons-material/Payment';
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';
import RefreshIcon from '@mui/icons-material/Refresh';
import { PageHeader } from '@/components/common/PageHeader';
import { SegmentedControl } from '@/components/molecules/SegmentedControl';
import { BarcodeInput } from './components/BarcodeInput';
import { CustomerPicker } from './components/CustomerPicker';
import { PaymentDialog } from './components/PaymentDialog';
import { BelowCostConfirmDialog } from './components/BelowCostConfirmDialog';
import { InsufficientStockDialog } from './components/InsufficientStockDialog';
import { SaleSuccessOverlay } from './components/SaleSuccessOverlay';
import { usePosCartStore, lineStockQty } from '@/stores/posCartStore';
import { refreshAfterSaleMutation } from '@/utils/domainRefresh';
import { useCurrencyStore } from '@/stores/currencyStore';
import { useNotification } from '@/components/feedback/NotificationProvider';
import { productsApi, salesApi } from '@/api/services';
import { apiClient, API_BASE_URL } from '@/api/client';
import { formatUzs, formatUsd } from '@/utils/format';
import { productUsdFromUzs, lineTotalUsd } from '@/utils/currency';
import { cartLineBaseQuantity, productUnitLabel } from '@/constants/productUnits';
import type { Product } from '@/types/entities';
import type { PaymentDialogData, SaleDetail } from '@/types/sales';
import { useDisclosure } from '@/hooks/useListState';
import { useSalesStore } from '@/stores/salesStore';

function playBeep(type: 'success' | 'error') {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const audioCtx = new AudioContextClass();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    if (type === 'success') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1000, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.12);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.12);
    } else {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(120, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.25);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.25);
    }
  } catch (err) {
    console.error('Failed to play scanner beep:', err);
  }
}

const PosProductCard = memo(function PosProductCard({
  product,
  currency,
  exchangeRate,
  onAdd,
  onPreviewImage,
}: {
  product: Product;
  currency: 'UZS' | 'USD';
  exchangeRate: number;
  onAdd: (p: Product) => void;
  onPreviewImage: (src: string, title: string) => void;
}) {
  return (
    <Card
      variant="outlined"
      sx={{
        p: 1.5,
        cursor: 'pointer',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        '&:hover': { borderColor: 'primary.main', bgcolor: 'action.hover' },
      }}
      onClick={() => onAdd(product)}
    >
      <Box>
        {product.imageUrl ? (
          <Box
            sx={{ display: 'flex', justifyContent: 'center', mb: 1, bgcolor: 'grey.100', borderRadius: 1, p: 0.5, cursor: 'zoom-in' }}
            onClick={(e) => {
              e.stopPropagation();
              onPreviewImage(
                `${API_BASE_URL}/products/image/served/medium/${product.imageUrl}`,
                product.name,
              );
            }}
          >
            <img
              src={`${API_BASE_URL}/products/image/served/thumb/${product.imageUrl}`}
              alt={product.name}
              style={{ height: 64, objectFit: 'contain' }}
              loading="lazy"
            />
          </Box>
        ) : (
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1, bgcolor: 'grey.100', borderRadius: 1, p: 0.5, height: 64, alignItems: 'center' }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>Rasm yo&apos;q</Typography>
          </Box>
        )}
        <Typography variant="caption" color="text.secondary">
          {product.sku}
        </Typography>
        <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5, lineHeight: 1.3 }}>
          {product.name}
        </Typography>
      </Box>
      <Box>
        <Typography variant="body2" color="primary.main" fontWeight={700}>
          {currency === 'UZS'
            ? formatUzs(product.priceUzs)
            : formatUsd(productUsdFromUzs(product.priceUzs, exchangeRate))}
        </Typography>
        <Chip
          size="small"
          label={`Qoldiq: ${product.stock}`}
          color={product.stock <= product.minStockLevel ? 'warning' : 'default'}
          sx={{ mt: 0.5, height: 20, fontSize: '0.65rem' }}
        />
      </Box>
    </Card>
  );
});

export function SalesPosPage() {
  const { success, error: notifyError } = useNotification();
  const items = usePosCartStore((s) => s.items);
  const customer = usePosCartStore((s) => s.customer);
  const currency = usePosCartStore((s) => s.currency);
  const isProcessing = usePosCartStore((s) => s.isProcessing);
  const addProduct = usePosCartStore((s) => s.addProduct);
  const setQuantity = usePosCartStore((s) => s.setQuantity);
  const setSaleUnit = usePosCartStore((s) => s.setSaleUnit);
  const setUnitPrice = usePosCartStore((s) => s.setUnitPrice);
  const removeLine = usePosCartStore((s) => s.removeLine);
  const setCustomer = usePosCartStore((s) => s.setCustomer);
  const setCurrency = usePosCartStore((s) => s.setCurrency);
  const clearCart = usePosCartStore((s) => s.clearCart);
  const setProcessing = usePosCartStore((s) => s.setProcessing);

  const exchangeRate = useCurrencyStore((s) => s.rates.find((r) => r.status === 'active')?.rate ?? 12_620);
  const { totalUzs, totalUsd, itemCount } = useMemo(() => {
    const totalUzs = items.reduce(
      (s, i) => s + lineStockQty(i) * i.unitPriceUzs,
      0,
    );
    return {
      totalUzs,
      totalUsd: lineTotalUsd(totalUzs, exchangeRate),
      itemCount: items.reduce((s, i) => s + lineStockQty(i), 0),
    };
  }, [items, exchangeRate]);

  const belowCostLines = useMemo(
    () =>
      items.filter(
        (i) => i.product.purchasePriceUzs > 0 && i.unitPriceUzs <= i.product.purchasePriceUzs,
      ),
    [items],
  );

  const paymentDialog = useDisclosure();
  const [search, setSearch] = useState('');
  const [searchDebounced, setSearchDebounced] = useState('');
  const [barcode, setBarcode] = useState('');
  const [posProducts, setPosProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [stockError, setStockError] = useState<{ product: Product; requested: number } | null>(null);
  const [completedSale, setCompletedSale] = useState<SaleDetail | null>(null);
  const [belowCostOpen, setBelowCostOpen] = useState(false);
  const [pendingPayment, setPendingPayment] = useState<PaymentDialogData | null>(null);
  const [previewImage, setPreviewImage] = useState<{ src: string; title: string } | null>(null);



  useEffect(() => {
    const t = setTimeout(() => setSearchDebounced(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    let cancelled = false;
    setProductsLoading(true);
    void productsApi
      .posProducts(searchDebounced || undefined, 60)
      .then((data) => {
        if (!cancelled) setPosProducts(data.filter((p) => p.status === 'active' && p.stock > 0));
      })
      .finally(() => {
        if (!cancelled) setProductsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [searchDebounced]);

  const tryAddProduct = useCallback(
    (product: Product, qty = 1, saleUnit: 'piece' | 'box' = 'piece') => {
      const ok = addProduct(product, qty, saleUnit);
      if (!ok) {
        playBeep('error');
        const existing = items.find((i) => i.product.id === product.id);
        const requested =
          (existing ? lineStockQty(existing) : 0) +
          cartLineBaseQuantity(qty, saleUnit, product.unitsPerBox);
        setStockError({ product, requested });
      } else {
        playBeep('success');
      }
    },
    [addProduct, items],
  );

  const handleBarcodeScan = useCallback(
    async (code: string) => {
      const trimmed = code.trim();
      if (!trimmed) return;
      try {
        const product = await productsApi.getByBarcode(trimmed);
        if (product.status !== 'active' || product.stock <= 0) {
          playBeep('error');
          notifyError('Mahsulot mavjud emas yoki zaxirasi tugagan');
          return;
        }
        tryAddProduct(product);
        success(`${product.name} savatga qo'shildi`);
      } catch {
        const local = posProducts.find(
          (p) =>
            p.barcode === trimmed ||
            p.sku.toLowerCase() === trimmed.toLowerCase(),
        );
        if (local) {
          tryAddProduct(local);
          success(`${local.name} savatga qo'shildi`);
        } else {
          playBeep('error');
          notifyError('Mahsulot topilmadi');
        }
      }
    },
    [tryAddProduct, success, notifyError, posProducts],
  );

  const submitSale = async (data: PaymentDialogData) => {
    setProcessing(true);
    try {
      const paymentType =
        data.method === 'cash' ? 'CASH' : data.method === 'credit' ? 'CREDIT' : 'MIXED';

      const amountPaidUzs = data.dialogCurrency === 'UZS' ? Math.round(data.receivedUzs) : 0;
      const amountPaidUsd = data.dialogCurrency === 'USD' ? data.receivedUsd : undefined;

      const sale = await salesApi.create({
        customerId: customer?.id,
        originalCurrency: data.dialogCurrency,
        paymentType,
        amountPaidUzs,
        amountPaidUsd,
        lineItems: items.map((item) => ({
          productId: item.product.id,
          quantity: lineStockQty(item),
          unitPriceUzs: item.unitPriceUzs,
        })),
      });
      paymentDialog.onClose();
      setBelowCostOpen(false);
      setPendingPayment(null);
      clearCart();
      setCompletedSale(sale);
      useSalesStore.getState().setLastCompletedSaleId(sale.id);
      await refreshAfterSaleMutation();
      success('Sotuv muvaffaqiyatli yakunlandi');
    } catch (err: unknown) {
      notifyError((err as { message?: string }).message ?? 'Sotuvda xatolik');
    } finally {
      setProcessing(false);
    }
  };

  const handleCompletePayment = async (data: PaymentDialogData) => {
    if ((data.method === 'credit' || data.method === 'mixed') && !customer) {
      notifyError('Nasiya yoki aralash to\'lov uchun mijoz tanlang');
      return;
    }

    if (belowCostLines.length > 0) {
      setPendingPayment(data);
      paymentDialog.onClose();
      setBelowCostOpen(true);
      return;
    }

    await submitSale(data);
  };

  const handleBelowCostConfirm = async () => {
    if (!pendingPayment) return;
    setBelowCostOpen(false);
    success('Olish narxidan arzon narxda sotish tasdiqlandi');
    await submitSale(pendingPayment);
  };

  const handleBelowCostCancel = () => {
    setBelowCostOpen(false);
    setPendingPayment(null);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        document.querySelector<HTMLInputElement>('[aria-label="Shtrix-kod"], [aria-label="Qidiruv"]')?.focus();
      }
      if (e.key === 'F4' && items.length > 0) {
        e.preventDefault();
        paymentDialog.onOpen();
      }
      if (e.key === 'F6') {
        e.preventDefault();
        document.querySelector<HTMLInputElement>('[aria-label="Mijoz tanlash"], [label="Mijoz"]')?.focus();
      }
      if (e.ctrlKey && e.key === 'Enter' && items.length > 0) {
        e.preventDefault();
        if (belowCostOpen) {
          document.querySelector<HTMLButtonElement>('button.MuiButton-containedColorWarning')?.click();
        } else if (paymentDialog.open) {
          document.querySelector<HTMLButtonElement>('[type="submit"], #complete-sale-btn')?.click();
        } else {
          paymentDialog.onOpen();
        }
      }
      if (e.key === 'Escape') {
        if (belowCostOpen) {
          e.preventDefault();
          handleBelowCostCancel();
        } else if (stockError) {
          e.preventDefault();
          setStockError(null);
        } else if (paymentDialog.open) {
          e.preventDefault();
          paymentDialog.onClose();
        } else if (items.length > 0) {
          e.preventDefault();
          if (window.confirm("Savatni tozalashni xohlaysizmi?")) {
            clearCart();
          }
        }
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [items.length, paymentDialog.open, paymentDialog.onOpen, paymentDialog.onClose, clearCart, belowCostOpen, stockError]);

  const productGrid = useMemo(
    () =>
      posProducts.map((product) => (
        <Grid key={product.id} size={{ xs: 6, sm: 4, lg: 3 }}>
          <PosProductCard
            product={product}
            currency={currency}
            exchangeRate={exchangeRate}
            onAdd={(p) => tryAddProduct(p)}
            onPreviewImage={(src, title) => setPreviewImage({ src, title })}
          />
        </Grid>
      )),
    [posProducts, currency, exchangeRate, tryAddProduct],
  );

  return (
    <>
      <PageHeader
        title="Yangi sotuv (POS)"
        subtitle="Mahsulot qo'shing va to'lovni yakunlang"
        secondaryActions={
          <>
            <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
              Kurs: 1 USD = {exchangeRate.toLocaleString()} so&apos;m
            </Typography>
            <Button
              size="small"
              startIcon={<RefreshIcon />}
              onClick={() => {
                clearCart();
                success('Yangi savat boshlandi');
              }}
            >
              Yangi savat
            </Button>
          </>
        }
      />

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 7 }}>
          <BarcodeInput
            value={barcode}
            onChange={setBarcode}
            onScan={handleBarcodeScan}
            autoFocus
          />

          <TextField
            fullWidth
            size="small"
            placeholder="Mahsulot nomi, SKU yoki shtrix-kod…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ my: 2 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" color="action" />
                </InputAdornment>
              ),
            }}
          />

          {productsLoading ? (
            <Typography color="text.secondary">Mahsulotlar yuklanmoqda…</Typography>
          ) : (
            <Grid container spacing={1.5}>{productGrid}</Grid>
          )}
        </Grid>

        <Grid size={{ xs: 12, md: 5 }}>
          <Paper variant="outlined" sx={{ p: 2, position: 'sticky', top: 16 }}>
            <CustomerPicker value={customer} onChange={setCustomer} />

            <Box sx={{ my: 2 }}>
              <SegmentedControl
                value={currency}
                options={[
                  { value: 'UZS', label: 'UZS' },
                  { value: 'USD', label: 'USD' },
                ]}
                onChange={setCurrency}
                aria-label="Valyuta"
              />
            </Box>

            <Divider sx={{ mb: 2 }} />
            <Typography variant="h6" fontWeight={700} gutterBottom>
              Savat ({itemCount})
            </Typography>

            {items.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
                Savat bo&apos;sh. Mahsulot qo&apos;shing.
              </Typography>
            ) : (
              <Box sx={{ maxHeight: 360, overflow: 'auto', mb: 2 }}>
                {items.map((item) => (
                  <Box key={item.product.id} sx={{ mb: 2, pb: 1.5, borderBottom: 1, borderColor: 'divider', display: 'flex', gap: 1.5 }}>
                    {item.product.imageUrl ? (
                      <Box
                        sx={{ width: 48, height: 48, bgcolor: 'grey.100', borderRadius: 1, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, cursor: 'zoom-in' }}
                        onClick={() => setPreviewImage({
                          src: `${API_BASE_URL}/products/image/served/medium/${item.product.imageUrl}`,
                          title: item.product.name,
                        })}
                      >
                        <img
                          src={`${API_BASE_URL}/products/image/served/thumb/${item.product.imageUrl}`}
                          alt={item.product.name}
                          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                          loading="lazy"
                        />
                      </Box>
                    ) : (
                      <Box sx={{ width: 48, height: 48, bgcolor: 'grey.100', borderRadius: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.6rem' }}>Rasm yo&apos;q</Typography>
                      </Box>
                    )}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="body2" fontWeight={600} noWrap>
                        {item.product.name}
                        {item.product.purchasePriceUzs > 0 &&
                          item.unitPriceUzs <= item.product.purchasePriceUzs && (
                            <Typography
                              component="span"
                              variant="caption"
                              color="warning.main"
                              sx={{ ml: 1 }}
                            >
                              (olish narxidan arzon)
                            </Typography>
                          )}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mt: 1 }}>
                        <TextField
                          size="small"
                          type="number"
                          label={currency === 'USD' ? 'Narx (USD)' : 'Narx (dona)'}
                          value={currency === 'USD' ? Number((item.unitPriceUzs / exchangeRate).toFixed(2)) : item.unitPriceUzs}
                          onChange={(e) => {
                            const val = Number(e.target.value) || 0;
                            const uzsVal = currency === 'USD' ? Math.round(val * exchangeRate) : val;
                            setUnitPrice(item.product.id, uzsVal);
                          }}
                          sx={{ flex: 1 }}
                        />
                        {item.product.unitsPerBox > 1 && item.product.unitOfMeasure !== 'box' && (
                          <FormControl size="small" sx={{ minWidth: 100 }}>
                            <Select
                              value={item.saleUnit}
                              onChange={(e) => setSaleUnit(item.product.id, e.target.value as 'piece' | 'box')}
                            >
                              <MenuItem value="piece">{productUnitLabel(item.product.unitOfMeasure)}</MenuItem>
                              <MenuItem value="box">Karobka</MenuItem>
                            </Select>
                          </FormControl>
                        )}
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}>
                        <IconButton size="small" onClick={() => setQuantity(item.product.id, item.quantity - 1)}>
                          <RemoveIcon fontSize="small" />
                        </IconButton>
                        <Typography variant="body2" sx={{ minWidth: 48, textAlign: 'center' }}>
                          {item.quantity} {item.saleUnit === 'box' ? 'kar.' : productUnitLabel(item.product.unitOfMeasure).toLowerCase()}
                          {item.saleUnit === 'box' && (
                            <Typography component="span" variant="caption" display="block" color="text.secondary">
                              = {lineStockQty(item)} {productUnitLabel(item.product.unitOfMeasure).toLowerCase()}
                            </Typography>
                          )}
                        </Typography>
                        <IconButton size="small" onClick={() => tryAddProduct(item.product, 1, item.saleUnit)}>
                          <AddIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" color="error" onClick={() => removeLine(item.product.id)}>
                          <DeleteOutlineIcon fontSize="small" />
                        </IconButton>
                        <Typography variant="body2" fontWeight={600} sx={{ ml: 'auto' }}>
                          {currency === 'UZS'
                            ? formatUzs(lineStockQty(item) * item.unitPriceUzs)
                            : formatUsd(lineStockQty(item) * (item.unitPriceUzs / exchangeRate))}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                ))}
              </Box>
            )}

            <Divider sx={{ mb: 2 }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="body1" fontWeight={600}>Jami</Typography>
              <Typography variant="h6" fontWeight={700}>
                {currency === 'UZS' ? formatUzs(totalUzs) : formatUsd(totalUsd)}
              </Typography>
            </Box>

            <Button
              fullWidth
              variant="outlined"
              size="large"
              startIcon={<PaymentIcon />}
              disabled={items.length === 0 || isProcessing}
              onClick={paymentDialog.onOpen}
              sx={{ mb: 1 }}
            >
              To&apos;lov (F8)
            </Button>
            <Button
              fullWidth
              variant="contained"
              size="large"
              startIcon={<PointOfSaleIcon />}
              disabled={items.length === 0 || isProcessing}
              onClick={paymentDialog.onOpen}
            >
              Sotuvni yakunlash (F9)
            </Button>
          </Paper>
        </Grid>
      </Grid>

      <PaymentDialog
        open={paymentDialog.open}
        totalUzs={totalUzs}
        totalUsd={totalUsd}
        currency={currency}
        hasCustomer={Boolean(customer)}
        loading={isProcessing}
        onClose={paymentDialog.onClose}
        onConfirm={handleCompletePayment}
      />

      <BelowCostConfirmDialog
        open={belowCostOpen}
        lines={belowCostLines}
        onCancel={handleBelowCostCancel}
        onConfirm={() => void handleBelowCostConfirm()}
      />

      <InsufficientStockDialog
        open={Boolean(stockError)}
        productName={stockError?.product.name ?? ''}
        available={stockError?.product.stock ?? 0}
        requested={stockError?.requested ?? 0}
        onClose={() => setStockError(null)}
        onReduce={() => {
          if (stockError) {
            const existing = items.find((i) => i.product.id === stockError.product.id);
            if (existing) setQuantity(stockError.product.id, stockError.product.stock);
            else tryAddProduct(stockError.product, stockError.product.stock);
            setStockError(null);
          }
        }}
      />

      <SaleSuccessOverlay
        sale={completedSale}
        onNewCart={() => {
          setCompletedSale(null);
          clearCart();
        }}
        onClose={() => setCompletedSale(null)}
      />

      <Dialog open={!!previewImage} onClose={() => setPreviewImage(null)} maxWidth="md">
        <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">{previewImage?.title}</Typography>
          <IconButton onClick={() => setPreviewImage(null)} size="small" aria-label="yopish">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 1, display: 'flex', justifyContent: 'center', bgcolor: 'grey.100' }}>
          {previewImage && (
            <img
              src={previewImage.src}
              alt={previewImage.title}
              style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain', borderRadius: 4 }}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
