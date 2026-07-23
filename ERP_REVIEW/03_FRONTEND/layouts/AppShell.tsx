import { Box, useMediaQuery, useTheme } from '@mui/material';
import { Outlet } from 'react-router-dom';
import { useState } from 'react';
import { Sidebar } from '@/components/organisms/Sidebar';
import { TopBar } from '@/components/organisms/TopBar';
import { BreadcrumbBar } from '@/components/molecules/BreadcrumbBar';
import { useUiStore } from '@/stores/uiStore';
import { SIDEBAR_COLLAPSED_WIDTH, SIDEBAR_WIDTH } from '@/constants';

export function AppShell() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { sidebarCollapsed } = useUiStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  const sidebarWidth = isMobile
    ? 0
    : sidebarCollapsed
      ? SIDEBAR_COLLAPSED_WIDTH
      : SIDEBAR_WIDTH;

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <Sidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />

      <Box
        component="main"
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          width: `calc(100% - ${sidebarWidth}px)`,
          transition: 'width 0.2s ease',
        }}
      >
        <TopBar onMenuClick={() => setMobileOpen(true)} />
        <BreadcrumbBar />
        <Box
          sx={{
            flex: 1,
            p: { xs: 2, sm: 3 },
            overflow: 'auto',
            bgcolor: (t) =>
              t.palette.mode === 'light' ? '#F8FAFC' : '#0F172A',
          }}
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
