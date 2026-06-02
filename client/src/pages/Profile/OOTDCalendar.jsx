import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, IconButton } from '@mui/material';
import { ChevronLeftRounded, ChevronRightRounded } from '@mui/icons-material';

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

export default function OOTDCalendar({ posts = [], isDark }) {
  const navigate = useNavigate();
  const today = new Date();
  const [current, setCurrent] = useState(new Date(today.getFullYear(), today.getMonth(), 1));

  const year  = current.getFullYear();
  const month = current.getMonth();

  const prevMonth = () => setCurrent(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrent(new Date(year, month + 1, 1));
  const isCurrentMonth = year === today.getFullYear() && month === today.getMonth();

  // 날짜별 포스트 그룹핑
  const postsByDay = useMemo(() => {
    const map = {};
    posts.forEach(p => {
      const d = new Date(p.created_at);
      if (d.getFullYear() !== year || d.getMonth() !== month) return;
      const key = d.getDate();
      if (!map[key]) map[key] = [];
      map[key].push(p);
    });
    return map;
  }, [posts, year, month]);

  // 월 통계
  const monthPostCount = Object.values(postsByDay).flat().length;
  const postedDays     = Object.keys(postsByDay).length;

  // 캘린더 그리드 셀 목록
  const firstDow    = new Date(year, month, 1).getDay();   // 0=일
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const C = {
    bg:      isDark ? '#0A0A0A' : '#FFFFFF',
    text:    isDark ? '#EFEFEF' : '#0A0A0A',
    sub:     isDark ? '#505050' : '#AAAAAA',
    border:  isDark ? '#1A1A1A' : '#F0F0F0',
    empty:   isDark ? '#111111' : '#F8F8F8',
    accent:  '#E8C96D',
  };

  return (
    <Box sx={{ px: 2, pb: 4 }}>

      {/* 월 네비게이션 */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 2 }}>
        <IconButton onClick={prevMonth} size="small" sx={{ color: C.sub }}>
          <ChevronLeftRounded />
        </IconButton>
        <Box sx={{ textAlign: 'center' }}>
          <Typography fontWeight={700} fontSize={16} sx={{ color: C.text }}>
            {year}년 {month + 1}월
          </Typography>
          {monthPostCount > 0 && (
            <Typography fontSize={11} sx={{ color: C.sub, mt: 0.2 }}>
              {postedDays}일 · {monthPostCount}개 OOTD
            </Typography>
          )}
        </Box>
        <IconButton
          onClick={nextMonth}
          disabled={isCurrentMonth}
          size="small"
          sx={{ color: isCurrentMonth ? 'transparent' : C.sub }}>
          <ChevronRightRounded />
        </IconButton>
      </Box>

      {/* 요일 헤더 */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', mb: 0.5 }}>
        {DAY_LABELS.map((d, i) => (
          <Typography key={d} fontSize={11} fontWeight={600} textAlign="center"
            sx={{ color: i === 0 ? '#FF6B6B' : i === 6 ? '#6B9FFF' : C.sub, py: 0.5 }}>
            {d}
          </Typography>
        ))}
      </Box>

      {/* 날짜 그리드 */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '3px' }}>
        {cells.map((day, idx) => {
          if (!day) return <Box key={`empty-${idx}`} />;

          const dayPosts  = postsByDay[day] || [];
          const hasPost   = dayPosts.length > 0;
          const firstPost = dayPosts[0];
          const extra     = dayPosts.length - 1;
          const isToday   = isCurrentMonth && day === today.getDate();
          const dow       = (firstDow + day - 1) % 7;

          return (
            <Box
              key={day}
              onClick={() => hasPost && navigate(`/post/${firstPost.id}`)}
              sx={{
                position: 'relative',
                aspectRatio: '1/1',
                borderRadius: 1.5,
                overflow: 'hidden',
                cursor: hasPost ? 'pointer' : 'default',
                backgroundColor: hasPost ? 'transparent' : C.empty,
                border: isToday
                  ? `2px solid ${C.accent}`
                  : `1px solid ${C.border}`,
                transition: 'transform 0.12s',
                '&:hover': hasPost ? { transform: 'scale(0.96)' } : {},
              }}>

              {/* 썸네일 */}
              {hasPost && firstPost.thumbnail && (
                <Box
                  component="img"
                  src={`http://localhost:5000${firstPost.thumbnail}`}
                  sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
              )}

              {/* 날짜 숫자 */}
              <Box sx={{
                position: 'absolute',
                bottom: 2, left: 0, right: 0,
                display: 'flex', justifyContent: 'center',
              }}>
                <Typography
                  fontSize={9}
                  fontWeight={isToday ? 800 : 500}
                  sx={{
                    color: hasPost
                      ? 'rgba(255,255,255,0.9)'
                      : (dow === 0 ? '#FF6B6B' : dow === 6 ? '#6B9FFF' : C.sub),
                    textShadow: hasPost ? '0 1px 3px rgba(0,0,0,0.8)' : 'none',
                    lineHeight: 1,
                  }}>
                  {day}
                </Typography>
              </Box>

              {/* 오늘 강조 점 */}
              {isToday && !hasPost && (
                <Box sx={{
                  position: 'absolute', top: 4, right: 4,
                  width: 4, height: 4, borderRadius: '50%',
                  backgroundColor: C.accent,
                }} />
              )}

              {/* 복수 게시물 배지 */}
              {extra > 0 && (
                <Box sx={{
                  position: 'absolute', top: 3, right: 3,
                  backgroundColor: 'rgba(0,0,0,0.65)',
                  borderRadius: 8, px: 0.6, py: 0.1,
                }}>
                  <Typography fontSize={8} fontWeight={700} sx={{ color: '#fff', lineHeight: 1.4 }}>
                    +{extra}
                  </Typography>
                </Box>
              )}
            </Box>
          );
        })}
      </Box>

      {/* 빈 달 안내 */}
      {monthPostCount === 0 && (
        <Box sx={{ textAlign: 'center', pt: 6 }}>
          <Typography fontSize={32} mb={1}>📅</Typography>
          <Typography fontSize={13} sx={{ color: C.sub }}>이 달엔 올린 코디가 없어요</Typography>
        </Box>
      )}
    </Box>
  );
}
