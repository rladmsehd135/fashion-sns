import { useState, useEffect, useMemo } from 'react';
import { Dialog, Box, Typography, IconButton, CircularProgress, Avatar } from '@mui/material';
import { CloseRounded, FavoriteRounded, PsychologyRounded } from '@mui/icons-material';
import useAuthStore from '../../store/authStore';

export default function StyleMatchModal({ open, onClose, targetUser, isDark }) {
  const { user: me } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [score, setScore] = useState(0);

  const C = {
    bg: isDark ? '#0D0D0D' : '#FFFFFF',
    text: isDark ? '#EFEFEF' : '#0A0A0A',
    accent: '#E8C96D'
  };

  useEffect(() => {
    if (open && targetUser) {
      setLoading(true);
      // 실제로는 서버에서 AI 분석 결과를 가져오지만, 여기선 간단한 로직으로 시뮬레이션합니다.
      setTimeout(() => {
        let matchScore = 50;
        if (me.preferred_style === targetUser.preferred_style) matchScore += 30;
        if (Math.abs(me.height - targetUser.height) < 5) matchScore += 10;
        setScore(Math.min(matchScore + Math.floor(Math.random() * 10), 99));
        setLoading(false);
      }, 1500);
    }
  }, [open, targetUser, me]);

  // 점수와 스타일에 따른 동적 멘트 생성
  const advice = useMemo(() => {
    if (!me || !targetUser || score === 0) return '';
    const myStyle = me.preferred_style;
    const targetStyle = targetUser.preferred_style;

    if (score >= 90) {
      return `심장이 멎을 듯한 패션 소울메이트 발견! 두 분의 #${myStyle} 감성은 거의 한 몸 수준입니다. 당장 팔로우하고 서로의 코디를 공유하세요. 지갑이 위험해질 정도의 완벽한 케미입니다!`;
    } 
    if (score >= 75) {
      return `안정적인 패션 파트너네요! #${myStyle} 스타일을 기반으로 한 두 분의 조합은 어디서나 시선을 사로잡을 거예요. 서로의 피드를 참고하면 스타일 지수가 200% 상승할 것으로 보입니다.`;
    }
    if (score >= 55) {
      if (myStyle === targetStyle) {
        return `두 분 모두 #${myStyle} 스타일을 선호하시는군요! 공통된 취향 덕분에 서로의 피드가 아주 좋은 패션 참고서가 될 것 같습니다. 조금만 더 소통하면 완벽한 메이트가 될 수 있어요.`;
      }
      return `흥미로운 조합이네요! #${myStyle}과 #${targetStyle}은 서로 다르지만 묘하게 어울리는 구석이 있습니다. 두 분의 감성을 믹스매치해본다면 세상에 없던 새로운 룩이 탄생할지도 몰라요!`;
    }
    if (myStyle === targetStyle) {
      return `취향은 #${myStyle}로 같지만 아직은 알아갈 단계입니다! 서로의 OOTD에 '좋아요'를 누르며 패션 공감대를 넓혀보는 건 어떨까요?`;
    }
    return `서로 다른 극과 극의 매력! #${myStyle}인 당신과 #${targetStyle}인 상대방이 만나면 서로에게 없는 감성을 완벽하게 보완해줄 수 있는 '반전 케미'가 기대됩니다.`;
  }, [score, me, targetUser]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth
      PaperProps={{ sx: { bgcolor: C.bg, borderRadius: 4, backgroundImage: 'none' } }}>
      <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end' }}>
        <IconButton onClick={onClose} size="small"><CloseRounded /></IconButton>
      </Box>

      <Box sx={{ px: 4, pb: 6, textAlign: 'center' }}>
        <Typography fontWeight={800} fontSize={18} mb={4} sx={{ color: C.text }}>
          패션 스타일 궁합 분석
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3, mb: 4 }}>
          <Avatar src={`http://localhost:5000${me.profile_image}`} sx={{ width: 64, height: 64, border: `2px solid ${C.accent}` }} />
          <FavoriteRounded sx={{ color: '#FF4D6D', fontSize: 32, animation: 'pulse 1.5s infinite' }} />
          <Avatar src={`http://localhost:5000${targetUser.profile_image}`} sx={{ width: 64, height: 64, border: `2px solid ${C.accent}` }} />
        </Box>

        {loading ? (
          <Box sx={{ py: 2 }}>
            <CircularProgress size={24} sx={{ color: C.accent, mb: 2 }} />
            <Typography variant="body2" color="text.secondary">AI가 두 분의 스타일 DNA를 분석 중...</Typography>
          </Box>
        ) : (
          <Box>
            <Typography fontSize={42} fontWeight={900} sx={{ color: C.accent, lineHeight: 1 }}>
              {score}%
            </Typography>
            <Typography fontWeight={700} sx={{ color: C.text, mt: 1, mb: 3 }}>
              {score > 80 ? '찰떡궁합 패션 메이트!' : score > 50 ? '비슷한 취향을 가졌네요' : '서로의 스타일이 보완될 수 있어요'}
            </Typography>
            <Box sx={{ 
              p: 2, 
              bgcolor: isDark ? '#151515' : '#F8F8F8', 
              borderRadius: 2, 
              textAlign: 'left' 
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <PsychologyRounded sx={{ fontSize: 16, color: C.accent }} />
                <Typography fontSize={12} fontWeight={700} sx={{ color: C.text }}>AI 가이드</Typography>
              </Box>
              <Typography fontSize={12} sx={{ color: isDark ? '#AAA' : '#666', lineHeight: 1.6 }}>
                {advice}
              </Typography>
            </Box>
          </Box>
        )}
      </Box>
      <style>
        {`@keyframes pulse { 0% { transform: scale(1); } 50% { transform: scale(1.2); } 100% { transform: scale(1); } }`}
      </style>
    </Dialog>
  );
}