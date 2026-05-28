import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Box, Card, CardContent, Typography,
  TextField, Button, CircularProgress,
  InputAdornment, Chip,
} from '@mui/material';
import { PersonRounded, EmailRounded, LockRounded } from '@mui/icons-material';
import toast from 'react-hot-toast';
import { register } from '../../api/authApi';

const styles = [
  { label: '테크웨어', value: 'techwear', emoji: '🥷' },
  { label: '아메카지', value: 'amekaji',  emoji: '🧢' },
  { label: '캐주얼',   value: 'casual',   emoji: '👕' },
  { label: '스트릿',   value: 'street',   emoji: '🔥' },
  { label: '워크웨어', value: 'workwear', emoji: '🧥' },
  { label: '기타',     value: 'etc',      emoji: '✨' },
];

const Register = () => {
  const navigate = useNavigate();
  const [step, setStep]         = useState(1); // 1: 기본정보, 2: 스타일 선택
  const [form, setForm]         = useState({ username: '', email: '', password: '', confirm: '' });
  const [selectedStyle, setSelectedStyle] = useState('');
  const [loading, setLoading]   = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleNext = (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) return toast.error('비밀번호가 일치하지 않습니다.');
    if (form.password.length < 6) return toast.error('비밀번호는 6자 이상이어야 합니다.');
    setStep(2);
  };

  const handleSubmit = async () => {
    if (!selectedStyle) return toast.error('스타일을 선택해주세요.');
    setLoading(true);
    try {
      await register({
        username: form.username,
        email: form.email,
        password: form.password,
        preferred_style: selectedStyle,
      });
      toast.success('환영합니다! 🎉');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || '회원가입에 실패했습니다.');
      setStep(1);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{
      minHeight: '100vh', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      backgroundColor: '#0A0A0A', p: 2,
      position: 'relative', overflow: 'hidden',
      '&::before': {
        content: '""', position: 'absolute',
        top: '-20%', left: '50%', transform: 'translateX(-50%)',
        width: 600, height: 600,
        background: 'radial-gradient(circle, rgba(232,201,109,0.06) 0%, transparent 70%)',
        pointerEvents: 'none',
      },
    }}>
      <Box sx={{ width: '100%', maxWidth: 420, position: 'relative', zIndex: 1 }}>
        {/* 로고 */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="h3" fontWeight={900} letterSpacing={6}
            sx={{
              background: 'linear-gradient(135deg, #E8C96D, #D4AF37)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', mb: 0.5,
            }}>
            FITLOG
          </Typography>
          <Typography sx={{ color: '#333', letterSpacing: 3, fontSize: 10 }}>
            FASHION ARCHIVE SNS
          </Typography>
        </Box>

        {/* 스텝 인디케이터 */}
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mb: 3 }}>
          {[1,2].map(s => (
            <Box key={s} sx={{
              width: s === step ? 24 : 8, height: 8, borderRadius: 4,
              backgroundColor: s === step ? '#E8C96D' : s < step ? '#E8C96D80' : '#2A2A2A',
              transition: 'all 0.3s ease',
            }} />
          ))}
        </Box>

        <Card sx={{
          background: 'rgba(16,16,16,0.9)',
          backdropFilter: 'blur(20px)',
          border: '1px solid #1E1E1E',
          borderRadius: 4, p: 1,
        }}>
          <CardContent sx={{ p: 3 }}>

            {/* STEP 1 — 기본 정보 */}
            {step === 1 && (
              <>
                <Typography fontWeight={700} fontSize={18} mb={0.5}>계정 만들기</Typography>
                <Typography variant="body2" color="text.secondary" mb={3}>기본 정보를 입력해주세요</Typography>
                <Box component="form" onSubmit={handleNext} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <TextField name="username" label="닉네임" value={form.username} onChange={handleChange} fullWidth required
                    InputProps={{ startAdornment: <InputAdornment position="start"><PersonRounded sx={{ color: '#333', fontSize: 18 }} /></InputAdornment> }} />
                  <TextField name="email" label="이메일" type="email" value={form.email} onChange={handleChange} fullWidth required
                    InputProps={{ startAdornment: <InputAdornment position="start"><EmailRounded sx={{ color: '#333', fontSize: 18 }} /></InputAdornment> }} />
                  <TextField name="password" label="비밀번호" type="password" value={form.password} onChange={handleChange} fullWidth required
                    InputProps={{ startAdornment: <InputAdornment position="start"><LockRounded sx={{ color: '#333', fontSize: 18 }} /></InputAdornment> }} />
                  <TextField name="confirm" label="비밀번호 확인" type="password" value={form.confirm} onChange={handleChange} fullWidth required
                    InputProps={{ startAdornment: <InputAdornment position="start"><LockRounded sx={{ color: '#333', fontSize: 18 }} /></InputAdornment> }} />
                  <Button type="submit" variant="contained" fullWidth size="large" sx={{ mt: 1, py: 1.5, fontWeight: 700 }}>
                    다음
                  </Button>
                </Box>
              </>
            )}

            {/* STEP 2 — 스타일 선택 */}
            {step === 2 && (
              <>
                <Typography fontWeight={700} fontSize={18} mb={0.5}>스타일 선택</Typography>
                <Typography variant="body2" color="text.secondary" mb={3}>
                  선호하는 패션 스타일을 선택해주세요.<br />
                  비슷한 취향의 유저들을 추천해드려요!
                </Typography>

                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1.5, mb: 3 }}>
                  {styles.map(s => (
                    <Box key={s.value}
                      onClick={() => setSelectedStyle(s.value)}
                      sx={{
                        p: 2, borderRadius: 3, cursor: 'pointer',
                        border: `1.5px solid ${selectedStyle === s.value ? '#E8C96D' : '#1E1E1E'}`,
                        backgroundColor: selectedStyle === s.value ? 'rgba(232,201,109,0.08)' : '#111',
                        transition: 'all 0.2s ease',
                        textAlign: 'center',
                        '&:hover': { borderColor: '#3A3A3A', backgroundColor: '#1A1A1A' },
                      }}>
                      <Typography fontSize={28} mb={0.5}>{s.emoji}</Typography>
                      <Typography variant="body2" fontWeight={selectedStyle === s.value ? 700 : 400}
                        color={selectedStyle === s.value ? '#E8C96D' : '#C0C0C0'}>
                        {s.label}
                      </Typography>
                    </Box>
                  ))}
                </Box>

                <Box sx={{ display: 'flex', gap: 1.5 }}>
                  <Button variant="outlined" fullWidth onClick={() => setStep(1)}
                    sx={{ py: 1.5, borderColor: '#2A2A2A', color: '#A0A0A0' }}>
                    이전
                  </Button>
                  <Button variant="contained" fullWidth onClick={handleSubmit}
                    disabled={!selectedStyle || loading} size="large" sx={{ py: 1.5, fontWeight: 700 }}>
                    {loading ? <CircularProgress size={22} sx={{ color: '#0A0A0A' }} /> : '시작하기 🎉'}
                  </Button>
                </Box>
              </>
            )}

            <Typography textAlign="center" mt={3} variant="body2" color="text.secondary">
              이미 계정이 있으신가요?{' '}
              <Link to="/login" style={{ color: '#E8C96D', fontWeight: 700 }}>로그인</Link>
            </Typography>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default Register;