import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, CircularProgress, IconButton } from '@mui/material';
import { ArrowBackIosNewRounded, TagRounded } from '@mui/icons-material';
import PostCard from '../../components/post/PostCard';
import { getByTag } from '../../api/postApi';
import useThemeStore from '../../store/themeStore';

export default function HashtagPage() {
  const { tag }      = useParams();
  const navigate     = useNavigate();
  const { mode }     = useThemeStore();
  const isDark       = mode === 'dark';
  const decodedTag   = decodeURIComponent(tag);

  const [posts,   setPosts]   = useState([]);
  const [page,    setPage]    = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const bottomRef = useRef(null);

  const C = {
    bg:     isDark ? '#0A0A0A' : '#FAFAFA',
    text:   isDark ? '#F0F0F0' : '#0A0A0A',
    sub:    isDark ? '#505050' : '#AAAAAA',
    border: isDark ? '#1A1A1A' : '#EBEBEB',
  };

  const fetchPosts = useCallback(async (targetPage, isReset = false) => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await getByTag(decodedTag, targetPage);
      const next = res.data || [];
      setPosts(prev => isReset ? next : [...prev, ...next]);
      setHasMore(next.length === 12);
      setPage(targetPage + 1);
    } catch {
    } finally {
      setLoading(false);
    }
  }, [decodedTag]);

  useEffect(() => {
    setPosts([]);
    setPage(1);
    setHasMore(true);
    fetchPosts(1, true);
  }, [decodedTag]);

  useEffect(() => {
    if (!bottomRef.current) return;
    const obs = new IntersectionObserver(
      entries => { if (entries[0].isIntersecting && hasMore && !loading) fetchPosts(page); },
      { threshold: 0.1 }
    );
    obs.observe(bottomRef.current);
    return () => obs.disconnect();
  }, [hasMore, loading, page, fetchPosts]);

  return (
    <Box sx={{ minHeight: '100%', backgroundColor: C.bg }}>
      {/* 헤더 */}
      <Box sx={{
        position: 'sticky', top: 0, zIndex: 10,
        backgroundColor: isDark ? 'rgba(10,10,10,0.97)' : 'rgba(250,250,250,0.97)',
        backdropFilter: 'blur(20px)',
        borderBottom: `1px solid ${C.border}`,
        px: 1, py: 1,
        display: 'flex', alignItems: 'center', gap: 1,
      }}>
        <IconButton size="small" onClick={() => navigate(-1)} sx={{ color: C.sub }}>
          <ArrowBackIosNewRounded sx={{ fontSize: 18 }} />
        </IconButton>
        <TagRounded sx={{ fontSize: 22, color: '#4A90D9' }} />
        <Box>
          <Typography fontWeight={800} fontSize={16} sx={{ color: C.text, lineHeight: 1.1 }}>
            #{decodedTag}
          </Typography>
          {posts.length > 0 && (
            <Typography fontSize={11} sx={{ color: C.sub }}>
              게시물 {posts.length}{hasMore ? '+' : ''}개
            </Typography>
          )}
        </Box>
      </Box>

      {/* 게시물 그리드 */}
      {loading && posts.length === 0 ? (
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2px' }}>
          {Array.from({ length: 9 }).map((_, i) => (
            <Box key={i} sx={{ aspectRatio: '1/1', backgroundColor: isDark ? '#141414' : '#F0F0F0' }} />
          ))}
        </Box>
      ) : posts.length === 0 ? (
        <Box sx={{ textAlign: 'center', pt: 14 }}>
          <TagRounded sx={{ fontSize: 48, color: C.sub, mb: 2 }} />
          <Typography fontWeight={700} fontSize={16} sx={{ color: C.text, mb: 0.5 }}>
            #{decodedTag}
          </Typography>
          <Typography fontSize={13} sx={{ color: C.sub }}>
            아직 이 태그가 달린 게시물이 없어요
          </Typography>
        </Box>
      ) : (
        <>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2px' }}>
            {posts.map(post => (
              <PostCard key={post.id} post={post} compact />
            ))}
            {loading && Array.from({ length: 3 }).map((_, i) => (
              <Box key={`sk-${i}`} sx={{ aspectRatio: '1/1', backgroundColor: isDark ? '#141414' : '#F0F0F0' }} />
            ))}
          </Box>
          <Box ref={bottomRef} sx={{ height: 40 }} />
          {!hasMore && posts.length > 0 && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography fontSize={12} sx={{ color: C.sub }}>
                모든 게시물을 확인했어요
              </Typography>
            </Box>
          )}
        </>
      )}
    </Box>
  );
}
