import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Box, Chip, Typography } from '@mui/material';
import PostCard from '../../components/post/PostCard';
import axiosInstance from '../../api/axiosInstance';
import { getExplore } from '../../api/postApi';
import useThemeStore from '../../store/themeStore';

const Explore = () => {
  const { mode } = useThemeStore();
  const isDark = mode === 'dark';
  const [searchParams] = useSearchParams();

  const [style, setStyle]       = useState(() => searchParams.get('style') || '');
  const [styleList, setStyleList] = useState([]);
  const [posts, setPosts]       = useState([]);
  const [page, setPage]         = useState(1);
  const [loading, setLoading]   = useState(false);
  const [hasMore, setHasMore]   = useState(true);
  const bottomRef               = useRef(null);

  useEffect(() => {
    axiosInstance.get('/users/styles/list')
      .then(res => setStyleList([
        { value:'', label:'전체', icon:'🔍' },
        ...res.data,
      ]))
      .catch(() => {});
  }, []);

  const fetchPosts = useCallback(async (targetPage, isReset = false) => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await getExplore(style, targetPage);
      const newPosts = res.data || [];
      setPosts(prev => isReset ? newPosts : [...prev, ...newPosts]);
      setHasMore(newPosts.length === 10);
      setPage(targetPage + 1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [style]);

  // 스타일 바뀌면 초기화
  useEffect(() => {
    setPosts([]);
    setPage(1);
    setHasMore(true);
    fetchPosts(1, true);
  }, [style]);

  // 무한 스크롤 Observer
  useEffect(() => {
    if (!bottomRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          fetchPosts(page);
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(bottomRef.current);
    return () => observer.disconnect();
  }, [hasMore, loading, page, fetchPosts]);

  const handleStyleChange = (val) => {
    if (val === style) return;
    setStyle(val);
  };

  return (
    <Box sx={{ height:'100%' }}>

      {/* 스타일 필터 */}
      <Box sx={{
        position:'sticky', top:0, zIndex:10,
        backgroundColor: isDark ? 'rgba(8,8,8,0.96)' : 'rgba(245,245,240,0.96)',
        backdropFilter:'blur(20px)',
        borderBottom:`1px solid ${isDark ? '#1A1A1A' : '#EBEBEB'}`,
        px:2, py:1.2,
        display:'flex', gap:1, overflowX:'auto',
        '&::-webkit-scrollbar':{ display:'none' },
      }}>
        {styleList.map(s => (
          <Chip key={s.value} label={s.label}
            onClick={() => handleStyleChange(s.value)}
            sx={{
              flexShrink:0, height:30,
              fontSize:13, fontWeight: style === s.value ? 700 : 500,
              backgroundColor: style === s.value
                ? (isDark ? '#EFEFEF' : '#0A0A0A')
                : (isDark ? '#161616' : '#F0F0F0'),
              color: style === s.value
                ? (isDark ? '#0A0A0A' : '#FFFFFF')
                : (isDark ? '#A0A0A0' : '#666666'),
              border:`1px solid ${style === s.value
                ? (isDark ? '#EFEFEF' : '#0A0A0A')
                : (isDark ? '#2A2A2A' : '#E0E0E0')}`,
              borderRadius:20,
              cursor:'pointer',
              '&:hover':{
                backgroundColor: style === s.value
                  ? (isDark ? '#EFEFEF' : '#0A0A0A')
                  : (isDark ? '#1E1E1E' : '#E8E8E8'),
              },
            }}
          />
        ))}
      </Box>

      {/* 초기 로딩 스켈레톤 */}
      {loading && posts.length === 0 ? (
        <Box sx={{
          display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:'2px',
        }}>
          {[1,2,3,4,5,6,7,8,9].map(i => (
            <Box key={i} sx={{
              aspectRatio:'1/1',
              backgroundColor: isDark ? '#141414' : '#F0F0F0',
            }} />
          ))}
        </Box>
      ) : posts.length === 0 ? (
        <Box sx={{ textAlign:'center', py:15 }}>
          <Typography sx={{ fontSize:40, mb:2 }}>🔍</Typography>
          <Typography fontWeight={700} mb={1}>게시물이 없어요</Typography>
          <Typography variant="body2" color="text.secondary">
            첫 번째 게시물을 올려보세요!
          </Typography>
        </Box>
      ) : (
        <>
          <Box sx={{
            display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:'2px',
          }}>
            {posts.map(post => (
              <PostCard key={post.id} post={post} compact />
            ))}

            {/* 추가 로딩 스켈레톤 */}
            {loading && [1,2,3].map(i => (
              <Box key={`sk-${i}`} sx={{
                aspectRatio:'1/1',
                backgroundColor: isDark ? '#141414' : '#F0F0F0',
              }} />
            ))}
          </Box>

          {/* 무한 스크롤 감지 */}
          <Box ref={bottomRef} sx={{ height:40 }} />

          {!hasMore && posts.length > 0 && (
            <Box sx={{ textAlign:'center', py:4 }}>
              <Typography fontSize={12} sx={{ color: isDark ? '#303030' : '#CCCCCC' }}>
                모든 게시물을 확인했어요
              </Typography>
            </Box>
          )}
        </>
      )}
    </Box>
  );
};

export default Explore;