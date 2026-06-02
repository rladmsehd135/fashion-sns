import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Box, Typography } from '@mui/material';
import { AccessibilityNewRounded } from '@mui/icons-material';
import PostCard from '../../components/post/PostCard';
import axiosInstance from '../../api/axiosInstance';
import { getExplore } from '../../api/postApi';
import useAuthStore from '../../store/authStore';
import useThemeStore from '../../store/themeStore';
import toast from 'react-hot-toast';

const Explore = () => {
  const { mode } = useThemeStore();
  const { user }  = useAuthStore();
  const isDark    = mode === 'dark';
  const [searchParams] = useSearchParams();

  const [style,      setStyle]      = useState(() => searchParams.get('style') || '');
  const [styleList,  setStyleList]  = useState([]);
  const [posts,      setPosts]      = useState([]);
  const [page,       setPage]       = useState(1);
  const [loading,    setLoading]    = useState(false);
  const [hasMore,    setHasMore]    = useState(true);
  const [bodyFilter, setBodyFilter] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    axiosInstance.get('/users/styles/list')
      .then(res => setStyleList([{ value:'', label:'전체', icon:'🔍' }, ...res.data]))
      .catch(() => {});
  }, []);

  const fetchPosts = useCallback(async (targetPage, isReset = false) => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await getExplore(style, targetPage, bodyFilter);
      const newPosts = res.data || [];
      setPosts(prev => isReset ? newPosts : [...prev, ...newPosts]);
      setHasMore(newPosts.length === 10);
      setPage(targetPage + 1);
    } catch {
    } finally {
      setLoading(false);
    }
  }, [style, bodyFilter]);

  useEffect(() => {
    setPosts([]);
    setPage(1);
    setHasMore(true);
    fetchPosts(1, true);
  }, [style, bodyFilter]);

  useEffect(() => {
    if (!bottomRef.current) return;
    const observer = new IntersectionObserver(
      entries => { if (entries[0].isIntersecting && hasMore && !loading) fetchPosts(page); },
      { threshold: 0.1 }
    );
    observer.observe(bottomRef.current);
    return () => observer.disconnect();
  }, [hasMore, loading, page, fetchPosts]);

  const handleBodyFilter = () => {
    if (!bodyFilter && (!user?.height || !user?.weight)) {
      toast.error('프로필에 키/몸무게를 먼저 등록해주세요');
      return;
    }
    setBodyFilter(v => !v);
  };

  return (
    <Box sx={{ height: '100%' }}>

      {/* 필터 바 */}
      <Box sx={{
        position: 'sticky', top: 0, zIndex: 10,
        backgroundColor: isDark ? 'rgba(8,8,8,0.97)' : 'rgba(250,250,248,0.97)',
        backdropFilter: 'blur(24px)',
        borderBottom: `1px solid ${isDark ? '#1C1C1C' : '#EBEBEB'}`,
        boxShadow: isDark
          ? '0 4px 20px rgba(0,0,0,0.4)'
          : '0 2px 12px rgba(0,0,0,0.06)',
        px: 2, py: 1.4,
      }}>
        <Box sx={{
          display: 'flex', gap: 0.8, alignItems: 'center',
          overflowX: 'auto',
          // 크로스브라우저 스크롤바 숨김
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          '&::-webkit-scrollbar': { display: 'none' },
        }}>

          {/* 체형 맞춤 토글 — 항상 고정 표시 */}
          <Box
            onClick={handleBodyFilter}
            sx={{
              flexShrink: 0,
              display: 'flex', alignItems: 'center', gap: 0.6,
              px: 1.4, height: 32, borderRadius: 20,
              cursor: 'pointer',
              transition: 'all 0.18s ease',
              ...(bodyFilter ? {
                background: 'linear-gradient(135deg, #E8C96D, #D4AF37)',
                color: '#0A0A0A',
                boxShadow: '0 0 12px rgba(232,201,109,0.45)',
                fontWeight: 700,
              } : {
                backgroundColor: 'transparent',
                border: `1.5px solid ${isDark ? 'rgba(232,201,109,0.45)' : 'rgba(180,150,50,0.4)'}`,
                color: isDark ? '#E8C96D' : '#B8952D',
                fontWeight: 600,
                '&:hover': {
                  backgroundColor: isDark ? 'rgba(232,201,109,0.08)' : 'rgba(232,201,109,0.1)',
                },
              }),
            }}>
            <AccessibilityNewRounded sx={{ fontSize: 14 }} />
            <Typography fontSize={12} fontWeight="inherit" sx={{ color: 'inherit', whiteSpace: 'nowrap' }}>
              체형 맞춤
            </Typography>
          </Box>

          {/* 구분선 */}
          <Box sx={{
            width: '1px', height: 18, flexShrink: 0,
            backgroundColor: isDark ? '#282828' : '#E0E0E0',
            mx: 0.4,
          }} />

          {/* 스타일 칩 목록 */}
          {styleList.map(s => {
            const active = style === s.value;
            return (
              <Box
                key={s.value}
                onClick={() => setStyle(s.value)}
                sx={{
                  flexShrink: 0,
                  px: 1.4, height: 32, borderRadius: 20,
                  display: 'flex', alignItems: 'center',
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: active ? 700 : 500,
                  transition: 'all 0.15s ease',
                  ...(active ? {
                    backgroundColor: isDark ? '#EFEFEF' : '#0A0A0A',
                    color: isDark ? '#0A0A0A' : '#FFFFFF',
                  } : {
                    backgroundColor: isDark ? '#161616' : '#F2F2F2',
                    color: isDark ? '#888888' : '#666666',
                    '&:hover': {
                      backgroundColor: isDark ? '#202020' : '#E8E8E8',
                      color: isDark ? '#C0C0C0' : '#333333',
                    },
                  }),
                }}>
                {s.label}
              </Box>
            );
          })}
        </Box>
      </Box>

      {/* 체형 필터 안내 배너 */}
      {bodyFilter && user?.height && user?.weight && (
        <Box sx={{
          px: 2, py: 1, display: 'flex', alignItems: 'center', gap: 0.8,
          backgroundColor: isDark ? 'rgba(232,201,109,0.07)' : 'rgba(232,201,109,0.1)',
          borderBottom: `1px solid ${isDark ? 'rgba(232,201,109,0.15)' : 'rgba(232,201,109,0.2)'}`,
        }}>
          <AccessibilityNewRounded sx={{ fontSize: 14, color: '#E8C96D' }} />
          <Typography fontSize={12} sx={{ color: '#E8C96D', fontWeight: 600 }}>
            {user.height}cm · {user.weight}kg 기준 (±5cm / ±7kg) 코디만 표시
          </Typography>
        </Box>
      )}

      {/* 게시물 그리드 */}
      {loading && posts.length === 0 ? (
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2px' }}>
          {[1,2,3,4,5,6,7,8,9].map(i => (
            <Box key={i} sx={{ aspectRatio: '1/1', backgroundColor: isDark ? '#141414' : '#F0F0F0' }} />
          ))}
        </Box>
      ) : posts.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 15 }}>
          <Typography sx={{ fontSize: 40, mb: 2 }}>
            {bodyFilter ? '👤' : '🔍'}
          </Typography>
          <Typography fontWeight={700} mb={1}>게시물이 없어요</Typography>
          <Typography variant="body2" color="text.secondary" fontSize={13}>
            {bodyFilter
              ? '비슷한 체형의 코디가 아직 없어요.\n더 많은 사람들이 체형 정보를 등록하면 채워져요!'
              : '첫 번째 게시물을 올려보세요!'}
          </Typography>
        </Box>
      ) : (
        <>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2px' }}>
            {posts.map(post => (
              <PostCard key={post.id} post={post} compact />
            ))}
            {loading && [1,2,3].map(i => (
              <Box key={`sk-${i}`} sx={{ aspectRatio: '1/1', backgroundColor: isDark ? '#141414' : '#F0F0F0' }} />
            ))}
          </Box>
          <Box ref={bottomRef} sx={{ height: 40 }} />
          {!hasMore && posts.length > 0 && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
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
