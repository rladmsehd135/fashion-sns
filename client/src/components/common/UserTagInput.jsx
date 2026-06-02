import { useState, useRef, useEffect } from 'react';
import { Box, Avatar, Typography, IconButton, InputBase } from '@mui/material';
import { CloseRounded, PersonAddRounded } from '@mui/icons-material';
import { searchUsers } from '../../api/userApi';
import useThemeStore from '../../store/themeStore';

// tagged: [{ id, username, profile_image }]
// onChange: (tagged) => void
export default function UserTagInput({ tagged = [], onChange }) {
  const { mode } = useThemeStore();
  const isDark = mode === 'dark';

  const [query,       setQuery]       = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [open,        setOpen]        = useState(false);
  const debounce = useRef(null);

  useEffect(() => {
    if (!query.trim()) { setSuggestions([]); setOpen(false); return; }
    clearTimeout(debounce.current);
    debounce.current = setTimeout(async () => {
      try {
        const res = await searchUsers(query.trim());
        const users = (res.data?.users || []).filter(u => !tagged.find(t => t.id === u.id));
        setSuggestions(users.slice(0, 6));
        setOpen(users.length > 0);
      } catch { setSuggestions([]); setOpen(false); }
    }, 280);
  }, [query, tagged]);

  const add = (u) => {
    onChange([...tagged, { id: u.id, username: u.username, profile_image: u.profile_image }]);
    setQuery('');
    setSuggestions([]);
    setOpen(false);
  };

  const remove = (id) => onChange(tagged.filter(t => t.id !== id));

  const C = {
    border:  isDark ? '#2A2A2A' : '#E0E0E0',
    bg:      isDark ? '#111111' : '#FFFFFF',
    bgDrop:  isDark ? '#161616' : '#FAFAFA',
    text:    isDark ? '#EFEFEF' : '#0A0A0A',
    sub:     isDark ? '#606060' : '#AAAAAA',
    hover:   isDark ? '#1E1E1E' : '#F5F5F5',
    chip:    isDark ? '#1A1A1A' : '#F0F0F0',
    accent:  '#E8C96D',
  };

  return (
    <Box>
      {/* 레이블 */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6, mb: 1 }}>
        <PersonAddRounded sx={{ fontSize: 16, color: C.accent }} />
        <Typography fontSize={13} fontWeight={600} sx={{ color: C.text }}>사람 태그</Typography>
      </Box>

      {/* 태그된 유저 칩 */}
      {tagged.length > 0 && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8, mb: 1 }}>
          {tagged.map(u => (
            <Box key={u.id} sx={{
              display: 'flex', alignItems: 'center', gap: 0.6,
              px: 1, py: 0.4, borderRadius: 20,
              backgroundColor: C.chip,
              border: `1px solid ${C.border}`,
            }}>
              <Avatar src={u.profile_image ? `http://localhost:5000${u.profile_image}` : null}
                sx={{ width: 20, height: 20, fontSize: 9, bgcolor: C.accent, color: '#0A0A0A' }}>
                {u.username?.[0]?.toUpperCase()}
              </Avatar>
              <Typography fontSize={12} fontWeight={600} sx={{ color: C.text }}>
                @{u.username}
              </Typography>
              <IconButton size="small" onClick={() => remove(u.id)}
                sx={{ p: 0.1, color: C.sub, '&:hover': { color: '#FF6B6B' } }}>
                <CloseRounded sx={{ fontSize: 13 }} />
              </IconButton>
            </Box>
          ))}
        </Box>
      )}

      {/* 검색 입력 */}
      <Box sx={{ position: 'relative' }}>
        <Box sx={{
          display: 'flex', alignItems: 'center',
          border: `1px solid ${C.border}`, borderRadius: 2,
          px: 1.5, py: 0.6, backgroundColor: C.bg,
        }}>
          <Typography fontSize={14} sx={{ color: C.sub, mr: 0.5 }}>@</Typography>
          <InputBase
            placeholder="유저 이름 검색..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            onFocus={() => suggestions.length > 0 && setOpen(true)}
            sx={{ flex: 1, fontSize: 14, color: C.text,
              '& input::placeholder': { color: C.sub } }}
          />
        </Box>

        {/* 드롭다운 */}
        {open && (
          <Box sx={{
            position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
            mt: 0.5, borderRadius: 2, overflow: 'hidden',
            backgroundColor: C.bgDrop,
            border: `1px solid ${C.border}`,
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          }}>
            {suggestions.map(u => (
              <Box key={u.id}
                onMouseDown={() => add(u)}
                sx={{
                  display: 'flex', alignItems: 'center', gap: 1.2,
                  px: 1.5, py: 1, cursor: 'pointer',
                  transition: 'background 0.1s',
                  '&:hover': { backgroundColor: C.hover },
                }}>
                <Avatar src={u.profile_image ? `http://localhost:5000${u.profile_image}` : null}
                  sx={{ width: 32, height: 32, fontSize: 12, bgcolor: C.accent, color: '#0A0A0A' }}>
                  {u.username?.[0]?.toUpperCase()}
                </Avatar>
                <Box>
                  <Typography fontSize={13} fontWeight={600} sx={{ color: C.text }}>
                    {u.username}
                  </Typography>
                  {u.bio && (
                    <Typography fontSize={11} sx={{ color: C.sub }} noWrap>
                      {u.bio}
                    </Typography>
                  )}
                </Box>
              </Box>
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
}
