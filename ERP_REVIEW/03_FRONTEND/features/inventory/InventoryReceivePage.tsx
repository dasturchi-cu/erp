import { useEffect, useMemo, useState } from 'react';
import { Box, Button, Card, MenuItem, TextField, Grid, Typography, FormControl, InputLabel, Select } from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PageHeader } from '@/components/common/PageHeader';
import { SupplierFormDialog } from '@/features/suppliers/SupplierFormPage';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useSupplierStore } from '@/stores/supplierStore';
import { useNotification } from '@/components/feedback/NotificationProvider';
import { formatUzs, formatUsd } from '@/utils/format';
import { productUnitLabel } from '@/constants/productUnits';

const OTHER_SUPPLIER = '__other__';

const schema = z.object({
  productId: z.string().min(1, 'Mahsulotni tanlang'),
  warehouseId: z.string().min(1, 'Omborni tanlang'),
  supplierId: z.string().min(1, 'Firma tanlanmagan bo\'lsa saqlanmasin'),
  paymentType: z.enum(['CASH', 'CREDIT'], { errorMap: () => ({ message: 'To\'lov turi tanlanmagan bo\'lsa saqlanmasin' }) }),
  currency: z.enum(['UZS', 'USD'], { errorMap: () => ({ message: 'Valyuta noto\'g\'ri bo\'lsa saqlanmasin' }) }),
  exchangeRate: z.coerce.number().min(1, 'Kurs kamida 1 bo\'lishi kerak'),
  receiveUnit: z.enum(['piece', 'box']),
  quantity: z.coerce.number().min(0.0001, 'Miqdor 0 dan katta bo\'lishi kerak'),
  unitsPerBox: z.coerce.number().min(1, 'Karobkadagi dona soni noto\'g\'ri bo\'lsa saqlanmasin'),
  unitCost: z.coerce.number().min(0.0001, 'Birlik narxi 0 dan katta bo\'lishi kerak'),
  batchNumber: z.string().optional(),
  expiresAt: z.string().optional(),
  note: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export function InventoryReceivePage() {
  const { success } = useNotification();
  const products = useInventoryStore((s) => s.products);
  const warehouses = useInventoryStore((s) => s.warehouses);
  const receiveStock = useInventoryStore((s) => s.receiveStock);
  const allSuppliers = useSupplierStore((s) => s.suppliers);
  const fetchSuppliers = useSupplierStore((s) => s.fetchSuppliers);
  const suppliers = useMemo(
    () => allSuppliers.filter((s) => s.status !== 'archived'),
    [allSuppliers],
  );
  const [supplierDialogOpen, setSupplierDialogOpen] = useState(false);

  useEffect(() => {
    void fetchSuppliers();
  }, [fetchSuppliers]);

  const { register, handleSubmit, control, setValue, watch, formState: { errors, isSubmitting }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      productId: '',
      warehouseId: '',
      supplierId: '',
      paymentType: '' as any,
      currency: 'UZS',
      exchangeRate: 12620,
      receiveUnit: 'piece',
      quantity: 1,
      unitsPerBox: 1,
      unitCost: 0,
      batchNumber: '',
      expiresAt: '',
      note: '',
    },
  });

  const productId = watch('productId');
  const currency = watch('currency');
  const exchangeRate = watch('exchangeRate') || 12620;
  const receiveUnit = watch('receiveUnit') || 'piece';
  const quantity = watch('quantity') || 0;
  const unitsPerBox = watch('unitsPerBox') || 1;
  const unitCost = watch('unitCost') || 0;

  const selectedProduct = products.find((p) => p.id === productId);

  useEffect(() => {
    if (selectedProduct) {
      setValue('unitsPerBox', selectedProduct.unitsPerBox || 1);
      const defaultUzsCost = selectedProduct.purchasePriceUzs || Math.round(selectedProduct.priceUzs * 0.72);
      const defaultUsdCost = selectedProduct.purchasePriceUsd || (defaultUzsCost / exchangeRate);

      if (currency === 'USD') {
        setValue('unitCost', Number(defaultUsdCost.toFixed(2)));
      } else {
        setValue('unitCost', Math.round(defaultUzsCost));
      }
    }
  }, [productId, selectedProduct, currency, setValue, exchangeRate]);

  const totalQuantityBase = receiveUnit === 'box' ? quantity * unitsPerBox : quantity;
  const boxCount = receiveUnit === 'box' ? quantity : quantity / unitsPerBox;
  const totalAmount = quantity * unitCost;

  const totalAmountUzs = currency === 'UZS' ? totalAmount : totalAmount * exchangeRate;
  const totalAmountUsd = currency === 'USD' ? totalAmount : totalAmount / exchangeRate;

  const onSubmit = async (data: FormData) => {
    const totalQty = data.receiveUnit === 'box' ? data.quantity * data.unitsPerBox : data.quantity;
    const costPerPiece = data.receiveUnit === 'box' ? data.unitCost / data.unitsPerBox : data.unitCost;
    const costUzs = data.currency === 'UZS' ? costPerPiece : costPerPiece * data.exchangeRate;

    await receiveStock({
      productId: data.productId,
      quantity: totalQty,
      costUzs: Math.round(costUzs),
      warehouseId: data.warehouseId,
      supplierId: data.supplierId,
      paymentType: data.paymentType,
      note: data.note,
      originalCurrency: data.currency,
      exchangeRateUsed: data.exchangeRate,
      batchNumber: data.batchNumber || undefined,
      expiresAt: data.expiresAt || undefined,
    });

    const paymentLabel = data.paymentType === 'CREDIT' ? ' (qarz yozildi)' : '';
    success(`${totalQty} dona qabul qilindi${paymentLabel}`);
    reset({
      productId: '',
      warehouseId: data.warehouseId,
      supplierId: data.supplierId,
      paymentType: '' as any,
      currency: data.currency,
      exchangeRate: data.exchangeRate,
      receiveUnit: 'piece',
      quantity: 1,
      unitsPerBox: 1,
      unitCost: 0,
      batchNumber: '',
      expiresAt: '',
      note: '',
    });
  };

  const productBaseUnitLabel = selectedProduct ? productUnitLabel(selectedProduct.unitOfMeasure) : 'dona';

  return (
    <>
      <PageHeader title="Zaxira qabul qilish" subtitle="Omborga mahsulot kirimi va FIFO partiya" />
      <Card variant="outlined" sx={{ p: 3, maxWidth: 720 }}>
        <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField select fullWidth label="Mahsulot" {...register('productId')} error={!!errors.productId} helperText={errors.productId?.message}>
                {products.filter((p) => p.status === 'active').map((p) => (
                  <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField select fullWidth label="Ombor" {...register('warehouseId')} error={!!errors.warehouseId} helperText={errors.warehouseId?.message}>
                {warehouses.map((w) => (
                  <MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Controller
                name="supplierId"
                control={control}
                render={({ field }) => (
                  <TextField
                    select
                    fullWidth
                    label="Firma"
                    value={field.value}
                    error={!!errors.supplierId}
                    helperText={errors.supplierId?.message}
                    onChange={(e) => {
                      if (e.target.value === OTHER_SUPPLIER) {
                        setSupplierDialogOpen(true);
                        return;
                      }
                      field.onChange(e.target.value);
                    }}
                  >
                    {suppliers.map((s) => (
                      <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
                    ))}
                    <MenuItem value={OTHER_SUPPLIER}>Boshqa…</MenuItem>
                  </TextField>
                )}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField select fullWidth label="To'lov turi" {...register('paymentType')} error={!!errors.paymentType} helperText={errors.paymentType?.message}>
                <MenuItem value="">— Tanlang —</MenuItem>
                <MenuItem value="CASH">Naqd</MenuItem>
                <MenuItem value="CREDIT">Qarz</MenuItem>
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField select fullWidth label="Valyuta" {...register('currency')} error={!!errors.currency} helperText={errors.currency?.message}>
                <MenuItem value="UZS">UZS</MenuItem>
                <MenuItem value="USD">USD</MenuItem>
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField fullWidth label="Kurs" type="number" {...register('exchangeRate')} error={!!errors.exchangeRate} helperText={errors.exchangeRate?.message} />
            </Grid>
            
            <Grid size={{ xs: 12, sm: 6 }}>
              <Controller
                name="receiveUnit"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth>
                    <InputLabel>Qabul Birligi</InputLabel>
                    <Select {...field} label="Qabul Birligi">
                      <MenuItem value="piece">{productBaseUnitLabel}</MenuItem>
                      {(!selectedProduct || selectedProduct.unitsPerBox > 1) && (
                        <MenuItem value="box">Karobka</MenuItem>
                      )}
                    </Select>
                  </FormControl>
                )}
              />
            </Grid>
            
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField 
                fullWidth 
                label={receiveUnit === 'box' ? 'Miqdor (Karobka)' : `Miqdor (${productBaseUnitLabel})`} 
                type="number" 
                inputProps={{ step: 'any' }}
                {...register('quantity')} 
                error={!!errors.quantity} 
                helperText={errors.quantity?.message} 
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField fullWidth label="Karobkadagi dona soni" type="number" {...register('unitsPerBox')} error={!!errors.unitsPerBox} helperText={errors.unitsPerBox?.message} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField 
                fullWidth 
                label={receiveUnit === 'box' ? `Karobka narxi (${currency})` : `Birlik narxi (${currency})`} 
                type="number" 
                inputProps={{ step: currency === 'USD' ? '0.01' : '1' }}
                {...register('unitCost')} 
                error={!!errors.unitCost} 
                helperText={errors.unitCost?.message} 
              />
            </Grid>

            {/* FIFO Batch Optional Fields */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField 
                fullWidth 
                label="Partiya raqami (ixtiyoriy)" 
                placeholder="Masalan: SR-102"
                {...register('batchNumber')} 
                error={!!errors.batchNumber} 
                helperText={errors.batchNumber?.message} 
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField 
                fullWidth 
                type="date"
                label="Yaroqlilik muddati (ixtiyoriy)" 
                InputLabelProps={{ shrink: true }}
                {...register('expiresAt')} 
                error={!!errors.expiresAt} 
                helperText={errors.expiresAt?.message} 
              />
            </Grid>
          </Grid>
          
          <TextField label="Izoh" multiline rows={2} {...register('note')} />
          
          <Box sx={{ mt: 2, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
            <Typography variant="subtitle2" color="text.secondary">Jami miqdor (baza o'lchovida):</Typography>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>
              {totalQuantityBase.toLocaleString('uz-UZ')} {productBaseUnitLabel.toLowerCase()} 
              {receiveUnit === 'piece' && selectedProduct && selectedProduct.unitsPerBox > 1 && (
                <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                  (= {boxCount.toFixed(2)} kar.)
                </Typography>
              )}
            </Typography>
            <Typography variant="subtitle2" color="text.secondary">Jami summa:</Typography>
            <Typography variant="h5" color="primary" fontWeight={700}>
              {formatUzs(totalAmountUzs)} ({formatUsd(totalAmountUsd)})
            </Typography>
          </Box>

          <Button type="submit" variant="contained" disabled={isSubmitting} size="large">Qabul qilish</Button>
        </Box>
      </Card>

      <SupplierFormDialog
        open={supplierDialogOpen}
        onClose={() => setSupplierDialogOpen(false)}
        onCreated={(supplierId) => setValue('supplierId', supplierId)}
      />
    </>
  );
}
