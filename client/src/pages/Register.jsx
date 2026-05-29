import { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Box, Card, CardContent, Typography,
  TextField, Button, CircularProgress,
  InputAdornment, IconButton,
} from '@mui/material';
import {
  PersonRounded, EmailRounded, LockRounded,
  VisibilityRounded, VisibilityOffRounded,
  CheckCircleRounded as CheckIcon,
} from '@mui/icons-material';
import toast from 'react-hot-toast';
import { register, sendVerificationCode, verifyCode } from '../../api/authApi';
import axiosInstance from '../../api/axiosInstance';

const getStrength = (pw) => {
  if (!pw) return { score: 0, label: '', color: 'transparent', bg: 'transparent' };
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  const map = [
    { score: 1, label: '취약', color: '#FF4D4D', bg: 'rgba(255,77,77,0.1)' },
    { score: 2, label: '보통', color: '#FF8C00', bg: 'rgba(255,140,0,0.1)' },
    { score: 3, label: '강함', color: '#4CAF50', bg: 'rgba(76,175,80,0.1)' },
    { score: 4, label: '매우 강함', color: '#00BCD4', bg: 'rgba(0,188,212,0.1)' },
  ];
  return map[s - 1] || { score: 0, label: '', color: 'transparent', bg: 'transparent' };
};

const inputSx = {
  '& .MuiOutlinedInput-root': { borderRadius: '10px' },
  '& .MuiInputLabel-root': { fontSize: 14 },
};

const styleColors = {
  techwear: '#4FC3F7', amekaji: '#FFB74D', casual: '#81C784',
  street: '#F06292', workwear: '#CE93D8', oldmoney: '#E8C96D',
  gorpcore: '#A5D6A7', blokecore: '#EF9A9A', cityboy: '#90CAF9',
  preppy: '#F48FB1', rockchic: '#B39DDB', minimal: '#CFD8DC',
};

