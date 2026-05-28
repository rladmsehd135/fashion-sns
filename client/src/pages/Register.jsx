import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Box, Card, CardContent, Typography,
  TextField, Button, CircularProgress, Alert,
} from '@mui/material';
import { register } from '../../api/authApi';

const Register = () => {
  const navigate = useNavigate();
  const [form, setForm]       = useState({ username: '', email: '', password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) {
      return setError('비밀번호가 일치하지 않습니다.');
    }
    setLoading(true);
    setError('');
    try {
      await register({ username: form.username, email: form.email, password: form.password });
      navigate('/login', { state: { message: '회원가입이 완료되었습니다.' } });
    } catch (err) {
      setError(err.response?.data?.message || '회원가입에 실패했습니다.');
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
            새 계정 만들기
          </Typography>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              name="username" label="닉네임"
              value={form.username} onChange={handleChange}
              fullWidth required
            />
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
            <TextField
              name="confirm" label="비밀번호 확인" type="password"
              value={form.confirm} onChange={handleChange}
              fullWidth required
            />
            <Button
              type="submit" variant="contained" fullWidth
              disabled={loading} size="large"
              sx={{ backgroundColor: '#E8C96D', color: '#0A0A0A', fontWeight: 700,
                '&:hover': { backgroundColor: '#D4B55A' } }}
            >
              {loading ? <CircularProgress size={24} /> : '회원가입'}
            </Button>
          </Box>

          <Typography textAlign="center" mt={3} variant="body2" color="text.secondary">
            이미 계정이 있으신가요?{' '}
            <Link to="/login" style={{ color: '#E8C96D', fontWeight: 600 }}>
              로그인
            </Link>
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Register;