import React from 'react';
import ReactDOM from 'react-dom/client';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Toaster } from 'react-hot-toast';
import App from './App';
import theme from './theme';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#1A1A1A',
            color:       '#F0F0F0',
            border:      '1px solid #2A2A2A',
            borderRadius: '12px',
            fontSize:    '14px',
            fontFamily:  'Pretendard, sans-serif',
            padding:     '12px 16px',
          },
          success: {
            iconTheme: { primary: '#E8C96D', secondary: '#0A0A0A' },
          },
          error: {
            iconTheme: { primary: '#FF6B6B', secondary: '#0A0A0A' },
          },
        }}
      />
      <App />
    </ThemeProvider>
  </React.StrictMode>
);