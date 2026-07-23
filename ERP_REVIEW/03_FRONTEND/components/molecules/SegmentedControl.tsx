import {
  Box,
  ToggleButton,
  ToggleButtonGroup,
  type SxProps,
  type Theme,
} from '@mui/material';

interface SegmentedControlOption<T extends string> {
  value: T;
  label: string;
}

interface SegmentedControlProps<T extends string> {
  value: T;
  options: SegmentedControlOption<T>[];
  onChange: (value: T) => void;
  size?: 'small' | 'medium';
  sx?: SxProps<Theme>;
  'aria-label'?: string;
}

export function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
  size = 'small',
  sx,
  'aria-label': ariaLabel,
}: SegmentedControlProps<T>) {
  return (
    <ToggleButtonGroup
      value={value}
      exclusive
      onChange={(_, newValue) => {
        if (newValue !== null) onChange(newValue as T);
      }}
      size={size}
      aria-label={ariaLabel}
      sx={{
        '& .MuiToggleButton-root': {
          px: 1.5,
          py: 0.75,
          fontSize: '0.875rem',
          fontWeight: 500,
          textTransform: 'none',
          borderColor: 'divider',
          '&.Mui-selected': {
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
            '&:hover': {
              bgcolor: 'primary.dark',
            },
          },
        },
        ...sx,
      }}
    >
      {options.map((opt) => (
        <ToggleButton key={opt.value} value={opt.value}>
          {opt.label}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
}
