import {
  AppBar,
  Avatar,
  Badge,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Toolbar,
  Tooltip,
  Typography,
  Divider,
  ListItemIcon,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import SearchIcon from '@mui/icons-material/Search';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import WifiIcon from '@mui/icons-material/Wifi';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import LogoutIcon from '@mui/icons-material/Logout';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import SettingsIcon from '@mui/icons-material/Settings';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TOPBAR_HEIGHT } from '@/constants';
import { useAuthStore } from '@/stores/authStore';
import { useAppTheme } from '@/theme/ThemeProvider';
import { getInitials } from '@/utils/format';
import { useUnreadNotificationCount } from '@/hooks/useNotifications';
import { t } from '@/i18n';

interface TopBarProps {
  onMenuClick: () => void;
}

export function TopBar({ onMenuClick }: TopBarProps) {
  const navigate = useNavigate();
  const { user, activeCompany, logout } = useAuthStore();
  const { resolvedMode, toggleMode } = useAppTheme();
  const unreadNotifications = useUnreadNotificationCount();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleLogout = () => {
    setAnchorEl(null);
    logout();
    navigate('/login');
  };

  const handleSwitchCompany = () => {
    setAnchorEl(null);
    navigate('/company-select');
  };

  return (
    <AppBar
      position="sticky"
      elevation={0}
      color="inherit"
      sx={{
        height: TOPBAR_HEIGHT,
        borderBottom: 1,
        borderColor: 'divider',
        bgcolor: 'background.paper',
      }}
    >
      <Toolbar sx={{ height: TOPBAR_HEIGHT, minHeight: `${TOPBAR_HEIGHT}px !important`, gap: 1 }}>
        <IconButton
          edge="start"
          onClick={onMenuClick}
          sx={{ display: { md: 'none' } }}
          aria-label={t('nav.openMenu')}
        >
          <MenuIcon />
        </IconButton>

        <Box
          onClick={handleSwitchCompany}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            px: 1.5,
            py: 0.75,
            borderRadius: 1,
            cursor: 'pointer',
            border: 1,
            borderColor: 'divider',
            '&:hover': { bgcolor: 'action.hover' },
            maxWidth: { xs: 160, sm: 240 },
          }}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && handleSwitchCompany()}
          aria-label={t('nav.switchCompany')}
        >
          <Avatar
            sx={{ width: 28, height: 28, fontSize: '0.75rem', bgcolor: 'primary.main' }}
          >
            {activeCompany ? getInitials(activeCompany.name) : 'E'}
          </Avatar>
          <Box sx={{ minWidth: 0, display: { xs: 'none', sm: 'block' } }}>
            <Typography variant="body2" fontWeight={600} noWrap>
              {activeCompany?.name ?? t('nav.selectCompany')}
            </Typography>
          </Box>
          <SwapHorizIcon sx={{ fontSize: 18, color: 'text.secondary', ml: 'auto' }} />
        </Box>

        <Box sx={{ flex: 1 }} />

        <Tooltip title={t('nav.search')}>
          <IconButton aria-label={t('nav.search')}>
            <SearchIcon />
          </IconButton>
        </Tooltip>

        <Tooltip title={t('nav.notifications')}>
          <IconButton
            aria-label={t('nav.notifications')}
            onClick={() => navigate('/notifications')}
          >
            <Badge badgeContent={unreadNotifications || undefined} color="error">
              <NotificationsNoneIcon />
            </Badge>
          </IconButton>
        </Tooltip>

        <Tooltip title={t('nav.connected')}>
          <IconButton aria-label={t('nav.connected')} sx={{ color: 'success.main' }}>
            <WifiIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        <Tooltip title={resolvedMode === 'light' ? t('nav.darkMode') : t('nav.lightMode')}>
          <IconButton onClick={toggleMode} aria-label={resolvedMode === 'light' ? t('nav.darkMode') : t('nav.lightMode')}>
            {resolvedMode === 'light' ? <DarkModeIcon /> : <LightModeIcon />}
          </IconButton>
        </Tooltip>

        <IconButton
          onClick={(e) => setAnchorEl(e.currentTarget)}
          aria-label={t('nav.userMenu')}
          sx={{ ml: 0.5 }}
        >
          <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: '0.875rem' }}>
            {user ? getInitials(`${user.firstName} ${user.lastName}`) : '?'}
          </Avatar>
        </IconButton>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={() => setAnchorEl(null)}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          slotProps={{ paper: { sx: { minWidth: 220, mt: 1 } } }}
        >
          <Box sx={{ px: 2, py: 1.5 }}>
            <Typography variant="body2" fontWeight={600}>
              {user?.firstName} {user?.lastName}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {user?.email}
            </Typography>
          </Box>
          <Divider />
          <MenuItem onClick={handleSwitchCompany}>
            <ListItemIcon>
              <SwapHorizIcon fontSize="small" />
            </ListItemIcon>
            {t('nav.switchCompany')}
          </MenuItem>
          <MenuItem onClick={() => { setAnchorEl(null); navigate('/settings'); }}>
            <ListItemIcon>
              <SettingsIcon fontSize="small" />
            </ListItemIcon>
            {t('nav.settings')}
          </MenuItem>
          <Divider />
          <MenuItem onClick={handleLogout}>
            <ListItemIcon>
              <LogoutIcon fontSize="small" />
            </ListItemIcon>
            {t('nav.logout')}
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
}