export default function Register() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ username: '', email: '', password: '', confirm: '' });
  const [selected, setSelected] = useState([]);
  const [styleList, setStyleList] = useState([]);
  const [stylesLoading, setStylesLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [showCf, setShowCf] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [available, setAvailable] = useState(null);

  // 이메일 인증
  const [codeSent, setCodeSent] = useState(false);
  const [code, setCode] = useState('');
  const [verified, setVerified] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [verifyingCode, setVerifyingCode] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const strength = useMemo(() => getStrength(form.password), [form.password]);

  // 카운트다운 타이머
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  // 스타일 목록 DB에서
  useEffect(() => {
    setStylesLoading(true);
    axiosInstance.get('/users/styles/list')
      .then(res => setStyleList(res.data))
      .catch(() => toast.error('스타일 목록을 불러오지 못했어요.'))
      .finally(() => setStylesLoading(false));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'password' || name === 'confirm') {
      setForm(p => ({ ...p, [name]: value.replace(/\s/g, '') }));
    } else if (name === 'username') {
      setAvailable(null);
      setForm(p => ({ ...p, username: value }));
    } else {
      setForm(p => ({ ...p, [name]: value }));
    }
  };

  const checkUsername = useCallback(async () => {
    if (!form.username.trim()) return toast.error('닉네임을 입력해주세요.');
    setChecking(true);
    try {
      const res = await axiosInstance.get(`/users/check-username?username=${form.username.trim()}`);
      setAvailable(res.data.available);
      if (res.data.available) toast.success('사용 가능한 닉네임이에요!');
      else toast.error('이미 사용 중인 닉네임이에요.');
    } catch {
      toast.error('확인 중 오류가 발생했어요.');
    } finally {
      setChecking(false);
    }
  }, [form.username]);

  const handleSendCode = async () => {
    if (!form.email.trim()) return toast.error('이메일을 입력해주세요.');
    setSendingCode(true);
    try {
      await sendVerificationCode(form.email.trim());
      setCodeSent(true);
      setCountdown(300);
      toast.success('인증코드가 발송되었어요!');
    } catch (err) {
      toast.error(err.response?.data?.message || '발송에 실패했어요.');
    } finally {
      setSendingCode(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!code.trim()) return toast.error('인증코드를 입력해주세요.');
    setVerifyingCode(true);
    try {
      await verifyCode(form.email.trim(), code.trim());
      setVerified(true);
      toast.success('이메일 인증 완료! ✅');
    } catch (err) {
      toast.error(err.response?.data?.message || '인증에 실패했어요.');
    } finally {
      setVerifyingCode(false);
    }
  };

  const toggleStyle = (value) => {
    setSelected(prev => {
      if (prev.includes(value)) return prev.filter(s => s !== value);
      if (prev.length >= 3) { toast.error('최대 3개까지 선택할 수 있어요.'); return prev; }
      return [...prev, value];
    });
  };

  const handleNext = (e) => {
    e.preventDefault();
    if (!form.username.trim()) return toast.error('닉네임을 입력해주세요.');
    if (available !== true) return toast.error('닉네임 중복 확인을 해주세요.');
    if (!form.email.trim()) return toast.error('이메일을 입력해주세요.');
    if (!verified) return toast.error('이메일 인증을 완료해주세요.');
    if (form.password.length < 8) return toast.error('비밀번호는 8자 이상이어야 해요.');
    if (strength.score < 2) return toast.error('더 강한 비밀번호를 사용해주세요.');
    if (form.password !== form.confirm) return toast.error('비밀번호가 일치하지 않아요.');
    setStep(2);
  };

  const handleSubmit = async () => {
    if (selected.length === 0) return toast.error('대표 스타일을 최소 1개 선택해주세요.');
    setLoading(true);
    try {
      await register({
        username: form.username.trim(),
        email: form.email.trim(),
        password: form.password,
        preferred_style: selected[0],
        style_1: selected[1] || null,
        style_2: selected[2] || null,
      });
      toast.success('환영합니다! 취향 저격 코디들이 기다려요 🎉');
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
      backgroundColor: '#080808', p: 2,
      overflow: 'hidden', position: 'relative',
      '&::before': {
        content: '""', position: 'absolute',
        top: '-15%', left: '40%', width: 600, height: 600,
        background: 'radial-gradient(circle, rgba(232,201,109,0.055) 0%, transparent 65%)',
        pointerEvents: 'none',
      },
    }}>
      <Box sx={{ width: '100%', maxWidth: 460, position: 'relative', zIndex: 1 }}>

        {/* 로고 */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.5, mb: 1 }}>
            <Box sx={{
              width: 38, height: 38, borderRadius: '10px',
              background: 'linear-gradient(135deg,#E8C96D,#B8952D)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 20px rgba(232,201,109,0.2)',
            }}>
              <Typography fontWeight={900} fontSize={20} sx={{ color: '#0A0A0A', lineHeight: 1 }}>F</Typography>
            </Box>
            <Typography fontWeight={900} letterSpacing={5} fontSize={26}
              sx={{
                background: 'linear-gradient(135deg,#E8C96D,#D4AF37)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}>
              FITLOG
            </Typography>
          </Box>
          <Typography sx={{ color: '#252525', letterSpacing: 4, fontSize: 9, fontWeight: 500 }}>
            FASHION ARCHIVE SNS
          </Typography>
        </Box>

        {/* 스텝 인디케이터 */}
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mb: 3.5 }}>
          {[1, 2].map(s => (
            <Box key={s} sx={{
              height: 3, borderRadius: 2,
              width: s === step ? 36 : 12,
              backgroundColor: s <= step ? '#E8C96D' : '#1E1E1E',
              transition: 'all 0.35s cubic-bezier(0.4,0,0.2,1)',
            }} />
          ))}
        </Box>

        <Card sx={{
          background: 'rgba(12,12,12,0.97)',
          backdropFilter: 'blur(28px)',
          border: '1px solid #161616',
          borderRadius: '20px',
          boxShadow: '0 24px 60px rgba(0,0,0,0.6)',
        }}>
          <CardContent sx={{ p: 3.5 }}>

            {/* ── STEP 1 ── */}
            {step === 1 && (
              <>
                <Box sx={{ mb: 3 }}>
                  <Typography fontWeight={800} fontSize={22} letterSpacing={-0.5} mb={0.4}>
                    계정 만들기
                  </Typography>
                  <Typography sx={{ color: '#444', fontSize: 13 }}>
                    기본 정보를 입력해주세요
                  </Typography>
                </Box>

                <Box component="form" onSubmit={handleNext}
                  sx={{ display: 'flex', flexDirection: 'column', gap: 2.2 }}>

                  {/* 닉네임 */}
                  <Box>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                      <TextField
                        name="username" label="닉네임"
                        value={form.username} onChange={handleChange}
                        fullWidth required autoComplete="off" size="small"
                        sx={{
                          ...inputSx,
                          '& .MuiOutlinedInput-root fieldset': {
                            borderColor:
                              available === true ? '#4CAF50' :
                                available === false ? '#FF4D4D' : undefined,
                          },
                        }}
                        slotProps={{
                          input: {
                            startAdornment: available === true ? (
                              <Box sx={{ mr: 1, display: 'flex' }}>
                                <CheckIcon sx={{ color: '#4CAF50', fontSize: 17 }} />
                              </Box>
                            ) : undefined,
                          },
                        }}
                      />
                      <Button variant="outlined" onClick={checkUsername}
                        disabled={checking || !form.username.trim()}
                        sx={{
                          height: 40, px: 2, flexShrink: 0,
                          borderColor: '#232323', color: '#808080',
                          fontSize: 12, fontWeight: 600,
                          borderRadius: '10px', whiteSpace: 'nowrap',
                          '&:hover': {
                            borderColor: '#E8C96D', color: '#E8C96D',
                            backgroundColor: 'rgba(232,201,109,0.04)'
                          },
                        }}>
                        {checking ? <CircularProgress size={13} /> : '중복확인'}
                      </Button>
                    </Box>
                    {available !== null && (
                      <Typography sx={{
                        fontSize: 11, mt: 0.5, pl: 0.5,
                        color: available ? '#4CAF50' : '#FF4D4D',
                      }}>
                        {available ? '✓ 사용 가능한 닉네임이에요' : '✗ 이미 사용 중인 닉네임이에요'}
                      </Typography>
                    )}
                  </Box>
                  {/* 이메일 + 인증 */}
                  <Box>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <TextField
                          name="email" label="이메일" type="email"
                          value={form.email}
                          onChange={(e) => {
                            setForm(p => ({ ...p, email: e.target.value }));
                            setCodeSent(false);
                            setVerified(false);
                            setCode('');
                            setCountdown(0);
                          }}
                          fullWidth required autoComplete="off" size="small"
                          disabled={verified}
                          sx={{
                            ...inputSx,
                            '& .MuiOutlinedInput-root fieldset': {
                              borderColor: verified ? '#4CAF50' : undefined,
                            },
                            '& input:-webkit-autofill': {
                              WebkitBoxShadow: '0 0 0 100px #0C0C0C inset',
                              WebkitTextFillColor: '#EFEFEF',
                            },
                          }}
                          slotProps={{
                            input: {
                              startAdornment: (
                                <InputAdornment position="start">
                                  {verified
                                    ? <CheckIcon sx={{ color: '#4CAF50', fontSize: 17 }} />
                                    : <EmailRounded sx={{ color: '#333', fontSize: 17 }} />}
                                </InputAdornment>
                              ),
                            },
                          }}
                        />
                      </Box>

                      {!verified && (
                        <Button
                          variant="outlined"
                          onClick={handleSendCode}
                          disabled={sendingCode || !form.email.trim() || countdown > 0}
                          sx={{
                            height: 40, px: 2, flexShrink: 0,
                            borderColor: '#232323', color: '#808080',
                            fontSize: 12, fontWeight: 600,
                            borderRadius: '10px', whiteSpace: 'nowrap',
                            mt: '1px',
                            '&:hover': { borderColor: '#E8C96D', color: '#E8C96D' },
                          }}>
                          {sendingCode
                            ? <CircularProgress size={13} />
                            : countdown > 0
                              ? `${Math.floor(countdown / 60)}:${String(countdown % 60).padStart(2, '0')}`
                              : codeSent ? '재발송' : '인증'}
                        </Button>
                      )}
                    </Box>

                    {/* 인증코드 입력 */}
                    {codeSent && !verified && (
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mt: 1 }}>
                        <TextField
                          label="인증코드 6자리"
                          value={code}
                          onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          fullWidth size="small"
                          placeholder="000000"
                          autoComplete="off"
                          sx={{
                            ...inputSx,
                            '& input': { letterSpacing: 8, fontWeight: 700, fontSize: 18, textAlign: 'center' },
                          }}
                        />
                        <Button
                          variant="outlined"
                          onClick={handleVerifyCode}
                          disabled={verifyingCode || code.length !== 6}
                          sx={{
                            height: 40, px: 2, flexShrink: 0,
                            borderColor: '#232323', color: '#808080',
                            fontSize: 12, fontWeight: 600,
                            borderRadius: '10px', whiteSpace: 'nowrap',
                            '&:hover': { borderColor: '#4CAF50', color: '#4CAF50' },
                          }}>
                          {verifyingCode ? <CircularProgress size={13} /> : '확인'}
                        </Button>
                      </Box>
                    )}

                    {verified && (
                      <Typography sx={{ fontSize: 11, mt: 0.5, pl: 0.5, color: '#4CAF50' }}>
                        ✓ 이메일 인증이 완료되었어요
                      </Typography>
                    )}
                    {codeSent && !verified && countdown === 0 && (
                      <Typography sx={{ fontSize: 11, mt: 0.5, pl: 0.5, color: '#FF4D4D' }}>
                        인증코드가 만료되었어요. 재발송해주세요.
                      </Typography>
                    )}
                  </Box>

                  {/* 비밀번호 */}
                  <Box>
                    <TextField
                      name="password" label="비밀번호"
                      type={showPw ? 'text' : 'password'}
                      value={form.password} onChange={handleChange}
                      fullWidth required autoComplete="new-password" size="small"
                      sx={inputSx}
                      slotProps={{
                        input: {
                          startAdornment: (
                            <InputAdornment position="start">
                              <LockRounded sx={{ color: '#333', fontSize: 17 }} />
                            </InputAdornment>
                          ),
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton onClick={() => setShowPw(p => !p)} size="small"
                                sx={{ color: '#383838' }}>
                                {showPw
                                  ? <VisibilityOffRounded sx={{ fontSize: 17 }} />
                                  : <VisibilityRounded sx={{ fontSize: 17 }} />}
                              </IconButton>
                            </InputAdornment>
                          ),
                        },
                      }}
                    />
                    {form.password && (
                      <Box sx={{ mt: 1 }}>
                        <Box sx={{ display: 'flex', gap: 0.5, mb: 0.6 }}>
                          {[1, 2, 3, 4].map(i => (
                            <Box key={i} sx={{
                              flex: 1, height: 3, borderRadius: 2,
                              backgroundColor: i <= strength.score ? strength.color : '#1A1A1A',
                              transition: 'background-color 0.3s ease',
                            }} />
                          ))}
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Box sx={{
                            display: 'inline-flex', px: 1, py: 0.2,
                            borderRadius: 6, backgroundColor: strength.bg
                          }}>
                            <Typography sx={{ color: strength.color, fontWeight: 700, fontSize: 11 }}>
                              {strength.label}
                            </Typography>
                          </Box>
                          <Typography sx={{ color: '#2A2A2A', fontSize: 10 }}>
                            대문자 · 숫자 · 특수문자 포함 시 강해져요
                          </Typography>
                        </Box>
                      </Box>
                    )}
                  </Box>

                  {/* 비밀번호 확인 */}
                  <Box>
                    <TextField
                      name="confirm" label="비밀번호 확인"
                      type={showCf ? 'text' : 'password'}
                      value={form.confirm} onChange={handleChange}
                      fullWidth required autoComplete="new-password" size="small"
                      sx={{
                        ...inputSx,
                        '& .MuiOutlinedInput-root fieldset': {
                          borderColor:
                            form.confirm && form.password === form.confirm ? '#4CAF50' :
                              form.confirm ? '#FF4D4D' : undefined,
                        },
                      }}
                      slotProps={{
                        input: {
                          startAdornment: (
                            <InputAdornment position="start">
                              {form.confirm && form.password === form.confirm
                                ? <CheckIcon sx={{ color: '#4CAF50', fontSize: 17 }} />
                                : <LockRounded sx={{ color: '#333', fontSize: 17 }} />}
                            </InputAdornment>
                          ),
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton onClick={() => setShowCf(p => !p)} size="small"
                                sx={{ color: '#383838' }}>
                                {showCf
                                  ? <VisibilityOffRounded sx={{ fontSize: 17 }} />
                                  : <VisibilityRounded sx={{ fontSize: 17 }} />}
                              </IconButton>
                            </InputAdornment>
                          ),
                        },
                      }}
                    />
                    {form.confirm && form.password !== form.confirm && (
                      <Typography sx={{ color: '#FF4D4D', fontSize: 11, mt: 0.5, pl: 0.5 }}>
                        비밀번호가 일치하지 않아요
                      </Typography>
                    )}
                  </Box>

                  <Button type="submit" variant="contained" fullWidth
                    sx={{ mt: 0.5, py: 1.4, fontWeight: 700, fontSize: 15, borderRadius: '10px' }}>
                    다음 단계 →
                  </Button>
                </Box>
              </>
            )}

            {/* ── STEP 2 ── */}
            {step === 2 && (
              <>
                <Box sx={{ mb: 2 }}>
                  <Typography fontWeight={800} fontSize={22} letterSpacing={-0.5} mb={0.4}>
                    나의 스타일은?
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography sx={{ color: '#444', fontSize: 13 }}>
                      첫 번째 선택이 대표 스타일이 돼요
                    </Typography>
                    <Box sx={{
                      px: 1.5, py: 0.3, borderRadius: 10,
                      backgroundColor: selected.length > 0 ? 'rgba(232,201,109,0.08)' : '#111',
                      border: `1px solid ${selected.length > 0 ? '#E8C96D40' : '#1E1E1E'}`,
                    }}>
                      <Typography fontWeight={700} sx={{
                        fontSize: 11,
                        color: selected.length > 0 ? '#E8C96D' : '#333',
                      }}>
                        {selected.length} / 3
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                {/* 선택 순서 표시 */}
                {selected.length > 0 && (
                  <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                    {selected.map((val, i) => {
                      const s = styleList.find(s => s.value === val);
                      const color = styleColors[val] || '#A0A0A0';
                      return (
                        <Box key={val} sx={{
                          display: 'flex', alignItems: 'center', gap: 0.5,
                          px: 1.5, py: 0.4, borderRadius: 10,
                          backgroundColor: i === 0 ? `${color}15` : 'rgba(255,255,255,0.04)',
                          border: `1px solid ${i === 0 ? `${color}50` : '#2A2A2A'}`,
                        }}>
                          <Typography sx={{
                            fontSize: 10, fontWeight: 700,
                            color: i === 0 ? color : '#505050'
                          }}>
                            {i === 0 ? '대표' : `관심 ${i}`}
                          </Typography>
                          <Typography sx={{
                            fontSize: 11,
                            color: i === 0 ? color : '#808080'
                          }}>
                            {s?.icon} {s?.label}
                          </Typography>
                        </Box>
                      );
                    })}
                  </Box>
                )}

                {/* 스타일 그리드 */}
                {stylesLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                    <CircularProgress sx={{ color: '#E8C96D' }} size={28} />
                  </Box>
                ) : (
                  <Box sx={{
                    display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: 1.2, mb: 3,
                    maxHeight: 380, overflowY: 'auto', pr: 0.5,
                    '&::-webkit-scrollbar': { width: 3 },
                    '&::-webkit-scrollbar-thumb': { backgroundColor: '#2A2A2A', borderRadius: 4 },
                  }}>
                    {styleList.map(s => {
                      const on = selected.includes(s.value);
                      const order = selected.indexOf(s.value);
                      const color = styleColors[s.value] || '#A0A0A0';
                      return (
                        <Box key={s.value} onClick={() => toggleStyle(s.value)}
                          sx={{
                            p: 1.5, borderRadius: '12px', cursor: 'pointer',
                            border: `1.5px solid ${on ? color : '#181818'}`,
                            backgroundColor: on ? `${color}10` : '#0C0C0C',
                            position: 'relative', textAlign: 'center',
                            transition: 'all 0.18s ease',
                            '&:hover': {
                              borderColor: on ? color : '#282828',
                              backgroundColor: on ? `${color}15` : '#121212',
                              transform: 'translateY(-1px)',
                            },
                          }}>
                          {on && (
                            <Box sx={{
                              position: 'absolute', top: 5, right: 5,
                              width: 18, height: 18, borderRadius: '50%',
                              backgroundColor: order === 0 ? color : '#2A2A2A',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              border: order === 0 ? 'none' : `1px solid ${color}60`,
                            }}>
                              <Typography sx={{
                                fontSize: 9, fontWeight: 900, lineHeight: 1,
                                color: order === 0 ? '#0A0A0A' : color,
                              }}>
                                {order + 1}
                              </Typography>
                            </Box>
                          )}
                          <Typography fontSize={22} sx={{ lineHeight: 1, mb: 0.6 }}>
                            {s.icon}
                          </Typography>
                          <Typography fontWeight={on ? 700 : 500} fontSize={11}
                            sx={{ color: on ? color : '#C0C0C0', mb: 0.2, lineHeight: 1.2 }}>
                            {s.label}
                          </Typography>
                          <Typography sx={{ color: '#303030', fontSize: 9, lineHeight: 1.3 }}>
                            {s.description}
                          </Typography>
                        </Box>
                      );
                    })}
                  </Box>
                )}

                <Box sx={{ display: 'flex', gap: 1.5 }}>
                  <Button variant="outlined" onClick={() => setStep(1)}
                    sx={{
                      flex: 1, py: 1.4, borderColor: '#1A1A1A',
                      color: '#606060', borderRadius: '10px',
                      '&:hover': { borderColor: '#2A2A2A' },
                    }}>
                    이전
                  </Button>
                  <Button variant="contained" onClick={handleSubmit}
                    disabled={selected.length === 0 || loading || stylesLoading}
                    sx={{ flex: 2, py: 1.4, fontWeight: 700, fontSize: 15, borderRadius: '10px' }}>
                    {loading
                      ? <CircularProgress size={22} sx={{ color: '#0A0A0A' }} />
                      : '시작하기 🎉'}
                  </Button>
                </Box>
              </>
            )}

            <Typography sx={{ textAlign: 'center', mt: 3, color: '#303030', fontSize: 13 }}>
              이미 계정이 있으신가요?{' '}
              <Link to="/login" style={{ color: '#E8C96D', fontWeight: 700, textDecoration: 'none' }}>
                로그인
              </Link>
            </Typography>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}