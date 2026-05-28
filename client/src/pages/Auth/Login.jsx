import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Box, Card, CardContent, Typography,
  TextField, Button, Divider, CircularProgress,
} from '@mui/material';
import { Google, EmailRounded, LockRounded } from '@mui/icons-material';
import { InputAdornment } from '@mui/material';
import toast from 'react-hot-toast';
import useAuthStore from '../../store/authStore';
import { login } from '../../api/authApi';

const Login = () => {
  const navigate    = useNavigate();
  const { setAuth } = useAuthStore();
  const [form, setForm]       = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await login(form);
      localStorage.setItem('accessToken', res.data.accessToken);
      setAuth(res.data.user, res.data.accessToken);
      toast.success(`${res.data.user.username}님, 환영합니다!`);
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || '로그인에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#0A0A0A',
      p: 2,
      position: 'relative',
      overflow: 'hidden',
      '&::before': {
        content: '""',
        position: 'absolute',
        top: '-20%', left: '50%',
        transform: 'translateX(-50%)',
        width: 600, height: 600,
        background: 'radial-gradient(circle, rgba(232,201,109,0.06) 0%, transparent 70%)',
        pointerEvents: 'none',
      },
    }}>
      <Box sx={{ width: '100%', maxWidth: 400, position: 'relative', zIndex: 1 }}>
        {/* 로고 */}
        <Box sx={{ textAlign: 'center', mb: 5 }}>
          <Typography variant="h3" fontWeight={900} letterSpacing={6}
            sx={{
              background: 'linear-gradient(135deg, #E8C96D, #D4AF37)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 1,
            }}>
            FITLOG
          </Typography>
          <Typography variant="body2" sx={{ color: '#404040', letterSpacing: 3, fontSize: 11 }}>
            FASHION ARCHIVE SNS
          </Typography>
        </Box>

        <Card sx={{
          background: 'rgba(20,20,20,0.8)',
          backdropFilter: 'blur(20px)',
          border: '1px solid #1E1E1E',
          borderRadius: 4,
          p: 1,
        }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={700} mb={3}>로그인</Typography>

            <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                name="email" label="이메일" type="email"
                value={form.email} onChange={handleChange}
                fullWidth required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailRounded sx={{ color: '#404040', fontSize: 18 }} />
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                name="password" label="비밀번호" type="password"
                value={form.password} onChange={handleChange}
                fullWidth required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockRounded sx={{ color: '#404040', fontSize: 18 }} />
                    </InputAdornment>
                  ),
                }}
              />
              <Button type="submit" variant="contained" fullWidth
                disabled={loading} size="large" sx={{ mt: 1, py: 1.5 }}>
                {loading ? <CircularProgress size={22} sx={{ color: '#0A0A0A' }} /> : '로그인'}
              </Button>
            </Box>

            <Divider sx={{ my: 3 }}>
              <Typography variant="caption" color="text.secondary">또는</Typography>
            </Divider>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Button variant="outlined" fullWidth startIcon={<Google />}
                href="http://localhost:5000/api/auth/google"
                sx={{ py: 1.2, borderColor: '#2A2A2A',
                  '&:hover': { borderColor: '#4A4A4A', backgroundColor: 'rgba(255,255,255,0.03)' } }}>
                Google로 계속하기
              </Button>
              <Button variant="outlined" fullWidth
                href="http://localhost:5000/api/auth/kakao"
                sx={{ py: 1.2, borderColor: '#FEE500', color: '#FEE500',
                  '&:hover': { backgroundColor: 'rgba(254,229,0,0.05)' } }}>
                카카오로 계속하기
              </Button>
            </Box>

            <Typography textAlign="center" mt={3} variant="body2" color="text.secondary">
              아직 계정이 없으신가요?{' '}
              <Link to="/register" style={{ color: '#E8C96D', fontWeight: 700 }}>
                회원가입
              </Link>
            </Typography>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default Login;