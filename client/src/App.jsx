import AppRouter from './router/AppRouter';
import useAuth from './hooks/useAuth';

function App() {
  useAuth(); // ← 앱 시작 시 토큰 복원
  return <AppRouter />;
}

export default App;