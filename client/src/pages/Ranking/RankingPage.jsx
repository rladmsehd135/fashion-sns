import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, CircularProgress } from '@mui/material';
import {
  EmojiEventsRounded, FavoriteRounded, WarningRounded,
  ArticleRounded, CheckroomRounded, StyleRounded,
  NorthRounded,
} from '@mui/icons-material';
import { getBrandRanking, getItemRanking, getStyleRanking } from '../../api/rankingApi';
import useThemeStore from '../../store/themeStore';
import { styleColors } from '../../constants/styleConstants';

const PERIODS = [
  { label: '전체',   value: 'all'   },
  { label: '이번주', value: 'week'  },
  { label: '이번달', value: 'month' },
];
const TABS = [
  { label: '브랜드', value: 'brand', icon: <ArticleRounded  sx={{ fontSize: 14 }} /> },
  { label: '아이템', value: 'item',  icon: <CheckroomRounded sx={{ fontSize: 14 }} /> },
  { label: '스타일', value: 'style', icon: <StyleRounded    sx={{ fontSize: 14 }} /> },
];
const CATS = [
  { label: '전체',    value: '' },
  { label: '상의',    value: 'top'    },
  { label: '하의',    value: 'bottom' },
  { label: '아우터',  value: 'outer'  },
  { label: '슈즈',    value: 'shoes'  },
  { label: '가방',    value: 'bag'    },
  { label: '악세서리',value: 'acc'    },
];

const RANK_GRADIENTS = [
  'linear-gradient(145deg, #FFE566 0%, #F5A623 100%)',
  'linear-gradient(145deg, #E8E8F4 0%, #9E9EB8 100%)',
  'linear-gradient(145deg, #ECA96A 0%, #9B4800 100%)',
];
const RANK_SHADOWS = [
  '0 0 0 3px rgba(255,215,0,0.18), 0 4px 20px rgba(255,215,0,0.45)',
  '0 0 0 2px rgba(180,180,210,0.2), 0 4px 16px rgba(180,180,200,0.35)',
  '0 0 0 2px rgba(180,90,30,0.18), 0 4px 16px rgba(180,90,30,0.35)',
];
const RANK_TEXT_COLORS = ['#5A3800', '#1A1A2E', '#3A1800'];
const RANK_TINTS_DARK  = ['rgba(255,215,0,0.08)', 'rgba(160,160,190,0.06)', 'rgba(180,90,30,0.07)'];
const RANK_TINTS_LIGHT = ['rgba(255,215,0,0.07)', 'rgba(160,160,190,0.05)', 'rgba(180,90,30,0.06)'];
const RANK_BORDERS_DARK  = ['rgba(232,201,109,0.35)', 'rgba(160,160,200,0.28)', 'rgba(200,120,50,0.28)'];
const RANK_BORDERS_LIGHT = ['rgba(232,201,109,0.3)',  'rgba(160,160,200,0.22)', 'rgba(200,120,50,0.22)'];

