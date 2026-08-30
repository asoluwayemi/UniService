import { alpha, createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    primary: {
      main: '#7c3aed',
      light: '#a78bfa',
      dark: '#6d28d9',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#2563eb',
      light: '#60a5fa',
      dark: '#1d4ed8',
      contrastText: '#ffffff',
    },
    success: {
      main: '#10b981',
      light: '#34d399',
      dark: '#059669',
    },
    warning: {
      main: '#f59e0b',
      light: '#fbbf24',
      dark: '#d97706',
    },
    error: {
      main: '#ef4444',
      light: '#f87171',
      dark: '#dc2626',
    },
    info: {
      main: '#0284c7',
      light: '#38bdf8',
      dark: '#0369a1',
    },
    background: {
      default: '#f1f5f9',
      paper: '#ffffff',
    },
    divider: 'rgba(226, 232, 240, 0.8)',
    text: {
      primary: '#0f172a',
      secondary: '#64748b',
    },
  },
  shape: {
    borderRadius: 14,
  },
  typography: {
    fontFamily: [
      'Inter',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      'Arial',
      'sans-serif',
    ].join(','),
    fontSize: 13,
    h1: { fontSize: '2.25rem', fontWeight: 800, letterSpacing: '-0.02em' },
    h2: { fontSize: '1.875rem', fontWeight: 800, letterSpacing: '-0.02em' },
    h3: { fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.01em' },
    h4: { fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.01em' },
    h5: { fontSize: '1.05rem', fontWeight: 700 },
    h6: { fontSize: '0.95rem', fontWeight: 700 },
    subtitle1: { fontSize: '0.875rem', fontWeight: 600 },
    subtitle2: { fontSize: '0.8rem', fontWeight: 600 },
    body1: { fontSize: '0.85rem' },
    body2: { fontSize: '0.78rem' },
    button: { fontSize: '0.8rem' },
    caption: { fontSize: '0.7rem' },
    overline: { fontSize: '0.65rem' },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)',
        },
      },
    },
    MuiButton: {
      defaultProps: {
        size: 'small',
      },
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 700,
          borderRadius: 10,
        },
      },
    },
    MuiIconButton: {
      defaultProps: {
        size: 'small',
      },
    },
    MuiTextField: {
      defaultProps: {
        size: 'small',
      },
    },
    MuiFormControl: {
      defaultProps: {
        size: 'small',
      },
    },
    MuiSelect: {
      defaultProps: {
        size: 'small',
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: 'none',
        },
      },
    },
    MuiCard: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: {
          border: '1px solid #e2e8f0',
          borderRadius: 16,
        },
      },
    },
    MuiChip: {
      defaultProps: {
        size: 'small',
      },
      styleOverrides: {
        root: {
          fontWeight: 700,
          borderRadius: 8,
        },
      },
    },
    MuiTable: {
      defaultProps: {
        size: 'small',
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          fontSize: '0.8rem',
          padding: '8px 12px',
        },
        head: {
          fontSize: '0.72rem',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.03em',
        },
      },
    },
    MuiListItemText: {
      styleOverrides: {
        primary: {
          fontSize: '0.85rem',
        },
        secondary: {
          fontSize: '0.75rem',
        },
      },
    },
    MuiInputBase: {
      styleOverrides: {
        input: {
          fontSize: '0.85rem',
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          fontSize: '0.85rem',
          minHeight: 'auto',
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          fontSize: '0.7rem',
        },
      },
    },
  },
});
