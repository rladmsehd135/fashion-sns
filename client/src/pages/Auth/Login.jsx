import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Box, Card, CardContent, Typography, TextField,
  Button, Divider, CircularProgress, InputAdornment, IconButton,
} from '@mui/material';
import {
  EmailRounded, LockRounded,
  VisibilityRounded, VisibilityOffRounded,
} from '@mui/icons-material';
import toast from 'react-hot-toast';
import { ThemeProvider } from '@mui/material/styles';
import { createAppTheme } from '../../theme';
import useAuthStore from '../../store/authStore';
import { login } from '../../api/authApi';
import BrandMark from '../../components/common/BrandMark';

const darkTheme = createAppTheme('dark');

const KakaoIcon = () => (
  <Box sx={{
    width: 20, height: 20, borderRadius: '50%',
    backgroundColor: '#FEE500',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  }}>
    <Typography sx={{ fontSize: 12, fontWeight: 900, color: '#3A1D1D', lineHeight: 1 }}>K</Typography>
  </Box>
);

export default function Login() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await login(form);
      localStorage.setItem('accessToken', res.data.accessToken);
      setAuth(res.data.user, res.data.accessToken);
      toast.success(`${res.data.user.username}님, 환영합니다! 👋`);
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || '로그인에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemeProvider theme={darkTheme}>
    <Box sx={{
      minHeight: '100vh', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      backgroundColor: '#080808', p: 2,
      overflow: 'hidden', position: 'relative',
      animation: 'pageEnter 0.28s cubic-bezier(0.22,1,0.36,1) both',
      '&::before': {
        content: '""', position: 'absolute',
        top: '-15%', left: '40%', width: 600, height: 600,
        background: 'radial-gradient(circle, rgba(232,201,109,0.055) 0%, transparent 65%)',
        pointerEvents: 'none',
      },
    }}>
      <Box sx={{ width: '100%', maxWidth: 420, position: 'relative', zIndex: 1 }}>

        {/* 로고 */}
        <Box sx={{ textAlign: 'center', mb: 5 }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1.5 }}>
            <BrandMark size={44} variant="full" isDark={true} />
          </Box>
          <Typography sx={{ color: '#2A2A2A', letterSpacing: '0.4em', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', fontFamily: '"Montserrat", sans-serif' }}>
            Style · Archive · Community
          </Typography>
        </Box>

        <Card sx={{
          background: 'rgba(12,12,12,0.97)',
          backdropFilter: 'blur(28px)',
          border: '1px solid #161616',
          borderRadius: '20px',
          boxShadow: '0 24px 60px rgba(0,0,0,0.6)',
        }}>
          <CardContent sx={{ p: 3.5 }}>
            <Box sx={{ mb: 3 }}>
              <Typography fontWeight={800} fontSize={22} letterSpacing={-0.5} mb={0.4}>
                로그인
              </Typography>
              <Typography sx={{ color: '#444', fontSize: 13 }}>
                계정에 로그인하세요
              </Typography>
            </Box>

            <Box component="form" onSubmit={handleSubmit}
              sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>

              <TextField
                name="email" label="이메일" type="email"
                value={form.email} onChange={handleChange}
                fullWidth required autoComplete="email" size="small"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailRounded sx={{ color: '#333', fontSize: 17 }} />
                      </InputAdornment>
                    ),
                  },
                }}
              />

              <TextField
                name="password" label="비밀번호"
                type={showPw ? 'text' : 'password'}
                value={form.password} onChange={handleChange}
                fullWidth required autoComplete="current-password" size="small"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockRounded sx={{ color: '#333', fontSize: 17 }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowPw(p => !p)} size="small" sx={{ color: '#383838' }}>
                          {showPw
                            ? <VisibilityOffRounded sx={{ fontSize: 17 }} />
                            : <VisibilityRounded sx={{ fontSize: 17 }} />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
              />

              <Button type="submit" variant="contained" fullWidth
                disabled={loading} size="large"
                sx={{ py: 1.4, fontWeight: 700, fontSize: 15, borderRadius: '10px', mt: 0.5 }}>
                {loading ? <CircularProgress size={22} sx={{ color: '#0A0A0A' }} /> : '로그인'}
              </Button>
            </Box>

            <Divider sx={{ my: 3 }}>
              <Typography sx={{ color: '#2A2A2A', fontSize: 12 }}>또는</Typography>
            </Divider>

            <Button
              onClick={() => { window.location.href = 'http://localhost:5000/api/auth/kakao'; }}
              fullWidth
              sx={{
                py: 1.4, borderRadius: '10px', fontWeight: 700, fontSize: 14,
                backgroundColor: '#FEE500', color: '#3A1D1D',
                display: 'flex', alignItems: 'center', gap: 1.5,
                '&:hover': { backgroundColor: '#F5DC00' },
              }}>
              <KakaoIcon />
              카카오로 계속하기
            </Button>

            <Typography
              sx={{ textAlign: 'center', mt: 3, color: '#303030', fontSize: 13 }}>
              아직 계정이 없으신가요?{' '}
              <Link to="/register" style={{ color: '#E8C96D', fontWeight: 700, textDecoration: 'none' }}>
                회원가입
              </Link>
            </Typography>
          </CardContent>
        </Card>
      </Box>
    </Box>
    </ThemeProvider>
  );
}
