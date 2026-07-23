import { Box, Breadcrumbs, Link, Typography } from '@mui/material';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import { BREADCRUMB_HEIGHT } from '@/constants';
import { routeLabels } from '@/config/navigation';

export function BreadcrumbBar() {
  const location = useLocation();
  const segments = location.pathname.split('/').filter(Boolean);

  if (segments.length === 0) return null;

  const crumbs = segments.map((segment, index) => {
    const path = `/${segments.slice(0, index + 1).join('/')}`;
    const label = routeLabels[segment] ?? segment;
    const isLast = index === segments.length - 1;
    return { path, label, isLast };
  });

  return (
    <Box
      sx={{
        height: BREADCRUMB_HEIGHT,
        display: 'flex',
        alignItems: 'center',
        px: 3,
        borderBottom: 1,
        borderColor: 'divider',
        bgcolor: 'background.paper',
      }}
    >
      <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} aria-label="breadcrumb">
        {crumbs.map((crumb) =>
          crumb.isLast ? (
            <Typography key={crumb.path} color="text.primary" variant="body2">
              {crumb.label}
            </Typography>
          ) : (
            <Link
              key={crumb.path}
              component={RouterLink}
              to={crumb.path}
              underline="hover"
              color="text.secondary"
              variant="body2"
            >
              {crumb.label}
            </Link>
          ),
        )}
      </Breadcrumbs>
    </Box>
  );
}
