import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary:    { main: '#E8C96D', contrastText: '#0A0A0A' },
    secondary:  { main: '#A0A0A0' },
    background: { default: '#0A0A0A', paper: '#141414' },
    text:       { primary: '#F0F0F0', secondary: '#808080' },
    divider:    '#1E1E1E',
    error:      { main: '#FF6B6B' },
    success:    { main: '#4CAF50' },
  },
  typography: {
    fontFamily: '"Pretendard", "Noto Sans KR", sans-serif',
    fontSize: 15,
    h1: { fontWeight: 800, letterSpacing: '-0.02em' },
    h2: { fontWeight: 700, letterSpacing: '-0.01em' },
    h3: { fontWeight: 700 },
    h4: { fontWeight: 600 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    body1: { fontSize: '1rem', lineHeight: 1.6 },
    body2: { fontSize: '0.925rem', lineHeight: 1.5 },
    caption: { fontSize: '0.8rem', color: '#808080' },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiButtonBase: {
      defaultProps: {
        disableRipple: true,
      },
    },
    MuiCssBaseline: {
      styleOverrides: {
        body: { backgroundColor: '#0A0A0A', scrollbarWidth: 'thin' },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          textTransform: 'none',
          fontWeight: 600,
          fontSize: '0.9rem',
          padding: '8px 20px',
          transition: 'all 0.2s ease',
        },
        contained: {
          background: 'linear-gradient(135deg, #E8C96D 0%, #D4AF37 100%)',
          color: '#0A0A0A',
          boxShadow: '0 4px 15px rgba(232, 201, 109, 0.25)',
          '&:hover': {
            background: 'linear-gradient(135deg, #F0D47A 0%, #E8C96D 100%)',
            boxShadow: '0 6px 20px rgba(232, 201, 109, 0.35)',
            transform: 'translateY(-1px)',
          },
        },
        outlined: {
          borderColor: '#2A2A2A',
          '&:hover': { borderColor: '#E8C96D', backgroundColor: 'rgba(232,201,109,0.05)' },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: '#111111',
          backgroundImage: 'none',
          border: '1px solid #1E1E1E',
          borderRadius: 16,
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 8px 30px rgba(0,0,0,0.4)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 10,
            backgroundColor: '#111111',
            '& fieldset': { borderColor: '#2A2A2A' },
            '&:hover fieldset': { borderColor: '#3A3A3A' },
            '&.Mui-focused fieldset': { borderColor: '#E8C96D', borderWidth: 1.5 },
          },
          '& .MuiInputLabel-root.Mui-focused': { color: '#E8C96D' },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 500,
          fontSize: '0.75rem',
        },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: {
          border: '2px solid #2A2A2A',
          fontWeight: 700,
        },
      },
    },
    MuiDivider: {
      styleOverrides: { root: { borderColor: '#1E1E1E' } },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          transition: 'all 0.2s ease',
          '&:hover': { backgroundColor: 'rgba(255,255,255,0.05)' },
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          fontSize: '0.9rem',
        },
      },
    },
    MuiBottomNavigation: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(10,10,10,0.95)',
          backdropFilter: 'blur(20px)',
          borderTop: '1px solid #1E1E1E',
          height: 60,
        },
      },
    },
    MuiBottomNavigationAction: {
      styleOverrides: {
        root: {
          color: '#404040',
          '&.Mui-selected': { color: '#E8C96D' },
          minWidth: 'auto',
        },
      },
    },
  },
});

export default theme;
