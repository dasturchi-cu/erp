export const designTokens = {
  light: {
    background: {
      page: '#FFFFFF',
      elevated: '#FFFFFF',
      sunken: '#F8FAFC',
    },
    foreground: {
      primary: '#0F172A',
      secondary: '#64748B',
      tertiary: '#94A3B8',
    },
    border: {
      default: '#E2E8F0',
      strong: '#CBD5E1',
      focus: '#2563EB',
      error: '#DC2626',
    },
    primary: {
      main: '#2563EB',
      light: '#3B82F6',
      dark: '#1D4ED8',
      subtle: '#EFF6FF',
    },
    sidebar: {
      background: '#0F172A',
      foreground: '#F8FAFC',
      foregroundMuted: '#94A3B8',
      accent: '#1E293B',
      border: '#1E293B',
      active: '#2563EB',
    },
    status: {
      success: '#16A34A',
      warning: '#D97706',
      error: '#DC2626',
      info: '#0891B2',
    },
    currency: {
      uzs: '#2563EB',
      usd: '#16A34A',
    },
  },
  dark: {
    background: {
      page: '#0F172A',
      elevated: '#1E293B',
      sunken: '#020617',
    },
    foreground: {
      primary: '#F8FAFC',
      secondary: '#94A3B8',
      tertiary: '#64748B',
    },
    border: {
      default: '#334155',
      strong: '#475569',
      focus: '#3B82F6',
      error: '#EF4444',
    },
    primary: {
      main: '#3B82F6',
      light: '#60A5FA',
      dark: '#2563EB',
      subtle: 'rgba(30, 58, 138, 0.3)',
    },
    sidebar: {
      background: '#020617',
      foreground: '#F8FAFC',
      foregroundMuted: '#64748B',
      accent: '#1E293B',
      border: '#1E293B',
      active: '#3B82F6',
    },
    status: {
      success: '#22C55E',
      warning: '#F59E0B',
      error: '#EF4444',
      info: '#06B6D4',
    },
    currency: {
      uzs: '#60A5FA',
      usd: '#22C55E',
    },
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  radius: {
    sm: 4,
    md: 6,
    lg: 12,
    full: 9999,
  },
  shadow: {
    lg: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)',
    md: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)',
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    fontFamilyMono: '"JetBrains Mono", "Roboto Mono", monospace',
  },
} as const;
