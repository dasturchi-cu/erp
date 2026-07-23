import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Divider,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PageHeader } from '@/components/common/PageHeader';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useNotification } from '@/components/feedback/NotificationProvider';
import { categoriesApi, productsApi } from '@/api/services';
import { useCurrencyStore } from '@/stores/currencyStore';
import { API_BASE_URL } from '@/api/client';
import { PRODUCT_UNITS } from '@/constants/productUnits';
import { productUzsFromUsd, productUsdFromUzs } from '@/utils/currency';
import { formatUzs, formatUsd } from '@/utils/format';
import type { Category } from '@/types/entities';

const schema = z.object({
  name: z.string().min(2, 'Nom talab qilinadi'),
  sku: z.string().min(2, 'SKU talab qilinadi'),
  categoryId: z.string().min(1, 'Kategoriya tanlang'),
  barcode: z.string().optional(),
  unitOfMeasure: z.string().min(1),
  unitsPerBox: z.coerce.number().int().min(1, 'Kamida 1'),
  minStockLevel: z.coerce.number().min(0).optional(),
  priceCurrency: z.enum(['UZS', 'USD']),
  purchasePrice: z.coerce.number().min(0.01, 'Olish narxi musbat bo\'lishi kerak'),
  salePrice: z.coerce.number().min(0.01, 'Sotish narxi musbat bo\'lishi kerak'),
  wholesalePrice: z.coerce.number().min(0).optional(),
  recommendedPrice: z.coerce.number().min(0).optional(),
  minPrice: z.coerce.number().min(0).optional(),
  initialStock: z.coerce.number().min(0).optional(),
  pdfCatalogUrl: z.string().optional(),
  techPassportUrl: z.string().optional(),
  userManualUrl: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export function ProductFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { success, error: notifyError } = useNotification();
  const existing = useInventoryStore((s) => (id ? s.getProductById(id) : undefined));
  const createProduct = useInventoryStore((s) => s.createProduct);
  const updateProduct = useInventoryStore((s) => s.updateProduct);
  const warehouses = useInventoryStore((s) => s.warehouses);
  const [categories, setCategories] = useState<Category[]>([]);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [extraBarcodes, setExtraBarcodes] = useState<string[]>([]);
  const [newBarcode, setNewBarcode] = useState('');
  const [aliases, setAliases] = useState<string[]>([]);
  const [newAlias, setNewAlias] = useState('');
  const [unitConversions, setUnitConversions] = useState<Array<{ fromUnit: string; toUnit: string; conversionFactor: number }>>([]);
  const [newFromUnit, setNewFromUnit] = useState('box');
  const [newConversionFactor, setNewConversionFactor] = useState('');

  const exchangeRate = useCurrencyStore((s) => s.rates.find((r) => r.status === 'active')?.rate ?? 12_620);

  useEffect(() => {
    void categoriesApi.list().then(setCategories);
  }, []);

  const { register, handleSubmit, reset, control, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      sku: '',
      categoryId: '',
      barcode: '',
      unitOfMeasure: 'pcs',
      unitsPerBox: 1,
      minStockLevel: 0,
      priceCurrency: 'UZS',
      purchasePrice: 0,
      salePrice: 0,
      wholesalePrice: 0,
      recommendedPrice: 0,
      minPrice: 0,
      initialStock: 0,
      pdfCatalogUrl: '',
      techPassportUrl: '',
      userManualUrl: '',
    },
  });

  const priceCurrency = watch('priceCurrency');
  const purchasePrice = watch('purchasePrice');
  const salePrice = watch('salePrice');

  useEffect(() => {
    if (!existing || !categories.length) return;
    const match = categories.find((c) => c.name === existing.category);
    reset({
      name: existing.name,
      sku: existing.sku,
      categoryId: match?.id ?? '',
      barcode: existing.barcode ?? '',
      unitOfMeasure: existing.unitOfMeasure || 'pcs',
      unitsPerBox: existing.unitsPerBox || 1,
      minStockLevel: existing.minStockLevel ?? 0,
      priceCurrency: 'UZS',
      purchasePrice: existing.purchasePriceUzs || Math.round(existing.priceUzs * 0.72),
      salePrice: existing.priceUzs,
      wholesalePrice: existing.wholesalePriceUzs || 0,
      recommendedPrice: existing.recommendedPriceUzs || 0,
      minPrice: existing.minPriceUzs || 0,
      pdfCatalogUrl: existing.pdfCatalogUrl || '',
      techPassportUrl: existing.techPassportUrl || '',
      userManualUrl: existing.userManualUrl || '',
    });
    setImageUrl(existing.imageUrl || null);
    setExtraBarcodes(existing.barcodes || []);
    setAliases(existing.aliases || []);
    setUnitConversions(
      existing.unitConversions?.map((uc: any) => ({
        fromUnit: uc.fromUnit,
        toUnit: uc.toUnit,
        conversionFactor: uc.conversionFactor,
      })) || [],
    );
  }, [existing, categories, reset]);

  // Global paste handler for Ctrl+V images
  useEffect(() => {
    const handleGlobalPaste = async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of items) {
        if (item.type.indexOf('image') === 0) {
          const file = item.getAsFile();
          if (file) {
            await uploadFile(file);
          }
        }
      }
    };
    window.addEventListener('paste', handleGlobalPaste);
    return () => window.removeEventListener('paste', handleGlobalPaste);
  }, []);

  const uploadFile = async (file: File) => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await (productsApi as any).uploadImage(formData);
      setImageUrl(res.fileName);
      success('Rasm muvaffaqiyatli yuklandi');
    } catch {
      notifyError('Rasm yuklashda xatolik yuz berdi');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await uploadFile(file);
    }
  };

  const handleAddBarcode = () => {
    const trimmed = newBarcode.trim();
    if (trimmed && !extraBarcodes.includes(trimmed)) {
      setExtraBarcodes([...extraBarcodes, trimmed]);
      setNewBarcode('');
    }
  };

  const handleRemoveBarcode = (idx: number) => {
    setExtraBarcodes(extraBarcodes.filter((_, i) => i !== idx));
  };

  const handleAddAlias = () => {
    const trimmed = newAlias.trim();
    if (trimmed && !aliases.includes(trimmed)) {
      setAliases([...aliases, trimmed]);
      setNewAlias('');
    }
  };

  const handleRemoveAlias = (idx: number) => {
    setAliases(aliases.filter((_, i) => i !== idx));
  };

  const handleAddConversion = () => {
    const factor = parseFloat(newConversionFactor);
    if (newFromUnit && !isNaN(factor) && factor > 0) {
      setUnitConversions([...unitConversions, {
        fromUnit: newFromUnit,
        toUnit: watch('unitOfMeasure') || 'pcs',
        conversionFactor: factor
      }]);
      setNewConversionFactor('');
    }
  };

  const handleRemoveConversion = (idx: number) => {
    setUnitConversions(unitConversions.filter((_, i) => i !== idx));
  };

  const purchaseUzs =
    priceCurrency === 'UZS' ? purchasePrice : productUzsFromUsd(purchasePrice, exchangeRate);
  const saleUzs =
    priceCurrency === 'UZS' ? salePrice : productUzsFromUsd(salePrice, exchangeRate);

  const onSubmit = async (data: FormData) => {
    const purchasePriceUzs =
      data.priceCurrency === 'UZS'
        ? Math.round(data.purchasePrice)
        : productUzsFromUsd(data.purchasePrice, exchangeRate);
    const salePriceUzs =
      data.priceCurrency === 'UZS'
        ? Math.round(data.salePrice)
        : productUzsFromUsd(data.salePrice, exchangeRate);

    const getUzsPrice = (val?: number) => {
      if (!val) return 0;
      return data.priceCurrency === 'UZS' ? Math.round(val) : productUzsFromUsd(val, exchangeRate);
    };

    const payload = {
      name: data.name,
      barcode: data.barcode?.trim() || undefined,
      categoryId: data.categoryId,
      unitOfMeasure: data.unitOfMeasure,
      unitsPerBox: data.unitsPerBox,
      minStockLevel: data.minStockLevel ?? 0,
      purchasePriceUzs,
      salePriceUzs,
      wholesalePriceUzs: getUzsPrice(data.wholesalePrice),
      recommendedPriceUzs: getUzsPrice(data.recommendedPrice),
      minPriceUzs: getUzsPrice(data.minPrice),
      imageUrl,
      pdfCatalogUrl: data.pdfCatalogUrl?.trim() || undefined,
      techPassportUrl: data.techPassportUrl?.trim() || undefined,
      userManualUrl: data.userManualUrl?.trim() || undefined,
      barcodes: extraBarcodes,
      aliases: aliases,
      unitConversions: unitConversions.map((uc) => ({
        fromUnit: uc.fromUnit,
        toUnit: uc.toUnit,
        conversionFactor: String(uc.conversionFactor),
      })),
    };

    try {
      if (isEdit && id) {
        const updated = await updateProduct(id, payload);
        success('Mahsulot yangilandi');
        navigate(`/products/${updated.id}`);
        return;
      }

      const created = await createProduct({
        sku: data.sku,
        ...payload,
        initialStock: data.initialStock,
        initialWarehouseId: data.initialStock ? warehouses[0]?.id : undefined,
      });
      success('Mahsulot yaratildi');
      navigate(`/products/${created.id}`);
    } catch (err: unknown) {
      notifyError((err as { message?: string }).message ?? 'Saqlashda xatolik');
    }
  };

  if (isEdit && !existing) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Button onClick={() => navigate('/products')}>Mahsulotlar ro&apos;yxatiga qaytish</Button>
      </Box>
    );
  }

  return (
    <>
      <PageHeader
        title={isEdit ? 'Mahsulotni tahrirlash' : 'Yangi mahsulot'}
        subtitle={existing?.sku}
      />
      <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Card variant="outlined" sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" gutterBottom>Asosiy Ma&apos;lumotlar</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                <TextField label="Nomi" {...register('name')} error={!!errors.name} helperText={errors.name?.message} InputLabelProps={{ shrink: true }} fullWidth />
                <TextField label="SKU" {...register('sku')} disabled={isEdit} error={!!errors.sku} helperText={errors.sku?.message} InputLabelProps={{ shrink: true }} fullWidth />
                <TextField select label="Kategoriya" {...register('categoryId')} error={!!errors.categoryId} helperText={errors.categoryId?.message} InputLabelProps={{ shrink: true }} fullWidth >
                  {categories.map((c) => (
                    <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                  ))}
                </TextField>
                <TextField label="Shtrix-kod" {...register('barcode')} helperText="Skaner yoki qo'lda kiriting" InputLabelProps={{ shrink: true }} fullWidth />

                <Controller
                  name="unitOfMeasure"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth>
                      <InputLabel>O&apos;lchov birligi</InputLabel>
                      <Select {...field} label="O'lchov birligi">
                        {PRODUCT_UNITS.map((u) => (
                          <MenuItem key={u.value} value={u.value}>{u.label}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                />

                <TextField
                  label="Karobkada nechta mahsulot"
                  type="number"
                  {...register('unitsPerBox')}
                  error={!!errors.unitsPerBox}
                  helperText={errors.unitsPerBox?.message ?? 'Masalan: 24 dona = 1 karobka'}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                />

                <TextField
                  label="Minimal qoldiq"
                  type="number"
                  {...register('minStockLevel')}
                  helperText="Qoldiq shu qiymatdan past bo'lsa ogohlantirish"
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                />
              </Box>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Card variant="outlined" sx={{ p: 3, display: 'flex', flexDirection: 'column', height: '100%' }}>
              <Typography variant="h6" gutterBottom>Mahsulot Rasmi va Hujjatlari</Typography>
              <Box
                onDragOver={(e) => e.preventDefault()}
                onDrop={async (e) => {
                  e.preventDefault();
                  const file = e.dataTransfer.files[0];
                  if (file) await uploadFile(file);
                }}
                sx={{
                  border: '2px dashed',
                  borderColor: imageUrl ? 'success.light' : 'action.disabled',
                  borderRadius: 1,
                  p: 3,
                  textAlign: 'center',
                  bgcolor: 'action.hover',
                  cursor: 'pointer',
                  position: 'relative',
                  mb: 2,
                  mt: 2
                }}
              >
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                />
                {imageUrl ? (
                  <Box>
                    <img
                      src={`${API_BASE_URL}/products/image/served/medium/${imageUrl}`}
                      alt="Product"
                      style={{ maxWidth: '100%', maxHeight: 160, borderRadius: 4 }}
                    />
                    <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 1 }}>
                      Rasm yuklandi. Almashtirish uchun bosing, sudrab tashlang yoki Ctrl+V bosing.
                    </Typography>
                  </Box>
                ) : (
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Rasm yuklash uchun bosing, faylni sudrab keling yoki sahifaga Ctrl+V orqali clipboarddan rasm qo&apos;ying.
                    </Typography>
                  </Box>
                )}
                {isUploading && (
                  <Typography variant="caption" color="primary" display="block" sx={{ mt: 1 }}>
                    Yuklanmoqda...
                  </Typography>
                )}
              </Box>

              {imageUrl && (
                <Button size="small" color="error" onClick={() => setImageUrl(null)} sx={{ alignSelf: 'flex-start', mb: 2 }}>
                  Rasmni o&apos;chirish
                </Button>
              )}

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField label="PDF Katalog URL" {...register('pdfCatalogUrl')} InputLabelProps={{ shrink: true }} fullWidth />
                <TextField label="Texnik Passport URL" {...register('techPassportUrl')} InputLabelProps={{ shrink: true }} fullWidth />
                <TextField label="Qo'llanma (User Manual) URL" {...register('userManualUrl')} InputLabelProps={{ shrink: true }} fullWidth />
              </Box>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Card variant="outlined" sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" gutterBottom>Narx Tizimi (UZS / USD)</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                <Controller
                  name="priceCurrency"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth>
                      <InputLabel>Valyuta</InputLabel>
                      <Select {...field} label="Valyuta">
                        <MenuItem value="UZS">UZS (so&apos;m)</MenuItem>
                        <MenuItem value="USD">USD ($)</MenuItem>
                      </Select>
                    </FormControl>
                  )}
                />

                <TextField
                  label={priceCurrency === 'UZS' ? 'Olish narxi (UZS)' : 'Olish narxi (USD)'}
                  type="number"
                  inputProps={{ step: priceCurrency === 'USD' ? 0.01 : 1 }}
                  {...register('purchasePrice')}
                  error={!!errors.purchasePrice}
                  helperText={errors.purchasePrice?.message}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                />
                <TextField
                  label={priceCurrency === 'UZS' ? 'Sotish narxi (UZS)' : 'Sotish narxi (USD)'}
                  type="number"
                  inputProps={{ step: priceCurrency === 'USD' ? 0.01 : 1 }}
                  {...register('salePrice')}
                  error={!!errors.salePrice}
                  helperText={errors.salePrice?.message}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                />
                <TextField
                  label={priceCurrency === 'UZS' ? 'Ulgurji narxi (Wholesale - UZS)' : 'Ulgurji narxi (Wholesale - USD)'}
                  type="number"
                  inputProps={{ step: priceCurrency === 'USD' ? 0.01 : 1 }}
                  {...register('wholesalePrice')}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                />
                <TextField
                  label={priceCurrency === 'UZS' ? 'Tavsiya etilgan sotish narxi (UZS)' : 'Tavsiya etilgan sotish narxi (USD)'}
                  type="number"
                  inputProps={{ step: priceCurrency === 'USD' ? 0.01 : 1 }}
                  {...register('recommendedPrice')}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                />
                <TextField
                  label={priceCurrency === 'UZS' ? 'Eng past sotish narxi (Min Price - UZS)' : 'Eng past sotish narxi (Min Price - USD)'}
                  type="number"
                  inputProps={{ step: priceCurrency === 'USD' ? 0.01 : 1 }}
                  {...register('minPrice')}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                />

                <Box sx={{ p: 1.5, bgcolor: 'action.hover', borderRadius: 1 }}>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Kurs: 1 USD = {exchangeRate.toLocaleString('uz-UZ')} so&apos;m
                  </Typography>
                  <Typography variant="body2">
                    Olish: {formatUzs(purchaseUzs)} / {formatUsd(productUsdFromUzs(purchaseUzs, exchangeRate))}
                  </Typography>
                  <Typography variant="body2">
                    Sotish: {formatUzs(saleUzs)} / {formatUsd(productUsdFromUzs(saleUzs, exchangeRate))}
                  </Typography>
                </Box>
              </Box>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Card variant="outlined" sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Typography variant="h6" gutterBottom>Qo&apos;shimcha Shtrix-kodlar &amp; Birliklar</Typography>

              <Box>
                <Typography variant="subtitle2">Qo&apos;shimcha Shtrix-kodlar</Typography>
                <Box sx={{ display: 'flex', gap: 1, mt: 1, mb: 1 }}>
                  <TextField
                    size="small"
                    label="Yangi Shtrix-kod"
                    value={newBarcode}
                    onChange={(e) => setNewBarcode(e.target.value)}
                  />
                  <Button size="small" variant="contained" onClick={handleAddBarcode}>Qo&apos;shish</Button>
                </Box>
                <List dense sx={{ maxHeight: 100, overflow: 'auto', border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                  {extraBarcodes.map((bar, idx) => (
                    <ListItem
                      key={bar}
                      secondaryAction={
                        <IconButton edge="end" size="small" onClick={() => handleRemoveBarcode(idx)}>
                          x
                        </IconButton>
                      }
                    >
                      <ListItemText primary={bar} />
                    </ListItem>
                  ))}
                  {extraBarcodes.length === 0 && (
                    <ListItem><ListItemText primary="Qo'shimcha shtrix-kodlar yo'q" /></ListItem>
                  )}
                </List>
              </Box>

              <Divider sx={{ my: 1 }} />

              <Box>
                <Typography variant="subtitle2">Mahsulot Aliaslari (Qidiruv uchun nomlar)</Typography>
                <Box sx={{ display: 'flex', gap: 1, mt: 1, mb: 1 }}>
                  <TextField
                    size="small"
                    label="Yangi Alias"
                    value={newAlias}
                    onChange={(e) => setNewAlias(e.target.value)}
                  />
                  <Button size="small" variant="contained" onClick={handleAddAlias}>Qo&apos;shish</Button>
                </Box>
                <List dense sx={{ maxHeight: 100, overflow: 'auto', border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                  {aliases.map((alias, idx) => (
                    <ListItem
                      key={alias}
                      secondaryAction={
                        <IconButton edge="end" size="small" onClick={() => handleRemoveAlias(idx)}>
                          x
                        </IconButton>
                      }
                    >
                      <ListItemText primary={alias} />
                    </ListItem>
                  ))}
                  {aliases.length === 0 && (
                    <ListItem><ListItemText primary="Qo'shimcha aliaslar yo'q" /></ListItem>
                  )}
                </List>
              </Box>

              <Divider sx={{ my: 1 }} />

              <Box>
                <Typography variant="subtitle2">Birlik Konversiyalari (Unit Conversion)</Typography>
                <Box sx={{ display: 'flex', gap: 1, mt: 1, mb: 1, alignItems: 'center' }}>
                  <TextField
                    select
                    size="small"
                    value={newFromUnit}
                    onChange={(e) => setNewFromUnit(e.target.value)}
                    sx={{ minWidth: 100 }}
                  >
                    {PRODUCT_UNITS.filter((u) => u.value !== watch('unitOfMeasure')).map((u) => (
                      <MenuItem key={u.value} value={u.value}>{u.label}</MenuItem>
                    ))}
                  </TextField>
                  <Typography variant="body2">=</Typography>
                  <TextField
                    size="small"
                    label="Koeffitsient"
                    type="number"
                    value={newConversionFactor}
                    onChange={(e) => setNewConversionFactor(e.target.value)}
                    sx={{ maxWidth: 100 }}
                  />
                  <Typography variant="body2">{watch('unitOfMeasure') || 'dona'}</Typography>
                  <Button size="small" variant="contained" onClick={handleAddConversion}>Qo&apos;shish</Button>
                </Box>
                <List dense sx={{ maxHeight: 120, overflow: 'auto', border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                  {unitConversions.map((uc, idx) => (
                    <ListItem
                      key={idx}
                      secondaryAction={
                        <IconButton edge="end" size="small" onClick={() => handleRemoveConversion(idx)}>
                          x
                        </IconButton>
                      }
                    >
                      <ListItemText primary={`1 ${PRODUCT_UNITS.find((u) => u.value === uc.fromUnit)?.label ?? uc.fromUnit} = ${uc.conversionFactor} ${PRODUCT_UNITS.find((u) => u.value === uc.toUnit)?.label ?? uc.toUnit}`} />
                    </ListItem>
                  ))}
                  {unitConversions.length === 0 && (
                    <ListItem><ListItemText primary="Birlik konversiyalari yo'q" /></ListItem>
                  )}
                </List>
              </Box>
            </Card>
          </Grid>
        </Grid>

        <Card variant="outlined" sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
              {!isEdit && (
                <TextField label="Boshlang'ich zaxira" type="number" {...register('initialStock')} helperText="Ixtiyoriy — omborga qabul qiladi" />
              )}
              {isEdit && existing && (
                <Typography variant="body2">Joriy zaxira: <strong>{existing.stock}</strong></Typography>
              )}
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button onClick={() => navigate(-1)}>Bekor qilish</Button>
              <Button type="submit" variant="contained" disabled={isSubmitting}>
                Saqlash
              </Button>
            </Box>
          </Box>
        </Card>
      </Box>
    </>
  );
}
