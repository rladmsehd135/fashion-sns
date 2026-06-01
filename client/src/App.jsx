import { useMemo } from 'react';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { createAppTheme } from './theme';
import useThemeStore from './store/themeStore';
import AppRouter from './router/AppRouter';
import { Toaster } from 'react-hot-toast';

export default function App() {
  const { mode } = useThemeStore();
  const theme = useMemo(() => createAppTheme(mode), [mode]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppRouter />
      <Toaster position="top-center" />
    </ThemeProvider>
  );
}