export default function RankingPage() {
  const navigate = useNavigate();
  const { mode } = useThemeStore();
  const isDark = mode === 'dark';

  const C = useMemo(() => ({
    bg:         isDark ? '#080808' : '#F8F8F6',
    card:       isDark ? '#111111' : '#FFFFFF',
    cardHover:  isDark ? '#161616' : '#FAFAFA',
    border:     isDark ? '#1A1A1A' : '#EBEBEB',
    borderSub:  isDark ? '#141414' : '#F4F4F4',
    text:       isDark ? '#EFEFEF' : '#0A0A0A',
    textSub:    isDark ? '#555555' : '#AAAAAA',
    textMid:    isDark ? '#A0A0A0' : '#666666',
    chip:       isDark ? '#181818' : '#F0F0F0',
    chipBorder: isDark ? '#242424' : '#E8E8E8',
    accent:     '#E8C96D',
    thumb:      isDark ? '#1C1C1C' : '#E8E8E8',
    divider:    isDark ? '#161616' : '#F0F0F0',
  }), [isDark]);

  const [tab,      setTab]      = useState('brand');
  const [period,   setPeriod]   = useState('all');
  const [category, setCategory] = useState('');
  const [data,     setData]     = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);

  useEffect(() => {
    setLoading(true); setData([]); setError(null);
    const req =
      tab === 'brand' ? getBrandRanking(period) :
      tab === 'item'  ? getItemRanking(period, category) :
      getStyleRanking(period);
    req
      .then(res => setData(res.data))
      .catch(err => setError(err?.response?.data?.message || '데이터를 불러오지 못했어요.'))
      .finally(() => setLoading(false));
  }, [tab, period, category]);

  const handleClick = (item) => {
    if (tab === 'brand') navigate(`/search?q=${encodeURIComponent(item.brand_name)}`);
    else if (tab === 'item') navigate(`/search?q=${encodeURIComponent(item.item_name)}`);
    else navigate(`/explore?style=${encodeURIComponent(item.style)}`);
  };

  const getName = (item) => tab === 'brand' ? item.brand_name : tab === 'item' ? item.item_name : item.style;
  const getSub  = (item) => (tab === 'item' && (item.brand_name || item.category)) ? (item.brand_name || item.category) : null;
  const fmt = (n) => { const num = Number(n) || 0; return num >= 1000 ? `${(num/1000).toFixed(1)}K` : String(num); };

  // ── 포디움 썸네일 (겹치기 효과) ──
  const StackedThumbs = ({ thumbs = [], size = 42, max = 3 }) => (
    <Box sx={{ position: 'relative', width: size + (max - 1) * 14, height: size, flexShrink: 0 }}>
      {Array.from({ length: max }).map((_, i) => (
        <Box key={i}
          component={thumbs[i] ? 'img' : 'div'}
          src={thumbs[i] ? `http://localhost:5000${thumbs[i]}` : undefined}
          sx={{
            position: 'absolute',
            left: i * 14,
            width: size, height: size,
            borderRadius: size * 0.22,
            objectFit: 'cover',
            backgroundColor: C.thumb,
            border: `2px solid ${C.card}`,
            zIndex: max - i,
            transition: 'transform 0.2s',
          }}
        />
      ))}
    </Box>
  );

  const top3 = data.slice(0, 3);
  const rest = data.slice(3);
  const maxScore = data[0] ? (Number(data[0].post_count) * 3 + Number(data[0].total_likes)) : 1;

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: C.bg, pb: 10 }}>

      {/* ── 헤더 (스티키) ── */}
      <Box sx={{
        position: 'sticky', top: 0, zIndex: 20,
        backgroundColor: isDark ? 'rgba(8,8,8,0.96)' : 'rgba(248,248,246,0.96)',
        backdropFilter: 'blur(20px)',
        borderBottom: `1px solid ${C.border}`,
      }}>
        {/* 타이틀 */}
        <Box sx={{ px: { xs: 2, md: 3 }, pt: 2.5, pb: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mb: 2 }}>
            <Box sx={{
              width: 32, height: 32, borderRadius: 2,
              background: 'linear-gradient(135deg, #FFE566, #F5A623)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 10px rgba(255,215,0,0.3)',
              flexShrink: 0,
            }}>
              <EmojiEventsRounded sx={{ fontSize: 18, color: '#5A3800' }} />
            </Box>
            <Typography sx={{
              fontFamily: '"Montserrat","Pretendard",sans-serif',
              fontWeight: 900, fontSize: 20, letterSpacing: '-0.02em',
              color: C.text,
            }}>
              인기 랭킹
            </Typography>
            {!loading && data.length > 0 && (
              <Typography sx={{ fontSize: 11, color: C.textSub, ml: 'auto', fontWeight: 600 }}>
                {data.length}개 집계
              </Typography>
            )}
          </Box>

          {/* 기간 필터 — pill */}
          <Box sx={{ display: 'flex', gap: 0.6, mb: 1.5 }}>
            {PERIODS.map(p => {
              const active = period === p.value;
              return (
                <Box key={p.value} onClick={() => setPeriod(p.value)} sx={{
                  px: 1.6, py: 0.45, borderRadius: 20, cursor: 'pointer', flexShrink: 0,
                  fontSize: 12, fontWeight: active ? 700 : 500,
                  backgroundColor: active ? C.accent : 'transparent',
                  color: active ? '#0A0A0A' : C.textSub,
                  border: `1px solid ${active ? C.accent : C.chipBorder}`,
                  transition: 'all 0.18s cubic-bezier(0.22,1,0.36,1)',
                  '&:hover': { borderColor: C.accent, color: active ? '#0A0A0A' : C.accent },
                }}>{p.label}</Box>
              );
            })}
          </Box>
        </Box>

        {/* 탭 */}
        <Box sx={{ display: 'flex', px: { xs: 2, md: 3 }, gap: 0 }}>
          {TABS.map(t => {
            const active = tab === t.value;
            return (
              <Box key={t.value} onClick={() => setTab(t.value)} sx={{
                display: 'flex', alignItems: 'center', gap: 0.6,
                px: 1.5, py: 1, cursor: 'pointer', position: 'relative',
                color: active ? C.text : C.textSub,
                fontWeight: active ? 700 : 500, fontSize: 13,
                transition: 'color 0.15s',
                '&:hover': { color: C.text },
                '&::after': active ? {
                  content: '""', position: 'absolute',
                  bottom: 0, left: 4, right: 4, height: 2,
                  background: 'linear-gradient(90deg, #F2D060, #C8991A)',
                  borderRadius: '2px 2px 0 0',
                } : {},
              }}>
                {t.icon}
                {t.label}
              </Box>
            );
          })}
        </Box>
      </Box>

      {/* 카테고리 (아이템 탭) */}
      {tab === 'item' && (
        <Box sx={{
          px: 2, py: 1.2, display: 'flex', gap: 0.6, overflowX: 'auto',
          backgroundColor: C.card, borderBottom: `1px solid ${C.border}`,
          '&::-webkit-scrollbar': { display: 'none' },
        }}>
          {CATS.map(c => {
            const active = category === c.value;
            return (
              <Box key={c.value} onClick={() => setCategory(c.value)} sx={{
                px: 1.4, py: 0.4, borderRadius: 20, cursor: 'pointer', flexShrink: 0,
                fontSize: 11.5, fontWeight: active ? 700 : 400,
                border: `1px solid ${active ? C.accent : C.chipBorder}`,
                backgroundColor: active ? (isDark ? 'rgba(232,201,109,0.12)' : 'rgba(232,201,109,0.1)') : 'transparent',
                color: active ? C.accent : C.textSub,
                transition: 'all 0.15s',
                '&:hover': { borderColor: C.accent, color: C.accent },
              }}>{c.label}</Box>
            );
          })}
        </Box>
      )}

      {/* ── 본문 ── */}
      <Box sx={{ maxWidth: 680, mx: 'auto', px: { xs: 1.5, md: 3 }, pt: 3 }}>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', pt: 12 }}>
            <CircularProgress size={28} sx={{ color: C.accent }} />
          </Box>
        ) : error ? (
          <Box sx={{ textAlign: 'center', pt: 10 }}>
            <WarningRounded sx={{ fontSize: 40, color: '#FF5757', mb: 1.5, opacity: 0.6, display: 'block', mx: 'auto' }} />
            <Typography fontSize={14} sx={{ color: '#FF5757', fontWeight: 600 }}>{error}</Typography>
            <Typography fontSize={12} sx={{ color: C.textSub, mt: 0.5 }}>서버 재시작 후 다시 시도해주세요</Typography>
          </Box>
        ) : data.length === 0 ? (
          <Box sx={{ textAlign: 'center', pt: 10 }}>
            <EmojiEventsRounded sx={{ fontSize: 48, color: isDark ? '#222' : '#D8D8D8', display: 'block', mx: 'auto', mb: 2 }} />
            <Typography fontSize={14} fontWeight={600} sx={{ color: C.textSub }}>랭킹 데이터가 없어요</Typography>
            <Typography fontSize={12} sx={{ color: isDark ? '#333' : '#CCCCCC', mt: 0.5 }}>게시물에 아이템 정보를 등록하면 집계됩니다</Typography>
          </Box>
        ) : (
          <>
            {/* ── TOP 3 포디움 ── */}
            {top3.length > 0 && (
              <Box sx={{ mb: 3.5 }}>
                {/* TOP 3 라벨 */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, px: 0.5 }}>
                  <Box sx={{ flex: 1, height: '1px', background: isDark ? 'rgba(255,215,0,0.1)' : 'rgba(232,201,109,0.2)' }} />
                  <Typography sx={{
                    fontSize: 10, fontWeight: 900, letterSpacing: '0.28em',
                    background: 'linear-gradient(90deg, #FFD700, #F5A623)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                    textTransform: 'uppercase',
                    fontFamily: '"Montserrat",sans-serif',
                  }}>
                    TOP 3
                  </Typography>
                  <Box sx={{ flex: 1, height: '1px', background: isDark ? 'rgba(255,215,0,0.1)' : 'rgba(232,201,109,0.2)' }} />
                </Box>

                {/* 1위 — 가로 풀 카드 */}
                {top3[0] && (() => {
                  const item = top3[0];
                  const name = getName(item);
                  const sub  = getSub(item);
                  const thumbs = item.thumbnails || [];
                  const styleColor = tab === 'style' ? (styleColors[item.style] || C.accent) : null;
                  return (
                    <Box onClick={() => handleClick(item)} sx={{
                      display: 'flex', alignItems: 'center', gap: 2,
                      p: 2.5, mb: 1.5, borderRadius: 4, cursor: 'pointer',
                      background: isDark
                        ? `linear-gradient(135deg, rgba(255,215,0,0.13) 0%, rgba(245,166,35,0.07) 60%, rgba(255,215,0,0.03) 100%)`
                        : `linear-gradient(135deg, rgba(255,215,0,0.16) 0%, rgba(245,166,35,0.07) 60%, rgba(255,215,0,0.03) 100%)`,
                      border: `1.5px solid rgba(232,201,109,0.42)`,
                      boxShadow: isDark
                        ? '0 2px 28px rgba(255,215,0,0.08), inset 0 1px 0 rgba(255,255,255,0.03)'
                        : '0 4px 24px rgba(232,201,109,0.12)',
                      transition: 'all 0.25s cubic-bezier(0.22,1,0.36,1)',
                      '&:hover': {
                        transform: 'translateY(-3px)',
                        boxShadow: isDark
                          ? '0 14px 48px rgba(232,201,109,0.18), inset 0 1px 0 rgba(255,255,255,0.05)'
                          : '0 12px 40px rgba(232,201,109,0.2)',
                        border: `1.5px solid rgba(232,201,109,0.65)`,
                      },
                    }}>
                      {/* 순위 뱃지 */}
                      <Box sx={{
                        width: 48, height: 48, borderRadius: '50%', flexShrink: 0,
                        background: RANK_GRADIENTS[0],
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: RANK_SHADOWS[0],
                      }}>
                        <Typography sx={{ fontFamily:'"Montserrat",sans-serif', fontWeight:900, fontSize:17, color: RANK_TEXT_COLORS[0] }}>1</Typography>
                      </Box>

                      {/* 텍스트 */}
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          {styleColor && <Box sx={{ width: 9, height: 9, borderRadius: '50%', backgroundColor: styleColor, flexShrink: 0 }} />}
                          <Typography sx={{ fontWeight: 800, fontSize: 18, color: C.text, letterSpacing: '-0.02em', lineHeight: 1.2 }} noWrap>
                            {name}
                          </Typography>
                          {sub && <Typography sx={{ fontSize: 11, color: C.textMid, flexShrink: 0, fontWeight: 500 }}>{sub}</Typography>}
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.4 }}>
                          <Typography sx={{ fontSize: 11.5, color: C.textSub }}>게시물 {fmt(item.post_count)}</Typography>
                          <Box sx={{ display:'flex', alignItems:'center', gap:0.4 }}>
                            <FavoriteRounded sx={{ fontSize:11, color:'#FF4D6D' }} />
                            <Typography sx={{ fontSize: 11.5, color: C.textSub, fontWeight: 600 }}>{fmt(item.total_likes)}</Typography>
                          </Box>
                          {item.min_price && (
                            <Typography sx={{ fontSize: 11.5, color: C.accent, fontWeight: 700 }}>
                              ₩{Number(item.min_price).toLocaleString()}~
                            </Typography>
                          )}
                        </Box>
                      </Box>

                      {/* 썸네일 */}
                      <StackedThumbs thumbs={thumbs} size={50} max={3} />
                    </Box>
                  );
                })()}

                {/* 2·3위 — 2열 */}
                {top3.slice(1).length > 0 && (
                  <Box sx={{ display: 'flex', gap: 1.2 }}>
                    {top3.slice(1).map((item, i) => {
                      const rank = i + 2;
                      const name = getName(item);
                      const sub  = getSub(item);
                      const thumbs = item.thumbnails || [];
                      const styleColor = tab === 'style' ? (styleColors[item.style] || C.accent) : null;
                      const borderColor = isDark ? RANK_BORDERS_DARK[rank - 1] : RANK_BORDERS_LIGHT[rank - 1];
                      return (
                        <Box key={rank} onClick={() => handleClick(item)} sx={{
                          flex: 1, p: 2, borderRadius: 3.5, cursor: 'pointer',
                          background: isDark ? RANK_TINTS_DARK[rank - 1] : RANK_TINTS_LIGHT[rank - 1],
                          border: `1.5px solid ${borderColor}`,
                          transition: 'all 0.22s cubic-bezier(0.22,1,0.36,1)',
                          '&:hover': {
                            transform: 'translateY(-3px)',
                            boxShadow: `0 8px 28px ${rank===2 ? 'rgba(160,160,200,0.18)' : 'rgba(180,90,30,0.18)'}`,
                            borderColor: rank===2 ? 'rgba(180,180,220,0.5)' : 'rgba(210,120,50,0.5)',
                          },
                        }}>
                          {/* 헤더: 뱃지 + 이름 */}
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.2 }}>
                            <Box sx={{
                              width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                              background: RANK_GRADIENTS[rank - 1],
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              boxShadow: RANK_SHADOWS[rank - 1],
                            }}>
                              <Typography sx={{ fontFamily:'"Montserrat",sans-serif', fontWeight:900, fontSize:12, color: RANK_TEXT_COLORS[rank-1] }}>{rank}</Typography>
                            </Box>
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Box sx={{ display:'flex', alignItems:'center', gap:0.6 }}>
                                {styleColor && <Box sx={{ width:6, height:6, borderRadius:'50%', backgroundColor:styleColor, flexShrink:0 }} />}
                                <Typography sx={{ fontWeight:800, fontSize:14, color:C.text, letterSpacing:'-0.01em' }} noWrap>{name}</Typography>
                              </Box>
                              {sub && <Typography sx={{ fontSize:10.5, color:C.textSub, fontWeight:500 }} noWrap>{sub}</Typography>}
                            </Box>
                          </Box>

                          {/* 썸네일 */}
                          <Box sx={{ display:'flex', gap:0.7, mb:1.2 }}>
                            {[0,1].map((ti) => (
                              <Box key={ti}
                                component={thumbs[ti] ? 'img' : 'div'}
                                src={thumbs[ti] ? `http://localhost:5000${thumbs[ti]}` : undefined}
                                sx={{
                                  width: 44, height: 44, borderRadius: 2,
                                  objectFit:'cover', backgroundColor:C.thumb,
                                  border:`1.5px solid ${C.border}`,
                                }}
                              />
                            ))}
                          </Box>

                          {/* 통계 */}
                          <Box sx={{ display:'flex', alignItems:'center', gap:1 }}>
                            <Typography sx={{ fontSize:10.5, color:C.textSub }}>게시물 {fmt(item.post_count)}</Typography>
                            <Box sx={{ display:'flex', alignItems:'center', gap:0.3 }}>
                              <FavoriteRounded sx={{ fontSize:10, color:'#FF4D6D' }} />
                              <Typography sx={{ fontSize:10.5, color:C.textSub, fontWeight:600 }}>{fmt(item.total_likes)}</Typography>
                            </Box>
                          </Box>
                        </Box>
                      );
                    })}
                  </Box>
                )}
              </Box>
            )}

            {/* ── 4위 이하 리스트 ── */}
            {rest.length > 0 && (
              <Box>
                {/* 순위 라벨 */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.8, px: 0.5 }}>
                  <Box sx={{ flex: 1, height: '1px', background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)' }} />
                  <Typography sx={{
                    fontSize: 10, fontWeight: 900, letterSpacing: '0.28em',
                    color: isDark ? '#3A3A3A' : '#C0C0C0',
                    textTransform: 'uppercase',
                    fontFamily: '"Montserrat",sans-serif',
                  }}>
                    순위
                  </Typography>
                  <Box sx={{ flex: 1, height: '1px', background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)' }} />
                </Box>

                <Box sx={{
                  backgroundColor: C.card,
                  border: `1px solid ${C.border}`,
                  borderRadius: 3.5, overflow: 'hidden',
                  boxShadow: isDark ? '0 2px 12px rgba(0,0,0,0.25)' : '0 2px 12px rgba(0,0,0,0.04)',
                }}>
                  {rest.map((item, i) => {
                    const rank = i + 4;
                    const name = getName(item);
                    const sub  = getSub(item);
                    const thumbs = item.thumbnails || [];
                    const score = Number(item.post_count) * 3 + Number(item.total_likes);
                    const pct = Math.round((score / maxScore) * 100);
                    const styleColor = tab === 'style' ? (styleColors[item.style] || C.accent) : null;
                    const isLast = i === rest.length - 1;

                    return (
                      <Box key={rank} onClick={() => handleClick(item)} sx={{
                        display: 'flex', alignItems: 'center', gap: 1.5,
                        px: 2, py: 1.7,
                        borderBottom: isLast ? 'none' : `1px solid ${C.divider}`,
                        cursor: 'pointer',
                        transition: 'background-color 0.18s',
                        '&:hover': { backgroundColor: C.cardHover },
                        position: 'relative', overflow: 'hidden',
                      }}>
                        {/* 배경 진행 바 — 그라디언트 */}
                        <Box sx={{
                          position: 'absolute', left: 0, top: 0, bottom: 0,
                          width: `${pct}%`,
                          background: isDark
                            ? 'linear-gradient(90deg, rgba(232,201,109,0.07) 0%, transparent 100%)'
                            : 'linear-gradient(90deg, rgba(232,201,109,0.09) 0%, transparent 100%)',
                          transition: 'width 0.9s cubic-bezier(0.22,1,0.36,1)',
                          pointerEvents: 'none',
                        }} />

                        {/* 순위 번호 */}
                        <Typography sx={{
                          fontFamily:'"Montserrat","Pretendard",sans-serif',
                          fontWeight:800, fontSize:13,
                          color: rank <= 7 ? C.textMid : C.textSub,
                          width:26, textAlign:'center', flexShrink:0, lineHeight:1,
                        }}>{rank}</Typography>

                        {/* 정보 */}
                        <Box sx={{ flex:1, minWidth:0, zIndex:1 }}>
                          <Box sx={{ display:'flex', alignItems:'center', gap:0.8, mb:0.3 }}>
                            {styleColor && <Box sx={{ width:7, height:7, borderRadius:'50%', backgroundColor:styleColor, flexShrink:0 }} />}
                            <Typography sx={{ fontWeight:700, fontSize:14, color:C.text, letterSpacing:'-0.01em' }} noWrap>{name}</Typography>
                            {sub && <Typography sx={{ fontSize:11, color:C.textSub, flexShrink:0, fontWeight:500 }} noWrap>{sub}</Typography>}
                          </Box>
                          <Box sx={{ display:'flex', alignItems:'center', gap:1 }}>
                            <Typography sx={{ fontSize:11, color:C.textSub }}>게시물 {fmt(item.post_count)}</Typography>
                            <Box sx={{ display:'flex', alignItems:'center', gap:0.35 }}>
                              <FavoriteRounded sx={{ fontSize:10, color:'#FF4D6D' }} />
                              <Typography sx={{ fontSize:11, color:C.textSub, fontWeight:600 }}>{fmt(item.total_likes)}</Typography>
                            </Box>
                            {item.min_price && (
                              <Typography sx={{ fontSize:11, color:C.accent, fontWeight:600 }}>
                                ₩{Number(item.min_price).toLocaleString()}~
                              </Typography>
                            )}
                          </Box>
                        </Box>

                        {/* 썸네일 */}
                        <Box
                          component={thumbs[0] ? 'img' : 'div'}
                          src={thumbs[0] ? `http://localhost:5000${thumbs[0]}` : undefined}
                          sx={{
                            width: 44, height: 44, borderRadius: 2,
                            objectFit: 'cover', flexShrink: 0,
                            backgroundColor: C.thumb,
                            border: `1px solid ${C.border}`,
                            zIndex: 1,
                          }}
                        />

                        {/* 이동 화살표 */}
                        <NorthRounded sx={{ fontSize:13, color:C.textSub, transform:'rotate(90deg)', opacity:0.35, flexShrink:0, zIndex:1 }} />
                      </Box>
                    );
                  })}
                </Box>
              </Box>
            )}
          </>
        )}
      </Box>
    </Box>
  );
}
