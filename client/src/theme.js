import { createTheme } from '@mui/material/styles';

const getDesignTokens = (mode) => {
  const isDark = mode === 'dark';
  return {
    palette: {
      mode,
      primary:    { main: '#E8C96D', light: '#F2D060', dark: '#C8991A', contrastText: '#0A0A0A' },
      secondary:  { main: isDark ? '#A0A0A0' : '#666666' },
      background: {
        default: isDark ? '#080808' : '#F8F8F6',
        paper:   isDark ? '#111111' : '#FFFFFF',
      },
      text: {
        primary:   isDark ? '#EBEBEB' : '#0F0F0F',
        secondary: isDark ? '#707070' : '#777777',
        disabled:  isDark ? '#3A3A3A' : '#C8C8C8',
      },
      divider: isDark ? '#181818' : '#EFEFEF',
      error:   { main: '#FF5757' },
      success: { main: '#4CAF50' },
      action: {
        hover:    isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
        selected: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
      },
    },
    typography: {
      fontFamily: '"Pretendard", "Noto Sans KR", -apple-system, BlinkMacSystemFont, sans-serif',
      fontSize: 15,
      h1: { fontWeight: 800, letterSpacing: '-0.02em', fontFamily: '"Montserrat", "Pretendard", sans-serif' },
      h2: { fontWeight: 700, letterSpacing: '-0.01em', fontFamily: '"Montserrat", "Pretendard", sans-serif' },
      h3: { fontWeight: 700, fontFamily: '"Montserrat", "Pretendard", sans-serif' },
      h4: { fontWeight: 700 },
      h5: { fontWeight: 600 },
      h6: { fontWeight: 600 },
      body1:   { fontSize: '1rem',    lineHeight: 1.65 },
      body2:   { fontSize: '0.925rem', lineHeight: 1.55 },
      caption: { fontSize: '0.8rem',  lineHeight: 1.4, color: isDark ? '#808080' : '#888888' },
    },
    shape: { borderRadius: 12 },
    components: {
      MuiButtonBase: { defaultProps: { disableRipple: true } },
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundColor: isDark ? '#0A0A0A' : '#F5F5F0',
            scrollbarWidth: 'thin',
            scrollbarColor: isDark ? '#2A2A2A #0A0A0A' : '#CCCCCC #F5F5F0',
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 10, textTransform: 'none',
            fontWeight: 600, fontSize: '0.875rem',
            padding: '8px 20px',
            transition: 'all 0.18s cubic-bezier(0.22,1,0.36,1)',
            letterSpacing: '0.01em',
          },
          contained: {
            background: 'linear-gradient(135deg, #E8C96D 0%, #D4AF37 100%)',
            color: '#0A0A0A',
            boxShadow: '0 2px 12px rgba(232,201,109,0.2)',
            '&:hover': {
              background: 'linear-gradient(135deg, #F2D678 0%, #E8C96D 100%)',
              boxShadow: '0 4px 20px rgba(232,201,109,0.4)',
              transform: 'translateY(-1px)',
            },
            '&:active': { transform: 'translateY(0)', boxShadow: '0 1px 6px rgba(232,201,109,0.2)' },
          },
          outlined: {
            borderColor: isDark ? '#2A2A2A' : '#DDDDDD',
            '&:hover': {
              borderColor: '#E8C96D',
              backgroundColor: 'rgba(232,201,109,0.06)',
              transform: 'translateY(-0.5px)',
            },
          },
          text: {
            '&:hover': { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            backgroundColor: isDark ? '#111111' : '#FFFFFF',
            backgroundImage: 'none',
            border: `1px solid ${isDark ? '#1A1A1A' : '#EBEBEB'}`,
            borderRadius: 16,
            transition: 'transform 0.22s cubic-bezier(0.22,1,0.36,1), box-shadow 0.22s cubic-bezier(0.22,1,0.36,1)',
            '&:hover': {
              transform: 'translateY(-3px)',
              boxShadow: isDark
                ? '0 12px 40px rgba(0,0,0,0.5)'
                : '0 12px 40px rgba(0,0,0,0.1)',
            },
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: 10,
              backgroundColor: isDark ? '#111111' : '#FAFAFA',
              '& fieldset': { borderColor: isDark ? '#2A2A2A' : '#DEDEDE' },
              '&:hover fieldset': { borderColor: isDark ? '#3A3A3A' : '#CCCCCC' },
              '&.Mui-focused fieldset': { borderColor: '#E8C96D', borderWidth: 1.5 },
            },
            '& .MuiInputLabel-root.Mui-focused': { color: '#E8C96D' },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            backgroundColor: isDark ? '#111111' : '#FFFFFF',
          },
          elevation1: { boxShadow: isDark ? '0 2px 12px rgba(0,0,0,0.4)' : '0 2px 12px rgba(0,0,0,0.08)' },
          elevation8: { boxShadow: isDark ? '0 8px 32px rgba(0,0,0,0.6)' : '0 8px 32px rgba(0,0,0,0.12)' },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: { borderRadius: 8, fontWeight: 500, fontSize: '0.75rem' },
        },
      },
      MuiAvatar: {
        styleOverrides: {
          root: {
            border: `2px solid ${isDark ? '#2A2A2A' : '#E8E8E8'}`,
            fontWeight: 700,
          },
        },
      },
      MuiDivider: {
        styleOverrides: { root: { borderColor: isDark ? '#1E1E1E' : '#EBEBEB' } },
      },
      MuiIconButton: {
        styleOverrides: {
          root: {
            borderRadius: 10, transition: 'all 0.2s ease',
            '&:hover': {
              backgroundColor: isDark
                ? 'rgba(255,255,255,0.05)'
                : 'rgba(0,0,0,0.05)',
            },
          },
        },
      },
      MuiTabs: {
        styleOverrides: {
          root:     { backgroundColor: 'transparent' },
          scroller: { backgroundColor: 'transparent' },
        },
      },
      MuiTab: {
        styleOverrides: {
          root: {
            textTransform: 'none', fontWeight: 600, fontSize: '0.9rem',
            backgroundColor: 'transparent',
            '&.Mui-selected': { backgroundColor: 'transparent' },
          },
        },
      },
      MuiBottomNavigation: {
        styleOverrides: {
          root: {
            backgroundColor: isDark
              ? 'rgba(10,10,10,0.95)'
              : 'rgba(255,255,255,0.95)',
            backdropFilter: 'blur(20px)',
            borderTop: `1px solid ${isDark ? '#1E1E1E' : '#EBEBEB'}`,
            height: 60,
          },
        },
      },
      MuiBottomNavigationAction: {
        styleOverrides: {
          root: {
            color: isDark ? '#404040' : '#AAAAAA',
            '&.Mui-selected': { color: '#E8C96D' },
            minWidth: 'auto',
          },
        },
      },
    },
  };
};

export const createAppTheme = (mode) => createTheme(getDesignTokens(mode));
export default createAppTheme('dark');