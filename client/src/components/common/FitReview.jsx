import { useState, useEffect } from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { AccessibilityNewRounded } from '@mui/icons-material';
import axiosInstance from '../../api/axiosInstance';
import useAuthStore from '../../store/authStore';

/**
 * 비슷한 체형의 사람들이 같은 브랜드/아이템을 어떻게 입었는지 보여주는 컴포넌트
 * @param {Array}  items  - post_items 배열 (brand_name, item_name, category)
 * @param {string} isDark
 */
export default function FitReview({ items, isDark }) {
  const navigate   = useNavigate();
  const { user }   = useAuthStore();
  const [posts,   setPosts]   = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);

  const C = {
    text:   isDark ? '#E0E0E0' : '#0A0A0A',
    sub:    isDark ? '#505050' : '#AAAAAA',
    border: isDark ? '#1E1E1E' : '#EBEBEB',
    bg:     isDark ? '#111' : '#F8F8F8',
  };

  const hasBody = user?.height && user?.weight;
  const mainItem = items?.find(i => i.brand_name || i.item_name);

  useEffect(() => {
    if (!mainItem || !hasBody || fetched) return;
    setFetched(true);
    setLoading(true);

    const params = new URLSearchParams({
      height: user.height,
      weight: user.weight,
      ...(mainItem.brand_name && { brand: mainItem.brand_name }),
      ...(mainItem.item_name  && { item:  mainItem.item_name  }),
    });

    axiosInstance.get(`/ai/fit-review?${params}`)
      .then(res => setPosts(res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [mainItem, hasBody]);

  if (!mainItem || !hasBody) return null;

  return (
    <Box sx={{ borderTop: `1px solid ${C.border}`, pt: 2, mt: 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, px: 2, mb: 1.5 }}>
        <AccessibilityNewRounded sx={{ fontSize: 14, color: '#E8C96D' }} />
        <Typography fontSize={12} fontWeight={700} sx={{ color: C.text }}>
          비슷한 체형이 입은 방법
        </Typography>
        <Typography fontSize={11} sx={{ color: C.sub }}>
          {user.height}cm · {user.weight}kg 기준
        </Typography>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
          <CircularProgress size={20} sx={{ color: '#E8C96D' }} />
        </Box>
      ) : posts.length === 0 ? (
        <Box sx={{ px: 2, py: 2, textAlign: 'center' }}>
          <Typography fontSize={12} sx={{ color: C.sub }}>
            비슷한 체형의 착용 기록이 아직 없어요
          </Typography>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', gap: 1, px: 2, overflowX: 'auto', pb: 1, '&::-webkit-scrollbar': { display: 'none' } }}>
          {posts.map(post => (
            <Box
              key={post.id}
              onClick={() => navigate(`/post/${post.id}`)}
              sx={{ flexShrink: 0, cursor: 'pointer' }}
            >
              <Box sx={{
                width: 80, height: 80, borderRadius: 2, overflow: 'hidden',
                backgroundColor: isDark ? '#1A1A1A' : '#F0F0F0',
                border: `1px solid ${C.border}`,
                '&:hover': { transform: 'scale(1.04)', borderColor: '#E8C96D' },
                transition: 'all 0.15s',
              }}>
                {post.thumbnail ? (
                  <Box component="img"
                    src={`http://localhost:5000${post.thumbnail}`}
                    sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <AccessibilityNewRounded sx={{ fontSize: 28, color: C.sub }} />
                  </Box>
                )}
              </Box>
              <Typography fontSize={10} sx={{ color: C.sub, textAlign: 'center', mt: 0.3 }}>
                {post.height}cm · {post.weight}kg
              </Typography>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}
