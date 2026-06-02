import { useState, useEffect } from 'react';
import {
  Dialog, Box, Typography, TextField,
  Avatar, IconButton, CircularProgress, Divider,
} from '@mui/material';
import { CloseRounded, CheckRounded } from '@mui/icons-material';
import { createGroup, getMutuals } from '../../api/chatApi';
import useThemeStore from '../../store/themeStore';
import toast from 'react-hot-toast';

export default function GroupCreateModal({ open, onClose, onCreated }) {
  const { mode } = useThemeStore();
  const isDark = mode === 'dark';

  const C = {
    bg:         isDark ? '#0D0D0D' : '#FFFFFF',
    border:     isDark ? '#1A1A1A' : '#EBEBEB',
    text:       isDark ? '#EFEFEF' : '#0A0A0A',
    textSub:    isDark ? '#808080' : '#888888',
    hover:      isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
    selectedBg: isDark ? 'rgba(232,201,109,0.08)' : 'rgba(232,201,109,0.1)',
    avatarBg:   isDark ? '#1A1A1A' : '#F0F0F0',
    accent:     '#E8C96D',
  };

  const [name, setName] = useState('');
  const [following, setFollowing] = useState([]);
  const [selected, setSelected] = useState([]);
  const [loadingList, setLoadingList] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName('');
    setSelected([]);
    setLoadingList(true);
    getMutuals()
      .then(res => setFollowing(res.data))
      .catch(() => toast.error('맞팔 목록을 불러오지 못했어요.'))
      .finally(() => setLoadingList(false));
  }, [open]);

  const toggle = (id) =>
    setSelected(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);

  const handleCreate = async () => {
    if (!name.trim()) return toast.error('그룹 이름을 입력해주세요.');
    if (selected.length < 1) return toast.error('멤버를 1명 이상 선택해주세요.');
    setCreating(true);
    try {
      const res = await createGroup(name.trim(), selected);
      onCreated?.(res.data);
      onClose();
    } catch {
      toast.error('그룹 생성에 실패했어요.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog
      open={open} onClose={onClose} maxWidth="xs" fullWidth
      slotProps={{
        paper: { sx: { bgcolor: C.bg, backgroundImage: 'none', borderRadius: 3, border: `1px solid ${C.border}` } }
      }}
    >
      <Box sx={{
        px: 2.5, py: 2,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: `1px solid ${C.border}`,
      }}>
        <Typography fontWeight={700} fontSize={15} sx={{ color: C.text }}>새 그룹 채팅</Typography>
        <IconButton size="small" onClick={onClose} sx={{ color: C.textSub }}>
          <CloseRounded />
        </IconButton>
      </Box>

      <Box sx={{ p: 2.5, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        <TextField
          label="그룹 이름"
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleCreate()}
          size="small"
          fullWidth
          slotProps={{ htmlInput: { maxLength: 30 } }}
          sx={{
            '& .MuiInputLabel-root': { color: C.textSub },
            '& .MuiOutlinedInput-root': {
              color: C.text,
              '& fieldset': { borderColor: C.border },
              '&:hover fieldset': { borderColor: C.accent },
              '&.Mui-focused fieldset': { borderColor: C.accent },
            },
          }}
        />

        <Box>
          <Typography fontSize={12} fontWeight={600} sx={{ color: C.textSub, mb: 1 }}>
            멤버 선택{selected.length > 0 ? ` (${selected.length}명 선택됨)` : ''}
          </Typography>

          {loadingList ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
              <CircularProgress size={22} sx={{ color: C.accent }} />
            </Box>
          ) : following.length === 0 ? (
            <Typography fontSize={13} sx={{ color: C.textSub, textAlign: 'center', py: 5 }}>
              맞팔로우한 사람이 없어요
            </Typography>
          ) : (
            <Box sx={{
              maxHeight: 260, overflowY: 'auto', mx: -1,
              '&::-webkit-scrollbar': { width: 3 },
              '&::-webkit-scrollbar-thumb': { backgroundColor: C.border, borderRadius: 4 },
            }}>
              {following.map(u => {
                const isSelected = selected.includes(u.id);
                return (
                  <Box
                    key={u.id}
                    onClick={() => toggle(u.id)}
                    sx={{
                      display: 'flex', alignItems: 'center', gap: 1.5,
                      px: 1.5, py: 1, mx: 1, borderRadius: 2, cursor: 'pointer',
                      backgroundColor: isSelected ? C.selectedBg : 'transparent',
                      transition: 'background 0.12s',
                      '&:hover': { backgroundColor: isSelected ? C.selectedBg : C.hover },
                    }}
                  >
                    <Avatar
                      src={u.profile_image ? `http://localhost:5000${u.profile_image}` : null}
                      sx={{
                        width: 38, height: 38, bgcolor: C.avatarBg,
                        color: C.accent, fontWeight: 700, fontSize: 15,
                      }}
                    >
                      {u.username?.[0]?.toUpperCase()}
                    </Avatar>
                    <Typography fontSize={14} fontWeight={isSelected ? 600 : 400}
                      sx={{ color: C.text, flex: 1 }}>
                      {u.username}
                    </Typography>
                    {isSelected && (
                      <Box sx={{
                        width: 20, height: 20, borderRadius: '50%',
                        backgroundColor: C.accent,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                      }}>
                        <CheckRounded sx={{ fontSize: 13, color: '#0A0A0A' }} />
                      </Box>
                    )}
                  </Box>
                );
              })}
            </Box>
          )}
        </Box>
      </Box>

      <Divider sx={{ borderColor: C.border }} />

      <Box sx={{ px: 2.5, py: 2 }}>
        <Box
          onClick={!creating ? handleCreate : undefined}
          sx={{
            py: 1.2, borderRadius: 2, textAlign: 'center',
            backgroundColor: C.accent, color: '#0A0A0A',
            fontWeight: 700, fontSize: 14,
            cursor: creating ? 'default' : 'pointer',
            opacity: creating ? 0.6 : 1,
            transition: 'opacity 0.15s',
            '&:hover': { opacity: creating ? 0.6 : 0.88 },
          }}
        >
          {creating
            ? '생성 중...'
            : `그룹 만들기${selected.length > 0 ? ` (${selected.length + 1}명)` : ''}`}
        </Box>
      </Box>
    </Dialog>
  );
}
