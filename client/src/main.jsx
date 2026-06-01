import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// App.jsx 내부에서 ThemeProvider와 Toaster를 이미 관리하고 있으므로
// main.jsx에서는 App만 렌더링하여 충돌을 방지합니다.
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);