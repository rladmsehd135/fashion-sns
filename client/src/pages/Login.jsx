import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Box, Card, CardContent, Typography, TextField,
  Button, Divider, CircularProgress, Alert,
} from '@mui/material';
import { Google } from '@mui/icons-material';
import useAuthStore from '../../store/authStore';
import { login } from '../../api/authApi';

const Login = () => {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [form, setForm]     = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await login(form);
      localStorage.setItem('accessToken', res.data.accessToken);
      setAuth(res.data.user, res.data.accessToken);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || '로그인에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{
      minHeight: '100vh', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      backgroundColor: '#0A0A0A', p: 2,
    }}>
      <Card sx={{ width: '100%', maxWidth: 400, p: 2 }}>
        <CardContent>
          <Typography variant="h4" fontWeight={800} textAlign="center"
            sx={{ color: '#E8C96D', letterSpacing: 3, mb: 1 }}>
            FITLOG
          </Typography>
          <Typography variant="body2" textAlign="center" color="text.secondary" mb={4}>
            패션을 기록하고 공유하세요
          </Typography>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              name="email" label="이메일" type="email"
              value={form.email} onChange={handleChange}
              fullWidth required
            />
            <TextField
              name="password" label="비밀번호" type="password"
              value={form.password} onChange={handleChange}
              fullWidth required
            />
            <Button
              type="submit" variant="contained" fullWidth
              disabled={loading} size="large"
              sx={{ backgroundColor: '#E8C96D', color: '#0A0A0A', fontWeight: 700,
                '&:hover': { backgroundColor: '#D4B55A' } }}
            >
              {loading ? <CircularProgress size={24} /> : '로그인'}
            </Button>
          </Box>

          <Divider sx={{ my: 3 }}>또는</Divider>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Button
              variant="outlined" fullWidth startIcon={<Google />}
              href="http://localhost:5000/api/auth/google"
              sx={{ borderColor: '#2A2A2A', color: '#F0F0F0',
                '&:hover': { borderColor: '#E8C96D' } }}
            >
              Google로 로그인
            </Button>
            <Button
              variant="outlined" fullWidth
              href="http://localhost:5000/api/auth/kakao"
              sx={{ borderColor: '#FEE500', color: '#FEE500',
                '&:hover': { borderColor: '#FEE500', backgroundColor: 'rgba(254,229,0,0.05)' } }}
            >
              카카오로 로그인
            </Button>
          </Box>

          <Typography textAlign="center" mt={3} variant="body2" color="text.secondary">
            계정이 없으신가요?{' '}
            <Link to="/register" style={{ color: '#E8C96D', fontWeight: 600 }}>
              회원가입
            </Link>
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Login;