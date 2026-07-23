import { useMemo, useState } from 'react';
import {
  Autocomplete,
  Box,
  Chip,
  TextField,
  Typography,
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import { useCustomerStore } from '@/stores/customerStore';
import type { Customer } from '@/types/entities';

interface CustomerPickerProps {
  value: Customer | null;
  onChange: (customer: Customer | null) => void;
}

export function CustomerPicker({ value, onChange }: CustomerPickerProps) {
  const [input, setInput] = useState('');
  const customers = useCustomerStore((s) => s.customers);

  const options = useMemo(
    () => customers.filter((c) => c.status === 'active'),
    [customers],
  );

  return (
    <Box>
      <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
        Mijoz
      </Typography>
      <Autocomplete
        size="small"
        options={options}
        value={value}
        onChange={(_, v) => onChange(v)}
        inputValue={input}
        onInputChange={(_, v) => setInput(v)}
        getOptionLabel={(o) => o.name}
        isOptionEqualToValue={(a, b) => a.id === b.id}
        filterOptions={(opts, state) => {
          const q = state.inputValue.toLowerCase();
          if (!q) return opts;
          return opts.filter(
            (c) =>
              c.name.toLowerCase().includes(q) ||
              c.phone.includes(q) ||
              (c.email?.toLowerCase().includes(q) ?? false),
          );
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            placeholder="Ism yoki telefon bo'yicha qidirish…"
            InputProps={{
              ...params.InputProps,
              startAdornment: (
                <>
                  <PersonIcon fontSize="small" color="action" sx={{ ml: 0.5, mr: 0.5 }} />
                  {params.InputProps.startAdornment}
                </>
              ),
            }}
          />
        )}
        renderOption={(props, option) => (
          <Box component="li" {...props} key={option.id}>
            <Box>
              <Typography variant="body2" fontWeight={600}>
                {option.name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {option.phone}
                {option.debtUzs > 0 && ` · Qarz: ${option.debtUzs.toLocaleString()} so'm`}
              </Typography>
            </Box>
          </Box>
        )}
      />
      {value && value.debtUzs > 0 && (
        <Chip
          size="small"
          color="warning"
          label={`Joriy qarz: ${value.debtUzs.toLocaleString()} so'm`}
          sx={{ mt: 1 }}
        />
      )}
    </Box>
  );
}
