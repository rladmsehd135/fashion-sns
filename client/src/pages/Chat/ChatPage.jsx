import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box, Typography, Avatar, Badge, IconButton,
  CircularProgress,
} from '@mui/material';
import {
  ArrowBackRounded, SendRounded,
  ImageRounded, MoreHorizRounded,
} from '@mui/icons-material';
import { getRooms, getMessages, readMessages, getRequests, acceptRequest, rejectRequest } from '../../api/chatApi';
import useAuthStore from '../../store/authStore';
import { getSocket } from '../../hooks/useSocket';
import { timeAgo } from '../../utils/formatDate';
import toast from 'react-hot-toast';

export default function ChatPage() {
  const navigate               = useNavigate();
  const location               = useLocation();
  const { user }               = useAuthStore();
  const [rooms, setRooms]           = useState([]);
  const [requests, setRequests]     = useState([]);
  const [showRequests, setShowRequests] = useState(false);
  const [activeRoom, setActiveRoom] = useState(null);
  const [messages, setMessages]     = useState([]);
  const [input, setInput]           = useState('');
  const [typing, setTyping]         = useState(false);
  const [loading, setLoading]       = useState(false);
  const bottomRef                  = useRef(null);
  const inputRef                   = useRef(null);
  const isMobile                   = window.innerWidth < 768;

  // 채팅방 목록 + 요청 목록
  useEffect(() => {
    getRooms().then(res => {
      setRooms(res.data);
      const openRoomId = location.state?.openRoomId;
      if (openRoomId) {
        const target = res.data.find(r => r.id === openRoomId);
        if (target) openRoom(target);
      }
    }).catch(() => {});
    getRequests().then(res => setRequests(res.data)).catch(() => {});
  }, []);

  // 소켓: 실시간 채팅 요청 수신
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const handleNewRequest = (data) => {
      setRequests(prev => [data, ...prev]);
    };
    socket.on('chat:request_received', handleNewRequest);
    return () => socket.off('chat:request_received', handleNewRequest);
  }, []);

  const handleAccept = async (req) => {
    try {
      const res = await acceptRequest(req.id);
      setRequests(prev => prev.filter(r => r.id !== req.id));
      toast.success(`${req.username}님과 채팅을 시작해요!`);
      // 수락 후 새 방 목록 다시 불러와 자동 오픈
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
      toast('채팅 요청을 거절했어요.', { style: { background:'#0F0F0F', color:'#808080', border:'1px solid #2A2A2A', fontSize:'13px' } });
    } catch { toast.error('잠시 후 다시 시도해주세요.'); }
  };

  // 소켓 이벤트
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleMessage = (msg) => {
      setMessages(prev => [...prev, msg]);
      setRooms(prev => prev.map(r =>
        r.id === msg.room_id
          ? { ...r, last_message: msg.content, last_message_at: msg.created_at }
          : r
      ));
      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior:'smooth' });
      }, 50);
    };

    const handleTypingStart = (data) => {
      if (data.roomId === activeRoom?.id) setTyping(true);
    };
    const handleTypingStop = (data) => {
      if (data.roomId === activeRoom?.id) setTyping(false);
    };

    socket.on('chat:message',    handleMessage);
    socket.on('chat:typing_start', handleTypingStart);
    socket.on('chat:typing_stop',  handleTypingStop);

    return () => {
      socket.off('chat:message',    handleMessage);
      socket.off('chat:typing_start', handleTypingStart);
      socket.off('chat:typing_stop',  handleTypingStop);
    };
  }, [activeRoom?.id]);

  // 방 열기
  const openRoom = async (room) => {
    setActiveRoom(room);
    setLoading(true);
    const socket = getSocket();
    socket?.emit('room:join', room.id);
    try {
      const res = await getMessages(room.id);
      setMessages(res.data);
      await readMessages(room.id);
      setRooms(prev => prev.map(r => r.id === room.id ? { ...r, unread_count: 0 } : r));
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior:'instant' }), 50);
    } finally {
      setLoading(false);
    }
    inputRef.current?.focus();
  };

  // 메시지 전송
  const sendMessage = useCallback((e) => {
    e?.preventDefault();
    const value = inputRef.current?.value?.trim();
    if (!value || !activeRoom) return;
    const socket = getSocket();
    if (!socket) return;
    socket.emit('message:send', { roomId: activeRoom.id, content: value });
    if (inputRef.current) inputRef.current.value = '';
    socket.emit('typing:stop', { roomId: activeRoom.id });
  }, [activeRoom]);

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

  // 날짜 구분선
  const formatDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('ko-KR', {
      year:'numeric', month:'long', day:'numeric',
    });
  };

  const showDateDivider = (msgs, idx) => {
    if (idx === 0) return true;
    const cur  = new Date(msgs[idx].created_at).toDateString();
    const prev = new Date(msgs[idx-1].created_at).toDateString();
    return cur !== prev;
  };

  return (
    <Box sx={{
      display:'flex',
      height:'100vh',
      backgroundColor:'#080808',
    }}>
      {/* ── 채팅방 목록 ── */}
      <Box sx={{
        width: isMobile ? (activeRoom ? 0 : '100%') : 340,
        flexShrink:0,
        borderRight:'1px solid #141414',
        display:'flex', flexDirection:'column',
        overflow:'hidden',
        transition:'width 0.2s ease',
      }}>
        {/* 헤더 */}
        <Box sx={{
          px:3, py:2.5,
          borderBottom:'1px solid #141414',
          display:'flex', alignItems:'center', justifyContent:'space-between',
        }}>
          <Typography fontWeight={800} fontSize={18} sx={{ letterSpacing:-0.5 }}>
            {user?.username}
          </Typography>
          {requests.length > 0 && (
            <Box
              onClick={() => setShowRequests(v => !v)}
              sx={{
                display:'flex', alignItems:'center', gap:0.7,
                px:1.5, py:0.5, borderRadius:20, cursor:'pointer',
                backgroundColor: showRequests ? '#E8C96D' : '#1A1A1A',
                color: showRequests ? '#0A0A0A' : '#E8C96D',
                fontSize:12, fontWeight:700,
                border:'1px solid #E8C96D',
                transition:'all 0.15s',
              }}>
              💌 요청 {requests.length}
            </Box>
          )}
        </Box>

        {/* 채팅 요청 목록 */}
        {showRequests && requests.length > 0 && (
          <Box sx={{ borderBottom:'1px solid #141414' }}>
            {requests.map(req => (
              <Box key={req.id} sx={{
                display:'flex', alignItems:'center', gap:1.5,
                px:2.5, py:1.5,
                backgroundColor:'rgba(232,201,109,0.03)',
              }}>
                <Avatar
                  src={req.profile_image ? `http://localhost:5000${req.profile_image}` : null}
                  sx={{ width:42, height:42, bgcolor:'#1A1A1A', color:'#E8C96D', fontWeight:800, fontSize:16 }}>
                  {req.username?.[0]?.toUpperCase()}
                </Avatar>
                <Box sx={{ flex:1, minWidth:0 }}>
                  <Typography fontSize={13} fontWeight={600} sx={{ color:'#EFEFEF' }}>
                    {req.username}
                  </Typography>
                  <Typography fontSize={11} sx={{ color:'#505050' }}>채팅을 요청했어요</Typography>
                </Box>
                <Box sx={{ display:'flex', gap:0.8 }}>
                  <Box onClick={() => handleAccept(req)} sx={{
                    px:1.5, py:0.4, borderRadius:8, cursor:'pointer',
                    backgroundColor:'#E8C96D', color:'#0A0A0A',
                    fontSize:12, fontWeight:700,
                    '&:hover':{ opacity:0.85 },
                  }}>수락</Box>
                  <Box onClick={() => handleReject(req)} sx={{
                    px:1.5, py:0.4, borderRadius:8, cursor:'pointer',
                    backgroundColor:'transparent', color:'#606060',
                    fontSize:12, fontWeight:600,
                    border:'1px solid #2A2A2A',
                    '&:hover':{ color:'#FF6B6B', borderColor:'#FF6B6B' },
                  }}>거절</Box>
                </Box>
              </Box>
            ))}
          </Box>
        )}

        {/* 목록 */}
        <Box sx={{
          flex:1, overflowY:'auto',
          '&::-webkit-scrollbar':{ width:3 },
          '&::-webkit-scrollbar-thumb':{ backgroundColor:'#1A1A1A', borderRadius:4 },
        }}>
          {rooms.length === 0 ? (
            <Box sx={{ textAlign:'center', py:10 }}>
              <Typography sx={{ fontSize:32, mb:2, opacity:0.2 }}>💬</Typography>
              <Typography fontSize={13} color="text.secondary">
                아직 채팅이 없어요
              </Typography>
            </Box>
          ) : rooms.map(room => (
            <Box key={room.id}
              onClick={() => openRoom(room)}
              sx={{
                display:'flex', alignItems:'center', gap:1.5,
                px:2.5, py:1.5, cursor:'pointer',
                backgroundColor: activeRoom?.id === room.id
                  ? 'rgba(255,255,255,0.05)' : 'transparent',
                transition:'background 0.15s',
                '&:hover':{ backgroundColor:'rgba(255,255,255,0.03)' },
              }}>
              <Badge
                overlap="circular"
                anchorOrigin={{ vertical:'bottom', horizontal:'right' }}
                variant="dot"
                sx={{
                  '& .MuiBadge-dot':{
                    backgroundColor: room.partner_online ? '#4CAF50' : 'transparent',
                    width:10, height:10,
                    border:'2px solid #080808',
                  },
                }}>
                <Avatar
                  src={room.partner_image ? `http://localhost:5000${room.partner_image}` : null}
                  sx={{
                    width:52, height:52,
                    bgcolor:'#1A1A1A', color:'#E8C96D',
                    fontWeight:800, fontSize:18,
                    border:'1.5px solid #2A2A2A',
                  }}>
                  {room.partner_username?.[0]?.toUpperCase()}
                </Avatar>
              </Badge>
              <Box sx={{ flex:1, minWidth:0 }}>
                <Box sx={{ display:'flex', justifyContent:'space-between', mb:0.3 }}>
                  <Typography fontSize={14} fontWeight={600} sx={{ color:'#EFEFEF' }}>
                    {room.partner_username}
                  </Typography>
                  <Typography fontSize={11} sx={{ color:'#3A3A3A', flexShrink:0, ml:1 }}>
                    {room.last_message_at ? timeAgo(room.last_message_at) : ''}
                  </Typography>
                </Box>
                <Box sx={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <Typography fontSize={13} noWrap
                    sx={{ color: room.unread_count > 0 ? '#C0C0C0' : '#404040',
                      fontWeight: room.unread_count > 0 ? 500 : 400 }}>
                    {room.last_message || '채팅을 시작해보세요'}
                  </Typography>
                  {room.unread_count > 0 && (
                    <Box sx={{
                      minWidth:18, height:18, borderRadius:9,
                      backgroundColor:'#E8C96D', color:'#0A0A0A',
                      display:'flex', alignItems:'center', justifyContent:'center',
                      fontSize:10, fontWeight:800, flexShrink:0, ml:1, px:0.5,
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
        <Box sx={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
          {/* 채팅 헤더 */}
          <Box sx={{
            px:2.5, py:1.5,
            borderBottom:'1px solid #141414',
            display:'flex', alignItems:'center', gap:1.5,
            flexShrink:0,
          }}>
            {isMobile && (
              <IconButton size="small" onClick={() => setActiveRoom(null)}
                sx={{ color:'#808080', mr:0.5 }}>
                <ArrowBackRounded />
              </IconButton>
            )}
            <Avatar
              src={activeRoom.partner_image
                ? `http://localhost:5000${activeRoom.partner_image}` : null}
              sx={{
                width:38, height:38, cursor:'pointer',
                bgcolor:'#1A1A1A', color:'#E8C96D',
                fontWeight:800, fontSize:14,
                border:'1.5px solid #2A2A2A',
              }}
              onClick={() => navigate(`/profile/${activeRoom.partner_username}`)}>
              {activeRoom.partner_username?.[0]?.toUpperCase()}
            </Avatar>
            <Box sx={{ flex:1 }}>
              <Typography fontSize={14} fontWeight={700}
                sx={{ cursor:'pointer', '&:hover':{ color:'#E8C96D' } }}
                onClick={() => navigate(`/profile/${activeRoom.partner_username}`)}>
                {activeRoom.partner_username}
              </Typography>
              <Typography fontSize={11}
                sx={{ color: activeRoom.partner_online ? '#4CAF50' : '#404040' }}>
                {activeRoom.partner_online ? '활성 상태' : activeRoom.partner_last_seen_text || '오프라인'}
              </Typography>
            </Box>
            <IconButton size="small" sx={{ color:'#404040' }}>
              <MoreHorizRounded />
            </IconButton>
          </Box>

          {/* 메시지 목록 */}
          <Box sx={{
            flex:1, overflowY:'auto', px:2, py:2,
            display:'flex', flexDirection:'column', gap:0.5,
            '&::-webkit-scrollbar':{ width:3 },
            '&::-webkit-scrollbar-thumb':{ backgroundColor:'#1A1A1A', borderRadius:4 },
          }}>
            {loading ? (
              <Box sx={{ display:'flex', justifyContent:'center', py:4 }}>
                <CircularProgress size={24} sx={{ color:'#E8C96D' }} />
              </Box>
            ) : (
              messages.map((msg, idx) => {
                const isMe = msg.sender_id === user?.id;
                return (
                  <Box key={msg.id}>
                    {/* 날짜 구분선 */}
                    {showDateDivider(messages, idx) && (
                      <Box sx={{ textAlign:'center', my:2 }}>
                        <Typography fontSize={11}
                          sx={{
                            color:'#2A2A2A', display:'inline-block',
                            px:1.5, py:0.3, borderRadius:10,
                            backgroundColor:'#111',
                          }}>
                          {formatDate(msg.created_at)}
                        </Typography>
                      </Box>
                    )}

                    <Box sx={{
                      display:'flex',
                      justifyContent: isMe ? 'flex-end' : 'flex-start',
                      alignItems:'flex-end', gap:1,
                      mb: 0.3,
                    }}>
                      {!isMe && (
                        <Avatar
                          src={msg.profile_image
                            ? `http://localhost:5000${msg.profile_image}` : null}
                          sx={{
                            width:28, height:28, flexShrink:0,
                            bgcolor:'#1A1A1A', color:'#E8C96D',
                            fontSize:11, fontWeight:800, mb:0.5,
                          }}>
                          {msg.username?.[0]?.toUpperCase()}
                        </Avatar>
                      )}
                      <Box sx={{
                        display:'flex', flexDirection:'column',
                        alignItems: isMe ? 'flex-end' : 'flex-start',
                        maxWidth:'70%',
                      }}>
                        <Box sx={{
                          px:1.8, py:1.1,
                          borderRadius: isMe
                            ? '18px 18px 4px 18px'
                            : '18px 18px 18px 4px',
                          backgroundColor: isMe ? '#E8C96D' : '#1A1A1A',
                          color: isMe ? '#0A0A0A' : '#EFEFEF',
                          fontSize:14, lineHeight:1.5,
                          wordBreak:'break-word',
                        }}>
                          {msg.content}
                        </Box>
                        <Typography fontSize={10}
                          sx={{ color:'#303030', mt:0.3,
                            px:0.5 }}>
                          {timeAgo(msg.created_at)}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                );
              })
            )}

            {typing && (
              <Box sx={{ display:'flex', alignItems:'center', gap:1, px:1 }}>
                <Box sx={{
                  px:1.8, py:1.1, borderRadius:'18px 18px 18px 4px',
                  backgroundColor:'#1A1A1A', display:'flex', gap:0.4,
                }}>
                  {[0,1,2].map(i => (
                    <Box key={i} sx={{
                      width:6, height:6, borderRadius:'50%',
                      backgroundColor:'#505050',
                      animation:`pulse 1.2s ease-in-out ${i*0.2}s infinite`,
                      '@keyframes pulse':{
                        '0%,80%,100%':{ opacity:0.3 },
                        '40%':{ opacity:1 },
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
            px:2, py:1.5,
            borderTop:'1px solid #141414',
            display:'flex', alignItems:'center', gap:1,
            flexShrink:0,
          }}>
            <IconButton size="small" sx={{ color:'#404040' }}>
              <ImageRounded sx={{ fontSize:22 }} />
            </IconButton>
            <Box sx={{
              flex:1,
              backgroundColor:'#111',
              border:'1px solid #1E1E1E',
              borderRadius:30,
              px:2, py:0.8,
              display:'flex', alignItems:'center',
              transition:'border-color 0.15s',
              '&:focus-within':{ borderColor:'#2A2A2A' },
            }}>
              <input
                ref={inputRef}
                placeholder="메시지 입력..."
                onChange={handleTyping}
                onKeyDown={handleKeyDown}
                style={{
                  flex:1, background:'transparent', border:'none',
                  outline:'none', color:'#EFEFEF', fontSize:'14px',
                  fontFamily:'inherit',
                }}
              />
            </Box>
            <IconButton
              onClick={sendMessage}
              sx={{
                color:'#E8C96D',
                '&:hover':{ backgroundColor:'rgba(232,201,109,0.1)' },
              }}>
              <SendRounded sx={{ fontSize:22 }} />
            </IconButton>
          </Box>
        </Box>
      ) : (
        <Box sx={{
          flex:1, display:{ xs:'none', md:'flex' },
          alignItems:'center', justifyContent:'center',
          flexDirection:'column', gap:2,
        }}>
          <Typography sx={{ fontSize:48, opacity:0.1 }}>💬</Typography>
          <Typography fontSize={14} color="text.secondary">
            채팅방을 선택해주세요
          </Typography>
        </Box>
      )}
    </Box>
  );
}