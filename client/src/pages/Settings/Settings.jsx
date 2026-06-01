import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, TextField, Button,
  CircularProgress, Alert, Divider, IconButton,
  InputAdornment,
} from '@mui/material';
import {
  EmailRounded, LockRounded, PersonRounded,
  VisibilityRounded, VisibilityOffRounded,
  CheckCircleRounded,
} from '@mui/icons-material';
import toast from 'react-hot-toast';
import useAuthStore from '../../store/authStore';
import useThemeStore from '../../store/themeStore';
import {
  sendCodeForChange,
  verifyCodeForChange,
  changePassword,
  changeUsername,
} from '../../api/authApi';

export default function Settings() {
  const navigate    = useNavigate();
  const { user, setAuth, accessToken } = useAuthStore();
  const { mode }    = useThemeStore();
  const isDark      = mode === 'dark';

  // 인증 단계: 'idle' | 'sent' | 'verified'
  const [step, setStep]           = useState('idle');
  const [maskedEmail, setMasked]  = useState('');
  const [code, setCode]           = useState('');
  const [sending, setSending]     = useState(false);
  const [verifying, setVerifying] = useState(false);

  // 변경 타입: 'password' | 'username'
  const [changeType, setChangeType] = useState('password');

  // 비밀번호
  const [newPw, setNewPw]         = useState('');
  const [newPw2, setNewPw2]       = useState('');
  const [showPw, setShowPw]       = useState(false);

  // 닉네임
  const [newName, setNewName]     = useState('');

  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState('');

  const C = {
    bg:      isDark ? '#0A0A0A' : '#F5F5F0',
    card:    isDark ? '#111111' : '#FFFFFF',
    border:  isDark ? '#1E1E1E' : '#EBEBEB',
    text:    isDark ? '#F0F0F0' : '#0A0A0A',
    textSub: isDark ? '#606060' : '#AAAAAA',
  };

  // 1. 인증코드 발송
  const handleSendCode = async () => {
    setSending(true);
    setError('');
    try {
      const res = await sendCodeForChange();
      const email = res.data.email || '';
      // 이메일 마스킹
      const [id, domain] = email.split('@');
      setMasked(`${id.slice(0,2)}${'*'.repeat(Math.max(id.length-2,2))}@${domain}`);
      setStep('sent');
      toast.success('인증코드가 발송되었어요!');
    } catch (err) {
      setError(err.response?.data?.message || '발송에 실패했어요.');
    } finally {
      setSending(false);
    }
  };

  // 2. 인증코드 확인
  const handleVerify = async () => {
    if (!code.trim()) return;
    setVerifying(true);
    setError('');
    try {
      await verifyCodeForChange(code.trim());
      setStep('verified');
      toast.success('인증 완료!');
    } catch (err) {
      setError(err.response?.data?.message || '인증 실패했어요.');
    } finally {
      setVerifying(false);
    }
  };

  // 3. 변경 실행
  const handleChange = async () => {
    setError('');
    if (changeType === 'password') {
      if (!newPw || newPw.length < 8) {
        return setError('비밀번호는 8자 이상이어야 해요.');
      }
      if (newPw !== newPw2) {
        return setError('비밀번호가 일치하지 않아요.');
      }
    } else {
      if (!newName || newName.trim().length < 2) {
        return setError('닉네임은 2자 이상이어야 해요.');
      }
    }

    setSaving(true);
    try {
      if (changeType === 'password') {
        await changePassword(newPw);
        toast.success('비밀번호가 변경되었어요!');
      } else {
        const res = await changeUsername(newName.trim());
        // 스토어 유저 정보 업데이트
        setAuth({ ...user, username: res.data.username }, accessToken);
        toast.success('닉네임이 변경되었어요!');
      }
      // 초기화
      setStep('idle');
      setCode('');
      setNewPw('');
      setNewPw2('');
      setNewName('');
    } catch (err) {
      setError(err.response?.data?.message || '변경에 실패했어요.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ maxWidth:600, mx:'auto', px:2, py:4, minHeight:'100vh',
      backgroundColor: C.bg }}>

      <Typography fontWeight={700} fontSize={20} mb={3} sx={{ color: C.text }}>
        계정 설정
      </Typography>

      {/* 변경 타입 선택 */}
      <Box sx={{
        display:'flex', gap:1, mb:3,
      }}>
        {[
          { key:'password', label:'비밀번호 변경', icon:<LockRounded sx={{ fontSize:16 }} /> },
          { key:'username', label:'닉네임 변경',   icon:<PersonRounded sx={{ fontSize:16 }} /> },
        ].map(item => (
          <Box key={item.key}
            onClick={() => {
              setChangeType(item.key);
              setStep('idle');
              setError('');
              setCode('');
            }}
            sx={{
              display:'flex', alignItems:'center', gap:0.8,
              px:2, py:1, borderRadius:10, cursor:'pointer',
              fontSize:13, fontWeight:600,
              backgroundColor: changeType === item.key
                ? (isDark ? '#EFEFEF' : '#0A0A0A')
                : (isDark ? '#1A1A1A' : '#F0F0F0'),
              color: changeType === item.key
                ? (isDark ? '#0A0A0A' : '#FFFFFF')
                : C.textSub,
              border:`1px solid ${changeType === item.key
                ? (isDark ? '#EFEFEF' : '#0A0A0A')
                : C.border}`,
              transition:'all 0.15s',
            }}>
            {item.icon}
            {item.label}
          </Box>
        ))}
      </Box>

      {/* 카드 */}
      <Box sx={{
        backgroundColor: C.card,
        border:`1px solid ${C.border}`,
        borderRadius:3, p:3,
        display:'flex', flexDirection:'column', gap:2.5,
      }}>

        {error && (
          <Alert severity="error" sx={{ borderRadius:2, fontSize:13 }}>
            {error}
          </Alert>
        )}

        {/* STEP 1: 인증 전 */}
        {step === 'idle' && (
          <>
            <Box>
              <Typography fontSize={14} fontWeight={600} mb={0.5} sx={{ color: C.text }}>
                {changeType === 'password' ? '비밀번호 변경' : '닉네임 변경'}
              </Typography>
              <Typography fontSize={13} sx={{ color: C.textSub }}>
                보안을 위해 가입 이메일로 인증이 필요해요.
              </Typography>
            </Box>

            <Button variant="contained" onClick={handleSendCode}
              disabled={sending}
              startIcon={sending
                ? <CircularProgress size={16} sx={{ color:'#0A0A0A' }} />
                : <EmailRounded sx={{ fontSize:18 }} />}
              sx={{ borderRadius:2, fontWeight:700, py:1.2 }}>
              이메일로 인증코드 받기
            </Button>
          </>
        )}

        {/* STEP 2: 코드 입력 */}
        {step === 'sent' && (
          <>
            <Box>
              <Typography fontSize={14} fontWeight={600} mb={0.5} sx={{ color: C.text }}>
                인증코드 입력
              </Typography>
              <Typography fontSize={13} sx={{ color: C.textSub }}>
                <Typography component="span" fontWeight={700} sx={{ color:'#E8C96D' }}>
                  {maskedEmail}
                </Typography>
                {' '}로 발송된 6자리 코드를 입력하세요.
              </Typography>
            </Box>

            <Box sx={{ display:'flex', gap:1 }}>
              <TextField
                value={code}
                onChange={e => setCode(e.target.value)}
                placeholder="000000"
                size="small" fullWidth
                inputProps={{ maxLength:6, style:{ letterSpacing:8, fontSize:18, fontWeight:700 } }}
                onKeyDown={e => e.key === 'Enter' && handleVerify()}
              />
              <Button variant="contained" onClick={handleVerify}
                disabled={verifying || code.length !== 6}
                sx={{ borderRadius:2, fontWeight:700, px:3, flexShrink:0 }}>
                {verifying
                  ? <CircularProgress size={16} sx={{ color:'#0A0A0A' }} />
                  : '확인'}
              </Button>
            </Box>

            <Typography fontSize={12} sx={{ color: C.textSub, textAlign:'center' }}>
              코드가 오지 않았나요?{' '}
              <Typography component="span" fontSize={12} fontWeight={700}
                sx={{ color:'#E8C96D', cursor:'pointer' }}
                onClick={handleSendCode}>
                다시 보내기
              </Typography>
            </Typography>
          </>
        )}

        {/* STEP 3: 인증 완료 → 변경 */}
        {step === 'verified' && (
          <>
            <Box sx={{ display:'flex', alignItems:'center', gap:1 }}>
              <CheckCircleRounded sx={{ color:'#4CAF50', fontSize:20 }} />
              <Typography fontSize={13} fontWeight={600} sx={{ color:'#4CAF50' }}>
                이메일 인증 완료
              </Typography>
            </Box>

            <Divider sx={{ borderColor: C.border }} />

            {changeType === 'password' ? (
              <>
                <TextField
                  label="새 비밀번호"
                  type={showPw ? 'text' : 'password'}
                  value={newPw}
                  onChange={e => setNewPw(e.target.value)}
                  fullWidth size="small"
                  helperText="8자 이상 입력해주세요"
                  slotProps={{
                    input:{
                      startAdornment:(
                        <InputAdornment position="start">
                          <LockRounded sx={{ fontSize:17, color: C.textSub }} />
                        </InputAdornment>
                      ),
                      endAdornment:(
                        <InputAdornment position="end">
                          <IconButton size="small" onClick={() => setShowPw(p => !p)}>
                            {showPw
                              ? <VisibilityOffRounded sx={{ fontSize:17 }} />
                              : <VisibilityRounded sx={{ fontSize:17 }} />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    },
                  }}
                />
                <TextField
                  label="새 비밀번호 확인"
                  type={showPw ? 'text' : 'password'}
                  value={newPw2}
                  onChange={e => setNewPw2(e.target.value)}
                  fullWidth size="small"
                  error={newPw2.length > 0 && newPw !== newPw2}
                  helperText={newPw2.length > 0 && newPw !== newPw2 ? '비밀번호가 일치하지 않아요' : ''}
                  slotProps={{
                    input:{
                      startAdornment:(
                        <InputAdornment position="start">
                          <LockRounded sx={{ fontSize:17, color: C.textSub }} />
                        </InputAdornment>
                      ),
                    },
                  }}
                />
              </>
            ) : (
              <TextField
                label="새 닉네임"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                fullWidth size="small"
                helperText="2자 이상 입력해주세요"
                slotProps={{
                  input:{
                    startAdornment:(
                      <InputAdornment position="start">
                        <PersonRounded sx={{ fontSize:17, color: C.textSub }} />
                      </InputAdornment>
                    ),
                  },
                }}
              />
            )}

            <Button variant="contained" onClick={handleChange}
              disabled={saving}
              sx={{ borderRadius:2, fontWeight:700, py:1.2 }}>
              {saving
                ? <CircularProgress size={18} sx={{ color:'#0A0A0A' }} />
                : changeType === 'password' ? '비밀번호 변경' : '닉네임 변경'}
            </Button>
          </>
        )}
      </Box>
    </Box>
  );
}