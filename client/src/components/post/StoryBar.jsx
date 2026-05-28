import { useState, useEffect, useRef } from 'react';
import { Box, Avatar, Typography, Dialog, IconButton, LinearProgress } from '@mui/material';
import { AddRounded, CloseRounded } from '@mui/icons-material';
import { getStories, uploadStory } from '../../api/postApi';
import useAuthStore from '../../store/authStore';

const StoryBar = () => {
  const { user }          = useAuthStore();
  const [stories, setStories]   = useState([]);
  const [viewing, setViewing]   = useState(null);
  const [storyIndex, setStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [userStories, setUserStories] = useState([]);
  const fileRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    getStories().then(res => setStories(res.data)).catch(() => {});
  }, []);

  const openStory = async (storyUser, index = 0) => {
    const { getUserStories } = await import('../../api/postApi');
    const res = await getUserStories(storyUser.user_id);
    setUserStories(res.data);
    setViewing(storyUser);
    setStoryIndex(index);
    setProgress(0);
  };

  useEffect(() => {
    if (!viewing) return;
    clearInterval(timerRef.current);
    setProgress(0);
    timerRef.current = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(timerRef.current);
          // 다음 스토리
          if (storyIndex < userStories.length - 1) {
            setStoryIndex(i => i + 1);
          } else {
            setViewing(null);
          }
          return 0;
        }
        return prev + 2;
      });
    }, 100);
    return () => clearInterval(timerRef.current);
  }, [viewing, storyIndex]);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('image', file);
    await uploadStory(formData);
    const res = await getStories();
    setStories(res.data);
  };

  const myStory = stories.find(s => s.user_id === user?.id);

  return (
    <>
      <Box sx={{
        display: 'flex', gap: 2,
        px: 2, py: 2,
        overflowX: 'auto',
        borderBottom: '1px solid #1E1E1E',
        '&::-webkit-scrollbar': { display: 'none' },
      }}>
        {/* 내 스토리 추가 버튼 */}
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.8, flexShrink: 0 }}>
          <Box sx={{ position: 'relative' }}>
            <Box
              onClick={() => myStory ? openStory(myStory) : fileRef.current?.click()}
              sx={{
                width: 62, height: 62, borderRadius: '50%', cursor: 'pointer',
                background: myStory
                  ? 'linear-gradient(45deg, #E8C96D, #D4AF37, #FFD700)'
                  : 'transparent',
                p: myStory ? '2px' : 0,
              }}>
              <Avatar
                src={user?.profile_image ? `http://localhost:5000${user.profile_image}` : null}
                sx={{
                  width: '100%', height: '100%',
                  bgcolor: '#1A1A1A', color: '#E8C96D',
                  fontWeight: 800, fontSize: 20,
                  border: myStory ? '2px solid #0A0A0A' : '2px solid #2A2A2A',
                }}>
                {user?.username?.[0]?.toUpperCase()}
              </Avatar>
            </Box>
            {!myStory && (
              <Box
                onClick={() => fileRef.current?.click()}
                sx={{
                  position: 'absolute', bottom: 0, right: 0,
                  width: 20, height: 20, borderRadius: '50%',
                  backgroundColor: '#0095F6',
                  border: '2px solid #0A0A0A',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer',
                }}>
                <AddRounded sx={{ fontSize: 14, color: '#fff' }} />
              </Box>
            )}
          </Box>
          <Typography variant="caption" sx={{ fontSize: 11, color: '#A0A0A0', maxWidth: 62, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            내 스토리
          </Typography>
        </Box>

        {/* 다른 유저 스토리 */}
        {stories.filter(s => s.user_id !== user?.id).map(storyUser => {
          const viewed = storyUser.viewed_count >= storyUser.story_count;
          return (
            <Box key={storyUser.user_id}
              sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.8, flexShrink: 0 }}>
              <Box
                onClick={() => openStory(storyUser)}
                sx={{
                  width: 62, height: 62, borderRadius: '50%', cursor: 'pointer',
                  background: viewed
                    ? 'linear-gradient(45deg, #3A3A3A, #2A2A2A)'
                    : 'linear-gradient(45deg, #F58529, #DD2A7B, #8134AF, #515BD4)',
                  p: '2px',
                }}>
                <Avatar
                  src={storyUser.profile_image ? `http://localhost:5000${storyUser.profile_image}` : null}
                  sx={{
                    width: '100%', height: '100%',
                    bgcolor: '#1A1A1A', color: '#F0F0F0',
                    fontWeight: 700, fontSize: 20,
                    border: '2px solid #0A0A0A',
                    filter: viewed ? 'grayscale(60%)' : 'none',
                  }}>
                  {storyUser.username?.[0]?.toUpperCase()}
                </Avatar>
              </Box>
              <Typography variant="caption"
                sx={{ fontSize: 11, color: viewed ? '#505050' : '#F0F0F0', maxWidth: 62, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {storyUser.username}
              </Typography>
            </Box>
          );
        })}
      </Box>

      {/* 숨겨진 파일 인풋 */}
      <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleUpload} />

      {/* 스토리 뷰어 */}
      <Dialog fullScreen open={Boolean(viewing)} onClose={() => setViewing(null)}
        PaperProps={{ sx: { backgroundColor: '#000' } }}>
        {viewing && userStories[storyIndex] && (
          <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
            {/* 프로그레스 바 */}
            <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, px: 1, pt: 1,
              display: 'flex', gap: 0.5 }}>
              {userStories.map((_, i) => (
                <Box key={i} sx={{ flex: 1, height: 2, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 1, overflow: 'hidden' }}>
                  <Box sx={{
                    height: '100%', backgroundColor: '#fff', borderRadius: 1,
                    width: i < storyIndex ? '100%' : i === storyIndex ? `${progress}%` : '0%',
                    transition: i === storyIndex ? 'none' : undefined,
                  }} />
                </Box>
              ))}
            </Box>

            {/* 헤더 */}
            <Box sx={{ position: 'absolute', top: 16, left: 0, right: 0, zIndex: 10,
              display: 'flex', alignItems: 'center', px: 2, pt: 1 }}>
              <Avatar src={viewing.profile_image ? `http://localhost:5000${viewing.profile_image}` : null}
                sx={{ width: 36, height: 36, mr: 1.5 }}>
                {viewing.username?.[0]?.toUpperCase()}
              </Avatar>
              <Typography fontWeight={600} color="#fff" fontSize={14}>{viewing.username}</Typography>
              <Box sx={{ flex: 1 }} />
              <IconButton onClick={() => setViewing(null)} sx={{ color: '#fff' }}>
                <CloseRounded />
              </IconButton>
            </Box>

            {/* 이미지 */}
            <Box
              component="img"
              src={`http://localhost:5000${userStories[storyIndex].image_url}`}
              sx={{ width: '100%', height: '100%', objectFit: 'contain' }}
              onClick={(e) => {
                const x = e.clientX;
                if (x < window.innerWidth / 2) {
                  if (storyIndex > 0) setStoryIndex(i => i - 1);
                  else setViewing(null);
                } else {
                  if (storyIndex < userStories.length - 1) setStoryIndex(i => i + 1);
                  else setViewing(null);
                }
              }}
            />
          </Box>
        )}
      </Dialog>
    </>
  );
};

export default StoryBar;