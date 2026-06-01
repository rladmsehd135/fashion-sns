import { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Tab, Tabs, IconButton } from '@mui/material';
import { AutoAwesomeRounded, RefreshRounded } from '@mui/icons-material';
import PostCard from '../../components/post/PostCard';
import SkeletonCard from '../../components/common/SkeletonCard';
import StoryBar from '../../components/post/StoryBar';
import RecommendedUsers from '../../components/common/RecommendedUsers';
import useInfiniteScroll from '../../hooks/useInfiniteScroll';
import { getExplore, getRecommended } from '../../api/postApi';
import useThemeStore from '../../store/themeStore';
import { getFeedStyles } from './Feed.styles';

const Feed = () => {
  const { mode } = useThemeStore();
  const isDark = mode === 'dark';

  const [tab, setTab] = useState(0);
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const fetchPosts = useCallback(async (targetPage, isReset = false) => {
    setLoading(true);
    try {
      
      const res = tab === 0 
        ? await getRecommended(targetPage) 
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

  return (
    <Box sx={styles.container}>
      <Box sx={styles.feedBox}>
        <StoryBar />

        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={styles.tabs}>
          <Tab label="홈" />
          <Tab label="추천" />
        </Tabs>

        <Box sx={styles.refreshHeader}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.7 }}>
            <AutoAwesomeRounded sx={{ fontSize: 13, color: '#E8C96D' }} />
            <Typography sx={styles.hintText}>
              {tab === 0 ? '회원님을 위한 맞춤형 피드' : '평소 자주 보는 스타일 기반 추천'}
            </Typography>
          </Box>
          <IconButton size="small" onClick={handleRefresh} disabled={loading} sx={{ color: isDark ? '#505050' : '#AAAAAA', p: 0.5 }}>
            <RefreshRounded sx={styles.refreshIcon} />
          </IconButton>
        </Box>

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
          {loading && [1, 2].map(i => <SkeletonCard key={i} />)}
        </Box>
        <Box ref={bottomRef} sx={{ height: 20 }} />
      </Box>

      <RecommendedUsers />
    </Box>
  );
};

export default Feed;