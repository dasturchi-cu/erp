import {
  Box,
  InputAdornment,
  TextField,
  type SxProps,
  type Theme,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import IconButton from '@mui/material/IconButton';

interface SearchFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  width?: number | string;
  sx?: SxProps<Theme>;
}

export function SearchField({
  value,
  onChange,
  placeholder = 'Qidirish…',
  width = 320,
  sx,
}: SearchFieldProps) {
  return (
    <TextField
      size="small"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      sx={{ width: { xs: '100%', sm: width }, ...sx }}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <SearchIcon fontSize="small" color="action" />
          </InputAdornment>
        ),
        endAdornment: value ? (
          <InputAdornment position="end">
            <IconButton size="small" onClick={() => onChange('')} aria-label="Tozalash">
              <ClearIcon fontSize="small" />
            </IconButton>
          </InputAdornment>
        ) : undefined,
      }}
    />
  );
}

interface FilterBarProps {
  search?: { value: string; onChange: (v: string) => void; placeholder?: string };
  filters?: React.ReactNode;
  actions?: React.ReactNode;
  sx?: SxProps<Theme>;
}

export function FilterBar({ search, filters, actions, sx }: FilterBarProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 1.5,
        mb: 2,
        minHeight: 48,
        ...sx,
      }}
    >
      {search && (
        <SearchField
          value={search.value}
          onChange={search.onChange}
          placeholder={search.placeholder}
        />
      )}
      {filters}
      <Box sx={{ flex: 1 }} />
      {actions}
    </Box>
  );
}
