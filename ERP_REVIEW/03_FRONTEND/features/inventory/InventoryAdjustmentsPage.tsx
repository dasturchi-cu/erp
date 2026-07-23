import { useEffect } from 'react';
import { Box, Button, Card, MenuItem, TextField } from '@mui/material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PageHeader } from '@/components/common/PageHeader';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useNotification } from '@/components/feedback/NotificationProvider';

const schema = z.object({
  productId: z.string().min(1, 'Mahsulotni tanlang'),
  warehouseId: z.string().min(1, 'Omborni tanlang'),
  quantity: z.coerce.number().refine((v) => v !== 0, 'Miqdor 0 bo\'lmasligi kerak'),
  reason: z.string().min(3, 'Sabab kiriting'),
});

export function InventoryAdjustmentsPage() {
  const { success, error: notifyError } = useNotification();
  const products = useInventoryStore((s) => s.products);
  const warehouses = useInventoryStore((s) => s.warehouses);
  const fetchWarehouses = useInventoryStore((s) => s.fetchWarehouses);
  const adjustStock = useInventoryStore((s) => s.adjustStock);

  useEffect(() => {
    void fetchWarehouses();
  }, [fetchWarehouses]);

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { productId: '', warehouseId: '', quantity: 0, reason: '' },
  });

  const onSubmit = async (data: z.infer<typeof schema>) => {
    try {
      await adjustStock(data.productId, data.quantity, data.reason, data.warehouseId);
      success('Tuzatish saqlandi');
      reset({ productId: '', warehouseId: data.warehouseId, quantity: 0, reason: '' });
    } catch (err) {
      notifyError(err instanceof Error ? err.message : 'Tuzatish xatolik');
    }
  };

  return (
    <>
      <PageHeader title="Zaxira tuzatish" subtitle="Inventarizatsiya va tuzatishlar" />
      <Card variant="outlined" sx={{ p: 3, maxWidth: 480 }}>
        <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField select label="Ombor" {...register('warehouseId')} error={!!errors.warehouseId} helperText={errors.warehouseId?.message}>
            {warehouses.map((w) => (
              <MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>
            ))}
          </TextField>
          <TextField select label="Mahsulot" {...register('productId')} error={!!errors.productId} helperText={errors.productId?.message}>
            {products.map((p) => (
              <MenuItem key={p.id} value={p.id}>{p.name} ({p.stock})</MenuItem>
            ))}
          </TextField>
          <TextField label="O'zgarish (+/-)" type="number" {...register('quantity')} helperText="Manfiy — kamaytirish" error={!!errors.quantity} />
          <TextField label="Sabab" {...register('reason')} error={!!errors.reason} helperText={errors.reason?.message} />
          <Button type="submit" variant="contained" disabled={isSubmitting}>Saqlash</Button>
        </Box>
      </Card>
    </>
  );
}
