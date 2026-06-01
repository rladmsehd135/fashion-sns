import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Avatar, Badge, Typography, IconButton, CircularProgress } from '@mui/material';
import { OpenInFullRounded, CloseRounded, EditRounded } from '@mui/icons-material';
import { getRooms } from '../../api/chatApi';
import useNotificationStore from '../../store/notificationStore';
import useThemeStore from '../../store/themeStore';
import { timeAgo } from '../../utils/formatDate';

export default function MiniChat() {
  const navigate = useNavigate();
  const { unreadChat } = useNotificationStore();
  const { mode } = useThemeStore();
  const isDark = mode === 'dark';

  const [open, setOpen] = useState(false);
  const [rooms, setRooms] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef(null);

  const C = useMemo(() => ({
    bg:       isDark ? '#0D0D0D' : '#FFFFFF',
    border:   isDark ? '#1E1E1E' : '#E8E8E8',
    border2:  isDark ? '#2A2A2A' : '#DDDDDD',
    text:     isDark ? '#EFEFEF' : '#0A0A0A',
    textSub:  isDark ? '#505050' : '#AAAAAA',
    textMid:  isDark ? '#C0C0C0' : '#444444',
    hover:    isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
    pillBg:   isDark ? '#141414' : '#FFFFFF',
    avatarBg: isDark ? '#1A1A1A' : '#F0F0F0',
    scrollbar: isDark ? '#2A2A2A' : '#DDDDDD',
    shadow:   isDark ? '0 8px 32px rgba(0,0,0,0.6)' : '0 8px 32px rgba(0,0,0,0.12)',
    pillShadow: isDark ? '0 4px 16px rgba(0,0,0,0.5)' : '0 2px 12px rgba(0,0,0,0.12)',
  }), [isDark]);

  useEffect(() => {
    if (!open || loaded) return;
    setLoading(true);
    getRooms()
      .then(res => { setRooms(res.data || []); setLoaded(true); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [open, loaded]);

  // 외부 클릭 시 닫기
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const recentAvatars = rooms.slice(0, 3);

  return (
    <Box ref={containerRef}
      sx={{ position: 'fixed', bottom: 24, right: 24, zIndex: 250 }}>

      {/* ── 팝업 패널 ── */}
      {open && (
        <Box sx={{
          position: 'absolute', bottom: 60, right: 0,
          width: 320,
          backgroundColor: C.bg,
          borderRadius: '16px',
          border: `1px solid ${C.border}`,
          boxShadow: C.shadow,
          overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
          maxHeight: 480,
          animation: 'fadeUp 0.18s ease',
          '@keyframes fadeUp': {
            from: { opacity: 0, transform: 'translateY(8px)' },
            to:   { opacity: 1, transform: 'translateY(0)' },
          },
        }}>

          {/* 헤더 */}
          <Box sx={{
            display: 'flex', alignItems: 'center',
            px: 2.5, py: 1.5,
            borderBottom: `1px solid ${C.border}`,
            flexShrink: 0,
          }}>
            <Typography fontWeight={800} fontSize={16} sx={{ color: C.text, flex: 1 }}>
              메시지
              {unreadChat > 0 && (
                <Box component="span" sx={{
                  ml: 1, px: 0.8, py: 0.2, borderRadius: 10,
                  backgroundColor: '#FF3B30', color: '#fff',
                  fontSize: 11, fontWeight: 700,
                  display: 'inline-block', lineHeight: 1.6, verticalAlign: 'middle',
                }}>
                  {unreadChat > 99 ? '99+' : unreadChat}
                </Box>
              )}
            </Typography>
            <IconButton size="small"
              onClick={() => { setOpen(false); navigate('/chat'); }}
              sx={{ color: C.textSub, '&:hover': { color: C.text } }}>
              <OpenInFullRounded sx={{ fontSize: 16 }} />
            </IconButton>
            <IconButton size="small"
              onClick={() => setOpen(false)}
              sx={{ color: C.textSub, '&:hover': { color: C.text } }}>
              <CloseRounded sx={{ fontSize: 18 }} />
            </IconButton>
          </Box>

          {/* 방 목록 */}
          <Box sx={{
            flex: 1, overflowY: 'auto',
            '&::-webkit-scrollbar': { width: 3 },
            '&::-webkit-scrollbar-thumb': { backgroundColor: C.scrollbar, borderRadius: 4 },
          }}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
                <CircularProgress size={22} sx={{ color: '#E8C96D' }} />
              </Box>
            ) : rooms.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 6 }}>
                <Typography sx={{ fontSize: 28, mb: 1, opacity: 0.2 }}>💬</Typography>
                <Typography fontSize={13} sx={{ color: C.textSub }}>아직 채팅이 없어요</Typography>
              </Box>
            ) : rooms.map(room => (
              <Box key={room.id}
                onClick={() => { setOpen(false); navigate('/chat', { state: { openRoomId: room.id } }); }}
                sx={{
                  display: 'flex', alignItems: 'center', gap: 1.5,
                  px: 2, py: 1.2, cursor: 'pointer',
                  transition: 'background 0.1s',
                  '&:hover': { backgroundColor: C.hover },
                }}>
                <Box sx={{ position: 'relative', flexShrink: 0 }}>
                  <Avatar
                    src={room.partner_image ? `http://localhost:5000${room.partner_image}` : null}
                    sx={{
                      width: 44, height: 44,
                      bgcolor: C.avatarBg, color: '#E8C96D',
                      fontWeight: 800, fontSize: 16,
                    }}>
                    {room.partner_username?.[0]?.toUpperCase()}
                  </Avatar>
                  {room.partner_online && (
                    <Box sx={{
                      position: 'absolute', bottom: 1, right: 1,
                      width: 10, height: 10, borderRadius: '50%',
                      backgroundColor: '#4CAF50', border: `2px solid ${C.bg}`,
                    }} />
                  )}
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.2 }}>
                    <Typography fontSize={13} fontWeight={600} sx={{ color: C.text }}>
                      {room.partner_username}
                    </Typography>
                    <Typography fontSize={11} sx={{ color: C.textSub, flexShrink: 0, ml: 1 }}>
                      {room.last_message_at ? timeAgo(room.last_message_at) : ''}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography fontSize={12} noWrap
                      sx={{ color: room.unread_count > 0 ? C.textMid : C.textSub, flex: 1 }}>
                      {room.last_message || '채팅을 시작해보세요'}
                    </Typography>
                    {room.unread_count > 0 && (
                      <Box sx={{
                        minWidth: 16, height: 16, borderRadius: 8,
                        backgroundColor: '#FF3B30', color: '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 9, fontWeight: 800, flexShrink: 0, ml: 1, px: 0.4,
                      }}>
                        {room.unread_count > 99 ? '99+' : room.unread_count}
                      </Box>
                    )}
                  </Box>
                </Box>
              </Box>
            ))}
          </Box>

          {/* 새 채팅 버튼 */}
          <Box sx={{
            px: 2, py: 1,
            borderTop: `1px solid ${C.border}`,
            display: 'flex', justifyContent: 'flex-end',
            flexShrink: 0,
          }}>
            <IconButton size="small"
              onClick={() => { setOpen(false); navigate('/chat'); }}
              sx={{
                color: C.textSub,
                backgroundColor: isDark ? '#1A1A1A' : '#F5F5F5',
                '&:hover': { color: '#E8C96D', backgroundColor: isDark ? '#222' : '#EEEEEE' },
              }}>
              <EditRounded sx={{ fontSize: 16 }} />
            </IconButton>
          </Box>
        </Box>
      )}

      {/* ── 플로팅 pill 버튼 ── */}
      <Box
        onClick={() => setOpen(v => !v)}
        sx={{
          display: 'flex', alignItems: 'center', gap: 1.2,
          px: 1.8, py: 0.9,
          backgroundColor: C.pillBg,
          border: `1.5px solid ${C.border}`,
          borderRadius: 30,
          cursor: 'pointer',
          boxShadow: C.pillShadow,
          transition: 'all 0.2s ease',
          userSelect: 'none',
          '&:hover': {
            boxShadow: isDark ? '0 6px 20px rgba(0,0,0,0.6)' : '0 4px 16px rgba(0,0,0,0.16)',
            transform: 'translateY(-2px)',
          },
          '&:active': { transform: 'translateY(0)' },
        }}>

        <Badge badgeContent={unreadChat || 0} color="error"
          sx={{ '& .MuiBadge-badge': { fontSize: 9, minWidth: 16, height: 16 } }}>
          <Typography fontSize={15} sx={{ lineHeight: 1 }}>💬</Typography>
        </Badge>

        <Typography fontSize={13} fontWeight={700} sx={{ color: C.text }}>
          메시지
        </Typography>

        {/* 최근 대화 아바타 */}
        {recentAvatars.length > 0 && (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {recentAvatars.map((room, i) => (
              <Avatar key={room.id}
                src={room.partner_image ? `http://localhost:5000${room.partner_image}` : null}
                sx={{
                  width: 22, height: 22,
                  bgcolor: C.avatarBg, color: '#E8C96D',
                  fontSize: 9, fontWeight: 800,
                  border: `2px solid ${C.pillBg}`,
                  ml: i > 0 ? -0.7 : 0,
                }}>
                {room.partner_username?.[0]?.toUpperCase()}
              </Avatar>
            ))}
            {rooms.length > 3 && (
              <Box sx={{
                width: 22, height: 22, borderRadius: '50%',
                backgroundColor: isDark ? '#2A2A2A' : '#E8E8E8',
                border: `2px solid ${C.pillBg}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                ml: -0.7, fontSize: 8, color: C.textSub, fontWeight: 700,
              }}>
                ···
              </Box>
            )}
          </Box>
        )}
      </Box>
    </Box>
  );
}
