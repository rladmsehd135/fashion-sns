import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';
import useAuthStore from '../../store/authStore';
import axiosInstance from '../../api/axiosInstance';

const SocialCallback = () => {
  const navigate    = useNavigate();
  const [params]    = useSearchParams();
  const { setAuth } = useAuthStore();

  useEffect(() => {
    const token = params.get('token');
    if (token) {
      localStorage.setItem('accessToken', token);
      axiosInstance.get('/users/me')
        .then(res => { setAuth(res.data, token); navigate('/'); })
        .catch(() => navigate('/login'));
    } else {
      navigate('/login');
    }
  }, []);

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 2 }}>
      <CircularProgress sx={{ color: '#E8C96D' }} />
      <Typography color="text.secondary">로그인 중...</Typography>
    </Box>
  );
};

export default SocialCallback;