import { createTheme } from '@mui/material/styles';

const getDesignTokens = (mode) => {
  const isDark = mode === 'dark';
  return {
    palette: {
      mode,
      primary:    { main: '#E8C96D', contrastText: '#0A0A0A' },
      secondary:  { main: isDark ? '#A0A0A0' : '#666666' },
      background: {
        default: isDark ? '#0A0A0A' : '#F5F5F0',
        paper:   isDark ? '#141414' : '#FFFFFF',
      },
      text: {
        primary:   isDark ? '#F0F0F0' : '#0A0A0A',
        secondary: isDark ? '#808080' : '#666666',
      },
      divider: isDark ? '#1E1E1E' : '#E8E8E3',
      error:   { main: '#FF6B6B' },
      success: { main: '#4CAF50' },
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
      body1:   { fontSize: '1rem',    lineHeight: 1.6 },
      body2:   { fontSize: '0.925rem', lineHeight: 1.5 },
      caption: { fontSize: '0.8rem',  color: isDark ? '#808080' : '#888888' },
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
            fontWeight: 600, fontSize: '0.9rem',
            padding: '8px 20px', transition: 'all 0.2s ease',
          },
          contained: {
            background: 'linear-gradient(135deg, #E8C96D 0%, #D4AF37 100%)',
            color: '#0A0A0A',
            boxShadow: '0 4px 15px rgba(232,201,109,0.25)',
            '&:hover': {
              background: 'linear-gradient(135deg, #F0D47A 0%, #E8C96D 100%)',
              boxShadow: '0 6px 20px rgba(232,201,109,0.35)',
              transform: 'translateY(-1px)',
            },
          },
          outlined: {
            borderColor: isDark ? '#2A2A2A' : '#DDDDDD',
            '&:hover': { borderColor: '#E8C96D', backgroundColor: 'rgba(232,201,109,0.05)' },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            backgroundColor: isDark ? '#111111' : '#FFFFFF',
            backgroundImage: 'none',
            border: `1px solid ${isDark ? '#1E1E1E' : '#EBEBEB'}`,
            borderRadius: 16,
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: isDark
                ? '0 8px 30px rgba(0,0,0,0.4)'
                : '0 8px 30px rgba(0,0,0,0.1)',
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
            backgroundColor: isDark ? '#141414' : '#FFFFFF',
          },
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
      MuiTab: {
        styleOverrides: {
          root: { textTransform: 'none', fontWeight: 600, fontSize: '0.9rem' },
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