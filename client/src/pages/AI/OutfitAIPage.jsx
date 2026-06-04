import { useState } from 'react';
import { Box, Typography, TextField, Select, MenuItem, FormControl, InputLabel, CircularProgress, Chip } from '@mui/material';
import { AutoAwesomeRounded, CheckroomRounded, ArrowForwardRounded, ShoppingBagRounded, DiamondRounded, StyleRounded, LayersRounded, DirectionsWalkRounded } from '@mui/icons-material';
import useThemeStore from '../../store/themeStore';
import axiosInstance from '../../api/axiosInstance';
import toast from 'react-hot-toast';

const CATEGORIES = [
  { value: 'top',    label: '상의' },
  { value: 'bottom', label: '하의' },
  { value: 'outer',  label: '아우터' },
  { value: 'shoes',  label: '신발' },
  { value: 'bag',    label: '가방' },
  { value: 'acc',    label: '액세서리' },
];

const CATEGORY_ICON_MAP = {
  top:    (sz) => <CheckroomRounded    sx={{ fontSize: sz, color: '#E8C96D' }} />,
  bottom: (sz) => <StyleRounded        sx={{ fontSize: sz, color: '#A78BFA' }} />,
  outer:  (sz) => <LayersRounded       sx={{ fontSize: sz, color: '#60A5FA' }} />,
  shoes:  (sz) => <DirectionsWalkRounded sx={{ fontSize: sz, color: '#34D399' }} />,
  bag:    (sz) => <ShoppingBagRounded  sx={{ fontSize: sz, color: '#F472B6' }} />,
  acc:    (sz) => <DiamondRounded      sx={{ fontSize: sz, color: '#FBBF24' }} />,
};
const getCategoryIcon = (cat, sz = 20) =>
  CATEGORY_ICON_MAP[cat]?.(sz) ?? <CheckroomRounded sx={{ fontSize: sz, color: '#808080' }} />;
const SEASON_COLORS  = { '봄':'#F9A8D4', '여름':'#6EE7B7', '가을':'#FCD34D', '겨울':'#93C5FD' };

