import { createTheme } from '@mui/material/styles'

// Paleta sobria, orientada a contexto clínico (azul/teal).
export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#1565c0' },
    secondary: { main: '#00897b' },
    success: { main: '#2e7d32' },
    warning: { main: '#ef6c00' },
    error: { main: '#c62828' },
    background: { default: '#f4f6f8' },
  },
  shape: { borderRadius: 10 },
  typography: {
    fontFamily: '"Roboto", "Segoe UI", Helvetica, Arial, sans-serif',
    h6: { fontWeight: 600 },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: { boxShadow: '0 1px 4px rgba(0,0,0,0.08)' },
      },
    },
  },
})
