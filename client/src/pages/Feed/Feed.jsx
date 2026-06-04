import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, IconButton } from '@mui/material';
import { AutoAwesomeRounded, RefreshRounded, PeopleRounded, PhotoCameraRounded } from '@mui/icons-material';
import PostCard from '../../components/post/PostCard';
import SkeletonCard from '../../components/common/SkeletonCard';
import StoryBar from '../../components/post/StoryBar';
import RecommendedUsers from '../../components/common/RecommendedUsers';
import useInfiniteScroll from '../../hooks/useInfiniteScroll';
import { getFeed, getRecommended, getMyStylePrefs } from '../../api/postApi';
import useThemeStore from '../../store/themeStore';
import { getFeedStyles } from './Feed.styles';

const Feed = () => {
  const navigate = useNavigate();
  const { mode } = useThemeStore();
  const isDark = mode === 'dark';

  const [tab, setTab]           = useState(0);
  const [posts, setPosts]       = useState([]);
  const [page, setPage]         = useState(1);
  const [loading, setLoading]   = useState(false);
  const [hasMore, setHasMore]   = useState(true);
  const [stylePrefs, setStylePrefs] = useState([]); // [{ style, score }]

  // 추천 탭 진입 시 스타일 선호도 한 번만 로드
  useEffect(() => {
    if (tab === 1 && stylePrefs.length === 0) {
      getMyStylePrefs()
        .then(res => setStylePrefs(res.data || []))
        .catch(() => {});
    }
  }, [tab]);

  const topStyleSet = useMemo(
    () => new Set(stylePrefs.map(s => s.style.trim().toLowerCase())),
    [stylePrefs]
  );

  const fetchPosts = useCallback(async (targetPage, isReset = false) => {
    setLoading(true);
    try {
      const res = tab === 0
        ? await getFeed(targetPage)
        : await getRecommended(targetPage);
      const newPosts = res.data || [];
      setPosts(prev => isReset ? newPosts : [...prev, ...newPosts]);
      setHasMore(newPosts.length === 10);
      setPage(targetPage + 1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    // 탭 전환 시 기존 게시물을 유지하거나, 매우 짧은 로딩 스켈레톤만 보여주는 것이 더 자연스럽습니다.
    setHasMore(true);
    fetchPosts(1, true);
  }, [tab, fetchPosts]);

  // 30초마다 첫 페이지 데이터만 살짝 갱신 (실시간성 강화)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchPosts(1, true);
    }, 30000); 
    return () => clearInterval(interval);
  }, [tab, fetchPosts]);

  const handleRefresh = () => {
    setHasMore(true);
    fetchPosts(1, true);
  };

  const bottomRef = useInfiniteScroll(() => {
    if (hasMore && !loading) fetchPosts(page, false);
  });

  const styles = getFeedStyles(isDark, loading);

  const textSub = isDark ? '#737373' : '#8E8E8E';

  return (
    <Box sx={styles.container}>
      <Box sx={styles.feedBox}>
        <StoryBar />

        {/* 탭 */}
        <Box sx={{
          display: 'flex',
          borderBottom: `1px solid ${isDark ? '#262626' : '#EFEFEF'}`,
        }}>
          {[
            { label: '팔로잉', icon: <PeopleRounded sx={{ fontSize: 14 }} /> },
            { label: '추천',   icon: <AutoAwesomeRounded sx={{ fontSize: 14 }} /> },
          ].map((t, i) => (
            <Box key={i} onClick={() => setTab(i)} sx={{
              flex: 1, height: 44,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.6,
              cursor: 'pointer', userSelect: 'none',
              fontSize: 13, fontWeight: tab === i ? 700 : 500,
              color: tab === i ? (isDark ? '#F5F5F5' : '#000000') : (isDark ? '#737373' : '#8E8E8E'),
              borderBottom: tab === i
                ? `1px solid ${isDark ? '#F5F5F5' : '#000000'}`
                : '1px solid transparent',
              mb: '-1px',
              transition: 'color 0.15s',
            }}>
              {t.icon}
              {t.label}
            </Box>
          ))}
        </Box>

        {/* 새로고침 버튼 */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', px: 1.5, pt: 0.5 }}>
          {loading && posts.length > 0 && (
            <Typography fontSize={11} sx={{ color: textSub, display: 'flex', alignItems: 'center', mr: 1 }}>
              업데이트 중...
            </Typography>
          )}
          <IconButton 
            size="small" 
            onClick={handleRefresh} 
            disabled={loading}
            sx={{ color: textSub, p: 0.5 }}
          >
            <RefreshRounded sx={{
              ...styles.refreshIcon, // 기존 styles.refreshIcon 속성 유지
              '@keyframes spin': { // 회전 애니메이션 정의
                '0%': { transform: 'rotate(0deg)' },
                '100%': { transform: 'rotate(360deg)' },
              },
              animation: loading ? 'spin 1s linear infinite' : 'none', // loading 상태일 때 애니메이션 적용
            }} />
          </IconButton>
        </Box>

        {/* 빈 상태 */}
        {posts.length === 0 && !loading && (
          <Box sx={{ textAlign: 'center', py: 12 }}>
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
              {tab === 0
                ? <PhotoCameraRounded sx={{ fontSize: 48, color: isDark ? '#2A2A2A' : '#D0D0D0' }} />
                : <AutoAwesomeRounded sx={{ fontSize: 48, color: '#E8C96D', opacity: 0.4 }} />
              }
            </Box>
            <Typography fontWeight={700} mb={1} sx={{ color: isDark ? '#EFEFEF' : '#0A0A0A' }}>
              {tab === 0 ? '아직 게시물이 없어요' : '추천 게시물이 없어요'}
            </Typography>
            <Typography variant="body2" sx={{ color: textSub, fontSize: 13 }}>
              {tab === 0
                ? '팔로우하는 사람들의 게시물이 여기 표시됩니다'
                : '게시물에 좋아요·북마크를 누르면 취향을 분석해 추천해 드려요'}
            </Typography>
          </Box>
        )}

        {/* 포스트 목록 */}
        <Box>
          {posts.map(post => {
            // 공백 제거 및 대소문자 통합 비교 (가장 확실한 방법)
            const postStyleNormalized = post.style?.trim().toLowerCase();
            const isStyleMatch = tab === 1 && postStyleNormalized && topStyleSet.has(postStyleNormalized);
            
            return (
              <Box key={post.id}>
                {/* 스타일 매칭 배지 */}
                {isStyleMatch && (
                  <Box sx={{
                    display: 'flex', alignItems: 'center',
                    px: 2, pt: 1.5, pb: 0.5,
                    gap: 1,
                  }}>
                    {/* 왼쪽 라인 */}
                    <Box sx={{ height: '1px', width: 20, background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)', flexShrink: 0 }} />

                    {/* 아이콘 + 텍스트 */}
                    <Box sx={{
                      display: 'inline-flex', alignItems: 'center', gap: 0.5,
                      px: 1.2, py: 0.35,
                      borderRadius: 20,
                      border: `1px solid ${isDark ? 'rgba(232,201,109,0.3)' : 'rgba(232,201,109,0.2)'}`,
                      backgroundColor: isDark ? 'rgba(232,201,109,0.08)' : 'rgba(232,201,109,0.05)',
                    }}>
                      <AutoAwesomeRounded sx={{ fontSize: 10, color: '#E8C96D' }} />
                      <Typography sx={{
                        fontSize: 10.5, fontWeight: 700,
                        color: isDark ? '#E8C96D' : '#D4AF37',
                        letterSpacing: 0.2,
                      }}>
                        취향 기반 추천
                      </Typography>
                    </Box>

                    {/* 오른쪽 라인 */}
                    <Box sx={{ flex: 1, height: '1px', background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }} />
                  </Box>
                )}
                <PostCard post={post} />
              </Box>
            );
          })}
          {loading && posts.length === 0 && [1, 2].map(i => <SkeletonCard key={i} />)}
        </Box>
        <Box ref={bottomRef} sx={{ height: 20 }} />
      </Box>

      <RecommendedUsers />
    </Box>
  );
};

export default Feed;
