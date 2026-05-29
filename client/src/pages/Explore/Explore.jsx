import { useState, useEffect } from 'react';
import { Box, Chip, Typography } from '@mui/material';
import PostCard from '../../components/post/PostCard';
import axiosInstance from '../../api/axiosInstance';
import { getExplore } from '../../api/postApi';

const Explore = () => {
  const [style, setStyle] = useState('');
  const [styleList, setStyleList] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    axiosInstance.get('/users/styles/list')
      .then(res => setStyleList([
        { value: '', label: '전체', icon: '🔍' },
        ...res.data,
      ]))
      .catch(() => { });
  }, []);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await getExplore(style, 1);
        setPosts(res.data);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [style]);

  return (
    <Box sx={{ height: '100%' }}>
      {/* 스타일 필터 */}
      <Box sx={{
        position: 'sticky', top: 0, zIndex: 10,
        backgroundColor: 'rgba(8,8,8,0.96)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid #1A1A1A',
        px: 2, py: 1.2,
        display: 'flex', gap: 1, overflowX: 'auto',
        '&::-webkit-scrollbar': { display: 'none' },
      }}>
        {styleList.map(s => (
          <Chip
            key={s.value}
            label={s.label}
            onClick={() => setStyle(s.value)}
            sx={{
              flexShrink: 0, height: 30,
              fontSize: 13, fontWeight: style === s.value ? 700 : 500,
              backgroundColor: style === s.value ? '#EFEFEF' : '#161616',
              color: style === s.value ? '#0A0A0A' : '#A0A0A0',
              border: `1px solid ${style === s.value ? '#EFEFEF' : '#2A2A2A'}`,
              borderRadius: 20,
              '&:hover': {
                backgroundColor: style === s.value ? '#EFEFEF' : '#1E1E1E',
                color: style === s.value ? '#0A0A0A' : '#C0C0C0',
              },
            }}
          />
        ))}
      </Box>

      {/* 3열 그리드 */}
      {loading ? (
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '2px',
        }}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => (
            <Box key={i} sx={{ aspectRatio: '1/1', backgroundColor: '#141414' }} />
          ))}
        </Box>
      ) : posts.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 15 }}>
          <Typography sx={{ fontSize: 40, mb: 2 }}>🔍</Typography>
          <Typography fontWeight={700} mb={1}>게시물이 없어요</Typography>
          <Typography variant="body2" color="text.secondary">
            첫 번째 게시물을 올려보세요!
          </Typography>
        </Box>
      ) : (
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '2px',
        }}>
          {posts.map(post => (
            <PostCard key={post.id} post={post} compact />
          ))}
        </Box>
      )}
    </Box>
  );
};

export default Explore; 