export default function OutfitAIPage() {
  const { mode } = useThemeStore();
  const isDark   = mode === 'dark';

  const [form,    setForm]    = useState({ name: '', brand: '', category: 'top' });
  const [loading, setLoading] = useState(false);
  const [result,  setResult]  = useState(null);

  const C = {
    bg:     isDark ? '#0A0A0A' : '#FAFAFA',
    card:   isDark ? '#111111' : '#FFFFFF',
    border: isDark ? '#1E1E1E' : '#EBEBEB',
    text:   isDark ? '#F0F0F0' : '#0A0A0A',
    sub:    isDark ? '#505050' : '#AAAAAA',
    input:  isDark ? '#1A1A1A' : '#F5F5F5',
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) return toast.error('아이템명을 입력해주세요.');
    setLoading(true);
    setResult(null);
    try {
      const res = await axiosInstance.post('/ai/outfit', form);
      setResult(res.data);
    } catch { toast.error('AI 요청에 실패했어요. 잠시 후 다시 시도해주세요.'); }
    finally { setLoading(false); }
  };

  return (
    <Box sx={{ maxWidth: 620, mx: 'auto', px: 2, py: 3, minHeight: '100%' }}>
      {/* 헤더 */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
        <Box sx={{
          width: 40, height: 40, borderRadius: 2,
          background: 'linear-gradient(135deg, #E8C96D, #D4AF37)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <AutoAwesomeRounded sx={{ fontSize: 20, color: '#0A0A0A' }} />
        </Box>
        <Box>
          <Typography fontWeight={800} fontSize={18} sx={{ color: C.text, lineHeight: 1.1 }}>AI 코디 완성</Typography>
          <Typography fontSize={12} sx={{ color: C.sub }}>아이템 1개로 완성된 코디를 AI가 추천해드려요</Typography>
        </Box>
      </Box>

      {/* 입력 폼 */}
      <Box sx={{ backgroundColor: C.card, border: `1px solid ${C.border}`, borderRadius: 3, p: 2.5, mb: 2.5 }}>
        <Typography fontSize={13} fontWeight={700} sx={{ color: C.text, mb: 2 }}>가진 아이템 입력</Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              label="아이템명 *" size="small" value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              placeholder="예: 카고 팬츠, 후드집업"
              sx={{ flex: 2, '& .MuiInputBase-root': { backgroundColor: C.input } }} />
            <TextField
              label="브랜드 (선택)" size="small" value={form.brand}
              onChange={e => setForm(p => ({ ...p, brand: e.target.value }))}
              placeholder="예: Nike, Zara"
              sx={{ flex: 1, '& .MuiInputBase-root': { backgroundColor: C.input } }} />
          </Box>
          <FormControl size="small" fullWidth>
            <InputLabel>카테고리</InputLabel>
            <Select value={form.category} label="카테고리"
              onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
              sx={{ backgroundColor: C.input }}>
              {CATEGORIES.map(c => (
                <MenuItem key={c.value} value={c.value}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {getCategoryIcon(c.value, 16)}
                    <span>{c.label}</span>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
        <Box
          onClick={handleSubmit}
          sx={{
            mt: 2, py: 1.2, borderRadius: 2, textAlign: 'center', cursor: 'pointer',
            background: loading ? (isDark ? '#1A1A1A' : '#EBEBEB') : 'linear-gradient(135deg, #E8C96D, #D4AF37)',
            transition: 'all 0.2s',
            '&:hover': { opacity: loading ? 1 : 0.9 },
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.8,
          }}
        >
          {loading
            ? <CircularProgress size={16} sx={{ color: isDark ? '#606060' : '#999' }} />
            : <AutoAwesomeRounded sx={{ fontSize: 16, color: '#0A0A0A' }} />
          }
          <Typography fontSize={13} fontWeight={700} sx={{ color: loading ? C.sub : '#0A0A0A' }}>
            {loading ? 'AI가 코디 중...' : '코디 추천받기'}
          </Typography>
        </Box>
      </Box>

      {/* AI 결과 */}
      {result && (
        <Box sx={{ animation: 'fadeIn 0.4s ease', '@keyframes fadeIn': { from: { opacity: 0, transform: 'translateY(12px)' }, to: { opacity: 1, transform: 'translateY(0)' } } }}>
          {/* 컨셉 */}
          <Box sx={{ backgroundColor: C.card, border: `1px solid ${C.border}`, borderRadius: 3, p: 2.5, mb: 1.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <CheckroomRounded sx={{ fontSize: 16, color: '#E8C96D' }} />
              <Typography fontSize={11} fontWeight={800} letterSpacing={1.5} sx={{ color: '#E8C96D', textTransform: 'uppercase' }}>
                AI 코디 컨셉
              </Typography>
            </Box>
            <Typography fontSize={18} fontWeight={800} sx={{ color: C.text, mb: 0.5 }}>{result.concept}</Typography>
            <Typography fontSize={13} sx={{ color: C.sub, lineHeight: 1.6 }}>{result.reason}</Typography>
            <Box sx={{ display: 'flex', gap: 0.8, mt: 1.5, flexWrap: 'wrap' }}>
              {result.colorPalette?.map(color => (
                <Chip key={color} label={color} size="small"
                  sx={{ fontSize: 11, height: 22, backgroundColor: isDark ? '#1A1A1A' : '#F0F0F0', color: C.sub, border: `1px solid ${C.border}` }} />
              ))}
              {result.season && (
                <Chip label={`${result.season} 추천`} size="small"
                  sx={{ fontSize: 11, height: 22, backgroundColor: `${SEASON_COLORS[result.season]}22`, color: SEASON_COLORS[result.season], border: `1px solid ${SEASON_COLORS[result.season]}44` }} />
              )}
            </Box>
          </Box>

          {/* 기준 아이템 */}
          <Box sx={{ backgroundColor: 'rgba(232,201,109,0.06)', border: `1.5px solid rgba(232,201,109,0.3)`, borderRadius: 3, p: 2, mb: 1 }}>
            <Typography fontSize={10} fontWeight={800} letterSpacing={1.5} sx={{ color: '#E8C96D', mb: 0.5 }}>MY ITEM</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {getCategoryIcon(form.category, 22)}
              <Box>
                {form.brand && <Typography fontSize={10} fontWeight={700} sx={{ color: '#E8C96D', textTransform: 'uppercase', letterSpacing: 1 }}>{form.brand}</Typography>}
                <Typography fontSize={14} fontWeight={700} sx={{ color: C.text }}>{form.name}</Typography>
              </Box>
            </Box>
          </Box>

          {/* 추천 아이템 목록 */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {result.items?.map((item, i) => (
              <Box key={i} sx={{
                backgroundColor: C.card, border: `1px solid ${C.border}`,
                borderRadius: 3, p: 2,
                display: 'flex', alignItems: 'flex-start', gap: 1.5,
              }}>
                <Box sx={{
                  width: 38, height: 38, borderRadius: 2, flexShrink: 0,
                  backgroundColor: isDark ? '#1A1A1A' : '#F5F5F5',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 20,
                }}>
                  {getCategoryIcon(item.category, 22)}
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mb: 0.3 }}>
                    <Typography fontSize={10} fontWeight={700} sx={{ color: C.sub, textTransform: 'uppercase', letterSpacing: 1 }}>
                      {item.categoryKr}
                    </Typography>
                    {item.brandSuggestion && (
                      <Typography fontSize={10} sx={{ color: '#E8C96D' }}>• {item.brandSuggestion}</Typography>
                    )}
                  </Box>
                  <Typography fontSize={14} fontWeight={700} sx={{ color: C.text, mb: 0.3 }}>{item.recommendation}</Typography>
                  {item.tip && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
                      <ArrowForwardRounded sx={{ fontSize: 11, color: '#E8C96D' }} />
                      <Typography fontSize={11} sx={{ color: C.sub }}>{item.tip}</Typography>
                    </Box>
                  )}
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );
}
