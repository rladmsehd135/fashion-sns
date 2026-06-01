import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box, Typography, Avatar, Badge, IconButton,
  CircularProgress,
} from '@mui/material';
import {
  ArrowBackRounded, SendRounded,
  ImageRounded, MoreHorizRounded,
} from '@mui/icons-material';
import { getRooms, getMessages, readMessages, getRequests, acceptRequest, rejectRequest, uploadChatImage } from '../../api/chatApi';
import useAuthStore from '../../store/authStore';
import { getSocket } from '../../hooks/useSocket';
import { timeAgo } from '../../utils/formatDate';
import toast from 'react-hot-toast';
import useNotificationStore from '../../store/notificationStore';
import useThemeStore from '../../store/themeStore';

export default function ChatPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();
  const { mode } = useThemeStore();
  const isDark = mode === 'dark';

  const C = useMemo(() => ({
    bg:         isDark ? '#080808' : '#FFFFFF',
    border:     isDark ? '#141414' : '#EBEBEB',
    border2:    isDark ? '#2A2A2A' : '#DDDDDD',
    text:       isDark ? '#EFEFEF' : '#0A0A0A',
    textMid:    isDark ? '#C0C0C0' : '#444444',
    textSub:    isDark ? '#505050' : '#AAAAAA',
    textDim:    isDark ? '#3A3A3A' : '#BBBBBB',
    bubbleBg:   isDark ? '#1A1A1A' : '#F0F0F0',
    bubbleText: isDark ? '#EFEFEF' : '#0A0A0A',
    avatarBg:   isDark ? '#1A1A1A' : '#F0F0F0',
    inputBg:    isDark ? '#111111' : '#F5F5F5',
    inputBorder:isDark ? '#1E1E1E' : '#E0E0E0',
    roomActive: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
    roomHover:  isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
    dateBg:     isDark ? '#111111' : '#EEEEEE',
    dateText:   isDark ? '#606060' : '#888888',
    scrollbar:  isDark ? '#1A1A1A' : '#DDDDDD',
    unreadBg:   '#E8C96D',
    unreadText: '#0A0A0A',
    typingDot:  isDark ? '#505050' : '#AAAAAA',
  }), [isDark]);

  const [rooms, setRooms] = useState([]);
  const [requests, setRequests] = useState([]);
  const [showRequests, setShowRequests] = useState(false);
  const [activeRoom, setActiveRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [typing, setTyping] = useState(false);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const imageRef = useRef(null);
  const isMobile = window.innerWidth < 768;
  const { setUnreadChat } = useNotificationStore();

  useEffect(() => {
    getRooms().then(res => {
      setRooms(res.data);
      const openRoomId = location.state?.openRoomId;
      if (openRoomId) {
        const target = res.data.find(r => r.id === openRoomId);
        if (target) openRoom(target);
      }
    }).catch(() => { });
    getRequests().then(res => setRequests(res.data)).catch(() => { });
  }, []);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const handler = (data) => setRequests(prev => [data, ...prev]);
    socket.on('chat:request_received', handler);
    return () => socket.off('chat:request_received', handler);
  }, []);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleMessage = (msg) => {
      setMessages(prev => {
        const filtered = prev.filter(m =>
          !(String(m.id).startsWith('temp_') && Number(m.sender_id) === Number(msg.sender_id))
        );
        if (filtered.find(m => m.id === msg.id)) return filtered;
        return [...filtered, { ...msg, is_read: false }];
      });
      setRooms(prev => prev.map(r =>
        r.id === msg.room_id
          ? { ...r, last_message: msg.message_type === 'image' ? '📷 사진' : msg.content, last_message_at: msg.created_at }
          : r
      ));
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    };

    const handleTypingStart = (data) => {
      if (data?.roomId === activeRoom?.id) setTyping(true);
    };
    const handleTypingStop = (data) => {
      if (data?.roomId === activeRoom?.id) setTyping(false);
    };
    const handleMessageRead = ({ roomId }) => {
      if (String(roomId) === String(activeRoom?.id)) {
        setMessages(prev => prev.map(m =>
          Number(m.sender_id) === Number(user?.id) ? { ...m, is_read: true } : m
        ));
      }
    };

    socket.on('chat:message', handleMessage);
    socket.on('chat:typing_start', handleTypingStart);
    socket.on('chat:typing_stop', handleTypingStop);
    socket.on('chat:message_read', handleMessageRead);

    return () => {
      socket.off('chat:message', handleMessage);
      socket.off('chat:typing_start', handleTypingStart);
      socket.off('chat:typing_stop', handleTypingStop);
      socket.off('chat:message_read', handleMessageRead);
    };
  }, [activeRoom?.id, user?.id]);

  const openRoom = async (room) => {
    setActiveRoom(room);
    setLoading(true);
    const socket = getSocket();
    socket?.emit('room:join', room.id);
    try {
      const res = await getMessages(room.id);
      setMessages(res.data);
      await readMessages(room.id);
      const wasUnread = Number(room.unread_count) || 0;
      if (wasUnread > 0) {
        setUnreadChat(prev => Math.max(0, prev - wasUnread));
      }
      setRooms(prev => prev.map(r =>
        r.id === room.id ? { ...r, unread_count: 0 } : r
      ));
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'instant' }), 50);
    } finally {
      setLoading(false);
    }
    inputRef.current?.focus();
  };

  const handleAccept = async (req) => {
    try {
      const res = await acceptRequest(req.id);
      setRequests(prev => prev.filter(r => r.id !== req.id));
      toast.success(`${req.username}님과 채팅을 시작해요!`);
      const roomsRes = await getRooms();
      setRooms(roomsRes.data);
      const newRoom = roomsRes.data.find(r => r.id === res.data.roomId);
      if (newRoom) openRoom(newRoom);
    } catch { toast.error('잠시 후 다시 시도해주세요.'); }
  };

  const handleReject = async (req) => {
    try {
      await rejectRequest(req.id);
      setRequests(prev => prev.filter(r => r.id !== req.id));
      toast('채팅 요청을 거절했어요.', {
        style: { background: '#0F0F0F', color: '#808080', border: '1px solid #2A2A2A', fontSize: '13px' }
      });
    } catch { toast.error('잠시 후 다시 시도해주세요.'); }
  };

  const sendMessage = useCallback((e) => {
    e?.preventDefault();
    const value = inputRef.current?.value?.trim();
    if (!value || !activeRoom) return;
    const socket = getSocket();
    if (!socket) return;

    const tempMsg = {
      id: `temp_${Date.now()}`,
      room_id: activeRoom.id,
      sender_id: user?.id,
      content: value,
      message_type: 'text',
      created_at: new Date().toISOString(),
      username: user?.username,
      profile_image: user?.profile_image,
      is_read: false,
    };
    setMessages(prev => [...prev, tempMsg]);
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    socket.emit('message:send', { roomId: activeRoom.id, content: value });
    if (inputRef.current) inputRef.current.value = '';
    socket.emit('typing:stop', { roomId: activeRoom.id });
  }, [activeRoom, user]);

  const handleImageSend = async (e) => {
    const file = e.target.files[0];
    if (!file || !activeRoom) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error('10MB 이하 이미지만 전송할 수 있어요.');
      return;
    }
    const socket = getSocket();
    if (!socket) return;

    const previewUrl = URL.createObjectURL(file);
    const tempId = `temp_${Date.now()}`;
    const tempMsg = {
      id: tempId, room_id: activeRoom.id, sender_id: user?.id,
      content: null, image_url: previewUrl, message_type: 'image',
      created_at: new Date().toISOString(), username: user?.username,
      profile_image: user?.profile_image, is_read: false,
    };
    setMessages(prev => [...prev, tempMsg]);
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);

    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await uploadChatImage(formData);
      socket.emit('message:send', { roomId: activeRoom.id, imageUrl: res.data.imageUrl, messageType: 'image' });
      setMessages(prev => prev.filter(m => m.id !== tempId));
    } catch {
      toast.error('이미지 전송에 실패했어요.');
      setMessages(prev => prev.filter(m => m.id !== tempId));
    }
    if (imageRef.current) imageRef.current.value = '';
  };

  const handleTyping = (e) => {
    const socket = getSocket();
    if (!activeRoom || !socket) return;
    if (e.target.value) socket.emit('typing:start', { roomId: activeRoom.id });
    else socket.emit('typing:stop', { roomId: activeRoom.id });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('ko-KR', {
      year: 'numeric', month: 'long', day: 'numeric',
    });
  };

  const showDateDivider = (msgs, idx) => {
    if (idx === 0) return true;
    return new Date(msgs[idx].created_at).toDateString() !==
      new Date(msgs[idx - 1].created_at).toDateString();
  };

  // 같은 발신자 연속 메시지 그룹의 마지막일 때만 시간 표시
  const isLastInGroup = (msgs, idx) => {
    if (idx === msgs.length - 1) return true;
    return Number(msgs[idx + 1].sender_id) !== Number(msgs[idx].sender_id);
  };

  return (
    <Box sx={{ display: 'flex', height: '100vh', backgroundColor: C.bg, overflow: 'hidden' }}>

      {/* ── 채팅방 목록 ── */}
      <Box sx={{
        width: isMobile ? (activeRoom ? 0 : '100%') : 340,
        flexShrink: 0,
        borderRight: `1px solid ${C.border}`,
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
        transition: 'width 0.2s ease',
        backgroundColor: C.bg,
      }}>
        <Box sx={{
          px: 3, py: 2.5,
          borderBottom: `1px solid ${C.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <Typography fontWeight={800} fontSize={18}
            sx={{ letterSpacing: -0.5, color: C.text }}>
            {user?.username}
          </Typography>
          {requests.length > 0 && (
            <Box onClick={() => setShowRequests(v => !v)}
              sx={{
                display: 'flex', alignItems: 'center', gap: 0.7,
                px: 1.5, py: 0.5, borderRadius: 20, cursor: 'pointer',
                backgroundColor: showRequests ? '#E8C96D' : (isDark ? '#1A1A1A' : '#F5F5F5'),
                color: showRequests ? '#0A0A0A' : '#E8C96D',
                fontSize: 12, fontWeight: 700,
                border: '1px solid #E8C96D',
                transition: 'all 0.15s',
              }}>
              💌 요청 {requests.length}
            </Box>
          )}
        </Box>

        {showRequests && requests.length > 0 && (
          <Box sx={{ borderBottom: `1px solid ${C.border}` }}>
            {requests.map(req => (
              <Box key={req.id} sx={{
                display: 'flex', alignItems: 'center', gap: 1.5,
                px: 2.5, py: 1.5,
                backgroundColor: isDark ? 'rgba(232,201,109,0.03)' : 'rgba(232,201,109,0.05)',
              }}>
                <Avatar
                  src={req.profile_image ? `http://localhost:5000${req.profile_image}` : null}
                  sx={{ width: 42, height: 42, bgcolor: C.avatarBg, color: '#E8C96D', fontWeight: 800, fontSize: 16 }}>
                  {req.username?.[0]?.toUpperCase()}
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography fontSize={13} fontWeight={600} sx={{ color: C.text }}>
                    {req.username}
                  </Typography>
                  <Typography fontSize={11} sx={{ color: C.textSub }}>채팅을 요청했어요</Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 0.8 }}>
                  <Box onClick={() => handleAccept(req)} sx={{
                    px: 1.5, py: 0.4, borderRadius: 8, cursor: 'pointer',
                    backgroundColor: '#E8C96D', color: '#0A0A0A',
                    fontSize: 12, fontWeight: 700, '&:hover': { opacity: 0.85 },
                  }}>수락</Box>
                  <Box onClick={() => handleReject(req)} sx={{
                    px: 1.5, py: 0.4, borderRadius: 8, cursor: 'pointer',
                    backgroundColor: 'transparent', color: C.textSub,
                    fontSize: 12, fontWeight: 600, border: `1px solid ${C.border2}`,
                    '&:hover': { color: '#FF6B6B', borderColor: '#FF6B6B' },
                  }}>거절</Box>
                </Box>
              </Box>
            ))}
          </Box>
        )}

        <Box sx={{
          flex: 1, overflowY: 'auto',
          '&::-webkit-scrollbar': { width: 3 },
          '&::-webkit-scrollbar-thumb': { backgroundColor: C.scrollbar, borderRadius: 4 },
        }}>
          {rooms.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 10 }}>
              <Typography sx={{ fontSize: 32, mb: 2, opacity: 0.2 }}>💬</Typography>
              <Typography fontSize={13} sx={{ color: C.textSub }}>아직 채팅이 없어요</Typography>
            </Box>
          ) : rooms.map(room => (
            <Box key={room.id} onClick={() => openRoom(room)}
              sx={{
                display: 'flex', alignItems: 'center', gap: 1.5,
                px: 2.5, py: 1.5, cursor: 'pointer',
                backgroundColor: activeRoom?.id === room.id ? C.roomActive : 'transparent',
                transition: 'background 0.15s',
                '&:hover': { backgroundColor: C.roomHover },
              }}>
              <Badge overlap="circular"
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                variant="dot"
                sx={{
                  '& .MuiBadge-dot': {
                    backgroundColor: room.partner_online ? '#4CAF50' : 'transparent',
                    width: 10, height: 10, border: `2px solid ${C.bg}`,
                  }
                }}>
                <Avatar
                  src={room.partner_image ? `http://localhost:5000${room.partner_image}` : null}
                  sx={{
                    width: 52, height: 52, bgcolor: C.avatarBg, color: '#E8C96D',
                    fontWeight: 800, fontSize: 18, border: `1.5px solid ${C.border2}`
                  }}>
                  {room.partner_username?.[0]?.toUpperCase()}
                </Avatar>
              </Badge>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.3 }}>
                  <Typography fontSize={14} fontWeight={600} sx={{ color: C.text }}>
                    {room.partner_username}
                  </Typography>
                  <Typography fontSize={11} sx={{ color: C.textDim, flexShrink: 0, ml: 1 }}>
                    {room.last_message_at ? timeAgo(room.last_message_at) : ''}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography fontSize={13} noWrap
                    sx={{
                      color: room.unread_count > 0 ? C.textMid : C.textSub,
                      fontWeight: room.unread_count > 0 ? 500 : 400,
                    }}>
                    {room.last_message || '채팅을 시작해보세요'}
                  </Typography>
                  {room.unread_count > 0 && (
                    <Box sx={{
                      minWidth: 18, height: 18, borderRadius: 9,
                      backgroundColor: C.unreadBg, color: C.unreadText,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 10, fontWeight: 800, flexShrink: 0, ml: 1, px: 0.5,
                    }}>
                      {room.unread_count > 99 ? '99+' : room.unread_count}
                    </Box>
                  )}
                </Box>
              </Box>
            </Box>
          ))}
        </Box>
      </Box>

      {/* ── 메시지 영역 ── */}
      {activeRoom ? (
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', backgroundColor: C.bg }}>

          {/* 헤더 */}
          <Box sx={{
            px: 2.5, py: 1.5,
            borderBottom: `1px solid ${C.border}`,
            display: 'flex', alignItems: 'center', gap: 1.5,
            flexShrink: 0,
          }}>
            {isMobile && (
              <IconButton size="small" onClick={() => setActiveRoom(null)}
                sx={{ color: C.textSub, mr: 0.5 }}>
                <ArrowBackRounded />
              </IconButton>
            )}
            <Avatar
              src={activeRoom.partner_image ? `http://localhost:5000${activeRoom.partner_image}` : null}
              sx={{
                width: 38, height: 38, cursor: 'pointer',
                bgcolor: C.avatarBg, color: '#E8C96D',
                fontWeight: 800, fontSize: 14, border: `1.5px solid ${C.border2}`
              }}
              onClick={() => navigate(`/profile/${activeRoom.partner_username}`)}>
              {activeRoom.partner_username?.[0]?.toUpperCase()}
            </Avatar>

            <Box sx={{ flex: 1 }}>
              <Typography fontSize={14} fontWeight={700} sx={{ color: C.text, cursor: 'pointer', '&:hover': { color: '#E8C96D' } }}
                onClick={() => navigate(`/profile/${activeRoom.partner_username}`)}>
                {activeRoom.partner_username}
              </Typography>
              <Typography fontSize={11}
                sx={{ color: activeRoom.partner_online ? '#4CAF50' : C.textSub }}>
                {activeRoom.partner_online ? '활성 상태' : activeRoom.partner_last_seen_text || '오프라인'}
              </Typography>
            </Box>
            <IconButton size="small" sx={{ color: C.textSub }}>
              <MoreHorizRounded />
            </IconButton>
          </Box>

          {/* 메시지 목록 */}
          <Box sx={{
            flex: 1, overflowY: 'auto', px: 2, py: 2,
            display: 'flex', flexDirection: 'column', gap: 0.5,
            '&::-webkit-scrollbar': { width: 3 },
            '&::-webkit-scrollbar-thumb': { backgroundColor: C.scrollbar, borderRadius: 4 },
          }}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress size={24} sx={{ color: '#E8C96D' }} />
              </Box>
            ) : messages.map((msg, idx) => {
              const isMe = Number(msg.sender_id) === Number(user?.id);
              const isImage = msg.message_type === 'image';
              const showTime = isLastInGroup(messages, idx);
              return (
                <Box key={msg.id}>
                  {showDateDivider(messages, idx) && (
                    <Box sx={{ textAlign: 'center', my: 2 }}>
                      <Typography fontSize={11}
                        sx={{
                          color: C.dateText, display: 'inline-block',
                          px: 1.5, py: 0.3, borderRadius: 10, backgroundColor: C.dateBg,
                        }}>
                        {formatDate(msg.created_at)}
                      </Typography>
                    </Box>
                  )}
                  <Box sx={{
                    display: 'flex',
                    justifyContent: isMe ? 'flex-end' : 'flex-start',
                    alignItems: 'flex-end', gap: 1, mb: 0.3,
                  }}>
                    {!isMe && (
                      <Avatar
                        src={msg.profile_image ? `http://localhost:5000${msg.profile_image}` : null}
                        sx={{
                          width: 28, height: 28, flexShrink: 0,
                          bgcolor: C.avatarBg, color: '#E8C96D',
                          fontSize: 11, fontWeight: 800, mb: 0.5,
                          // 그룹 마지막 메시지에만 아바타 표시
                          visibility: isLastInGroup(messages, idx) ? 'visible' : 'hidden',
                        }}>
                        {msg.username?.[0]?.toUpperCase()}
                      </Avatar>
                    )}
                    <Box sx={{
                      display: 'flex', flexDirection: 'column',
                      alignItems: isMe ? 'flex-end' : 'flex-start',
                      maxWidth: '70%',
                    }}>
                      {isImage ? (
                        <Box
                          component="img"
                          src={msg.image_url?.startsWith('blob:')
                            ? msg.image_url
                            : `http://localhost:5000${msg.image_url}`}
                          sx={{
                            maxWidth: 260, maxHeight: 300,
                            borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                            display: 'block', cursor: 'pointer', objectFit: 'cover',
                            '&:hover': { opacity: 0.9 },
                          }}
                          onClick={() => window.open(
                            msg.image_url?.startsWith('blob:')
                              ? msg.image_url
                              : `http://localhost:5000${msg.image_url}`, '_blank'
                          )}
                        />
                      ) : (
                        <Box sx={{
                          px: 1.8, py: 1.1,
                          borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                          backgroundColor: isMe ? '#E8C96D' : C.bubbleBg,
                          color: isMe ? '#0A0A0A' : C.bubbleText,
                          fontSize: 14, lineHeight: 1.5, wordBreak: 'break-word',
                        }}>
                          {msg.content}
                        </Box>
                      )}

                      {/* 시간 + 읽음 — 그룹 마지막 메시지만 */}
                      {showTime && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.3, px: 0.5 }}>
                          {isMe && !msg.is_read && (
                            <Typography fontSize={10} sx={{ color: '#E8C96D', fontWeight: 700 }}>
                              1
                            </Typography>
                          )}
                          <Typography fontSize={10} sx={{ color: C.textDim }}>
                            {timeAgo(msg.created_at)}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </Box>
                </Box>
              );
            })}

            {typing && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1 }}>
                <Box sx={{
                  px: 1.8, py: 1.1, borderRadius: '18px 18px 18px 4px',
                  backgroundColor: C.bubbleBg, display: 'flex', gap: 0.4,
                }}>
                  {[0, 1, 2].map(i => (
                    <Box key={i} sx={{
                      width: 6, height: 6, borderRadius: '50%',
                      backgroundColor: C.typingDot,
                      animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
                      '@keyframes pulse': {
                        '0%,80%,100%': { opacity: 0.3 },
                        '40%': { opacity: 1 },
                      },
                    }} />
                  ))}
                </Box>
              </Box>
            )}
            <Box ref={bottomRef} />
          </Box>

          {/* 입력창 */}
          <Box sx={{
            px: 2, py: 1.5,
            borderTop: `1px solid ${C.border}`,
            display: 'flex', alignItems: 'center', gap: 1,
            flexShrink: 0,
          }}>
            <input
              ref={imageRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleImageSend}
            />
            <IconButton size="small"
              onClick={() => imageRef.current?.click()}
              sx={{ color: C.textSub, '&:hover': { color: '#E8C96D' } }}>
              <ImageRounded sx={{ fontSize: 22 }} />
            </IconButton>
            <Box sx={{
              flex: 1, backgroundColor: C.inputBg,
              border: `1px solid ${C.inputBorder}`, borderRadius: 30,
              px: 2, py: 0.8, display: 'flex', alignItems: 'center',
              transition: 'border-color 0.15s',
              '&:focus-within': { borderColor: isDark ? '#2A2A2A' : '#CCCCCC' },
            }}>
              <input
                ref={inputRef}
                placeholder="메시지 입력..."
                onChange={handleTyping}
                onKeyDown={handleKeyDown}
                style={{
                  flex: 1, background: 'transparent', border: 'none',
                  outline: 'none', color: isDark ? '#EFEFEF' : '#0A0A0A',
                  fontSize: '14px', fontFamily: 'inherit',
                }}
              />
            </Box>
            <IconButton onClick={sendMessage}
              sx={{ color: '#E8C96D', '&:hover': { backgroundColor: 'rgba(232,201,109,0.1)' } }}>
              <SendRounded sx={{ fontSize: 22 }} />
            </IconButton>
          </Box>
        </Box>

      ) : (
        <Box sx={{
          flex: 1, display: { xs: 'none', md: 'flex' },
          alignItems: 'center', justifyContent: 'center',
          flexDirection: 'column', gap: 2, backgroundColor: C.bg,
        }}>
          <Typography sx={{ fontSize: 48, opacity: 0.1 }}>💬</Typography>
          <Typography fontSize={14} sx={{ color: C.textSub }}>
            채팅방을 선택해주세요
          </Typography>
        </Box>
      )}
    </Box>
  );
}
