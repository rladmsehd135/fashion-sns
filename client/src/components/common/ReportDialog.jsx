import { useState } from 'react';
import { Box, Typography, Dialog, DialogContent, IconButton, TextField } from '@mui/material';
import { CloseRounded, FlagRounded } from '@mui/icons-material';
import toast from 'react-hot-toast';
import useThemeStore from '../../store/themeStore';

const REASONS = [
  '스팸',
  '욕설 / 혐오 발언',
  '불법 콘텐츠',
  '사기 / 사칭',
  '저작권 침해',
  '기타 (직접 입력)',
];

/**
 * 게시물 신고 다이얼로그
 * @param {boolean}  open
 * @param {Function} onClose
 * @param {Function} onSubmit  - async (reason: string) => void
 */
export default function ReportDialog({ open, onClose, onSubmit }) {
  const { mode }  = useThemeStore();
  const isDark    = mode === 'dark';
  const [selected, setSelected] = useState('');
  const [custom,   setCustom]   = useState('');
  const [loading,  setLoading]  = useState(false);

  const isCustom   = selected === '기타 (직접 입력)';
  const finalReason = isCustom ? custom.trim() : selected;
  const canSubmit  = selected && (!isCustom || custom.trim().length > 0);

  const handleClose = () => {
    setSelected('');
    setCustom('');
    onClose();
  };

  const handleSubmit = async () => {
    if (!canSubmit || loading) return;
    setLoading(true);
    try {
      await onSubmit(finalReason);
      toast.success('신고가 접수됐어요. 검토 후 조치하겠습니다.', { icon: '🚩' });
      handleClose();
    } catch (err) {
      if (err?.response?.status === 409) {
        toast.error('이미 신고한 게시물이에요.');
        handleClose();
      } else {
        toast.error('신고 접수에 실패했어요. 다시 시도해주세요.');
      }
    } finally {
      setLoading(false);
    }
  };

  const C = {
    bg:      isDark ? '#111111' : '#FFFFFF',
    border:  isDark ? '#222222' : '#EBEBEB',
    text:    isDark ? '#EFEFEF' : '#0A0A0A',
    sub:     isDark ? '#606060' : '#888888',
    chip:    isDark ? '#1A1A1A' : '#F5F5F5',
    chipBd:  isDark ? '#2A2A2A' : '#E0E0E0',
    selBg:   isDark ? 'rgba(255,77,109,0.12)' : 'rgba(255,77,109,0.08)',
    selBd:   '#FF4D6D',
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: C.bg,
          border: `1px solid ${C.border}`,
          borderRadius: 3,
          boxShadow: isDark ? '0 16px 48px rgba(0,0,0,0.7)' : '0 16px 48px rgba(0,0,0,0.15)',
        }
      }}
    >
      <DialogContent sx={{ p: 0 }}>
        {/* 헤더 */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2.5, pt: 2, pb: 1.5, borderBottom: `1px solid ${C.border}` }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FlagRounded sx={{ fontSize: 18, color: '#FF4D6D' }} />
            <Typography fontWeight={800} fontSize={15} sx={{ color: C.text }}>신고하기</Typography>
          </Box>
          <IconButton size="small" onClick={handleClose} sx={{ color: C.sub }}>
            <CloseRounded sx={{ fontSize: 18 }} />
          </IconButton>
        </Box>

        {/* 안내 문구 */}
        <Box sx={{ px: 2.5, pt: 2, pb: 1.5 }}>
          <Typography fontSize={12} sx={{ color: C.sub, lineHeight: 1.6 }}>
            신고 사유를 선택해주세요. 허위 신고 시 불이익이 있을 수 있습니다.
          </Typography>
        </Box>

        {/* 사유 목록 */}
        <Box sx={{ px: 2.5, pb: 1, display: 'flex', flexDirection: 'column', gap: 0.8 }}>
          {REASONS.map(r => {
            const active = selected === r;
            return (
              <Box
                key={r}
                onClick={() => setSelected(r)}
                sx={{
                  px: 2, py: 1.2,
                  borderRadius: 2,
                  cursor: 'pointer',
                  border: `1.5px solid ${active ? C.selBd : C.chipBd}`,
                  backgroundColor: active ? C.selBg : C.chip,
                  transition: 'all 0.15s',
                  display: 'flex', alignItems: 'center', gap: 1,
                  '&:hover': {
                    borderColor: active ? C.selBd : (isDark ? '#404040' : '#C0C0C0'),
                  },
                }}
              >
                {/* 라디오 인디케이터 */}
                <Box sx={{
                  width: 16, height: 16, borderRadius: '50%', flexShrink: 0,
                  border: `2px solid ${active ? '#FF4D6D' : C.chipBd}`,
                  backgroundColor: active ? '#FF4D6D' : 'transparent',
                  transition: 'all 0.15s',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {active && <Box sx={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#fff' }} />}
                </Box>
                <Typography fontSize={13} fontWeight={active ? 700 : 500} sx={{ color: active ? (isDark ? '#FF7D95' : '#E03355') : C.text }}>
                  {r}
                </Typography>
              </Box>
            );
          })}
        </Box>

        {/* 직접 입력 */}
        {isCustom && (
          <Box sx={{ px: 2.5, pb: 1.5 }}>
            <TextField
              autoFocus
              multiline
              rows={2}
              fullWidth
              placeholder="신고 내용을 직접 입력해주세요"
              value={custom}
              onChange={e => setCustom(e.target.value)}
              inputProps={{ maxLength: 200 }}
              size="small"
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: isDark ? '#1A1A1A' : '#F8F8F8',
                  borderRadius: 2,
                  fontSize: 13,
                  '& fieldset': { borderColor: C.chipBd },
                  '&:hover fieldset': { borderColor: '#FF4D6D' },
                  '&.Mui-focused fieldset': { borderColor: '#FF4D6D' },
                },
                '& .MuiInputBase-input': { color: C.text },
              }}
            />
            <Typography fontSize={11} sx={{ color: C.sub, mt: 0.5, textAlign: 'right' }}>
              {custom.length}/200
            </Typography>
          </Box>
        )}

        {/* 버튼 */}
        <Box sx={{ display: 'flex', gap: 1, px: 2.5, pb: 2.5, pt: isCustom ? 0 : 1 }}>
          <Box
            onClick={handleClose}
            sx={{
              flex: 1, py: 1.2, borderRadius: 2, textAlign: 'center', cursor: 'pointer',
              border: `1px solid ${C.chipBd}`, transition: 'all 0.15s',
              '&:hover': { backgroundColor: isDark ? '#1A1A1A' : '#F5F5F5' },
            }}
          >
            <Typography fontSize={13} fontWeight={600} sx={{ color: C.sub }}>취소</Typography>
          </Box>
          <Box
            onClick={handleSubmit}
            sx={{
              flex: 2, py: 1.2, borderRadius: 2, textAlign: 'center',
              cursor: canSubmit && !loading ? 'pointer' : 'not-allowed',
              backgroundColor: canSubmit && !loading ? '#FF4D6D' : (isDark ? '#1A1A1A' : '#EBEBEB'),
              transition: 'all 0.15s',
              '&:hover': canSubmit && !loading ? { backgroundColor: '#E03355' } : {},
            }}
          >
            <Typography fontSize={13} fontWeight={700} sx={{ color: canSubmit && !loading ? '#fff' : C.sub }}>
              {loading ? '접수 중...' : '신고 접수'}
            </Typography>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
