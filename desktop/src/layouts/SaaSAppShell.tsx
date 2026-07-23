import React from 'react';
import { Box, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Typography, AppBar, Toolbar, IconButton, Button, useTheme } from '@mui/material';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Dashboard as DashboardIcon, Business as BusinessIcon, Settings as SettingsIcon, Logout as LogoutIcon, Brightness4 as DarkIcon, Brightness7 as LightIcon, Security as SecurityIcon } from '@mui/icons-material';
import { useSaaSStore } from '@/stores/saasStore';
import { useAppTheme } from '@/theme/ThemeProvider';

const DRAWER_WIDTH = 260;

export function SaaSAppShell() {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const { admin, logout } = useSaaSStore();
  const { resolvedMode, setMode } = useAppTheme();

  const handleLogout = () => {
    logout();
    navigate('/super-admin/login');
  };

  const menuItems = [
    { text: 'Boshqaruv paneli', icon: <DashboardIcon />, path: '/super-admin/dashboard' },
    { text: 'Kompaniyalar', icon: <BusinessIcon />, path: '/super-admin/companies' },
    { text: 'Super Adminlar', icon: <SecurityIcon />, path: '/super-admin/settings' },
  ];

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Sidebar Drawer */}
      <Drawer
        variant="permanent"
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
            borderRight: '1px solid',
            borderColor: 'divider',
            bgcolor: (t) => t.palette.mode === 'dark' ? '#1E293B' : '#0F172A',
            color: '#F8FAFC',
          },
        }}
      >
        <Box sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 1.5, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <BusinessIcon sx={{ color: 'primary.main', fontSize: 28 }} />
          <Typography variant="h6" fontWeight={700} sx={{ letterSpacing: 0.5, color: '#FFFFFF' }}>
            SaaS Cloud
          </Typography>
        </Box>

        <List sx={{ px: 1.5, py: 2, flex: 1 }}>
          {menuItems.map((item) => {
            const active = location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
            return (
              <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  onClick={() => navigate(item.path)}
                  sx={{
                    borderRadius: 1.5,
                    color: active ? '#FFFFFF' : '#94A3B8',
                    bgcolor: active ? 'primary.main' : 'transparent',
                    '&:hover': {
                      bgcolor: active ? 'primary.main' : 'rgba(255,255,255,0.04)',
                      color: '#FFFFFF',
                    },
                  }}
                >
                  <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText primary={item.text} primaryTypographyProps={{ fontSize: 14, fontWeight: active ? 600 : 500 }} />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>

        <Box sx={{ p: 2, borderTop: '1px solid rgba(255,255,255,0.08)', bgcolor: 'rgba(0,0,0,0.1)' }}>
          <Typography variant="caption" color="slate.400" display="block" sx={{ mb: 1, color: '#94A3B8' }}>
            Kirilgan hisob:
          </Typography>
          <Typography variant="body2" fontWeight={600} noWrap sx={{ color: '#FFFFFF' }}>
            {admin?.email ?? 'Noma\'lum'}
          </Typography>
        </Box>
      </Drawer>

      {/* Main Content Area */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <AppBar
          position="static"
          color="inherit"
          elevation={0}
          sx={{
            borderBottom: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper',
          }}
        >
          <Toolbar sx={{ justifyContent: 'flex-end', gap: 2 }}>
            <IconButton onClick={() => setMode(resolvedMode === 'dark' ? 'light' : 'dark')} color="inherit">
              {resolvedMode === 'dark' ? <LightIcon /> : <DarkIcon />}
            </IconButton>

            <Button
              variant="outlined"
              color="error"
              size="small"
              startIcon={<LogoutIcon />}
              onClick={handleLogout}
              sx={{ borderRadius: 2 }}
            >
              Chiqish
            </Button>
          </Toolbar>
        </AppBar>

        <Box
          component="main"
          sx={{
            flex: 1,
            p: { xs: 2, sm: 3 },
            overflow: 'auto',
            bgcolor: (t) => t.palette.mode === 'light' ? '#F8FAFC' : '#0F172A',
          }}
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
export default SaaSAppShell;
