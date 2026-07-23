import {
  Box,
  Card,
  CardActionArea,
  Radio,
  Typography,
  alpha,
} from '@mui/material';
import { EntityAvatar } from '@/components/atoms/EntityAvatar';
import { RoleBadge } from '@/components/atoms/RoleBadge';
import { formatRelativeTime } from '@/utils/format';
import type { Company } from '@/types';

interface CompanyCardProps {
  company: Company;
  selected: boolean;
  disabled?: boolean;
  onSelect: (id: string) => void;
}

export function CompanyCard({ company, selected, disabled, onSelect }: CompanyCardProps) {
  return (
    <Card
      variant="outlined"
      sx={{
        borderWidth: selected ? 2 : 1,
        borderColor: selected ? 'primary.main' : 'divider',
        bgcolor: selected ? (theme) => alpha(theme.palette.primary.main, 0.04) : 'background.paper',
        opacity: disabled ? 0.6 : 1,
        transition: 'border-color 0.15s, background-color 0.15s',
      }}
    >
      <CardActionArea
        onClick={() => !disabled && onSelect(company.id)}
        disabled={disabled}
        sx={{ p: 0 }}
        role="radio"
        aria-checked={selected}
        aria-label={`${company.name}, ${company.role}`}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            px: 2,
            py: 1.75,
            minHeight: 72,
          }}
        >
          <EntityAvatar name={company.name} src={company.logoUrl} entityVariant="company" />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <Typography variant="body1" fontWeight={600} noWrap>
                {company.name}
              </Typography>
              <RoleBadge role={company.role} />
            </Box>
            <Typography variant="body2" color="text.secondary">
              {company.branchCount === 1
                ? 'Main branch'
                : `${company.branchCount} branches`}{' '}
              · Last: {formatRelativeTime(company.lastAccessedAt)}
            </Typography>
          </Box>
          <Radio checked={selected} tabIndex={-1} sx={{ p: 0.5 }} />
        </Box>
      </CardActionArea>
    </Card>
  );
}
