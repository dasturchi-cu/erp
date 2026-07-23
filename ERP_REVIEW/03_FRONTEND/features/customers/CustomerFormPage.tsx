import { useEffect, useState } from 'react';
import { Box, Button, TextField } from '@mui/material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { useCustomerStore } from '@/stores/customerStore';
import { useNotification } from '@/components/feedback/NotificationProvider';
import { normalizePhoneUz } from '@/utils/phone';

const schema = z.object({
  name: z.string().min(2, 'F.I.O kamida 2 ta belgi'),
  phone: z.string().min(9, 'Telefon raqamini kiriting'),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export function CustomerFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { success, error: notifyError } = useNotification();
  const getCustomerById = useCustomerStore((s) => s.getCustomerById);
  const createCustomer = useCustomerStore((s) => s.createCustomer);
  const updateCustomer = useCustomerStore((s) => s.updateCustomer);
  const [loading, setLoading] = useState(false);

  const customer = id ? getCustomerById(id) : undefined;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', phone: '', notes: '' },
  });

  useEffect(() => {
    if (customer) {
      reset({
        name: customer.name,
        phone: customer.phone,
        notes: customer.notes ?? '',
      });
    }
  }, [customer, reset]);

  if (isEdit && !customer) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <PageHeader title="Mijoz topilmadi" />
        <Button onClick={() => navigate('/customers')}>Orqaga</Button>
      </Box>
    );
  }

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const phone = normalizePhoneUz(data.phone);
      const payload = {
        name: data.name.trim(),
        phone,
        notes: data.notes?.trim() || undefined,
      };

      if (isEdit && id) {
        await updateCustomer(id, payload);
        success('Mijoz yangilandi');
        navigate(`/customers/${id}`);
      } else {
        const created = await createCustomer(payload);
        success('Mijoz yaratildi');
        navigate(`/customers/${created.id}`);
      }
    } catch (err: unknown) {
      notifyError((err as { message?: string }).message ?? 'Saqlashda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageHeader
        title={isEdit ? 'Mijozni tahrirlash' : 'Yangi mijoz'}
        subtitle={isEdit ? customer?.name : 'Mijoz ma\'lumotlarini kiriting'}
      />

      <Box
        component="form"
        onSubmit={handleSubmit(onSubmit)}
        sx={{
          maxWidth: 520,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          p: 3,
          border: 1,
          borderColor: 'divider',
          borderRadius: 2,
          bgcolor: 'background.paper',
        }}
      >
        <TextField
          label="F.I.O"
          {...register('name')}
          error={!!errors.name}
          helperText={errors.name?.message}
          fullWidth
          autoFocus
        />
        <TextField
          label="Telefon"
          {...register('phone')}
          error={!!errors.phone}
          helperText={errors.phone?.message ?? '+998 90 123 45 67 yoki 901234567'}
          fullWidth
          placeholder="+998 90 123 45 67"
        />
        <TextField
          label="Izoh"
          {...register('notes')}
          fullWidth
          multiline
          rows={3}
          placeholder="Qo'shimcha ma'lumot (ixtiyoriy)"
        />
        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', pt: 1 }}>
          <Button onClick={() => navigate(isEdit ? `/customers/${id}` : '/customers')}>
            Bekor qilish
          </Button>
          <Button type="submit" variant="contained" disabled={isSubmitting || loading}>
            {isEdit ? 'Saqlash' : 'Yaratish'}
          </Button>
        </Box>
      </Box>
    </>
  );
}
