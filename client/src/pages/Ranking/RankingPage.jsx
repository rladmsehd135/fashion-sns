import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Avatar, CircularProgress, Chip } from '@mui/material';
import { EmojiEventsRounded } from '@mui/icons-material';
import { getBrandRanking, getItemRanking, getStyleRanking } from '../../api/rankingApi';
import useThemeStore from '../../store/themeStore';

const PERIODS  = [{ label: '전체', value: 'all' }, { label: '이번주', value: 'week' }, { label: '이번달', value: 'month' }];
const TABS     = [{ label: '브랜드', value: 'brand' }, { label: '아이템', value: 'item' }, { label: '스타일', value: 'style' }];
const CATS     = [
  { label: '전체', value: '' },
  { label: '상의', value: 'top' },
  { label: '하의', value: 'bottom' },
  { label: '아우터', value: 'outer' },
  { label: '슈즈', value: 'shoes' },
  { label: '가방', value: 'bag' },
  { label: '악세서리', value: 'acc' },
];

const RANK_COLORS = ['#E8C96D', '#C0C0C0', '#CD7F32'];

export default function RankingPage() {
  const navigate = useNavigate();
  const { mode } = useThemeStore();
  const isDark = mode === 'dark';

  const C = useMemo(() => ({
    bg:      isDark ? '#0A0A0A' : '#F5F5F0',
    card:    isDark ? '#111111' : '#FFFFFF',
    border:  isDark ? '#1A1A1A' : '#EBEBEB',
    text:    isDark ? '#EFEFEF' : '#0A0A0A',
    textSub: isDark ? '#606060' : '#999999',
    textMid: isDark ? '#C0C0C0' : '#555555',
    chip:    isDark ? '#1A1A1A' : '#F0F0F0',
    chipActive: isDark ? 'rgba(232,201,109,0.15)' : 'rgba(232,201,109,0.2)',
    accent:  '#E8C96D',
    hover:   isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
    thumb:   isDark ? '#1A1A1A' : '#E8E8E8',
  }), [isDark]);

  const [tab, setTab]       = useState('brand');
  const [period, setPeriod] = useState('all');
  const [category, setCategory] = useState('');
  const [data, setData]     = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState(null);

  useEffect(() => {
    setLoading(true);
    setData([]);
    setError(null);
    const req =
      tab === 'brand'  ? getBrandRanking(period) :
      tab === 'item'   ? getItemRanking(period, category) :
      getStyleRanking(period);

    req
      .then(res => setData(res.data))
      .catch(err => setError(err?.response?.data?.message || '데이터를 불러오지 못했어요.'))
      .finally(() => setLoading(false));
  }, [tab, period, category]);

  const handleItemClick = (item) => {
    if (tab === 'brand')  navigate(`/search?q=${encodeURIComponent(item.brand_name)}`);
    else if (tab === 'item')   navigate(`/search?q=${encodeURIComponent(item.item_name)}`);
    else if (tab === 'style')  navigate(`/explore?style=${encodeURIComponent(item.style)}`);
  };

  const getName = (item) => {
    if (tab === 'brand') return item.brand_name;
    if (tab === 'item')  return item.item_name;
    return item.style;
  };

  const getSub = (item) => {
    if (tab === 'item' && item.brand_name) return item.brand_name;
    if (tab === 'item' && item.category) return item.category;
    return null;
  };

  const fmtNum = (n) => {
    const num = Number(n) || 0;
    return num >= 1000 ? `${(num / 1000).toFixed(1)}K` : String(num);
  };

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: C.bg, pb: 8 }}>
      {/* 헤더 */}
      <Box sx={{
        px: 3, pt: 4, pb: 2,
        borderBottom: `1px solid ${C.border}`,
        backgroundColor: C.card,
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
          <EmojiEventsRounded sx={{ color: C.accent, fontSize: 28 }} />
          <Typography fontWeight={800} fontSize={22} sx={{ color: C.text, letterSpacing: -0.5 }}>
            인기 랭킹
          </Typography>
        </Box>

        {/* 기간 필터 */}
        <Box sx={{ display: 'flex', gap: 0.8, mb: 2 }}>
          {PERIODS.map(p => (
            <Box key={p.value}
              onClick={() => setPeriod(p.value)}
              sx={{
                px: 1.8, py: 0.5, borderRadius: 20, cursor: 'pointer',
                fontSize: 13, fontWeight: period === p.value ? 700 : 400,
                backgroundColor: period === p.value ? C.accent : C.chip,
                color: period === p.value ? '#0A0A0A' : C.textMid,
                transition: 'all 0.15s',
              }}>
              {p.label}
            </Box>
          ))}
        </Box>

        {/* 탭 */}
        <Box sx={{ display: 'flex', gap: 0 }}>
          {TABS.map(t => (
            <Box key={t.value}
              onClick={() => setTab(t.value)}
              sx={{
                px: 2, py: 1, cursor: 'pointer', position: 'relative',
                fontSize: 14, fontWeight: tab === t.value ? 700 : 400,
                color: tab === t.value ? C.text : C.textSub,
                transition: 'color 0.15s',
                '&::after': tab === t.value ? {
                  content: '""', position: 'absolute',
                  bottom: 0, left: 0, right: 0, height: 2,
                  backgroundColor: C.accent, borderRadius: '2px 2px 0 0',
                } : {},
              }}>
              {t.label}
            </Box>
          ))}
        </Box>
      </Box>

      {/* 카테고리 필터 (아이템 탭만) */}
      {tab === 'item' && (
        <Box sx={{ px: 3, py: 1.5, display: 'flex', gap: 0.8, overflowX: 'auto', backgroundColor: C.card, borderBottom: `1px solid ${C.border}`,
          '&::-webkit-scrollbar': { display: 'none' } }}>
          {CATS.map(c => (
            <Box key={c.value}
              onClick={() => setCategory(c.value)}
              sx={{
                px: 1.5, py: 0.4, borderRadius: 20, cursor: 'pointer', flexShrink: 0,
                fontSize: 12, fontWeight: category === c.value ? 700 : 400,
                border: `1px solid ${category === c.value ? C.accent : C.border}`,
                backgroundColor: category === c.value ? C.chipActive : 'transparent',
                color: category === c.value ? C.accent : C.textSub,
                transition: 'all 0.15s',
              }}>
              {c.label}
            </Box>
          ))}
        </Box>
      )}

      {/* 랭킹 목록 */}
      <Box sx={{ px: { xs: 2, md: 4 }, py: 2, maxWidth: 680, mx: 'auto' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
            <CircularProgress sx={{ color: C.accent }} />
          </Box>
        ) : error ? (
          <Box sx={{ textAlign: 'center', py: 10 }}>
            <Typography fontSize={32} sx={{ mb: 2 }}>⚠️</Typography>
            <Typography fontSize={14} sx={{ color: '#FF6B6B' }}>{error}</Typography>
            <Typography fontSize={12} sx={{ color: C.textSub, mt: 0.5 }}>서버 재시작 후 다시 시도해주세요</Typography>
          </Box>
        ) : data.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 10 }}>
            <Typography fontSize={40} sx={{ mb: 2, opacity: 0.2 }}>🏆</Typography>
            <Typography fontSize={14} sx={{ color: C.textSub }}>랭킹 데이터가 없어요</Typography>
            <Typography fontSize={12} sx={{ color: C.textSub, mt: 0.5 }}>게시물에 아이템 정보를 등록하면 랭킹이 집계됩니다</Typography>
          </Box>
        ) : data.map((item, idx) => {
          const rank    = idx + 1;
          const rankColor = rank <= 3 ? RANK_COLORS[rank - 1] : C.textSub;
          const name    = getName(item);
          const sub     = getSub(item);
          const thumbs  = item.thumbnails || [];
          const priceStr = item.min_price ? `₩${Number(item.min_price).toLocaleString()}~` : null;

          return (
            <Box key={`${tab}-${idx}`}
              onClick={() => handleItemClick(item)}
              sx={{
                display: 'flex', alignItems: 'center', gap: 2,
                px: 2, py: 2, mb: 0.5, borderRadius: 3, cursor: 'pointer',
                backgroundColor: C.card,
                border: `1px solid ${rank <= 3 ? `${rankColor}30` : C.border}`,
                transition: 'all 0.15s',
                '&:hover': { backgroundColor: C.hover, transform: 'translateX(4px)' },
              }}>

              {/* 순위 */}
              <Box sx={{
                width: 36, flexShrink: 0, textAlign: 'center',
              }}>
                {rank <= 3 ? (
                  <Typography fontSize={22} lineHeight={1}>
                    {rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉'}
                  </Typography>
                ) : (
                  <Typography fontWeight={700} fontSize={16} sx={{ color: C.textSub }}>
                    {rank}
                  </Typography>
                )}
              </Box>

              {/* 이름 + 통계 */}
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.3 }}>
                  <Typography fontWeight={700} fontSize={15} noWrap sx={{ color: C.text }}>
                    {name}
                  </Typography>
                  {sub && (
                    <Typography fontSize={11} sx={{ color: C.textSub, flexShrink: 0 }}>
                      {sub}
                    </Typography>
                  )}
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Typography fontSize={12} sx={{ color: C.textSub }}>
                    게시물 {fmtNum(item.post_count)}
                  </Typography>
                  <Typography fontSize={12} sx={{ color: C.textSub }}>
                    ❤️ {fmtNum(item.total_likes)}
                  </Typography>
                  {priceStr && (
                    <Typography fontSize={12} sx={{ color: C.accent }}>
                      {priceStr}
                    </Typography>
                  )}
                </Box>
              </Box>

              {/* 썸네일 3장 */}
              <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0 }}>
                {[0, 1, 2].map(i => (
                  <Box key={i}
                    component={thumbs[i] ? 'img' : 'div'}
                    src={thumbs[i] ? `http://localhost:5000${thumbs[i]}` : undefined}
                    sx={{
                      width: 46, height: 46, borderRadius: 1.5,
                      objectFit: 'cover',
                      backgroundColor: C.thumb,
                      border: `1px solid ${C.border}`,
                    }}
                  />
                ))}
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
