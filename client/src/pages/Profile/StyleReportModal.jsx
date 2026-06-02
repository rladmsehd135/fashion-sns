import { useState, useEffect } from 'react';
import {
  Dialog, Box, Typography, IconButton, CircularProgress,
  Divider, Paper, Grid
} from '@mui/material';
import { CloseRounded, AutoAwesomeRounded, BarChartRounded, PsychologyRounded } from '@mui/icons-material';
import { getStyleReport } from '../../api/userApi';
import toast from 'react-hot-toast';

export default function StyleReportModal({ open, onClose, isDark }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  const C = {
    bg: isDark ? '#0D0D0D' : '#FFFFFF',
    border: isDark ? '#1A1A1A' : '#EBEBEB',
    text: isDark ? '#EFEFEF' : '#0A0A0A',
    textSub: isDark ? '#808080' : '#666666',
    card: isDark ? '#141414' : '#F9F9F9',
    accent: '#E8C96D'
  };

  useEffect(() => {
    if (open) {
      setLoading(true);
      getStyleReport()
        .then(res => {
          setData(res.data);
          setLoading(false);
        })
        .catch(() => {
          toast.error('리포트를 생성하지 못했습니다.');
          onClose();
        });
    }
  }, [open, onClose]);

  const fitLabels = { small: '슬림', true: '정사이즈', large: '오버사이즈' };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="sm" 
      fullWidth
      PaperProps={{ sx: { bgcolor: C.bg, backgroundImage: 'none', borderRadius: 4, border: `1px solid ${C.border}` } }}
    >
      <Box sx={{ p: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${C.border}` }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PsychologyRounded sx={{ color: C.accent }} />
          <Typography fontWeight={800} fontSize={16} sx={{ color: C.text }}>AI 스타일 분석 리포트</Typography>
        </Box>
        <IconButton onClick={onClose} size="small" sx={{ color: C.textSub }}><CloseRounded /></IconButton>
      </Box>

      <Box sx={{ p: 3 }}>
        {loading ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 8, gap: 2 }}>
            <CircularProgress size={30} sx={{ color: C.accent }} />
            <Typography variant="body2" sx={{ color: C.textSub }}>회원님의 활동 데이터를 분석 중입니다...</Typography>
          </Box>
        ) : data && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            
            {/* 페르소나 타이틀 */}
            <Box sx={{ textAlign: 'center', py: 1 }}>
              <Typography fontSize={10} fontWeight={800} letterSpacing={3} sx={{ color: C.accent, mb: 0.5 }}>
                AI STYLE ARCHETYPE
              </Typography>
              <Typography fontSize={22} fontWeight={900} sx={{ color: C.text, letterSpacing: -0.5, mb: 1 }}>
                {data.report.archetype}
              </Typography>
              <Typography fontSize={13} sx={{ color: C.textSub }}>
                {data.report.archetypeDescription}
              </Typography>
            </Box>

            {/* AI 요약 */}
            <Paper elevation={0} sx={{ p: 2, bgcolor: C.card, borderRadius: 3, border: `1px solid ${C.border}` }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                <AutoAwesomeRounded sx={{ fontSize: 18, color: C.accent }} />
                <Typography fontWeight={700} fontSize={14} sx={{ color: C.text }}>AI 가이드</Typography>
              </Box>
              <Typography fontSize={13} sx={{ color: C.text, lineHeight: 1.6, mb: 2 }}>
                {data.report.summary}
              </Typography>
              <Divider sx={{ my: 1.5, opacity: 0.5 }} />
              <Typography fontSize={13} sx={{ color: C.textSub, lineHeight: 1.6, fontStyle: 'italic' }}>
                " {data.report.advice} "
              </Typography>
            </Paper>

            {/* 스타일 통계 */}
            <Box>
              <Typography fontWeight={700} fontSize={14} sx={{ color: C.text, mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                <BarChartRounded sx={{ fontSize: 18 }} /> 선호 스타일 Top 3
              </Typography>
              <Grid container spacing={1}>
                {data.styles.map((s, i) => (
                  <Grid size={4} key={s.style}>
                    <Box sx={{ textAlign: 'center', p: 1.5, bgcolor: C.card, borderRadius: 2 }}>
                      <Typography fontSize={10} color={C.textSub} mb={0.5}>{i + 1}위</Typography>
                      <Typography fontWeight={700} fontSize={13} sx={{ color: C.accent }}>{s.style}</Typography>
                      <Typography fontSize={11} color={C.textSub}>{s.score}pts</Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Box>

            {/* 색상 분석 코멘트 */}
            <Box>
              <Typography fontWeight={700} fontSize={14} sx={{ color: C.text, mb: 1 }}>색상 매치 조언</Typography>
              <Typography fontSize={13} sx={{ color: C.textSub }}>{data.report.colorAnalysis}</Typography>
            </Box>

            {/* 핏 선호도 */}
            <Box>
              <Typography fontWeight={700} fontSize={14} sx={{ color: C.text, mb: 1.5 }}>선호하는 핏</Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                {data.fits.map((f, i) => (
                  <Box key={f.fit_review} sx={{ 
                    px: 2, py: 0.8, borderRadius: 5, 
                    border: `1px solid ${C.border}`,
                    bgcolor: i === 0 ? `${C.accent}15` : 'transparent'
                  }}>
                    <Typography fontSize={12} color={C.text}>
                      {fitLabels[f.fit_review]} ({f.cnt})
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>

            <Typography variant="caption" sx={{ color: C.textSub, textAlign: 'center', mt: 1 }}>
              마지막 업데이트: {new Date(data.updatedAt).toLocaleString()}
            </Typography>
          </Box>
        )}
      </Box>
    </Dialog>
  );
}