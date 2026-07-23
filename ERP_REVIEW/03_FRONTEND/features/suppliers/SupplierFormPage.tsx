import { useEffect, useState } from 'react';
import { Box, Button, TextField } from '@mui/material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { useSupplierStore } from '@/stores/supplierStore';
import { useNotification } from '@/components/feedback/NotificationProvider';
import { normalizePhoneUz } from '@/utils/phone';

const schema = z.object({
  name: z.string().min(2, 'Nom kamida 2 ta belgi'),
  phone: z.string().min(9, 'Telefon raqamini kiriting'),
  contactPerson: z.string().optional(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export function SupplierFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { success, error: notifyError } = useNotification();
  const supplier = useSupplierStore((s) =>
    id ? s.suppliers.find((su) => su.id === id) : undefined,
  );
  const isLoading = useSupplierStore((s) => s.isLoading);
  const fetchSuppliers = useSupplierStore((s) => s.fetchSuppliers);
  const createSupplier = useSupplierStore((s) => s.createSupplier);
  const updateSupplier = useSupplierStore((s) => s.updateSupplier);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isEdit) void fetchSuppliers();
  }, [isEdit, fetchSuppliers]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', phone: '', contactPerson: '', notes: '' },
  });

  useEffect(() => {
    if (supplier) {
      reset({
        name: supplier.name,
        phone: supplier.phone,
        contactPerson: supplier.contactPerson ?? '',
        notes: supplier.notes ?? '',
      });
    }
  }, [supplier, reset]);

  if (isEdit && isLoading) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <PageHeader title="Firma yuklanmoqda…" />
      </Box>
    );
  }

  if (isEdit && !supplier) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <PageHeader title="Firma topilmadi" />
        <Button onClick={() => navigate('/suppliers')}>Orqaga</Button>
      </Box>
    );
  }

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const payload = {
        name: data.name.trim(),
        phone: normalizePhoneUz(data.phone),
        contactPerson: data.contactPerson?.trim() || undefined,
        notes: data.notes?.trim() || undefined,
      };

      if (isEdit && id) {
        await updateSupplier(id, payload);
        success('Firma yangilandi');
        navigate(`/suppliers/${id}`);
      } else {
        const created = await createSupplier(payload);
        success('Firma yaratildi');
        navigate(`/suppliers/${created.id}`);
      }
    } catch {
      notifyError('Saqlashda xatolik');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageHeader title={isEdit ? 'Firmni tahrirlash' : 'Yangi firma'} />
      <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ maxWidth: 480, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <TextField label="Firma nomi" {...register('name')} error={!!errors.name} helperText={errors.name?.message} />
        <TextField label="Telefon" {...register('phone')} error={!!errors.phone} helperText={errors.phone?.message} />
        <TextField label="Mas'ul shaxs" {...register('contactPerson')} />
        <TextField label="Izoh" multiline rows={3} {...register('notes')} />
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button onClick={() => navigate(-1)}>Bekor</Button>
          <Button type="submit" variant="contained" disabled={isSubmitting || loading}>
            Saqlash
          </Button>
        </Box>
      </Box>
    </>
  );
}

export interface SupplierFormDialogProps {
  open: boolean;
  onClose: () => void;
  onCreated: (supplierId: string) => void;
}

export function SupplierFormDialog({ open, onClose, onCreated }: SupplierFormDialogProps) {
  const { success, error: notifyError } = useNotification();
  const createSupplier = useSupplierStore((s) => s.createSupplier);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', phone: '', contactPerson: '', notes: '' },
  });

  const onSubmit = async (data: FormData) => {
    try {
      const created = await createSupplier({
        name: data.name.trim(),
        phone: normalizePhoneUz(data.phone),
        contactPerson: data.contactPerson?.trim() || undefined,
        notes: data.notes?.trim() || undefined,
      });
      success('Firma yaratildi');
      reset();
      onCreated(created.id);
      onClose();
    } catch {
      notifyError('Firma yaratishda xatolik');
    }
  };

  if (!open) return null;

  return (
    <Box
      sx={{
        position: 'fixed',
        inset: 0,
        bgcolor: 'rgba(0,0,0,0.4)',
        zIndex: 1300,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
      }}
      onClick={onClose}
    >
      <Box
        component="form"
        onSubmit={handleSubmit(onSubmit)}
        onClick={(e) => e.stopPropagation()}
        sx={{ bgcolor: 'background.paper', p: 3, borderRadius: 2, width: '100%', maxWidth: 440, display: 'flex', flexDirection: 'column', gap: 2 }}
      >
        <PageHeader title="Yangi firma" />
        <TextField label="Firma nomi" {...register('name')} error={!!errors.name} helperText={errors.name?.message} autoFocus />
        <TextField label="Telefon" {...register('phone')} error={!!errors.phone} helperText={errors.phone?.message} />
        <TextField label="Mas'ul shaxs" {...register('contactPerson')} />
        <TextField label="Izoh" multiline rows={2} {...register('notes')} />
        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
          <Button onClick={onClose}>Bekor</Button>
          <Button type="submit" variant="contained" disabled={isSubmitting}>
            Saqlash
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
