import { createTheme, type Theme, type PaletteMode } from '@mui/material/styles';
import { designTokens } from './tokens';

export function createAppTheme(mode: PaletteMode): Theme {
  const tokens = mode === 'light' ? designTokens.light : designTokens.dark;

  return createTheme({
    cssVariables: true,
    palette: {
      mode,
      primary: {
        main: tokens.primary.main,
        light: tokens.primary.light,
        dark: tokens.primary.dark,
        contrastText: '#FFFFFF',
      },
      secondary: {
        main: mode === 'light' ? '#F1F5F9' : '#1E293B',
        contrastText: tokens.foreground.primary,
      },
      error: {
        main: tokens.status.error,
      },
      warning: {
        main: tokens.status.warning,
      },
      success: {
        main: tokens.status.success,
      },
      info: {
        main: tokens.status.info,
      },
      background: {
        default: tokens.background.page,
        paper: tokens.background.elevated,
      },
      text: {
        primary: tokens.foreground.primary,
        secondary: tokens.foreground.secondary,
        disabled: tokens.foreground.tertiary,
      },
      divider: tokens.border.default,
    },
    shape: {
      borderRadius: designTokens.radius.md,
    },
    typography: {
      fontFamily: designTokens.typography.fontFamily,
      h1: { fontSize: '1.875rem', fontWeight: 700, lineHeight: 1.2 },
      h2: { fontSize: '1.5rem', fontWeight: 600, lineHeight: 1.3 },
      h3: { fontSize: '1.25rem', fontWeight: 600, lineHeight: 1.4 },
      h4: { fontSize: '1.125rem', fontWeight: 600, lineHeight: 1.4 },
      h5: { fontSize: '1rem', fontWeight: 600, lineHeight: 1.5 },
      h6: { fontSize: '0.875rem', fontWeight: 600, lineHeight: 1.5 },
      body1: { fontSize: '0.875rem', lineHeight: 1.5 },
      body2: { fontSize: '0.75rem', lineHeight: 1.5 },
      button: { textTransform: 'none', fontWeight: 500 },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundColor: tokens.background.sunken,
          },
          '#root': {
            minHeight: '100vh',
          },
        },
      },
      MuiButton: {
        defaultProps: {
          disableElevation: true,
        },
        styleOverrides: {
          root: {
            borderRadius: designTokens.radius.md,
            minHeight: 44,
            padding: '8px 16px',
          },
          containedPrimary: {
            '&:hover': {
              backgroundColor: tokens.primary.dark,
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: designTokens.radius.md,
            border: `1px solid ${tokens.border.default}`,
            boxShadow: 'none',
          },
        },
      },
      MuiTextField: {
        defaultProps: {
          variant: 'outlined',
          size: 'small',
        },
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: designTokens.radius.md,
              backgroundColor: mode === 'light' ? '#FFFFFF' : tokens.background.elevated,
            },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            border: 'none',
          },
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            borderRadius: designTokens.radius.md,
            margin: '2px 8px',
          },
        },
      },
    },
  });
}

export function getSidebarTokens(mode: PaletteMode) {
  return mode === 'light' ? designTokens.light.sidebar : designTokens.dark.sidebar;
}

export function getCurrencyColor(mode: PaletteMode, currency: 'uzs' | 'usd') {
  const tokens = mode === 'light' ? designTokens.light : designTokens.dark;
  return tokens.currency[currency];
}
