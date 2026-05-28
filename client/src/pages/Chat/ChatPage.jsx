import { useState, useEffect, useRef } from 'react';
import { Box, Typography, Avatar, Badge, TextField,
  IconButton, Divider, List,
  ListItem, ListItemAvatar, ListItemText } from '@mui/material';
import { Send, ArrowBack } from '@mui/icons-material';
import { getRooms, getMessages, readMessages } from '../../api/chatApi';
import useAuthStore from '../../store/authStore';
import useSocket from '../../hooks/useSocket';
import { timeAgo } from '../../utils/formatDate';

const ChatPage = () => {
  const { user }    = useAuthStore();
  const socket      = useSocket();
  const [rooms, setRooms]           = useState([]);
  const [activeRoom, setActiveRoom] = useState(null);
  const [messages, setMessages]     = useState([]);
  const [input, setInput]           = useState('');
  const [typing, setTyping]         = useState(false);
  const bottomRef                   = useRef(null);

  useEffect(() => {
    getRooms().then(res => setRooms(res.data));
  }, []);

  useEffect(() => {
    if (!socket.current) return;
    socket.current.on('chat:message', (msg) => {
      setMessages(prev => [...prev, msg]);
      setRooms(prev => prev.map(r => r.id === msg.room_id
        ? { ...r, last_message: msg.content, last_message_at: msg.created_at } : r));
    });
    socket.current.on('chat:typing_start', () => setTyping(true));
    socket.current.on('chat:typing_stop',  () => setTyping(false));
    return () => {
      socket.current?.off('chat:message');
      socket.current?.off('chat:typing_start');
      socket.current?.off('chat:typing_stop');
    };
  }, [socket.current]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const openRoom = async (room) => {
    setActiveRoom(room);
    socket.current?.emit('room:join', room.id);
    const res = await getMessages(room.id);
    setMessages(res.data);
    await readMessages(room.id);
    setRooms(prev => prev.map(r => r.id === room.id ? { ...r, unread_count: 0 } : r));
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (!input.trim() || !activeRoom) return;
    socket.current?.emit('message:send', { roomId: activeRoom.id, content: input });
    setInput('');
    socket.current?.emit('typing:stop', { roomId: activeRoom.id });
  };

  const handleTyping = (e) => {
    setInput(e.target.value);
    if (e.target.value) socket.current?.emit('typing:start', { roomId: activeRoom?.id });
    else socket.current?.emit('typing:stop', { roomId: activeRoom?.id });
  };

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto', display: 'flex', height: 'calc(100vh - 64px)' }}>
      {/* 채팅방 목록 */}
      <Box sx={{ width: 320, borderRight: '1px solid #2A2A2A', overflowY: 'auto',
        display: activeRoom ? { xs: 'none', md: 'block' } : 'block' }}>
        <Typography variant="h6" fontWeight={700} p={2}>채팅</Typography>
        <Divider />
        <List>
          {rooms.map(room => (
            <ListItem key={room.id} button onClick={() => openRoom(room)}
              sx={{ '&:hover': { backgroundColor: '#1A1A1A' },
                backgroundColor: activeRoom?.id === room.id ? '#1A1A1A' : 'transparent' }}>
              <ListItemAvatar>
                <Badge color="error" badgeContent={room.unread_count} max={99}>
                  <Badge overlap="circular" anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    variant="dot"
                    sx={{ '& .MuiBadge-dot': { backgroundColor: room.partner_online ? '#4CAF50' : '#666' } }}>
                    <Avatar src={room.partner_image ? `http://localhost:5000${room.partner_image}` : null}>
                      {room.partner_username?.[0]?.toUpperCase()}
                    </Avatar>
                  </Badge>
                </Badge>
              </ListItemAvatar>
              <ListItemText
                primary={room.partner_username}
                secondary={room.last_message || '채팅을 시작해보세요'}
                secondaryTypographyProps={{ noWrap: true, color: '#A0A0A0' }}
              />
              <Typography variant="caption" color="text.secondary">
                {room.partner_online ? '온라인' : room.partner_last_seen_text}
              </Typography>
            </ListItem>
          ))}
        </List>
        {rooms.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 5 }}>
            <Typography color="text.secondary" variant="body2">채팅방이 없어요</Typography>
          </Box>
        )}
      </Box>

      {/* 메시지 영역 */}
      {activeRoom ? (
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ p: 2, borderBottom: '1px solid #2A2A2A', display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <IconButton sx={{ display: { md: 'none' } }} onClick={() => setActiveRoom(null)}>
              <ArrowBack />
            </IconButton>
            <Avatar src={activeRoom.partner_image ? `http://localhost:5000${activeRoom.partner_image}` : null}>
              {activeRoom.partner_username?.[0]?.toUpperCase()}
            </Avatar>
            <Box>
              <Typography fontWeight={600}>{activeRoom.partner_username}</Typography>
              <Typography variant="caption" color={activeRoom.partner_online ? '#4CAF50' : '#A0A0A0'}>
                {activeRoom.partner_online ? '온라인' : activeRoom.partner_last_seen_text}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ flex: 1, overflowY: 'auto', p: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
            {messages.map(msg => {
              const isMe = msg.sender_id === user?.id;
              return (
                <Box key={msg.id} sx={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', gap: 1 }}>
                  {!isMe && (
                    <Avatar sx={{ width: 28, height: 28, fontSize: 12 }}>
                      {msg.username?.[0]?.toUpperCase()}
                    </Avatar>
                  )}
                  <Box sx={{ maxWidth: '70%' }}>
                    <Box sx={{
                      p: '10px 14px',
                      borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                      backgroundColor: isMe ? '#E8C96D' : '#1A1A1A',
                      color: isMe ? '#0A0A0A' : '#F0F0F0',
                    }}>
                      <Typography variant="body2">{msg.content}</Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary"
                      sx={{ display: 'block', textAlign: isMe ? 'right' : 'left', mt: 0.3 }}>
                      {timeAgo(msg.created_at)}
                    </Typography>
                  </Box>
                </Box>
              );
            })}
            {typing && <Typography variant="caption" color="text.secondary">입력 중...</Typography>}
            <Box ref={bottomRef} />
          </Box>

          <Box component="form" onSubmit={sendMessage}
            sx={{ p: 2, borderTop: '1px solid #2A2A2A', display: 'flex', gap: 1 }}>
            <TextField fullWidth size="small" placeholder="메시지 입력..."
              value={input} onChange={handleTyping} />
            <IconButton type="submit" sx={{ color: '#E8C96D' }}><Send /></IconButton>
          </Box>
        </Box>
      ) : (
        <Box sx={{ flex: 1, display: { xs: 'none', md: 'flex' },
          alignItems: 'center', justifyContent: 'center' }}>
          <Typography color="text.secondary">채팅방을 선택해주세요</Typography>
        </Box>
      )}
    </Box>
  );
};

export default ChatPage;