import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Tab, Tabs, IconButton } from '@mui/material';
import { AutoAwesomeRounded, RefreshRounded, PeopleRounded } from '@mui/icons-material';
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
    () => new Set(stylePrefs.slice(0, 3).map(s => s.style)),
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
    setPosts([]);
    setHasMore(true);
    fetchPosts(1, true);
  }, [tab, fetchPosts]);

  const handleRefresh = () => {
    setPosts([]);
    setHasMore(true);
    fetchPosts(1, true);
  };

  const bottomRef = useInfiniteScroll(() => {
    if (hasMore && !loading) fetchPosts(page, false);
  });

  const styles = getFeedStyles(isDark, loading);

  const accent  = '#E8C96D';
  const textSub = isDark ? '#606060' : '#AAAAAA';
  const chipBg  = isDark ? 'rgba(232,201,109,0.1)' : 'rgba(232,201,109,0.15)';

  return (
    <Box sx={styles.container}>
      <Box sx={styles.feedBox}>
        <StoryBar />

        {/* 탭 */}
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={styles.tabs}>
          <Tab
            icon={<PeopleRounded sx={{ fontSize: 16 }} />}
            iconPosition="start"
            label="팔로잉"
          />
          <Tab
            icon={<AutoAwesomeRounded sx={{ fontSize: 16 }} />}
            iconPosition="start"
            label="추천"
          />
        </Tabs>

        {/* 탭별 헤더 */}
        {tab === 0 ? (
          <Box sx={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            px: 2, py: 1.2,
          }}>
            <Typography sx={{ fontSize: 12, color: textSub }}>
              팔로잉 중인 사람들의 최신 게시물
            </Typography>
            <IconButton size="small" onClick={handleRefresh} disabled={loading}
              sx={{ color: textSub, p: 0.5 }}>
              <RefreshRounded sx={{ fontSize: 18 }} />
            </IconButton>
          </Box>
        ) : (
          <Box sx={{ px: 2, py: 1.5 }}>
            <Box sx={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1,
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.7 }}>
                <AutoAwesomeRounded sx={{ fontSize: 14, color: accent }} />
                <Typography sx={{ fontSize: 12, color: textSub }}>
                  내 스타일 취향 기반 추천
                </Typography>
              </Box>
              <IconButton size="small" onClick={handleRefresh} disabled={loading}
                sx={{ color: textSub, p: 0.5 }}>
                <RefreshRounded sx={{ fontSize: 18 }} />
              </IconButton>
            </Box>

            {/* 내 관심 스타일 칩 */}
            {stylePrefs.length > 0 && (
              <Box sx={{ display: 'flex', gap: 0.6, flexWrap: 'wrap' }}>
                {stylePrefs.slice(0, 5).map(s => (
                  <Box key={s.style}
                    onClick={() => navigate(`/explore?style=${encodeURIComponent(s.style)}`)}
                    sx={{
                      px: 1.2, py: 0.3, borderRadius: 20, cursor: 'pointer',
                      backgroundColor: chipBg,
                      border: `1px solid ${isDark ? 'rgba(232,201,109,0.25)' : 'rgba(232,201,109,0.4)'}`,
                      fontSize: 11, fontWeight: 600, color: accent,
                      transition: 'opacity 0.15s',
                      '&:hover': { opacity: 0.7 },
                    }}>
                    # {s.style}
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        )}

        {/* 빈 상태 */}
        {posts.length === 0 && !loading && (
          <Box sx={{ textAlign: 'center', py: 12 }}>
            <Typography sx={{ fontSize: 40, mb: 2 }}>
              {tab === 0 ? '📸' : '✨'}
            </Typography>
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
            const isStyleMatch = tab === 1 && post.style && topStyleSet.has(post.style);
            return (
              <Box key={post.id}>
                {/* 스타일 매칭 배지 */}
                {isStyleMatch && (
                  <Box sx={{
                    mx: 2, mt: 1, mb: -0.5,
                    display: 'inline-flex', alignItems: 'center', gap: 0.5,
                    px: 1.2, py: 0.3, borderRadius: 20,
                    backgroundColor: chipBg,
                    border: `1px solid ${isDark ? 'rgba(232,201,109,0.2)' : 'rgba(232,201,109,0.35)'}`,
                  }}>
                    <AutoAwesomeRounded sx={{ fontSize: 11, color: accent }} />
                    <Typography sx={{ fontSize: 11, fontWeight: 600, color: accent }}>
                      {post.style} 스타일 선호 매칭
                    </Typography>
                  </Box>
                )}
                <PostCard post={post} />
              </Box>
            );
          })}
          {loading && [1, 2].map(i => <SkeletonCard key={i} />)}
        </Box>
        <Box ref={bottomRef} sx={{ height: 20 }} />
      </Box>

      <RecommendedUsers />
    </Box>
  );
};

export default Feed;
