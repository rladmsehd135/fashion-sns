import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Avatar, IconButton,
  TextField, Button, CircularProgress, Divider,
} from '@mui/material';
import {
  CameraAltRounded, ArrowBackRounded,
  CheckCircleRounded as CheckIcon,
} from '@mui/icons-material';
import toast from 'react-hot-toast';
import useAuthStore from '../../store/authStore';
import useThemeStore from '../../store/themeStore';
import { updateProfile } from '../../api/userApi';
import axiosInstance from '../../api/axiosInstance';

import { styleColors } from '../../constants/styleConstants';

export default function EditProfile() {
  const navigate = useNavigate();
  const { user, updateUser } = useAuthStore();
  const { mode } = useThemeStore();
  const isDark = mode === 'dark';
  const fileRef = useRef(null);

  const [form, setForm] = useState({
    username:'', bio:'', height:'', weight:'',
    preferred_style:'', style_1:'', style_2:'',
  });
  const [preview, setPreview]     = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [styleList, setStyleList] = useState([]);
  const [loading, setLoading]     = useState(false);
  const [checking, setChecking]   = useState(false);
  const [available, setAvailable] = useState(null);

  useEffect(() => {
    if (user) {
      setForm({
        username:        user.username        || '',
        bio:             user.bio             || '',
        height:          user.height          || '',
        weight:          user.weight          || '',
        preferred_style: user.preferred_style || '',
        style_1:         user.style_1         || '',
        style_2:         user.style_2         || '',
      });
      if (user.profile_image) {
        setPreview(`http://localhost:5000${user.profile_image}`);
      }
    }
  }, [user]);

  useEffect(() => {
    axiosInstance.get('/users/styles/list')
      .then(res => setStyleList(res.data))
      .catch(() => {});
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'username') setAvailable(null);
    setForm(p => ({ ...p, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('이미지는 5MB 이하만 가능해요.');
      return;
    }
    setImageFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const checkUsername = async () => {
    if (!form.username.trim()) return toast.error('닉네임을 입력해주세요.');
    if (form.username === user.username) {
      setAvailable(true);
      toast.success('현재 사용 중인 닉네임이에요.');
      return;
    }
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
  };

  // 다중 스타일 선택 (최대 3개, 첫 번째가 대표)
  const handleStyleClick = (value) => {
    const current = [form.preferred_style, form.style_1, form.style_2].filter(Boolean);
    if (current.includes(value)) {
      const next = current.filter(s => s !== value);
      setForm(p => ({
        ...p,
        preferred_style: next[0] || '',
        style_1:         next[1] || '',
        style_2:         next[2] || '',
      }));
      return;
    }
    if (current.length >= 3) {
      toast.error('최대 3개까지 선택할 수 있어요.');
      return;
    }
    const next = [...current, value];
    setForm(p => ({
      ...p,
      preferred_style: next[0] || '',
      style_1:         next[1] || '',
      style_2:         next[2] || '',
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.username.trim()) return toast.error('닉네임을 입력해주세요.');
    if (form.username !== user.username && available !== true) {
      return toast.error('닉네임 중복 확인을 해주세요.');
    }
    if (form.height && (form.height < 100 || form.height > 250)) {
      return toast.error('키는 100~250cm 사이로 입력해주세요.');
    }
    if (form.weight && (form.weight < 30 || form.weight > 200)) {
      return toast.error('몸무게는 30~200kg 사이로 입력해주세요.');
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('username',        form.username.trim());
      formData.append('bio',             form.bio             || '');
      formData.append('height',          form.height          || '');
      formData.append('weight',          form.weight          || '');
      formData.append('preferred_style', form.preferred_style || '');
      formData.append('style_1',         form.style_1         || '');
      formData.append('style_2',         form.style_2         || '');
      if (imageFile) formData.append('profile_image', imageFile);

      const res = await updateProfile(formData);
      updateUser(res.data.user);
      toast.success('프로필이 수정되었어요!');
      navigate(`/profile/${res.data.user.username}`);
    } catch (err) {
      toast.error(err.response?.data?.message || '수정에 실패했어요.');
    } finally {
      setLoading(false);
    }
  };

  const selectedStyles = [form.preferred_style, form.style_1, form.style_2].filter(Boolean);

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', px: 2, py: 3 }}>

      {/* 헤더 */}
      <Box sx={{ display:'flex', alignItems:'center', gap:2, mb:4 }}>
        <IconButton onClick={() => navigate(-1)} sx={{ color:'#808080' }}>
          <ArrowBackRounded />
        </IconButton>
        <Typography fontWeight={700} fontSize={18}>프로필 수정</Typography>
      </Box>

      <Box component="form" onSubmit={handleSubmit}>

        {/* 프로필 사진 */}
        <Box sx={{ display:'flex', flexDirection:'column', alignItems:'center', mb:4 }}>
          <Box sx={{ position:'relative', mb:1.5 }}>
            <Avatar src={preview}
              sx={{
                width:100, height:100,
                bgcolor:'#E8C96D', color:'#0A0A0A',
                fontSize:36, fontWeight:800,
                border:'3px solid #1E1E1E',
              }}>
              {user?.username?.[0]?.toUpperCase()}
            </Avatar>
            <Box onClick={() => fileRef.current?.click()}
              sx={{
                position:'absolute', bottom:0, right:0,
                width:32, height:32, borderRadius:'50%',
                backgroundColor:'#E8C96D',
                display:'flex', alignItems:'center', justifyContent:'center',
                cursor:'pointer', border:'2px solid #0A0A0A',
                transition:'all 0.2s',
                '&:hover':{ backgroundColor:'#D4AF37', transform:'scale(1.1)' },
              }}>
              <CameraAltRounded sx={{ fontSize:16, color:'#0A0A0A' }} />
            </Box>
          </Box>
          <Typography variant="caption" color="text.secondary"
            sx={{ cursor:'pointer', '&:hover':{ color:'#E8C96D' } }}
            onClick={() => fileRef.current?.click()}>
            사진 변경하기
          </Typography>
          <input ref={fileRef} type="file" accept="image/*"
            style={{ display:'none' }} onChange={handleImageChange} />
        </Box>

        <Divider sx={{ mb:3 }} />

        {/* 기본 정보 */}
        <Typography fontWeight={700} fontSize={14}
          sx={{ color:'#808080', mb:2, letterSpacing:1 }}>
          기본 정보
        </Typography>

        <Box sx={{ display:'flex', flexDirection:'column', gap:2, mb:3 }}>
          {/* 닉네임 */}
          <Box>
            <Box sx={{ display:'flex', gap:1, alignItems:'center' }}>
              <TextField
                name="username" label="닉네임"
                value={form.username} onChange={handleChange}
                fullWidth required size="small" autoComplete="off"
                sx={{
                  '& .MuiOutlinedInput-root':{ borderRadius:'10px' },
                  '& .MuiOutlinedInput-root fieldset':{
                    borderColor:
                      available === true  ? '#4CAF50' :
                      available === false ? '#FF4D4D' : undefined,
                  },
                }}
                slotProps={{
                  input:{
                    startAdornment: available === true ? (
                      <Box sx={{ mr:1, display:'flex' }}>
                        <CheckIcon sx={{ color:'#4CAF50', fontSize:17 }} />
                      </Box>
                    ) : undefined,
                  },
                }}
              />
              <Button variant="outlined" onClick={checkUsername}
                disabled={checking || !form.username.trim()}
                sx={{
                  height:40, px:2, flexShrink:0,
                  borderColor:'#2A2A2A', color:'#808080',
                  fontSize:12, fontWeight:600,
                  borderRadius:'10px', whiteSpace:'nowrap',
                  '&:hover':{ borderColor:'#E8C96D', color:'#E8C96D' },
                }}>
                {checking ? <CircularProgress size={13} /> : '중복확인'}
              </Button>
            </Box>
            {available !== null && (
              <Typography sx={{
                fontSize:11, mt:0.5, pl:0.5,
                color: available ? '#4CAF50' : '#FF4D4D',
              }}>
                {available ? '✓ 사용 가능한 닉네임이에요' : '✗ 이미 사용 중인 닉네임이에요'}
              </Typography>
            )}
          </Box>

          {/* 자기소개 */}
          <TextField
            name="bio" label="자기소개"
            value={form.bio} onChange={handleChange}
            fullWidth multiline rows={3} size="small"
            placeholder="나를 소개해보세요..."
            inputProps={{ maxLength:150 }}
            sx={{ '& .MuiOutlinedInput-root':{ borderRadius:'10px' } }}
            helperText={`${form.bio.length} / 150`}
            FormHelperTextProps={{ sx:{ textAlign:'right', fontSize:11 } }}
          />
        </Box>

        <Divider sx={{ mb:3 }} />

        {/* 체형 정보 */}
        <Typography fontWeight={700} fontSize={14}
          sx={{ color:'#808080', mb:1, letterSpacing:1 }}>
          체형 정보
        </Typography>
        <Typography variant="caption" color="text.secondary"
          sx={{ display:'block', mb:2 }}>
          착용 참고용으로 활용돼요
        </Typography>

        <Box sx={{ display:'flex', gap:2, mb:3 }}>
          <TextField
            name="height" label="키 (cm)"
            value={form.height} onChange={handleChange}
            type="number" size="small" fullWidth
            inputProps={{ min:100, max:250 }}
            sx={{ '& .MuiOutlinedInput-root':{ borderRadius:'10px' } }}
          />
          <TextField
            name="weight" label="몸무게 (kg)"
            value={form.weight} onChange={handleChange}
            type="number" size="small" fullWidth
            inputProps={{ min:30, max:200 }}
            sx={{ '& .MuiOutlinedInput-root':{ borderRadius:'10px' } }}
          />
        </Box>

        <Divider sx={{ mb:3 }} />

        {/* 스타일 선택 */}
        <Box sx={{ display:'flex', alignItems:'center', justifyContent:'space-between', mb:1 }}>
          <Typography fontWeight={700} fontSize={14}
            sx={{ color:'#808080', letterSpacing:1 }}>
            나의 스타일
          </Typography>
          <Box sx={{
            px:1.5, py:0.3, borderRadius:10,
            backgroundColor: selectedStyles.length > 0 ? 'rgba(232,201,109,0.08)' : (isDark ? '#111' : '#F0F0F0'),
            border:`1px solid ${selectedStyles.length > 0 ? '#E8C96D40' : (isDark ? '#1E1E1E' : '#E0E0E0')}`,
          }}>
            <Typography fontWeight={700} sx={{
              fontSize:11,
              color: selectedStyles.length > 0 ? '#E8C96D' : (isDark ? '#333' : '#AAAAAA'),
            }}>
              {selectedStyles.length} / 3
            </Typography>
          </Box>
        </Box>
        <Typography variant="caption" color="text.secondary"
          sx={{ display:'block', mb:2 }}>
          첫 번째 선택이 대표 스타일이 돼요 · 최대 3개
        </Typography>

        {/* 선택 순서 표시 */}
        {selectedStyles.length > 0 && (
          <Box sx={{ display:'flex', gap:1, mb:2, flexWrap:'wrap' }}>
            {selectedStyles.map((val, i) => {
              const s     = styleList.find(s => s.value === val);
              const color = styleColors[val] || '#A0A0A0';
              return (
                <Box key={val} sx={{
                  display:'flex', alignItems:'center', gap:0.5,
                  px:1.5, py:0.4, borderRadius:10,
                  backgroundColor: i === 0 ? `${color}15` : (isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'),
                  border:`1px solid ${i === 0 ? `${color}50` : (isDark ? '#2A2A2A' : '#E0E0E0')}`,
                }}>
                  <Typography sx={{ fontSize:10, fontWeight:700,
                    color: i === 0 ? color : (isDark ? '#505050' : '#888888') }}>
                    {i === 0 ? '대표' : `관심 ${i}`}
                  </Typography>
                  <Typography sx={{ fontSize:11, color: i === 0 ? color : (isDark ? '#808080' : '#AAAAAA') }}>
                    {s?.icon} {s?.label}
                  </Typography>
                </Box>
              );
            })}
          </Box>
        )}

        {/* 스타일 그리드 */}
        <Box sx={{
          display:'grid', gridTemplateColumns:'repeat(3, 1fr)',
          gap:1.2, mb:4,
          maxHeight:400, overflowY:'auto', pr:0.5,
          '&::-webkit-scrollbar':{ width:3 },
          '&::-webkit-scrollbar-thumb':{ backgroundColor: isDark ? '#2A2A2A' : '#DDDDDD', borderRadius:4 },
        }}>
          {styleList.map(s => {
            const on    = selectedStyles.includes(s.value);
            const order = selectedStyles.indexOf(s.value);
            const color = styleColors[s.value] || '#A0A0A0';
            return (
              <Box key={s.value} onClick={() => handleStyleClick(s.value)}
                sx={{
                  p:1.5, borderRadius:'12px', cursor:'pointer',
                  border:`1.5px solid ${on ? color : (isDark ? '#1E1E1E' : '#E0E0E0')}`,
                  backgroundColor: on ? `${color}12` : (isDark ? '#0C0C0C' : '#F7F7F7'),
                  position:'relative', textAlign:'center',
                  transition:'all 0.18s ease',
                  '&:hover':{
                    borderColor: on ? color : (isDark ? '#2A2A2A' : '#C0C0C0'),
                    backgroundColor: on ? `${color}18` : (isDark ? '#141414' : '#EFEFEF'),
                    transform:'translateY(-1px)',
                  },
                }}>
                {on && (
                  <Box sx={{
                    position:'absolute', top:5, right:5,
                    width:18, height:18, borderRadius:'50%',
                    backgroundColor: order === 0 ? color : (isDark ? '#2A2A2A' : '#E0E0E0'),
                    display:'flex', alignItems:'center', justifyContent:'center',
                    border: order === 0 ? 'none' : `1px solid ${color}60`,
                  }}>
                    <Typography sx={{
                      fontSize:9, fontWeight:900, lineHeight:1,
                      color: order === 0 ? '#0A0A0A' : color,
                    }}>
                      {order + 1}
                    </Typography>
                  </Box>
                )}
                <Typography fontSize={22} sx={{ lineHeight:1, mb:0.6 }}>
                  {s.icon}
                </Typography>
                <Typography fontWeight={on ? 700 : 500} fontSize={11}
                  sx={{ color: on ? color : (isDark ? '#C0C0C0' : '#606060'), mb:0.2, lineHeight:1.2 }}>
                  {s.label}
                </Typography>
                <Typography sx={{ color: isDark ? '#303030' : '#999999', fontSize:9, lineHeight:1.3 }}>
                  {s.description}
                </Typography>
              </Box>
            );
          })}
        </Box>

        {/* 저장 버튼 */}
        <Button type="submit" variant="contained" fullWidth
          disabled={loading}
          sx={{ py:1.5, fontWeight:700, fontSize:15, borderRadius:'10px' }}>
          {loading
            ? <CircularProgress size={22} sx={{ color:'#0A0A0A' }} />
            : '저장하기'}
        </Button>
      </Box>
    </Box>
  );
}