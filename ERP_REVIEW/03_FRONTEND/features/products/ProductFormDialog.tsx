import { useEffect, useState } from 'react';
import {
  FormControl,
  FormHelperText,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  TextField,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FormDialog } from '@/components/forms/FormDialog';
import { categoriesApi } from '@/api/services';
import type { Category } from '@/types/entities';
import { useCurrencyStore } from '@/stores/currencyStore';
import { productUsdFromUzs } from '@/utils/currency';
import type { Product } from '@/types/entities';

const productSchema = z.object({
  sku: z.string().min(1, 'SKU majburiy'),
  name: z.string().min(2, 'Nom kamida 2 belgi'),
  category: z.string().min(1, 'Kategoriya tanlang'),
  barcode: z.string().optional(),
  priceUzs: z.coerce.number().positive('UZS narxi musbat bo\'lishi kerak'),
  priceUsd: z.coerce.number().positive('USD narxi musbat bo\'lishi kerak'),
  stock: z.coerce.number().min(0, 'Qoldiq manfiy bo\'lmasligi kerak'),
  status: z.enum(['active', 'inactive']),
});

type ProductFormValues = z.infer<typeof productSchema>;

interface ProductFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (product: Omit<Product, 'id'>) => void;
  initial?: Product;
}

const defaultValues: ProductFormValues = {
  sku: '',
  name: '',
  category: '',
  barcode: '',
  priceUzs: 0,
  priceUsd: 0,
  stock: 0,
  status: 'active',
};

export function ProductFormDialog({ open, onClose, onSubmit, initial }: ProductFormDialogProps) {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    if (open) void categoriesApi.list().then(setCategories);
  }, [open]);
  const exchangeRate = useCurrencyStore((s) => s.rates.find((r) => r.status === 'active')?.rate ?? 12_620);
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues,
  });

  useEffect(() => {
    if (open) {
      reset(
        initial
          ? {
              sku: initial.sku,
              name: initial.name,
              category: initial.category,
              barcode: initial.barcode ?? '',
              priceUzs: initial.priceUzs,
              priceUsd: productUsdFromUzs(initial.priceUzs, exchangeRate),
              stock: initial.stock,
              status: initial.status,
            }
          : defaultValues,
      );
    }
  }, [open, initial, reset, exchangeRate]);

  const submit = handleSubmit((values) => {
    onSubmit({
      sku: values.sku,
      name: values.name,
      category: values.category,
      barcode: values.barcode || undefined,
      unitOfMeasure: 'pcs',
      unitsPerBox: 1,
      minStockLevel: 0,
      purchasePriceUzs: Math.round(values.priceUzs * 0.72),
      purchasePriceUsd: productUsdFromUzs(Math.round(values.priceUzs * 0.72), exchangeRate),
      priceUzs: values.priceUzs,
      priceUsd: productUsdFromUzs(values.priceUzs, exchangeRate),
      stock: values.stock,
      status: values.status,
    });
  });

  return (
    <FormDialog
      open={open}
      title={initial ? 'Mahsulotni tahrirlash' : 'Yangi mahsulot'}
      onClose={onClose}
      onSubmit={submit}
      loading={isSubmitting}
      maxWidth="md"
    >
      <Grid container spacing={2} sx={{ mt: 0.5 }}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            label="SKU"
            {...register('sku')}
            error={!!errors.sku}
            helperText={errors.sku?.message}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            label="Shtrix-kod"
            {...register('barcode')}
            error={!!errors.barcode}
            helperText={errors.barcode?.message}
          />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <TextField
            fullWidth
            label="Mahsulot nomi"
            {...register('name')}
            error={!!errors.name}
            helperText={errors.name?.message}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name="category"
            control={control}
            render={({ field }) => (
              <FormControl fullWidth error={!!errors.category}>
                <InputLabel>Kategoriya</InputLabel>
                <Select {...field} label="Kategoriya">
                  {categories.filter((c) => !c.parentId).map((c) => (
                    <MenuItem key={c.id} value={c.name}>
                      {c.name}
                    </MenuItem>
                  ))}
                </Select>
                {errors.category && <FormHelperText>{errors.category.message}</FormHelperText>}
              </FormControl>
            )}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name="status"
            control={control}
            render={({ field }) => (
              <FormControl fullWidth>
                <InputLabel>Holat</InputLabel>
                <Select {...field} label="Holat">
                  <MenuItem value="active">Faol</MenuItem>
                  <MenuItem value="inactive">Nofaol</MenuItem>
                </Select>
              </FormControl>
            )}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField
            fullWidth
            label="Narx (UZS)"
            type="number"
            {...register('priceUzs')}
            error={!!errors.priceUzs}
            helperText={errors.priceUzs?.message}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField
            fullWidth
            label="Narx (USD)"
            type="number"
            inputProps={{ step: 0.01 }}
            {...register('priceUsd')}
            error={!!errors.priceUsd}
            helperText={errors.priceUsd?.message}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField
            fullWidth
            label="Boshlang'ich qoldiq"
            type="number"
            {...register('stock')}
            error={!!errors.stock}
            helperText={errors.stock?.message}
          />
        </Grid>
      </Grid>
    </FormDialog>
  );
}
