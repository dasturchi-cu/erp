import {
  Box,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';
import ReceiptIcon from '@mui/icons-material/Receipt';
import UndoIcon from '@mui/icons-material/Undo';
import CategoryIcon from '@mui/icons-material/Category';
import FolderIcon from '@mui/icons-material/Folder';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import WarehouseIcon from '@mui/icons-material/Warehouse';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import PeopleIcon from '@mui/icons-material/People';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import PaymentsIcon from '@mui/icons-material/Payments';
import AssessmentIcon from '@mui/icons-material/Assessment';
import InsightsIcon from '@mui/icons-material/Insights';
import NotificationsIcon from '@mui/icons-material/Notifications';
import SettingsIcon from '@mui/icons-material/Settings';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import PriceChangeIcon from '@mui/icons-material/PriceChange';
import AddBoxIcon from '@mui/icons-material/AddBox';
import InventoryIcon from '@mui/icons-material/Inventory';
import TuneIcon from '@mui/icons-material/Tune';
import CurrencyExchangeIcon from '@mui/icons-material/CurrencyExchange';
import BusinessIcon from '@mui/icons-material/Business';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { NavLink, useLocation } from 'react-router-dom';
import type { SvgIconComponent } from '@mui/icons-material';
import { mainNavigation } from '@/config/navigation';
import { hasPermission } from '@/config/permissions';
import { useAuthStore } from '@/stores/authStore';
import { SIDEBAR_COLLAPSED_WIDTH, SIDEBAR_WIDTH } from '@/constants';
import { getSidebarTokens } from '@/theme/createTheme';
import { useAppTheme } from '@/theme/ThemeProvider';
import { useUiStore } from '@/stores/uiStore';

const iconMap: Record<string, SvgIconComponent> = {
  Dashboard: DashboardIcon,
  PointOfSale: PointOfSaleIcon,
  Receipt: ReceiptIcon,
  Undo: UndoIcon,
  Category: CategoryIcon,
  Folder: FolderIcon,
  Inventory: Inventory2Icon,
  Warehouse: WarehouseIcon,
  SwapHoriz: SwapHorizIcon,
  People: PeopleIcon,
  AccountBalance: AccountBalanceIcon,
  Payments: PaymentsIcon,
  Assessment: AssessmentIcon,
  Insights: InsightsIcon,
  Notifications: NotificationsIcon,
  Settings: SettingsIcon,
  AdminPanelSettings: AdminPanelSettingsIcon,
  Price: PriceChangeIcon,
  Receive: AddBoxIcon,
  Batch: InventoryIcon,
  Adjust: TuneIcon,
  Currency: CurrencyExchangeIcon,
  Business: BusinessIcon,
};

interface SidebarProps {
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export function Sidebar({ mobileOpen, onMobileClose }: SidebarProps) {
  const location = useLocation();
  const theme = useTheme();
  const { resolvedMode } = useAppTheme();
  const sidebarTokens = getSidebarTokens(resolvedMode);
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { sidebarCollapsed, toggleSidebar } = useUiStore();
  const permissions = useAuthStore((s) => s.permissions);
  const enabledModules = useAuthStore((s) => s.enabledModules);

  const visibleNav = mainNavigation
    .filter((group) => enabledModules.includes(group.module))
    .map((group) => ({
      ...group,
      items: group.items.filter(
        (item) =>
          (!item.module || enabledModules.includes(item.module)) &&
          (!item.permission || hasPermission(permissions, item.permission)),
      ),
    }))
    .filter((group) => group.items.length > 0);

  const width = sidebarCollapsed && !isMobile ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH;

  const isItemActive = (path: string) =>
    location.pathname === path ||
    (path !== '/dashboard' && location.pathname.startsWith(path));

  const content = (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: sidebarTokens.background,
        color: sidebarTokens.foreground,
        width,
        transition: 'width 0.2s ease',
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          height: 56,
          display: 'flex',
          alignItems: 'center',
          justifyContent: sidebarCollapsed && !isMobile ? 'center' : 'space-between',
          px: sidebarCollapsed && !isMobile ? 1 : 2,
          borderBottom: `1px solid ${sidebarTokens.border}`,
        }}
      >
        {(!sidebarCollapsed || isMobile) && (
          <Box sx={{ fontWeight: 700, fontSize: '1.125rem', letterSpacing: '-0.02em' }}>
            ERP
          </Box>
        )}
        {!isMobile && (
          <IconButton
            size="small"
            onClick={toggleSidebar}
            sx={{ color: sidebarTokens.foregroundMuted }}
            aria-label={sidebarCollapsed ? 'Yoyish' : 'Yig\'ish'}
          >
            {sidebarCollapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
          </IconButton>
        )}
      </Box>

      <Box sx={{ flex: 1, overflowY: 'auto', py: 1 }}>
        {visibleNav.map((group) => (
          <Box key={group.id} sx={{ mb: 1 }}>
            {(!sidebarCollapsed || isMobile) && (
              <Typography
                variant="caption"
                sx={{
                  px: 2,
                  py: 0.5,
                  display: 'block',
                  color: sidebarTokens.foregroundMuted,
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  fontSize: '0.65rem',
                }}
              >
                {group.label}
              </Typography>
            )}
            <List dense disablePadding sx={{ px: 0.5 }}>
              {group.items.map((item) => {
                const Icon = iconMap[item.icon] ?? DashboardIcon;
                const isActive = isItemActive(item.path);

                const button = (
                  <ListItemButton
                    key={item.id}
                    component={NavLink}
                    to={item.path}
                    onClick={isMobile ? onMobileClose : undefined}
                    selected={isActive}
                    sx={{
                      minHeight: 40,
                      color: isActive ? '#fff' : sidebarTokens.foregroundMuted,
                      bgcolor: isActive ? sidebarTokens.active : 'transparent',
                      '&:hover': { bgcolor: isActive ? sidebarTokens.active : sidebarTokens.accent },
                      '&.Mui-selected': {
                        bgcolor: sidebarTokens.active,
                        color: '#fff',
                        '&:hover': { bgcolor: sidebarTokens.active },
                      },
                      justifyContent: sidebarCollapsed && !isMobile ? 'center' : 'flex-start',
                      px: sidebarCollapsed && !isMobile ? 1 : 1.5,
                      borderRadius: 1,
                      mb: 0.25,
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        minWidth: sidebarCollapsed && !isMobile ? 0 : 36,
                        color: 'inherit',
                        justifyContent: 'center',
                      }}
                    >
                      <Icon sx={{ fontSize: 20 }} />
                    </ListItemIcon>
                    {(!sidebarCollapsed || isMobile) && (
                      <ListItemText
                        primary={item.label}
                        primaryTypographyProps={{
                          fontSize: '0.8125rem',
                          fontWeight: isActive ? 600 : 400,
                          noWrap: true,
                        }}
                      />
                    )}
                  </ListItemButton>
                );

                if (sidebarCollapsed && !isMobile) {
                  return (
                    <Tooltip key={item.id} title={item.label} placement="right">
                      <Box component="span" sx={{ display: 'block' }}>
                        {button}
                      </Box>
                    </Tooltip>
                  );
                }
                return button;
              })}
            </List>
          </Box>
        ))}
      </Box>
    </Box>
  );

  if (isMobile) {
    return (
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onMobileClose}
        ModalProps={{ keepMounted: true }}
        sx={{ '& .MuiDrawer-paper': { width: SIDEBAR_WIDTH } }}
      >
        {content}
      </Drawer>
    );
  }

  return (
    <Drawer
      variant="permanent"
      sx={{
        width,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width,
          boxSizing: 'border-box',
          border: 'none',
          transition: 'width 0.2s ease',
        },
      }}
    >
      {content}
    </Drawer>
  );
}
