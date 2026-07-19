/**
 * Thème Material UI personnalisé
 * Inspiré de Google Material 3, Notion, Linear
 * Palette moderne avec mode clair et sombre
 */
import { createTheme, alpha } from '@mui/material/styles';

// Palette de couleurs principales
const palette = {
  primary: { main: '#6366F1', light: '#818CF8', dark: '#4F46E5', contrastText: '#fff' },
  secondary: { main: '#EC4899', light: '#F472B6', dark: '#DB2777', contrastText: '#fff' },
  success: { main: '#10B981', light: '#34D399', dark: '#059669' },
  warning: { main: '#F59E0B', light: '#FBBF24', dark: '#D97706' },
  error: { main: '#EF4444', light: '#F87171', dark: '#DC2626' },
  info: { main: '#3B82F6', light: '#60A5FA', dark: '#2563EB' },
};

// Composants partagés
const sharedComponents = {
  MuiButton: {
    styleOverrides: {
      root: {
        borderRadius: 12,
        textTransform: 'none',
        fontWeight: 600,
        padding: '10px 24px',
        boxShadow: 'none',
        '&:hover': { boxShadow: 'none' },
      },
      contained: {
        '&:hover': {
          transform: 'translateY(-1px)',
          transition: 'transform 0.2s ease',
        },
      },
    },
  },
  MuiCard: {
    styleOverrides: {
      root: {
        borderRadius: 16,
        boxShadow: 'none',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
        },
      },
    },
  },
  MuiPaper: {
    styleOverrides: {
      root: { borderRadius: 16 },
    },
  },
  MuiTextField: {
    styleOverrides: {
      root: {
        '& .MuiOutlinedInput-root': {
          borderRadius: 12,
        },
      },
    },
  },
  MuiChip: {
    styleOverrides: {
      root: { borderRadius: 8, fontWeight: 500 },
    },
  },
  MuiDialog: {
    styleOverrides: {
      paper: { borderRadius: 20 },
    },
  },
  MuiDrawer: {
    styleOverrides: {
      paper: { border: 'none' },
    },
  },
  MuiListItemButton: {
    styleOverrides: {
      root: {
        borderRadius: 12,
        margin: '2px 8px',
        '&.Mui-selected': {
          fontWeight: 600,
        },
      },
    },
  },
  MuiTableCell: {
    styleOverrides: {
      head: { fontWeight: 700 },
    },
  },
  MuiFab: {
    styleOverrides: {
      root: { borderRadius: 16, boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)' },
    },
  },
};

const typography = {
  fontFamily: '"Inter", "Segoe UI", "Roboto", "Helvetica Neue", sans-serif',
  h1: { fontWeight: 800, letterSpacing: '-0.02em' },
  h2: { fontWeight: 700, letterSpacing: '-0.01em' },
  h3: { fontWeight: 700 },
  h4: { fontWeight: 700 },
  h5: { fontWeight: 600 },
  h6: { fontWeight: 600 },
  subtitle1: { fontWeight: 500 },
  body1: { lineHeight: 1.7 },
  button: { fontWeight: 600 },
};

export const lightTheme = createTheme({
  palette: {
    mode: 'light',
    ...palette,
    background: {
      default: '#F8FAFC',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#1E293B',
      secondary: '#64748B',
    },
    divider: '#E2E8F0',
  },
  typography,
  shape: { borderRadius: 12 },
  components: {
    ...sharedComponents,
    MuiCard: {
      styleOverrides: {
        root: {
          ...sharedComponents.MuiCard.styleOverrides.root,
          border: '1px solid #E2E8F0',
        },
      },
    },
  },
});

export const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    ...palette,
    background: {
      default: '#0F172A',
      paper: '#1E293B',
    },
    text: {
      primary: '#F1F5F9',
      secondary: '#94A3B8',
    },
    divider: '#334155',
  },
  typography,
  shape: { borderRadius: 12 },
  components: {
    ...sharedComponents,
    MuiCard: {
      styleOverrides: {
        root: {
          ...sharedComponents.MuiCard.styleOverrides.root,
          border: '1px solid #334155',
        },
      },
    },
  },
});
