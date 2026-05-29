import { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Tab, Tabs } from '@mui/material';
import PostCard from '../../components/post/PostCard';
import SkeletonCard from '../../components/common/SkeletonCard';
import StoryBar from '../../components/post/StoryBar';
import RecommendedUsers from '../../components/common/RecommendedUsers';
import useInfiniteScroll from '../../hooks/useInfiniteScroll';
import { getExplore, getRecommended } from '../../api/postApi';

const Feed = () => {
  const [tab, setTab] = useState(0);
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  // 1. fetchPosts는 순수하게 '특정 페이지'를 불러오는 역할만 하도록 의존성을 대폭 줄입니다.
  const fetchPosts = useCallback(async (targetPage, isReset = false) => {
    setLoading(true);
    try {
      const res = tab === 0
        ? await getExplore('', targetPage)
        : await getRecommended(targetPage);
      
      const newPosts = res.data || [];
      
      setPosts(prev => isReset ? newPosts : [...prev, ...newPosts]);
      setHasMore(newPosts.length === 10); // 10개 미만이면 더 이상 없음
      setPage(targetPage + 1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [tab]); // 오직 tab이 바뀔 때만 함수가 새로 정의됩니다.

  // 2. 탭이 변경되었을 때 전체 초기화 및 1페이지 요청
  useEffect(() => {
    setPosts([]);
    setHasMore(true);
    // 무한 루프를 방지하기 위해 state를 거치지 않고 직접 1을 찔러넣어 호출합니다.
    fetchPosts(1, true); 
  }, [tab, fetchPosts]);

  // 3. 무한 스크롤 트리거시 다음 페이지 호출
  const bottomRef = useInfiniteScroll(() => {
    if (hasMore && !loading) {
      fetchPosts(page, false);
    }
  });

  return (
    <Box sx={{
      display: 'flex',
      justifyContent: 'center',
      gap: 4,
      px: { xs: 0, lg: 2 },
    }}>
      {/* 피드 — 최대 470px 고정 */}
      <Box sx={{ width: '100%', maxWidth: 470, minWidth: 0 }}>
        <StoryBar />
        <Tabs 
          value={tab} 
          onChange={(_, v) => setTab(v)}
          sx={{
            borderBottom: '1px solid #1E1E1E',
            '& .MuiTab-root': { color: '#505050', fontWeight: 600, fontSize: 13 },
            '& .Mui-selected': { color: '#F0F0F0' },
            '& .MuiTabs-indicator': { backgroundColor: '#F0F0F0', height: 2 }, // 높이를 살짝 줌 (기존 1)
          }}
        >
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
          {loading && [1, 2].map(i => <SkeletonCard key={i} />)}
        </Box>
        <Box ref={bottomRef} sx={{ height: 20 }} />
      </Box>

      {/* 우측 추천 사이드바 — lg 이상만 */}
      <RecommendedUsers />
    </Box>
  );
};

export default Feed;  