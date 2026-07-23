import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  FormControlLabel,
  InputAdornment,
  Link,
  Skeleton,
  TextField,
  Typography,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { useNavigate } from 'react-router-dom';
import { AuthLayout } from '@/layouts/AuthLayout';
import { AuthCard } from '@/components/molecules/AuthCard';
import { EntityAvatar } from '@/components/atoms/EntityAvatar';
import { CompanyCard } from '@/components/organisms/CompanyCard';
import { useAuthStore } from '@/stores/authStore';
import { getHomePathForRole } from '@/utils/auth';
import { t } from '@/i18n';

export function CompanySelectPage() {
  const navigate = useNavigate();
  const {
    user,
    companies,
    isLoading,
    error,
    clearError,
    selectCompany,
    logout,
    rememberCompanyChoice,
    setRememberCompanyChoice,
    lastCompanyId,
    isAuthenticated,
  } = useAuthStore();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [initialLoading, setInitialLoading] = useState(true);
  const [selectionError, setSelectionError] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { replace: true });
      return;
    }
    const timer = setTimeout(() => setInitialLoading(false), 400);
    return () => clearTimeout(timer);
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (lastCompanyId && companies.some((c) => c.id === lastCompanyId)) {
      setSelectedId(lastCompanyId);
    }
  }, [lastCompanyId, companies]);

  const filteredCompanies = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return companies;
    return companies.filter((c) => c.name.toLowerCase().includes(q));
  }, [companies, searchQuery]);

  const showSearch = companies.length > 5;

  const handleContinue = async () => {
    if (!selectedId) {
      setSelectionError(t('company.selectRequired'));
      return;
    }
    setSelectionError('');
    clearError();
    await selectCompany(selectedId);

    if (!useAuthStore.getState().error) {
      const role = companies.find((c) => c.id === selectedId)?.role;
      navigate(getHomePathForRole(role), { replace: true });
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  if (!isAuthenticated) return null;

  return (
    <AuthLayout>
      <AuthCard variant="wide" data-screen-id="SCR-010">
        {initialLoading ? (
          <Box>
            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
              <Skeleton variant="circular" width={40} height={40} />
              <Box sx={{ flex: 1 }}>
                <Skeleton width="60%" height={28} />
                <Skeleton width="40%" height={20} />
              </Box>
            </Box>
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} variant="rounded" height={72} sx={{ mb: 1.5 }} />
            ))}
          </Box>
        ) : (
          <>
            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
              <EntityAvatar
                name={user ? `${user.firstName} ${user.lastName}` : 'User'}
                src={user?.avatarUrl}
                entityVariant="user"
              />
              <Box>
                <Typography variant="h5" fontWeight={600}>
                  {t('company.welcome', { name: user?.firstName ?? '' })}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('company.subtitle')}
                </Typography>
              </Box>
            </Box>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }} action={
                <Button color="inherit" size="small" onClick={() => setInitialLoading(true)}>
                  {t('company.retry')}
                </Button>
              }>
                {error}
              </Alert>
            )}

            {showSearch && (
              <TextField
                fullWidth
                placeholder={t('company.search')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                size="small"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" color="action" />
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 2 }}
                aria-label={t('company.searchAria')}
              />
            )}

            <Box
              role="radiogroup"
              aria-label={t('company.selectAria')}
              sx={{
                maxHeight: 360,
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: 1.5,
                mb: 2,
                opacity: isLoading ? 0.6 : 1,
                pointerEvents: isLoading ? 'none' : 'auto',
              }}
            >
              {filteredCompanies.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                  {searchQuery ? t('company.noMatch') : t('company.none')}
                </Typography>
              ) : (
                filteredCompanies.map((company) => (
                  <CompanyCard
                    key={company.id}
                    company={company}
                    selected={selectedId === company.id}
                    disabled={isLoading}
                    onSelect={(id) => {
                      setSelectedId(id);
                      setSelectionError('');
                    }}
                  />
                ))
              )}
            </Box>

            {selectionError && (
              <Typography variant="body2" color="error" sx={{ mb: 1 }} role="alert">
                {selectionError}
              </Typography>
            )}

            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                mb: 2,
                flexWrap: 'wrap',
                gap: 1,
              }}
            >
              <FormControlLabel
                control={
                  <Checkbox
                    checked={rememberCompanyChoice}
                    onChange={(e) => setRememberCompanyChoice(e.target.checked)}
                  />
                }
                label={t('company.remember')}
              />
              <Link
                component="button"
                type="button"
                variant="body2"
                onClick={handleLogout}
                sx={{ cursor: 'pointer' }}
              >
                {t('nav.logout')}
              </Link>
            </Box>

            <Button
              variant="contained"
              fullWidth
              disabled={!selectedId || isLoading}
              onClick={handleContinue}
              endIcon={isLoading ? undefined : <ArrowForwardIcon />}
              sx={{ height: 44 }}
            >
              {isLoading ? (
                <>
                  <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} />
                  {t('company.loading')}
                </>
              ) : (
                t('company.continue')
              )}
            </Button>
          </>
        )}
      </AuthCard>
    </AuthLayout>
  );
}
