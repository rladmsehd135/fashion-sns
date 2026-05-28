import { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Tab, Tabs } from '@mui/material';
import PostCard from '../../components/post/PostCard';
import SkeletonCard from '../../components/common/SkeletonCard';
import StoryBar from '../../components/post/StoryBar';
import RecommendedUsers from '../../components/common/RecommendedUsers';
import useInfiniteScroll from '../../hooks/useInfiniteScroll';
import { getExplore, getRecommended } from '../../api/postApi';

const Feed = () => {
  const [tab, setTab]         = useState(0);
  const [posts, setPosts]     = useState([]);
  const [page, setPage]       = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const fetchPosts = useCallback(async (reset = false) => {
    if (loading || (!hasMore && !reset)) return;
    setLoading(true);
    try {
      const currentPage = reset ? 1 : page;
      const res = tab === 0
        ? await getExplore('', currentPage)
        : await getRecommended(currentPage);
      const newPosts = res.data;
      setPosts(prev => reset ? newPosts : [...prev, ...newPosts]);
      setPage(currentPage + 1);
      if (newPosts.length < 10) setHasMore(false);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [tab, page, loading, hasMore]);

  useEffect(() => {
    setPosts([]);
    setPage(1);
    setHasMore(true);
    fetchPosts(true);
  }, [tab]);

  const bottomRef = useInfiniteScroll(() => {
    if (hasMore && !loading) fetchPosts();
  });

  return (
    <Box sx={{
      display: 'flex',
      justifyContent: 'center',
      gap: 6,
      px: { xs: 0, lg: 4 },
      pt: { xs: 0, lg: 3 },
    }}>
      {/* 피드 */}
      <Box sx={{ width: '100%', maxWidth: 470, flexShrink: 0 }}>
        {/* 스토리 */}
        <StoryBar />

        {/* 탭 */}
        <Tabs value={tab} onChange={(_, v) => setTab(v)}
          sx={{
            borderBottom: '1px solid #1E1E1E',
            '& .MuiTab-root': { color: '#505050', fontWeight: 600, fontSize: 13 },
            '& .Mui-selected': { color: '#F0F0F0' },
            '& .MuiTabs-indicator': { backgroundColor: '#F0F0F0', height: 1 },
          }}>
          <Tab label="홈" />
          <Tab label="추천" />
        </Tabs>

        {posts.length === 0 && !loading && (
          <Box sx={{ textAlign: 'center', py: 15 }}>
            <Typography sx={{ fontSize: 40, mb: 2 }}>📸</Typography>
            <Typography fontWeight={700} mb={1}>아직 게시물이 없어요</Typography>
            <Typography variant="body2" color="text.secondary">
              첫 번째 게시물을 올려보세요!
            </Typography>
          </Box>
        )}

        <Box>
          {posts.map(post => <PostCard key={post.id} post={post} />)}
          {loading && [1,2].map(i => <SkeletonCard key={i} />)}
        </Box>
        <Box ref={bottomRef} sx={{ height: 20 }} />
      </Box>

      {/* 우측 추천 사이드바 */}
      <RecommendedUsers />
    </Box>
  );
};

export default Feed;