import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Avatar, Typography, Chip, IconButton } from '@mui/material';
import { CloseRounded } from '@mui/icons-material';
import { toggleFollow } from '../../api/userApi';
import axiosInstance from '../../api/axiosInstance';
import toast from 'react-hot-toast';
import useAuthStore from '../../store/authStore';
import useThemeStore from '../../store/themeStore';

import { styleColors } from '../../constants/styleConstants';
import useStylesStore from '../../store/stylesStore';

const RecommendedUsers = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { mode } = useThemeStore();
  const isDark = mode === 'dark';
  const { getLabel, getColor, fetchStyles } = useStylesStore();

  // 무한 루프 방지를 위해 의존성 배열에서 fetchStyles 제거
  useEffect(() => { fetchStyles(); }, []);
  
  const [users, setUsers] = useState([]);
  const [followed, setFollowed] = useState({});
  
  // 안정적인 JSON 파싱
  const [excludedIds, setExcludedIds] = useState(() => {
    const saved = localStorage.getItem('fitlog_excluded_users');
    try { return saved ? new Set(JSON.parse(saved)) : new Set(); } 
    catch { return new Set(); }
  });

  const C = {
    text:     isDark ? '#F0F0F0' : '#0A0A0A',
    textSub:  isDark ? '#606060' : '#AAAAAA',
    textFoot: isDark ? '#333333' : '#CCCCCC',
    hover:    isDark ? '#F0F0F0' : '#0A0A0A',
    avatarBg: isDark ? '#1A1A1A' : '#F0F0F0',
    avatarFg: isDark ? '#F0F0F0' : '#555555',
    border:   isDark ? '#2A2A2A' : '#E8E8E8',
  };

  // 데이터 로딩 및 필터링 로직을 함수화합니다.
  const loadRecommended = async () => {
    try {
      const res = await axiosInstance.get('/users/recommended?limit=30');
      // 내가 지운 사람(excludedIds)은 아예 처음부터 제외하고 저장합니다.
      const filtered = res.data.filter(u => !excludedIds.has(u.id));
      setUsers(filtered);
    } catch {}
  };

  useEffect(() => {
    loadRecommended();
  }, []);

  // 유저 제외 로직 (localStorage 저장 추가)
  const removeUser = (id) => {
    const nextSet = new Set(excludedIds).add(id);
    setExcludedIds(nextSet);
    localStorage.setItem('fitlog_excluded_users', JSON.stringify(Array.from(nextSet)));
    
    // UI에서 즉시 제거 (그러면 다음 순번의 유저가 자동으로 slice 상단으로 올라옴)
    setUsers(prev => prev.filter(u => u.id !== id));
  };

  const handleFollow = async (userId, username) => {
    try {
      await toggleFollow(userId);
      setFollowed(prev => ({ ...prev, [userId]: true }));
      toast.success(`${username}님을 팔로우했습니다.`);
      // 약간의 딜레이 후 목록에서 제거 (UX 향상)
      setTimeout(() => removeUser(userId), 1000);
    } catch { toast.error('잠시 후 다시 시도해주세요.'); }
  };

  return (
    <Box sx={{
      position:'sticky', top:24,
      width:300, flexShrink:0,
      display:{ xs:'none', lg:'block' },
    }}>
      {/* 내 정보 */}
      <Box sx={{ display:'flex', alignItems:'center', gap:1.5, mb:4 }}>
        <Avatar
          src={user?.profile_image ? `http://localhost:5000${user.profile_image}` : null}
          sx={{
            width:44, height:44,
            bgcolor:'#E8C96D', color:'#0A0A0A',
            fontWeight:800, fontSize:18, cursor:'pointer',
          }}
          onClick={() => navigate(`/profile/${user?.username}`)}>
          {user?.username?.[0]?.toUpperCase()}
        </Avatar>
        <Box sx={{ flex:1 }}>
          <Typography fontWeight={700} fontSize={14}
            sx={{ cursor:'pointer', color: C.text,
              '&:hover':{ color:'#E8C96D' } }}
            onClick={() => navigate(`/profile/${user?.username}`)}>
            {user?.username}
          </Typography>
          {user?.preferred_style && (
            <Chip label={getLabel(user.preferred_style)}
              size="small"
              sx={{
                height:18, fontSize:10, fontWeight:600, mt:0.3,
                backgroundColor:`${getColor(user.preferred_style)}15`,
                color: getColor(user.preferred_style),
                border:`1px solid ${getColor(user.preferred_style)}30`,
              }} />
          )}
        </Box>
        <Typography variant="caption"
          sx={{ cursor:'pointer', color: C.textSub,
            '&:hover':{ color: C.hover } }}
          onClick={() => navigate(`/profile/${user?.username}`)}>
          전환
        </Typography>
      </Box>

      {/* 추천 유저 */}
      {users.length > 0 && (
        <>
          <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'center', mb:2 }}>
            <Typography variant="body2" fontWeight={700} sx={{ color: C.textSub }}>
              회원님을 위한 추천
            </Typography>
            <Typography 
              variant="caption" 
              fontWeight={700}
              onClick={() => navigate('/explore/people')}
              sx={{ cursor:'pointer', color: C.text, '&:hover':{ color:'#E8C96D' } }}
            >
              모두 보기
            </Typography>
          </Box>

          <Box sx={{ display:'flex', flexDirection:'column', gap:2 }}>
            {/* 상위 5명만 보여줍니다. 하나를 지우면 다음 사람이 자동으로 올라옵니다. */}
            {users.slice(0, 5).map(u => (
              <Box key={u.id} sx={{ display:'flex', alignItems:'center', gap:1.5 }}>
                <Avatar
                  src={u.profile_image ? `http://localhost:5000${u.profile_image}` : null}
                  sx={{
                    width:36, height:36,
                    bgcolor: C.avatarBg, color: C.avatarFg,
                    fontSize:14, fontWeight:700, cursor:'pointer',
                    border: u.preferred_style
                      ? `2px solid ${getColor(u.preferred_style)}60`
                      : `2px solid ${C.border}`,
                  }}
                  onClick={() => navigate(`/profile/${u.username}`)}>
                  {u.username?.[0]?.toUpperCase()}
                </Avatar>
                <Box sx={{ flex:1, minWidth:0 }}>
                  <Typography variant="body2" fontWeight={600} noWrap
                    sx={{ cursor:'pointer', fontSize:13, color: C.text,
                      '&:hover':{ color:'#E8C96D' } }}
                    onClick={() => navigate(`/profile/${u.username}`)}>
                    {u.username}
                  </Typography>
                  <Typography variant="caption" noWrap fontSize={11}
                    sx={{ color: C.textSub }}>
                    {u.preferred_style ? `${getLabel(u.preferred_style)} · ` : ''}
                    팔로워 {u.follower_count}명
                  </Typography>
                </Box>
                {!followed[u.id] ? (
                  <Typography variant="caption" fontWeight={700}
                    sx={{ color:'#0095F6', cursor:'pointer', flexShrink:0,
                      '&:hover':{ color:'#0077CC' } }}
                    onClick={() => handleFollow(u.id, u.username)}>
                    팔로우
                  </Typography>
                ) : (
                  <Typography variant="caption" sx={{ flexShrink:0, color: C.textSub }}>
                    팔로잉
                  </Typography>
                )}
                <IconButton size="small" onClick={() => removeUser(u.id)} sx={{ color: C.textFoot, p: 0 }}>
                  <CloseRounded sx={{ fontSize: 14 }} />
                </IconButton>
              </Box>
            ))}
          </Box>
        </>
      )}

      {/* 푸터 */}
      <Box sx={{ mt:4 }}>
        <Typography variant="caption"
          sx={{ lineHeight:2, fontSize:10, color: C.textFoot }}>
          소개 · 도움말 · 홍보 센터 · API · 채용 정보 · 개인정보처리방침 · 약관 · 위치 · 언어
        </Typography>
        <Typography variant="caption"
          sx={{ display:'block', mt:1, fontSize:10, color: C.textFoot }}>
          © 2026 FITLOG
        </Typography>
      </Box>
    </Box>
  );
};

export default RecommendedUsers;