import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Avatar, Typography, Button, Container, IconButton, CircularProgress } from '@mui/material';
import { ArrowBackIosNewRounded, CloseRounded } from '@mui/icons-material';
import axiosInstance from '../../api/axiosInstance';
import { toggleFollow } from '../../api/userApi';
import toast from 'react-hot-toast';
import useThemeStore from '../../store/themeStore';

import { styleColors } from '../../constants/styleConstants';
import useStylesStore from '../../store/stylesStore';

// 모두 보기 페이지이므로 더 많은 추천 유저를 보여줍니다.
const DISPLAY_COUNT = 20;

const PeopleSuggestions = () => {
  const navigate = useNavigate();
  const { mode } = useThemeStore();
  const isDark = mode === 'dark';
  const { getLabel, getColor, fetchStyles } = useStylesStore();

  const [allUsers, setAllUsers] = useState([]);
  const [followed, setFollowed] = useState({});
  const [loading, setLoading] = useState(true);

  // excluded를 state로 관리 → 변경 시 자동으로 display 재계산
  const [excluded, setExcluded] = useState(
    () => {
      try { return new Set(JSON.parse(localStorage.getItem('fitlog_excluded_users') || '[]')); }
      catch { return new Set(); }
    }
  );

  // allUsers 중 제외된 사람을 빼고 상위 5명만 표시
  const display = allUsers.filter(u => !excluded.has(u.id)).slice(0, DISPLAY_COUNT);

  useEffect(() => {
    fetchStyles();
    axiosInstance.get('/users/recommended?limit=50')
      .then(res => setAllUsers(res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const excludeUser = (id) => {
    setExcluded(prev => {
      const next = new Set(prev).add(id);
      localStorage.setItem('fitlog_excluded_users', JSON.stringify(Array.from(next)));
      return next;
    });
  };

  const handleFollow = async (userId, username) => {
    try {
      await toggleFollow(userId);
      const isNowFollowing = !followed[userId];
      setFollowed(prev => ({ ...prev, [userId]: isNowFollowing }));
      if (isNowFollowing) {
        toast.success(`${username}님을 팔로우했습니다.`);
        excludeUser(userId);
      }
    } catch {
      toast.error('잠시 후 다시 시도해주세요.');
    }
  };

  return (
    <Container maxWidth="sm" sx={{ py: { xs: 2, md: 4 }, minHeight: '100vh' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 1 }}>
        <IconButton onClick={() => navigate(-1)} size="small" sx={{ ml: -1 }}>
          <ArrowBackIosNewRounded sx={{ fontSize: 22, color: isDark ? '#F0F0F0' : '#0A0A0A' }} />
        </IconButton>
        <Typography variant="h6" fontWeight={700}>추천</Typography>
      </Box>

      <Typography variant="body1" fontWeight={700} sx={{ mb: 2, px: 0.5 }}>
        회원님을 위한 추천
      </Typography>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
          <CircularProgress sx={{ color: '#E8C96D' }} />
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {display.map((u) => (
            <Box key={u.id} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 0.5 }}>
              <Avatar
                src={u.profile_image ? `http://localhost:5000${u.profile_image}` : null}
                sx={{
                  width: 56, height: 56, cursor: 'pointer',
                  border: u.preferred_style
                    ? `2px solid ${getColor(u.preferred_style)}60`
                    : `1px solid ${isDark ? '#2A2A2A' : '#EBEBEB'}`
                }}
                onClick={() => navigate(`/profile/${u.username}`)}
              >
                {u.username?.[0].toUpperCase()}
              </Avatar>

              <Box sx={{ flex: 1, minWidth: 0, ml: 0.5 }}>
                <Typography
                  variant="body2"
                  fontWeight={700}
                  sx={{ cursor: 'pointer', color: isDark ? '#F0F0F0' : '#0A0A0A' }}
                  onClick={() => navigate(`/profile/${u.username}`)}
                >
                  {u.username}
                </Typography>
                {u.is_following_me ? (
                  <Typography variant="caption" sx={{ display: 'block', color: isDark ? '#888' : '#999', fontWeight: 500 }}>
                    회원님을 팔로우하고 있습니다
                  </Typography>
                ) : (
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                    {u.preferred_style ? `${getLabel(u.preferred_style)} 스타일 · ` : ''}
                    팔로워 {u.follower_count}명
                  </Typography>
                )}
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Button
                  variant={followed[u.id] ? "outlined" : "contained"}
                  size="small"
                  disableElevation
                  onClick={() => handleFollow(u.id, u.username)}
                  sx={{
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 700,
                    minWidth: 85,
                    height: 32,
                    fontSize: '0.8rem',
                    backgroundColor: followed[u.id] ? 'transparent' : '#0095F6',
                    color: followed[u.id] ? (isDark ? '#F0F0F0' : '#0A0A0A') : '#FFFFFF',
                    borderColor: followed[u.id] ? (isDark ? '#404040' : '#DBDBDB') : 'transparent',
                    '&:hover': {
                      backgroundColor: followed[u.id] ? (isDark ? '#262626' : '#FAFAFA') : '#1877F2',
                      borderColor: followed[u.id] ? (isDark ? '#404040' : '#DBDBDB') : 'transparent',
                    }
                  }}
                >
                  {followed[u.id] ? '팔로잉' : '팔로우'}
                </Button>
                <IconButton size="small" onClick={() => excludeUser(u.id)} sx={{ color: '#8E8E8E' }}>
                  <CloseRounded sx={{ fontSize: 18 }} />
                </IconButton>
              </Box>
            </Box>
          ))}
        </Box>
      )}

      {!loading && display.length === 0 && (
        <Typography textAlign="center" color="text.secondary" sx={{ mt: 4 }}>
          현재 추천할 사용자가 없습니다.
        </Typography>
      )}
    </Container>
  );
};

export default PeopleSuggestions;
