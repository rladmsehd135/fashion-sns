import { useState, useEffect } from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { TrendingUpRounded } from '@mui/icons-material';
import axiosInstance from '../../api/axiosInstance';
import { styleColors } from '../../constants/styleConstants';

const MONTH_KR = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'];

export default function StyleTimeline({ username, isDark }) {
  const navigate  = useNavigate();
  const [data,    setData]    = useState([]);
  const [loading, setLoading] = useState(true);

  const C = {
    card:   isDark ? '#111' : '#fff',
    border: isDark ? '#1E1E1E' : '#EBEBEB',
    text:   isDark ? '#F0F0F0' : '#0A0A0A',
    sub:    isDark ? '#505050' : '#AAAAAA',
    bg:     isDark ? '#0A0A0A' : '#FAFAFA',
  };

  useEffect(() => {
    axiosInstance.get(`/ai/style-timeline/${username}`)
      .then(res => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [username]);

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', pt: 8 }}>
      <CircularProgress size={24} sx={{ color: '#E8C96D' }} />
    </Box>
  );

  if (!data.length) return (
    <Box sx={{ textAlign: 'center', pt: 12 }}>
      <TrendingUpRounded sx={{ fontSize: 48, color: C.sub, mb: 2 }} />
      <Typography fontWeight={700} sx={{ color: C.text, mb: 0.5 }}>아직 기록이 없어요</Typography>
      <Typography fontSize={13} sx={{ color: C.sub }}>게시물을 올리면 스타일 변화를 추적할 수 있어요</Typography>
    </Box>
  );

  // 연도-월 레이블용
  const formatMonth = (monthStr) => {
    const [year, month] = monthStr.split('-');
    return { year, monthKr: MONTH_KR[parseInt(month) - 1] };
  };

  // 전체 스타일 분포 계산
  const styleTotal = {};
  data.forEach(m => m.styles.forEach(s => {
    styleTotal[s.style] = (styleTotal[s.style] || 0) + s.count;
  }));
  const topStyles = Object.entries(styleTotal).sort((a, b) => b[1] - a[1]).slice(0, 3);

  return (
    <Box sx={{ px: { xs: 1, md: 2 }, py: 2 }}>
      {/* 요약 카드 */}
      <Box sx={{
        backgroundColor: C.card, border: `1px solid ${C.border}`,
        borderRadius: 3, p: 2, mb: 2.5,
        display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap',
      }}>
        <TrendingUpRounded sx={{ fontSize: 20, color: '#E8C96D' }} />
        <Box sx={{ flex: 1 }}>
          <Typography fontSize={12} sx={{ color: C.sub }}>최근 {data.length}개월 스타일 분석</Typography>
          <Box sx={{ display: 'flex', gap: 0.8, mt: 0.5, flexWrap: 'wrap' }}>
            {topStyles.map(([style, count]) => (
              <Box key={style} sx={{
                display: 'flex', alignItems: 'center', gap: 0.5,
                px: 1, py: 0.3, borderRadius: 10,
                backgroundColor: `${styleColors[style] || '#808080'}18`,
                border: `1px solid ${styleColors[style] || '#808080'}40`,
              }}>
                <Box sx={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: styleColors[style] || '#808080' }} />
                <Typography fontSize={11} fontWeight={700} sx={{ color: styleColors[style] || C.sub }}>{style}</Typography>
                <Typography fontSize={10} sx={{ color: C.sub }}>{count}개</Typography>
              </Box>
            ))}
          </Box>
        </Box>
        <Typography fontSize={24} fontWeight={800} sx={{ color: C.text }}>
          {data.reduce((s, m) => s + m.totalCount, 0)}
          <Typography component="span" fontSize={12} sx={{ color: C.sub, ml: 0.5 }}>개 OOTD</Typography>
        </Typography>
      </Box>

      {/* 타임라인 */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {data.map((month, idx) => {
          const { year, monthKr } = formatMonth(month.month);
          const isFirst = idx === 0;
          const isLast  = idx === data.length - 1;
          const domColor = styleColors[month.dominantStyle] || '#808080';

          return (
            <Box key={month.month} sx={{ display: 'flex', gap: 2 }}>
              {/* 타임라인 라인 */}
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 40, flexShrink: 0 }}>
                <Box sx={{ width: 2, flex: isFirst ? '0 0 16px' : 1, backgroundColor: C.border }} />
                <Box sx={{
                  width: 12, height: 12, borderRadius: '50%', flexShrink: 0,
                  backgroundColor: domColor,
                  boxShadow: `0 0 0 3px ${isDark ? '#0A0A0A' : '#FAFAFA'}, 0 0 0 5px ${domColor}40`,
                }} />
                <Box sx={{ width: 2, flex: isLast ? '0 0 16px' : 1, backgroundColor: C.border }} />
              </Box>

              {/* 카드 */}
              <Box sx={{ flex: 1, py: 1.5, pb: 2.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5, mb: 1 }}>
                  <Typography fontSize={16} fontWeight={800} sx={{ color: C.text }}>{monthKr}</Typography>
                  <Typography fontSize={11} sx={{ color: C.sub }}>{year}</Typography>
                  <Typography fontSize={11} sx={{ color: C.sub, ml: 0.5 }}>· {month.totalCount}개</Typography>
                  {month.dominantStyle && (
                    <Box sx={{
                      ml: 'auto', px: 1, py: 0.2, borderRadius: 10,
                      backgroundColor: `${domColor}18`, border: `1px solid ${domColor}40`,
                    }}>
                      <Typography fontSize={10} fontWeight={700} sx={{ color: domColor }}>{month.dominantStyle}</Typography>
                    </Box>
                  )}
                </Box>

                {/* 스타일 바 */}
                <Box sx={{ display: 'flex', height: 4, borderRadius: 2, overflow: 'hidden', mb: 1.5, backgroundColor: isDark ? '#1A1A1A' : '#F0F0F0' }}>
                  {month.styles.map(s => (
                    <Box key={s.style} sx={{
                      flex: s.count / month.totalCount,
                      backgroundColor: styleColors[s.style] || '#808080',
                      transition: 'flex 0.3s',
                    }} />
                  ))}
                </Box>

                {/* 썸네일 */}
                {month.thumbnail && (
                  <Box
                    component="img"
                    src={`http://localhost:5000${month.thumbnail}`}
                    onClick={() => navigate(`/explore?style=${month.dominantStyle || ''}`)}
                    sx={{
                      width: 72, height: 72, objectFit: 'cover', borderRadius: 2,
                      cursor: 'pointer', border: `2px solid ${C.border}`,
                      '&:hover': { borderColor: domColor, transform: 'scale(1.04)' },
                      transition: 'all 0.15s',
                    }}
                  />
                )}
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
