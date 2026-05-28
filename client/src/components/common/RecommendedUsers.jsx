import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Avatar, Typography, Button, Chip } from '@mui/material';
import { toggleFollow } from '../../api/userApi';
import axiosInstance from '../../api/axiosInstance';
import toast from 'react-hot-toast';
import useAuthStore from '../../store/authStore';

const styleColors = {
  techwear: '#4FC3F7', amekaji: '#FFB74D', casual: '#81C784',
  street: '#F06292', workwear: '#CE93D8', etc: '#90A4AE',
};

const styleLabels = {
  techwear: '테크웨어', amekaji: '아메카지', casual: '캐주얼',
  street: '스트릿', workwear: '워크웨어', etc: '기타',
};

const RecommendedUsers = () => {
  const navigate     = useNavigate();
  const { user }     = useAuthStore();
  const [users, setUsers]     = useState([]);
  const [followed, setFollowed] = useState({});

  useEffect(() => {
    axiosInstance.get('/users/recommended')
      .then(res => setUsers(res.data))
      .catch(() => {});
  }, []);

  const handleFollow = async (userId, username) => {
    try {
      await toggleFollow(userId);
      setFollowed(prev => ({ ...prev, [userId]: true }));
      toast.success(`${username}님을 팔로우했어요.`);
    } catch { toast.error('잠시 후 다시 시도해주세요.'); }
  };

  return (
    <Box sx={{
      position: 'sticky', top: 24,
      width: 300, flexShrink: 0,
      display: { xs: 'none', lg: 'block' },
    }}>
      {/* 내 정보 */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 4 }}>
        <Avatar
          src={user?.profile_image ? `http://localhost:5000${user.profile_image}` : null}
          sx={{
            width: 44, height: 44, bgcolor: '#E8C96D', color: '#0A0A0A',
            fontWeight: 800, fontSize: 18, cursor: 'pointer',
          }}
          onClick={() => navigate(`/profile/${user?.username}`)}>
          {user?.username?.[0]?.toUpperCase()}
        </Avatar>
        <Box sx={{ flex: 1 }}>
          <Typography fontWeight={700} fontSize={14}
            sx={{ cursor: 'pointer', '&:hover': { color: '#E8C96D' } }}
            onClick={() => navigate(`/profile/${user?.username}`)}>
            {user?.username}
          </Typography>
          {user?.preferred_style && (
            <Chip label={styleLabels[user.preferred_style]} size="small"
              sx={{
                height: 18, fontSize: 10, fontWeight: 600,
                backgroundColor: `${styleColors[user.preferred_style]}15`,
                color: styleColors[user.preferred_style],
                border: `1px solid ${styleColors[user.preferred_style]}30`,
                mt: 0.3,
              }} />
          )}
        </Box>
        <Typography variant="caption" color="text.secondary"
          sx={{ cursor: 'pointer', '&:hover': { color: '#F0F0F0' } }}
          onClick={() => navigate(`/profile/${user?.username}`)}>
          전환
        </Typography>
      </Box>

      {/* 추천 유저 */}
      {users.length > 0 && (
        <>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="body2" fontWeight={700} color="text.secondary">
              회원님을 위한 추천
            </Typography>
            <Typography variant="caption" fontWeight={700}
              sx={{ cursor: 'pointer', color: '#F0F0F0', '&:hover': { color: '#E8C96D' } }}>
              모두 보기
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {users.map(u => (
              <Box key={u.id} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Avatar
                  src={u.profile_image ? `http://localhost:5000${u.profile_image}` : null}
                  sx={{
                    width: 36, height: 36, bgcolor: '#1A1A1A', color: '#F0F0F0',
                    fontSize: 14, fontWeight: 700, cursor: 'pointer',
                    border: u.preferred_style
                      ? `2px solid ${styleColors[u.preferred_style]}60`
                      : '2px solid #2A2A2A',
                  }}
                  onClick={() => navigate(`/profile/${u.username}`)}>
                  {u.username?.[0]?.toUpperCase()}
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body2" fontWeight={600} noWrap
                    sx={{ cursor: 'pointer', fontSize: 13, '&:hover': { color: '#E8C96D' } }}
                    onClick={() => navigate(`/profile/${u.username}`)}>
                    {u.username}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" noWrap fontSize={11}>
                    {u.preferred_style ? `${styleLabels[u.preferred_style]} · ` : ''}
                    팔로워 {u.follower_count}명
                  </Typography>
                </Box>
                {!followed[u.id] ? (
                  <Typography variant="caption" fontWeight={700}
                    sx={{ color: '#0095F6', cursor: 'pointer', flexShrink: 0,
                      '&:hover': { color: '#00376B' } }}
                    onClick={() => handleFollow(u.id, u.username)}>
                    팔로우
                  </Typography>
                ) : (
                  <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>
                    팔로잉
                  </Typography>
                )}
              </Box>
            ))}
          </Box>
        </>
      )}

      {/* 푸터 */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="caption" color="#333" sx={{ lineHeight: 2, fontSize: 10 }}>
          소개 · 도움말 · 홍보 센터 · API · 채용 정보 · 개인정보처리방침 · 약관 · 위치 · 언어
        </Typography>
        <Typography variant="caption" sx={{ display: 'block', color: '#2A2A2A', mt: 1, fontSize: 10 }}>
          © 2026 FITLOG
        </Typography>
      </Box>
    </Box>
  );
};

export default RecommendedUsers;