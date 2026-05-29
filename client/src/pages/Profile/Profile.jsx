import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Avatar, Typography, Button,
  Tab, Tabs, CircularProgress, Chip,
} from '@mui/material';
import {
  GridOnRounded, BookmarkBorderRounded,
} from '@mui/icons-material';
import { getProfile, toggleFollow } from '../../api/userApi';
import { getUserPosts, getMyBookmarks } from '../../api/postApi';
import { sendRequest, getRooms } from '../../api/chatApi';
import useAuthStore from '../../store/authStore';
import PostCard from '../../components/post/PostCard';
import toast from 'react-hot-toast';

const Profile = () => {
  const { username } = useParams();
  const navigate = useNavigate();
  const { user: me } = useAuthStore();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(true);

  const isMe = me?.username === username;

  useEffect(() => {
    let isMounted = true; // 메모리 누수 및 컴포넌트 언마운트 시 상태 변경 방지

    const loadData = async () => {
      setLoading(true);
      try {
        const res = await getProfile(username);
        if (!isMounted) return;
        setProfile(res.data);

        // 게시물과 북마크(본인일 경우)를 병렬로 동시에 호출하여 속도와 안정성을 높입니다.
        const requests = [getUserPosts(res.data.id)];
        if (me?.username === username) {
          requests.push(getMyBookmarks());
        }

        const [postRes, bmRes] = await Promise.all(requests);

        if (!isMounted) return;
        setPosts(postRes.data || []);
        if (bmRes) {
          setBookmarks(bmRes.data || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadData();

    return () => {
      isMounted = false; // 클린업 함수
    };
  }, [username, me?.username]); // me.username을 의존성에 추가하여 로그인 상태 변경에 안전하게 대응

  const handleMessage = async () => {
    try {
      const roomsRes = await getRooms();
      const existing = roomsRes.data.find(r => r.partner_id === profile.id);
      if (existing) {
        navigate('/chat', { state: { openRoomId: existing.id } });
        return;
      }
      await sendRequest(profile.id);
      toast.success('채팅 요청을 보냈습니다.');
      navigate('/chat');
    } catch (err) {
      if (err.response?.status === 409) {
        navigate('/chat');
      } else {
        toast.error('잠시 후 다시 시도해주세요.');
      }
    }
  };

  const handleFollow = async () => {
    try {
      const res = await toggleFollow(profile.id);
      setProfile(prev => ({
        ...prev,
        is_following: res.data.following ? 1 : 0,
        follower_count: res.data.following ? prev.follower_count + 1 : prev.follower_count - 1,
      }));
      toast.success(res.data.following ? `${profile.username}님을 팔로우했어요.` : '팔로우를 취소했어요.');
    } catch { toast.error('잠시 후 다시 시도해주세요.'); }
  };

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', pt: 10 }}>
      <CircularProgress sx={{ color: '#E8C96D' }} size={28} />
    </Box>
  );

  if (!profile) return (
    <Box sx={{ textAlign: 'center', pt: 10 }}>
      <Typography>유저를 찾을 수 없어요.</Typography>
    </Box>
  );

  const displayPosts = tab === 0 ? posts : bookmarks;

  return (
    <Box sx={{ maxWidth: 935, mx: 'auto' }}>
      {/* 프로필 헤더 */}
      <Box sx={{ px: { xs: 2, md: 4 }, pt: 4, pb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: { xs: 3, md: 6 }, mb: 3 }}>
          {/* 아바타 */}
          <Box sx={{ flexShrink: 0 }}>
            <Box sx={{
              p: '3px', borderRadius: '50%',
              background: profile.is_following || isMe
                ? 'linear-gradient(45deg, #E8C96D, #D4AF37)'
                : '#2A2A2A',
            }}>
              <Avatar
                src={profile.profile_image ? `http://localhost:5000${profile.profile_image}` : null}
                sx={{
                  width: { xs: 80, md: 150 },
                  height: { xs: 80, md: 150 },
                  fontSize: { xs: 28, md: 52 },
                  bgcolor: '#1A1A1A',
                  color: '#E8C96D',
                  fontWeight: 800,
                  border: '3px solid #0A0A0A',
                }}>
                {profile.username?.[0]?.toUpperCase()}
              </Avatar>
            </Box>
          </Box>

          {/* 정보 */}
          <Box sx={{ flex: 1, pt: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, flexWrap: 'wrap' }}>
              <Typography variant="h6" fontWeight={300} sx={{ fontSize: { xs: 18, md: 24 } }}>
                {profile.username}
              </Typography>
              {isMe ? (
                <Button size="small" variant="outlined"
                  onClick={() => navigate('/profile/edit')}
                  sx={{
                    borderColor: '#2A2A2A', color: '#F0F0F0',
                    borderRadius: 2, fontWeight: 600,
                    '&:hover': { borderColor: '#E8C96D', color: '#E8C96D' }
                  }}>
                  프로필 수정
                </Button>
              ) : (
                <>
                  <Button
                    variant={profile.is_following ? 'outlined' : 'contained'}
                    size="small"
                    onClick={handleFollow}
                    sx={profile.is_following
                      ? { borderColor: '#2A2A2A', color: '#F0F0F0', borderRadius: 2, fontWeight: 600, px: 3, py: 0.5 }
                      : { borderRadius: 2, fontWeight: 700, px: 3, py: 0.5, fontSize: 13 }}>
                    {profile.is_following ? '팔로잉' : '팔로우'}
                  </Button>
                  <Button variant="outlined" size="small"
                    onClick={handleMessage}
                    sx={{ borderColor: '#2A2A2A', color: '#F0F0F0', borderRadius: 2, fontWeight: 600, px: 2, py: 0.5, fontSize: 13 }}>
                    메시지
                  </Button>
                </>
              )}
            </Box>

            {/* 통계 */}
            <Box sx={{ display: 'flex', gap: { xs: 3, md: 5 }, mb: 2 }}>
              {[
                { label: '게시물', value: profile.post_count },
                { label: '팔로워', value: profile.follower_count },
                { label: '팔로잉', value: profile.following_count },
              ].map(item => (
                <Box key={item.label} sx={{ textAlign: { xs: 'center', md: 'left' }, cursor: 'pointer' }}>
                  <Typography fontWeight={700} fontSize={16}>{item.value?.toLocaleString()}</Typography>
                  <Typography variant="caption" color="text.secondary" fontSize={13}>{item.label}</Typography>
                </Box>
              ))}
            </Box>

            {/* 바이오 */}
            {profile.bio && (
              <Typography variant="body2" sx={{ color: '#D0D0D0', lineHeight: 1.6, mb: 1 }}>
                {profile.bio}
              </Typography>
            )}

            {/* 체형 */}
            {(profile.height || profile.weight) && (
              <Box sx={{ display: 'flex', gap: 1 }}>
                {profile.height && (
                  <Chip label={`${profile.height}cm`} size="small"
                    sx={{ backgroundColor: '#1A1A1A', color: '#808080', border: '1px solid #2A2A2A', height: 22, fontSize: 11 }} />
                )}
                {profile.weight && (
                  <Chip label={`${profile.weight}kg`} size="small"
                    sx={{ backgroundColor: '#1A1A1A', color: '#808080', border: '1px solid #2A2A2A', height: 22, fontSize: 11 }} />
                )}
              </Box>
            )}
          </Box>
        </Box>
      </Box>

      {/* 탭 */}
      {/* 탭 */}
      <Box sx={{ borderTop: '1px solid #1E1E1E', width: '100%', overflow: 'hidden' }}>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          centered
          sx={{
            minHeight: 48, // 탭 높이 고정
            '& .MuiTabs-scroller': {
              overflow: 'hidden !important', // 스크롤러 영역이 터지는 것 방지
            },
            '& .MuiTab-root': {
              color: '#505050',
              minWidth: 80,
              fontSize: 12,
              letterSpacing: 1,
              minHeight: 48,
              padding: '12px 16px',
              overflow: 'hidden', // 탭 내부가 부풀어 오르는 것 방지
            },
            '& .Mui-selected': { color: '#F0F0F0' },
            '& .MuiTabs-indicator': {
              backgroundColor: '#F0F0F0',
              height: '2px', // 높이를 명확한 px로 지정
              top: 0,
              bottom: 'auto'
            },
          }}
        >
          <Tab
            icon={<GridOnRounded sx={{ fontSize: 20, display: 'block' }} />} // 아이콘 display 고정
            label="게시물"
            iconPosition="start"
            sx={{ gap: 0.5 }}
          />
          {isMe && (
            <Tab
              icon={<BookmarkBorderRounded sx={{ fontSize: 20, display: 'block' }} />}
              label="저장됨"
              iconPosition="start"
              sx={{ gap: 0.5 }}
            />
          )}
        </Tabs>
      </Box>

      {/* 그리드 */}
      {displayPosts.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 15 }}>
          <Typography sx={{ fontSize: 48, mb: 2 }}>📷</Typography>
          <Typography fontWeight={700} fontSize={20} mb={1}>
            {tab === 0 ? '아직 게시물이 없어요' : '저장된 게시물이 없어요'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {tab === 0 && isMe ? '첫 번째 게시물을 공유해보세요!' : ''}
          </Typography>
          {tab === 0 && isMe && (
            <Button variant="contained" sx={{ mt: 2 }} onClick={() => navigate('/post/create')}>
              게시물 올리기
            </Button>
          )}
        </Box>
      ) : (
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '3px', mt: '3px' }}>
          {displayPosts.map(post => <PostCard key={post.id} post={post} compact />)}
        </Box>
      )}
    </Box>
  );
};

export default Profile;