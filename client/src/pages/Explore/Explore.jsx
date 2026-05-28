import { useState, useEffect } from 'react';
import { Box, Chip, Typography } from '@mui/material';
import PostCard from '../../components/post/PostCard';
import { getExplore } from '../../api/postApi';

const styles = [
  { label: '전체',     value: '' },
  { label: '테크웨어', value: 'techwear' },
  { label: '아메카지', value: 'amekaji' },
  { label: '캐주얼',   value: 'casual' },
  { label: '스트릿',   value: 'street' },
  { label: '워크웨어', value: 'workwear' },
  { label: '기타',     value: 'etc' },
];

const Explore = () => {
  const [style, setStyle]     = useState('');
  const [posts, setPosts]     = useState([]);
  const [loading, setLoading] = useState(false);

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
    <Box>
      {/* 스타일 필터 */}
      <Box sx={{
        position: 'sticky', top: 0, zIndex: 10,
        backgroundColor: 'rgba(10,10,10,0.92)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid #1E1E1E',
        px: 2, py: 1.5,
        display: 'flex', gap: 1, overflowX: 'auto',
        '&::-webkit-scrollbar': { display: 'none' },
      }}>
        {styles.map(s => (
          <Chip key={s.value} label={s.label} onClick={() => setStyle(s.value)}
            sx={{
              flexShrink: 0,
              backgroundColor: style === s.value ? '#F0F0F0' : 'transparent',
              color:           style === s.value ? '#0A0A0A' : '#606060',
              fontWeight:      style === s.value ? 700 : 400,
              border: `1px solid ${style === s.value ? '#F0F0F0' : '#2A2A2A'}`,
              borderRadius: 20,
              height: 30,
              fontSize: 13,
              '&:hover': { backgroundColor: style === s.value ? '#F0F0F0' : '#1A1A1A' },
            }} />
        ))}
      </Box>

      {/* 3열 그리드 */}
      {loading ? (
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2px' }}>
          {[1,2,3,4,5,6,7,8,9].map(i => (
            <Box key={i} sx={{ paddingTop: '100%', backgroundColor: '#1A1A1A' }} />
          ))}
        </Box>
      ) : posts.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 15 }}>
          <Typography sx={{ fontSize: 40, mb: 2 }}>🔍</Typography>
          <Typography fontWeight={700} mb={1}>게시물이 없어요</Typography>
          <Typography variant="body2" color="text.secondary">첫 번째 게시물을 올려보세요!</Typography>
        </Box>
      ) : (
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2px' }}>
          {posts.map(post => <PostCard key={post.id} post={post} compact />)}
        </Box>
      )}
    </Box>
  );
};

export default Explore;