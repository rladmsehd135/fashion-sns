import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box, Typography, Avatar, Badge, IconButton,
  CircularProgress, Menu, MenuItem, Divider,
  Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material';
import {
  ArrowBackRounded, SendRounded,
  ImageRounded, MoreHorizRounded, GroupAddRounded, CloseRounded,
  ChatBubbleRounded,
} from '@mui/icons-material';
import { getRooms, getMessages, readMessages, getRequests, acceptRequest, rejectRequest, uploadChatImage, getGroupMembers, leaveGroup } from '../../api/chatApi';
import { blockUser, reportUser } from '../../api/userApi';
import { filterProfanity } from '../../utils/profanityFilter';
import GroupCreateModal from './GroupCreateModal';
import useAuthStore from '../../store/authStore';
import { getSocket } from '../../hooks/useSocket';
import { timeAgo } from '../../utils/formatDate';
import toast from 'react-hot-toast';
import confirmToast from '../../utils/confirmToast';
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
    accent:     '#E8C96D',
  }), [isDark]);

  const [showGroupCreate, setShowGroupCreate] = useState(false);
  const [rooms, setRooms] = useState([]);
  const [requests, setRequests] = useState([]);
  const [showRequests, setShowRequests] = useState(false);
  const [activeRoom, setActiveRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [typingUsers, setTypingUsers] = useState({});
  const [showMembers, setShowMembers] = useState(false);
  const [groupMembers, setGroupMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [loading, setLoading] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [contextMenu, setContextMenu] = useState(null); // { x, y, room }
  const [reportDialog, setReportDialog] = useState({ open: false, targetId: null });
  const [reportReason, setReportReason] = useState('');
  const [memberActionDialog, setMemberActionDialog] = useState({ open: false, action: '', members: [] });
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const imageRef = useRef(null);
  const typingTimers = useRef({});
  const activeRoomRef = useRef(null);
  const lastReaderReadAt = useRef({});
  const readTimeout = useRef(null);
  const myLastReadAt = useRef(null);
  const isMobile = window.innerWidth < 768;
  const { setUnreadChat } = useNotificationStore();

  useEffect(() => {
    getRooms().then(res => {
      setRooms(res.data);
      const savedRoomId = sessionStorage.getItem('lastChatRoomId');
      const targetId = location.state?.openRoomId || (savedRoomId ? Number(savedRoomId) : null);
      if (targetId) {
        const target = res.data.find(r => r.id === targetId);
        if (target) openRoom(target);
      }
    }).catch(() => { });
    getRequests().then(res => setRequests(res.data)).catch(() => { });
  }, []);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const handler = (data) => setRequests(prev => [data, ...prev]);
    const groupHandler = () => getRooms().then(res => setRooms(res.data)).catch(() => {});
    const memberLeftHandler = (data) => {
      if (Number(data.userId) !== Number(user?.id)) {
        getRooms().then(res => setRooms(res.data)).catch(() => {});
      }
    };
    socket.on('chat:request_received', handler);
    socket.on('chat:group_created', groupHandler);
    socket.on('chat:member_left', memberLeftHandler);
    return () => {
      socket.off('chat:request_received', handler);
      socket.off('chat:group_created', groupHandler);
      socket.off('chat:member_left', memberLeftHandler);
    };
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
          ? { ...r, last_message: msg.message_type === 'image' ? '📷 사진' : msg.message_type === 'story_reply' ? '📸 스토리에 답장했어요' : msg.content, last_message_at: msg.created_at }
          : r
      ));
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
      // 채팅창 열려있고 내가 아닌 메시지면 300ms 후 읽음 처리 + 로컬 카운트 보정
      if (activeRoomRef.current?.id === msg.room_id && Number(msg.sender_id) !== Number(user?.id)) {
        clearTimeout(readTimeout.current);
        readTimeout.current = setTimeout(async () => {
          try {
            const readAt = new Date().toISOString();
            await readMessages(msg.room_id);
            decrementMyRead(readAt);
          } catch {}
        }, 300);
      }
    };

    const handleTypingStart = (data) => {
      if (!data?.roomId || data.roomId !== activeRoom?.id) return;
      const uid = data.userId || 'unknown';
      setTypingUsers(prev => ({ ...prev, [uid]: data.username || '상대방' }));
      clearTimeout(typingTimers.current[uid]);
      typingTimers.current[uid] = setTimeout(() => {
        setTypingUsers(prev => { const n = { ...prev }; delete n[uid]; return n; });
      }, 5000);
    };
    const handleTypingStop = (data) => {
      if (!data?.roomId || data.roomId !== activeRoom?.id) return;
      const uid = data.userId || 'unknown';
      clearTimeout(typingTimers.current[uid]);
      setTypingUsers(prev => { const n = { ...prev }; delete n[uid]; return n; });
    };
    const handleMessageRead = ({ roomId }) => {
      if (String(roomId) === String(activeRoom?.id)) {
        setMessages(prev => prev.map(m =>
          Number(m.sender_id) === Number(user?.id) ? { ...m, is_read: true } : m
        ));
      }
    };
    const handleGroupRead = ({ roomId, readerId, readAt }) => {
      if (String(roomId) !== String(activeRoom?.id)) return;
      if (Number(readerId) === Number(user?.id)) return;
      // readAt 타임스탬프로 이중 감소 방지
      const prev = lastReaderReadAt.current[readerId];
      lastReaderReadAt.current[readerId] = readAt;
      const newReadTime = readAt ? new Date(readAt).getTime() : Date.now();
      const prevReadTime = prev ? new Date(prev).getTime() : 0;
      setMessages(prevMsgs => prevMsgs.map(m => {
        if (Number(m.unread_count) <= 0) return m;
        const msgTime = new Date(m.created_at).getTime();
        if (msgTime <= newReadTime && msgTime > prevReadTime) {
          return { ...m, unread_count: Math.max(0, Number(m.unread_count) - 1) };
        }
        return m;
      }));
    };

    const handleRoomUpdate = ({ roomId, lastMessage, lastMessageAt }) => {
      const isActive = activeRoomRef.current?.id === roomId;
      setRooms(prev => prev.map(r =>
        r.id === roomId
          ? {
              ...r,
              last_message: lastMessage,
              last_message_at: lastMessageAt,
              unread_count: isActive ? r.unread_count : (Number(r.unread_count) || 0) + 1,
            }
          : r
      ));
    };

    socket.on('chat:message', handleMessage);
    socket.on('chat:typing_start', handleTypingStart);
    socket.on('chat:typing_stop', handleTypingStop);
    socket.on('chat:message_read', handleMessageRead);
    socket.on('chat:group_read', handleGroupRead);
    socket.on('chat:room_update', handleRoomUpdate);

    return () => {
      socket.off('chat:message', handleMessage);
      socket.off('chat:typing_start', handleTypingStart);
      socket.off('chat:typing_stop', handleTypingStop);
      socket.off('chat:message_read', handleMessageRead);
      socket.off('chat:group_read', handleGroupRead);
      socket.off('chat:room_update', handleRoomUpdate);
      Object.values(typingTimers.current).forEach(t => clearTimeout(t));
    };
  }, [activeRoom?.id, user?.id]);

  useEffect(() => {
    if (!showMembers || !activeRoom?.id || activeRoom.room_type !== 'group') return;
    setLoadingMembers(true);
    getGroupMembers(activeRoom.id)
      .then(res => setGroupMembers(res.data))
      .catch(() => toast.error('멤버 목록을 불러오지 못했어요.'))
      .finally(() => setLoadingMembers(false));
  }, [showMembers, activeRoom?.id]);

  useEffect(() => { activeRoomRef.current = activeRoom; }, [activeRoom]);

  // 내가 읽었을 때 로컬 unread_count 보정 (DB 기준과 동기화)
  const decrementMyRead = useCallback((readAt) => {
    const prev = myLastReadAt.current;
    myLastReadAt.current = readAt;
    const newT = new Date(readAt).getTime();
    const prevT = prev ? new Date(prev).getTime() : 0;
    setMessages(msgs => msgs.map(m => {
      if (Number(m.unread_count) <= 0) return m;
      const t = new Date(m.created_at).getTime();
      if (t <= newT && t > prevT) return { ...m, unread_count: Math.max(0, Number(m.unread_count) - 1) };
      return m;
    }));
  }, []);

  const openRoom = async (room) => {
    setActiveRoom(room);
    activeRoomRef.current = room;
    sessionStorage.setItem('lastChatRoomId', room.id);
    setTypingUsers({});
    setShowMembers(false);
    myLastReadAt.current = null;
    setLoading(true);
    const socket = getSocket();
    socket?.emit('room:join', room.id);
    try {
      // readMessages 먼저 → DB가 내 읽음을 반영한 뒤 getMessages 호출 → 정확한 unread_count
      try { await readMessages(room.id); } catch {}
      const res = await getMessages(room.id);
      setMessages(res.data);
      myLastReadAt.current = new Date().toISOString();
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
    const raw = inputRef.current?.value?.trim();
    if (!raw || !activeRoom) return;
    const socket = getSocket();
    if (!socket) return;

    const value = filterProfanity(raw);

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
      unread_count: activeRoom.room_type === 'group' ? Math.max(0, (activeRoom.member_count || 1) - 1) : 0,
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

  const performLeave = async (id) => {
    try {
      await leaveGroup(id);
      setRooms(prev => prev.filter(r => r.id !== id));
      if (activeRoom?.id === id) setActiveRoom(null);
      toast.success('채팅방을 나갔습니다.');
    } catch {
      toast.error('채팅방 나가기에 실패했어요.');
    }
  };

  const handleLeaveGroup = (roomId) => {
    setMenuAnchor(null);
    setContextMenu(null);
    const id = roomId || activeRoom?.id;
    if (!id) return;
    toast(
      (t) => (
        <div style={{ minWidth: 210 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4, color: isDark ? '#EFEFEF' : '#0A0A0A' }}>
            채팅방을 나가시겠어요?
          </div>
          <div style={{ fontSize: 12, color: '#888888', marginBottom: 14 }}>
            나간 후에는 대화 내용을 볼 수 없습니다.
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => { toast.dismiss(t.id); performLeave(id); }}
              style={{ flex: 1, padding: '7px 0', borderRadius: 8, border: 'none', cursor: 'pointer', background: '#FF6B6B', color: '#fff', fontSize: 13, fontWeight: 700 }}>
              나가기
            </button>
            <button onClick={() => toast.dismiss(t.id)}
              style={{ flex: 1, padding: '7px 0', borderRadius: 8, border: '1px solid #2A2A2A', cursor: 'pointer', background: 'transparent', color: '#888', fontSize: 13, fontWeight: 600 }}>
              취소
            </button>
          </div>
        </div>
      ),
      {
        duration: Infinity,
        style: {
          background: isDark ? '#111111' : '#FFFFFF',
          border: `1px solid ${isDark ? '#1A1A1A' : '#EBEBEB'}`,
          borderRadius: 12,
          padding: '14px 16px',
        }
      }
    );
  };

  const handleContextBlock = (overrideRoom) => {
    const room = overrideRoom || contextMenu?.room;
    setContextMenu(null);
    if (!room?.partner_id && !room?.id) return;
    const targetId = room.partner_id;
    const targetName = room.partner_username;
    if (!targetId) return;
    confirmToast(`${targetName}님을 차단하시겠어요?`, async () => {
      try {
        await blockUser(targetId);
        if (room.id) {
          setRooms(prev => prev.filter(r => r.id !== room.id));
          if (activeRoom?.id === room.id) setActiveRoom(null);
        }
        toast.success('차단되었습니다.');
      } catch {
        toast.error('잠시 후 다시 시도해주세요.');
      }
    }, { confirmText: '차단', danger: true });
  };

  const openMemberAction = async (action, roomId) => {
    setMenuAnchor(null);
    setContextMenu(null);
    const id = roomId || activeRoom?.id;
    if (!id) return;
    try {
      const res = await getGroupMembers(id);
      const members = res.data.filter(m => Number(m.id) !== Number(user?.id));
      setMemberActionDialog({ open: true, action, members });
    } catch {
      toast.error('멤버 목록을 불러올 수 없어요.');
    }
  };

  const handleMemberActionSelect = (member) => {
    const { action } = memberActionDialog;
    setMemberActionDialog({ open: false, action: '', members: [] });
    if (action === 'report') {
      setReportDialog({ open: true, targetId: member.id });
    } else if (action === 'block') {
      handleContextBlock({ partner_id: member.id, partner_username: member.username });
    }
  };

  const handleReportSubmit = async () => {
    if (!reportReason) return toast.error('신고 사유를 선택해주세요.');
    try {
      await reportUser(reportDialog.targetId, reportReason);
      toast.success('신고가 접수되었습니다. 검토 후 조치하겠습니다.');
      setReportDialog({ open: false, targetId: null });
      setReportReason('');
    } catch {
      toast.error('신고 접수에 실패했어요.');
    }
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
      year: 'numeric', month: 'long', day: 'numeric', weekday: 'long',
    });
  };

  const formatMsgTime = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const h = d.getHours();
    const m = d.getMinutes().toString().padStart(2, '0');
    return `${h < 12 ? '오전' : '오후'} ${h % 12 || 12}:${m}`;
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
          <Typography fontWeight={900} fontSize={20}
            sx={{ letterSpacing: '-0.03em', color: C.text, fontFamily: '"Montserrat", sans-serif' }}>
            {user?.username}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
            <IconButton size="small" onClick={() => setShowGroupCreate(true)}
              sx={{ color: C.textSub, '&:hover': { color: C.accent } }}>
              <GroupAddRounded sx={{ fontSize: 22 }} />
            </IconButton>
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
                  onClick={(e) => { e.stopPropagation(); navigate(`/profile/${req.username}`); }}
                  sx={{
                    width: 42, height: 42, bgcolor: C.avatarBg, color: '#E8C96D',
                    fontWeight: 800, fontSize: 16, cursor: 'pointer',
                    '&:hover': { opacity: 0.8 }
                  }}>
                  {req.username?.[0]?.toUpperCase()}
                </Avatar>
                <Box 
                  onClick={() => navigate(`/profile/${req.username}`)}
                  sx={{ flex: 1, minWidth: 0, cursor: 'pointer' }}
                >
                  <Typography 
                    fontSize={13} fontWeight={600} 
                    sx={{ color: C.text, '&:hover': { color: C.accent } }}
                  >
                    {req.username}
                  </Typography>
                  <Typography fontSize={11} sx={{ color: C.textSub }}>채팅을 요청했어요</Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 0.8 }} onClick={(e) => e.stopPropagation()}>
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
          ) : rooms.map(room => {
            const isGroup = room.room_type === 'group';
            return (
              <Box key={room.id}
                onClick={() => openRoom(room)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  setContextMenu({ x: e.clientX, y: e.clientY, room });
                }}
                sx={{
                  display: 'flex', alignItems: 'center', gap: 1.5,
                  px: 2.5, py: 1.5, cursor: 'pointer',
                  backgroundColor: activeRoom?.id === room.id ? C.roomActive : 'transparent',
                  transition: 'background 0.15s',
                  '&:hover': { backgroundColor: C.roomHover },
                }}>
                {isGroup ? (
                  <Box sx={{ width: 52, height: 52, position: 'relative', flexShrink: 0 }}>
                    {room.member_previews?.length > 0 ? (
                      room.member_previews.slice(0, 2).map((m, i) => (
                        <Avatar key={m.id}
                          src={m.profile_image ? `http://localhost:5000${m.profile_image}` : null}
                          sx={{
                            width: 34, height: 34, bgcolor: C.avatarBg, color: '#E8C96D',
                            fontWeight: 800, fontSize: 13, border: `2px solid ${C.bg}`,
                            position: 'absolute',
                            top: i === 0 ? 0 : 'auto', bottom: i === 1 ? 0 : 'auto',
                            left: i === 0 ? 0 : 'auto', right: i === 1 ? 0 : 'auto',
                          }}>
                          {m.username?.[0]?.toUpperCase()}
                        </Avatar>
                      ))
                    ) : (
                      <Avatar sx={{
                        width: 52, height: 52, bgcolor: C.avatarBg,
                        color: '#E8C96D', fontWeight: 800, fontSize: 20,
                      }}>#</Avatar>
                    )}
                    <Box sx={{
                      position: 'absolute', bottom: -2, right: -2,
                      minWidth: 18, height: 18, borderRadius: 9,
                      backgroundColor: C.accent, color: '#0A0A0A',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 10, fontWeight: 800, px: 0.4,
                      border: `2px solid ${C.bg}`,
                    }}>
                      {room.member_count || 0}
                    </Box>
                  </Box>
                ) : (
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
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/profile/${room.partner_username}`);
                      }}
                      sx={{
                        width: 52, height: 52, bgcolor: C.avatarBg, color: '#E8C96D',
                        fontWeight: 800, fontSize: 18, border: `1.5px solid ${C.border2}`,
                        cursor: 'pointer',
                        '&:hover': { opacity: 0.8, transform: 'scale(1.05)' },
                        transition: 'all 0.2s'
                      }}>
                      {room.partner_username?.[0]?.toUpperCase()}
                    </Avatar>
                  </Badge>
                )}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.3 }}>
                    <Typography fontSize={14} fontWeight={600} sx={{ color: C.text }}>
                      {isGroup ? room.room_name : room.partner_username}
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
                      {room.last_message || (isGroup ? `멤버 ${room.member_count}명` : '채팅을 시작해보세요')}
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
            );
          })}
        </Box>
      </Box>

      {/* ── 메시지 + 멤버 패널 ── */}
      <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
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
              <IconButton size="small" onClick={() => {
                setActiveRoom(null);
                sessionStorage.removeItem('lastChatRoomId');
              }}
                sx={{ color: C.textSub, mr: 0.5 }}>
                <ArrowBackRounded />
              </IconButton>
            )}
            {activeRoom.room_type === 'group' ? (
              <>
                <Avatar sx={{
                  width: 38, height: 38, bgcolor: C.accent,
                  color: '#0A0A0A', fontWeight: 800, fontSize: 15,
                  border: `1.5px solid ${C.border2}`,
                }}>
                  {activeRoom.room_name?.[0]?.toUpperCase()}
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography fontSize={14} fontWeight={700} sx={{ color: C.text }}>
                    {activeRoom.room_name}
                  </Typography>
                  <Typography
                    fontSize={11}
                    onClick={() => setShowMembers(v => !v)}
                    sx={{
                      color: showMembers ? C.accent : C.textSub,
                      cursor: 'pointer', userSelect: 'none', display: 'inline-block',
                      '&:hover': { color: C.accent },
                    }}
                  >
                    멤버 {activeRoom.member_count}명 {showMembers ? '▴' : '▾'}
                  </Typography>
                </Box>
              </>
            ) : (
              <>
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
              </>
            )}
            <IconButton size="small"
              onClick={(e) => setMenuAnchor(e.currentTarget)}
              sx={{ color: isDark ? '#C0C0C0' : '#666666', flexShrink: 0, '&:hover': { color: C.text } }}>
              <MoreHorizRounded />
            </IconButton>
          </Box>

          {/* 메시지 목록 */}
          <Box sx={{
            flex: 1, overflowY: 'auto', px: 1, py: 2,
            display: 'flex', flexDirection: 'column',
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
              const isStoryReply = msg.message_type === 'story_reply';
              let storyReply = null;
              if (isStoryReply) {
                try { storyReply = JSON.parse(msg.content); }
                catch { storyReply = { text: msg.content, storyOwner: '' }; }
              }
              const showTime = isLastInGroup(messages, idx);
              const isFirst = idx === 0 || Number(messages[idx - 1].sender_id) !== Number(msg.sender_id);
              const isGroup = activeRoom.room_type === 'group';

              // 미읽음 카운트 — 그룹은 sent/received 모두, 1:1은 sent만
              const unreadCnt = (() => {
                if (isGroup) return Number(msg.unread_count) > 0 ? Number(msg.unread_count) : null;
                return isMe && !msg.is_read ? 1 : null;
              })();

              // 버블 radius: 첫 메시지에 꼭짓점, 나머지는 전체 라운드
              const bubbleRadius = isMe
                ? (isFirst ? '12px 4px 12px 12px' : '12px 12px 12px 12px')
                : (isFirst ? '4px 12px 12px 12px' : '12px 12px 12px 12px');

              // 시간 표시 컴포넌트 (버블 옆)
              const timeBox = showTime ? (
                <Box sx={{
                  display: 'flex', flexDirection: 'column',
                  alignItems: isMe ? 'flex-end' : 'flex-start',
                  justifyContent: 'flex-end',
                  flexShrink: 0, pb: 0.2, gap: 0.2,
                }}>
                  {unreadCnt && (
                    <Typography fontSize={10} fontWeight={800} sx={{ color: C.accent, lineHeight: 1 }}>
                      {unreadCnt}
                    </Typography>
                  )}
                  <Typography fontSize={10} sx={{ color: C.textDim, whiteSpace: 'nowrap' }}>
                    {formatMsgTime(msg.created_at)}
                  </Typography>
                </Box>
              ) : null;

              return (
                <Box key={msg.id} sx={{ mb: isFirst ? 1 : 0.3 }}>
                  {showDateDivider(messages, idx) && (
                    <Box sx={{ textAlign: 'center', my: 2.5 }}>
                      <Typography fontSize={11}
                        sx={{
                          color: C.dateText, display: 'inline-block',
                          px: 2, py: 0.4, borderRadius: 10, backgroundColor: C.dateBg,
                        }}>
                        {formatDate(msg.created_at)}
                      </Typography>
                    </Box>
                  )}

                  {isMe ? (
                    /* ── 내 메시지 (오른쪽) ── */
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-end', gap: 0.6, px: 1 }}>
                      {timeBox}
                      {isStoryReply ? (
                        <Box sx={{
                          borderRadius: bubbleRadius, overflow: 'hidden',
                          backgroundColor: C.accent, maxWidth: 220,
                        }}>
                          <Box sx={{ px: 1.4, pt: 1, pb: 0.5 }}>
                            <Typography fontSize={11} sx={{ color: 'rgba(0,0,0,0.55)', mb: 0.6 }}>
                              @{storyReply.storyOwner}님의 스토리에 답장을 보냈습니다
                            </Typography>
                            {msg.image_url && (
                              <Box component="img"
                                src={`http://localhost:5000${msg.image_url}`}
                                sx={{ width: '100%', maxHeight: 160, objectFit: 'cover', borderRadius: 1.5, display: 'block' }}
                              />
                            )}
                          </Box>
                          <Box sx={{ px: 1.4, pt: 0.5, pb: 1, color: '#0A0A0A', fontSize: 14, lineHeight: 1.5, wordBreak: 'break-word' }}>
                            {storyReply.text}
                          </Box>
                        </Box>
                      ) : isImage ? (
                        <Box component="img"
                          src={msg.image_url?.startsWith('blob:') ? msg.image_url : `http://localhost:5000${msg.image_url}`}
                          sx={{ maxWidth: 220, maxHeight: 260, borderRadius: bubbleRadius, cursor: 'pointer', '&:hover': { opacity: 0.9 } }}
                          onClick={() => window.open(msg.image_url?.startsWith('blob:') ? msg.image_url : `http://localhost:5000${msg.image_url}`, '_blank')}
                        />
                      ) : (
                        <Box sx={{
                          px: 1.6, py: 0.9, borderRadius: bubbleRadius,
                          backgroundColor: C.accent, color: '#0A0A0A',
                          fontSize: 14, lineHeight: 1.5, wordBreak: 'break-word', maxWidth: '65vw',
                        }}>
                          {msg.content}
                        </Box>
                      )}
                    </Box>
                  ) : (
                    /* ── 상대 메시지 (왼쪽) ── */
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.8, px: 1 }}>
                      {/* 아바타 - 첫 메시지에만 표시, 이후는 공간 유지 */}
                      <Avatar
                        src={msg.profile_image ? `http://localhost:5000${msg.profile_image}` : null}
                        sx={{
                          width: 34, height: 34, flexShrink: 0,
                          bgcolor: C.avatarBg, color: C.accent,
                          fontSize: 13, fontWeight: 800, mt: 0.2,
                          visibility: isFirst ? 'visible' : 'hidden',
                          cursor: 'pointer',
                        }}
                        onClick={() => isFirst && navigate(`/profile/${msg.username}`)}
                      >
                        {msg.username?.[0]?.toUpperCase()}
                      </Avatar>
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', maxWidth: '65vw' }}>
                        {/* 이름 - 그룹에서 첫 메시지에만 */}
                        {isGroup && isFirst && (
                          <Typography
                            fontSize={12} fontWeight={600}
                            onClick={() => navigate(`/profile/${msg.username}`)}
                            sx={{
                              color: C.textSub, mb: 0.4, ml: 0.2,
                              cursor: 'pointer', '&:hover': { color: C.accent }
                            }}
                          >
                            {msg.username}
                          </Typography>
                        )}
                        <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 0.6 }}>
                          {isStoryReply ? (
                            <Box sx={{
                              borderRadius: bubbleRadius, overflow: 'hidden',
                              backgroundColor: C.bubbleBg, maxWidth: 220,
                            }}>
                              <Box sx={{ px: 1.4, pt: 1, pb: 0.5 }}>
                                <Typography fontSize={11} sx={{ color: C.textSub, mb: 0.6 }}>
                                  @{storyReply.storyOwner}님의 스토리에 답장을 보냈습니다
                                </Typography>
                                {msg.image_url && (
                                  <Box component="img"
                                    src={`http://localhost:5000${msg.image_url}`}
                                    sx={{ width: '100%', maxHeight: 160, objectFit: 'cover', borderRadius: 1.5, display: 'block' }}
                                  />
                                )}
                              </Box>
                              <Box sx={{ px: 1.4, pt: 0.5, pb: 1, color: C.bubbleText, fontSize: 14, lineHeight: 1.5, wordBreak: 'break-word' }}>
                                {storyReply.text}
                              </Box>
                            </Box>
                          ) : isImage ? (
                            <Box component="img"
                              src={msg.image_url?.startsWith('blob:') ? msg.image_url : `http://localhost:5000${msg.image_url}`}
                              sx={{ maxWidth: 220, maxHeight: 260, borderRadius: bubbleRadius, cursor: 'pointer', '&:hover': { opacity: 0.9 } }}
                              onClick={() => window.open(msg.image_url?.startsWith('blob:') ? msg.image_url : `http://localhost:5000${msg.image_url}`, '_blank')}
                            />
                          ) : (
                            <Box sx={{
                              px: 1.6, py: 0.9, borderRadius: bubbleRadius,
                              backgroundColor: C.bubbleBg, color: C.bubbleText,
                              fontSize: 14, lineHeight: 1.5, wordBreak: 'break-word',
                            }}>
                              {msg.content}
                            </Box>
                          )}
                          {timeBox}
                        </Box>
                      </Box>
                    </Box>
                  )}
                </Box>
              );
            })}

            {Object.keys(typingUsers).length > 0 && (() => {
              const names = Object.values(typingUsers);
              return (
                <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1, px: 1, mb: 0.5 }}>
                  <Avatar
                    src={activeRoom.room_type !== 'group' && activeRoom.partner_image
                      ? `http://localhost:5000${activeRoom.partner_image}` : null}
                    sx={{
                      width: 28, height: 28, flexShrink: 0,
                      bgcolor: C.avatarBg, color: C.accent,
                      fontSize: 11, fontWeight: 800, mb: 0.5,
                    }}
                  >
                    {activeRoom.room_type === 'group'
                      ? names[0]?.[0]?.toUpperCase()
                      : activeRoom.partner_username?.[0]?.toUpperCase()}
                  </Avatar>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.3 }}>
                    {activeRoom.room_type === 'group' && (
                      <Typography fontSize={11} sx={{ color: C.textSub, px: 0.5 }}>
                        {names.length === 1
                          ? `${names[0]}님이 입력 중`
                          : `${names.slice(0, 2).join(', ')}님이 입력 중`}
                      </Typography>
                    )}
                    <Box sx={{
                      px: 1.8, py: 1.1, borderRadius: '18px 18px 18px 4px',
                      backgroundColor: C.bubbleBg, display: 'flex', gap: 0.4, alignItems: 'center',
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
                </Box>
              );
            })()}
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
          <ChatBubbleRounded sx={{ fontSize: 48, color: isDark ? '#1E1E1E' : '#E8E8E8' }} />
          <Typography fontSize={14} sx={{ color: C.textSub }}>
            채팅방을 선택해주세요
          </Typography>
        </Box>
      )}

      {/* ── 멤버 목록 패널 ── */}
      {showMembers && activeRoom?.room_type === 'group' && (
        <Box sx={{
          width: 260, flexShrink: 0,
          borderLeft: `1px solid ${C.border}`,
          display: 'flex', flexDirection: 'column',
          backgroundColor: C.bg,
        }}>
          <Box sx={{
            px: 2, py: 1.5,
            borderBottom: `1px solid ${C.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <Typography fontWeight={700} fontSize={14} sx={{ color: C.text }}>
              멤버 {groupMembers.length || activeRoom.member_count}명
            </Typography>
            <IconButton size="small" onClick={() => setShowMembers(false)} sx={{ color: C.textSub }}>
              <CloseRounded sx={{ fontSize: 18 }} />
            </IconButton>
          </Box>
          <Box sx={{
            flex: 1, overflowY: 'auto', py: 1,
            '&::-webkit-scrollbar': { width: 3 },
            '&::-webkit-scrollbar-thumb': { backgroundColor: C.scrollbar, borderRadius: 4 },
          }}>
            {loadingMembers ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress size={20} sx={{ color: C.accent }} />
              </Box>
            ) : groupMembers.map(m => (
              <Box
                key={m.id}
                onClick={() => navigate(`/profile/${m.username}`)}
                sx={{
                  display: 'flex', alignItems: 'center', gap: 1.5,
                  px: 2, py: 1, cursor: 'pointer', borderRadius: 2, mx: 1,
                  '&:hover': { backgroundColor: C.roomHover },
                }}
              >
                <Avatar
                  src={m.profile_image ? `http://localhost:5000${m.profile_image}` : null}
                  sx={{ width: 34, height: 34, bgcolor: C.avatarBg, color: C.accent, fontWeight: 700, fontSize: 13 }}
                >
                  {m.username?.[0]?.toUpperCase()}
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography fontSize={13} fontWeight={600} noWrap sx={{ color: C.text }}>
                    {m.username}
                    {Number(m.id) === Number(user?.id) && (
                      <Typography component="span" fontSize={11} sx={{ color: C.textSub, ml: 0.5 }}>(나)</Typography>
                    )}
                  </Typography>
                  {Number(m.is_admin) === 1 && (
                    <Typography fontSize={11} sx={{ color: C.accent }}>관리자</Typography>
                  )}
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
      )}

      </Box>{/* flex wrapper end */}

      {/* ── 헤더 ... 메뉴 ── */}
      {activeRoom && (
        <Menu
          anchorEl={menuAnchor}
          open={Boolean(menuAnchor)}
          onClose={() => setMenuAnchor(null)}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          slotProps={{
            paper: {
              sx: {
                bgcolor: isDark ? '#111111' : '#FFFFFF',
                border: `1px solid ${C.border}`,
                backgroundImage: 'none', borderRadius: 2,
                minWidth: 160, mt: 0.5,
              }
            }
          }}
        >
          {activeRoom.room_type === 'group' && (
            <MenuItem onClick={() => { setShowMembers(v => !v); setMenuAnchor(null); }}
              sx={{ fontSize: 13, color: C.text, py: 1.2 }}>
              멤버 목록 {showMembers ? '닫기' : '보기'}
            </MenuItem>
          )}
          {activeRoom.room_type !== 'group' && (
            <MenuItem onClick={() => { navigate(`/profile/${activeRoom.partner_username}`); setMenuAnchor(null); }}
              sx={{ fontSize: 13, color: C.text, py: 1.2 }}>
              프로필 보기
            </MenuItem>
          )}
          <MenuItem
            onClick={() => {
              if (activeRoom.room_type === 'group') openMemberAction('report', activeRoom.id);
              else { setMenuAnchor(null); setReportDialog({ open: true, targetId: activeRoom.partner_id }); }
            }}
            sx={{ fontSize: 13, color: C.text, py: 1.2 }}>
            신고하기
          </MenuItem>
          <MenuItem
            onClick={() => {
              if (activeRoom.room_type === 'group') openMemberAction('block', activeRoom.id);
              else { setMenuAnchor(null); handleContextBlock(activeRoom); }
            }}
            sx={{ fontSize: 13, color: C.text, py: 1.2 }}>
            차단하기
          </MenuItem>
          <Divider sx={{ borderColor: C.border, my: 0.5 }} />
          {activeRoom.room_type === 'group' && (
            <MenuItem onClick={() => handleLeaveGroup(activeRoom.id)}
              sx={{ fontSize: 13, color: '#FF6B6B', py: 1.2 }}>
              채팅방 나가기
            </MenuItem>
          )}
        </Menu>
      )}

      {/* ── 방 목록 우클릭 컨텍스트 메뉴 ── */}
      <Menu
        open={Boolean(contextMenu)}
        onClose={() => setContextMenu(null)}
        anchorReference="anchorPosition"
        anchorPosition={contextMenu ? { top: contextMenu.y, left: contextMenu.x } : undefined}
        slotProps={{
          paper: {
            sx: {
              bgcolor: isDark ? '#111111' : '#FFFFFF',
              border: `1px solid ${C.border}`,
              backgroundImage: 'none', borderRadius: 2,
              minWidth: 150,
            }
          }
        }}
      >
        {contextMenu?.room?.room_type === 'group' ? [
          <MenuItem key="report-g"
            onClick={() => openMemberAction('report', contextMenu.room.id)}
            sx={{ fontSize: 13, color: C.text, py: 1.2 }}>
            신고하기
          </MenuItem>,
          <MenuItem key="block-g"
            onClick={() => openMemberAction('block', contextMenu.room.id)}
            sx={{ fontSize: 13, color: C.text, py: 1.2 }}>
            차단하기
          </MenuItem>,
          <Divider key="div" sx={{ borderColor: C.border, my: 0.5 }} />,
          <MenuItem key="leave"
            onClick={() => handleLeaveGroup(contextMenu.room.id)}
            sx={{ fontSize: 13, color: '#FF6B6B', py: 1.2 }}>
            채팅방 나가기
          </MenuItem>,
        ] : [
          <MenuItem key="report"
            onClick={() => {
              setReportDialog({ open: true, targetId: contextMenu?.room?.partner_id });
              setContextMenu(null);
            }}
            sx={{ fontSize: 13, color: C.text, py: 1.2 }}>
            신고하기
          </MenuItem>,
          <MenuItem key="block"
            onClick={handleContextBlock}
            sx={{ fontSize: 13, color: '#FF6B6B', py: 1.2 }}>
            차단하기
          </MenuItem>,
        ]}
      </Menu>

      {/* ── 그룹 멤버 선택 (신고/차단용) ── */}
      <Dialog
        open={memberActionDialog.open}
        onClose={() => setMemberActionDialog({ open: false, action: '', members: [] })}
        maxWidth="xs" fullWidth
        slotProps={{
          paper: {
            sx: {
              bgcolor: isDark ? '#0D0D0D' : '#FFFFFF', backgroundImage: 'none',
              border: `1px solid ${isDark ? '#1A1A1A' : '#EBEBEB'}`, borderRadius: 3,
            }
          }
        }}
      >
        <DialogTitle sx={{ color: C.text, fontSize: 15, fontWeight: 700, pb: 1 }}>
          {memberActionDialog.action === 'report' ? '누구를 신고하시겠어요?' : '누구를 차단하시겠어요?'}
        </DialogTitle>
        <DialogContent sx={{ pt: '0 !important', pb: 1 }}>
          {memberActionDialog.members.length === 0 ? (
            <Typography fontSize={13} sx={{ color: C.textSub, py: 2, textAlign: 'center' }}>
              멤버가 없습니다.
            </Typography>
          ) : memberActionDialog.members.map(m => (
            <Box key={m.id}
              onClick={() => handleMemberActionSelect(m)}
              sx={{
                display: 'flex', alignItems: 'center', gap: 1.5,
                px: 1.5, py: 1, borderRadius: 2, cursor: 'pointer',
                '&:hover': { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)' },
              }}>
              <Avatar
                src={m.profile_image ? `http://localhost:5000${m.profile_image}` : null}
                sx={{ width: 36, height: 36, bgcolor: C.avatarBg, color: C.accent, fontWeight: 700, fontSize: 14 }}>
                {m.username?.[0]?.toUpperCase()}
              </Avatar>
              <Typography fontSize={13} fontWeight={600} sx={{ color: C.text }}>{m.username}</Typography>
            </Box>
          ))}
        </DialogContent>
        <DialogActions sx={{ px: 2.5, pb: 2 }}>
          <Box onClick={() => setMemberActionDialog({ open: false, action: '', members: [] })}
            sx={{
              width: '100%', py: 1, textAlign: 'center', borderRadius: 2, cursor: 'pointer',
              border: `1px solid ${isDark ? '#1A1A1A' : '#EBEBEB'}`,
              fontSize: 13, fontWeight: 600, color: C.textSub,
              '&:hover': { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)' },
            }}>
            취소
          </Box>
        </DialogActions>
      </Dialog>

      {/* ── 신고 다이얼로그 ── */}
      <Dialog
        open={reportDialog.open}
        onClose={() => { setReportDialog({ open: false, targetId: null }); setReportReason(''); }}
        maxWidth="xs" fullWidth
        slotProps={{
          paper: {
            sx: {
              bgcolor: isDark ? '#0D0D0D' : '#FFFFFF',
              backgroundImage: 'none',
              border: `1px solid ${isDark ? '#1A1A1A' : '#EBEBEB'}`,
              borderRadius: 3,
            }
          }
        }}
      >
        <DialogTitle sx={{ color: C.text, fontSize: 15, fontWeight: 700, pb: 1 }}>
          신고하기
        </DialogTitle>
        <DialogContent sx={{ pt: '0 !important' }}>
          <Typography fontSize={12} sx={{ color: C.textSub, mb: 2 }}>
            신고 사유를 선택해주세요. 허위 신고 시 불이익이 있을 수 있습니다.
          </Typography>
          {['스팸', '욕설/혐오 발언', '불법 콘텐츠', '사기/사칭', '기타'].map(reason => (
            <Box key={reason}
              onClick={() => setReportReason(reason)}
              sx={{
                py: 1.2, px: 1.5, mb: 0.8, borderRadius: 2, cursor: 'pointer',
                border: `1px solid ${reportReason === reason ? C.accent : (isDark ? '#1A1A1A' : '#EBEBEB')}`,
                backgroundColor: reportReason === reason
                  ? (isDark ? 'rgba(232,201,109,0.08)' : 'rgba(232,201,109,0.1)')
                  : 'transparent',
                display: 'flex', alignItems: 'center', gap: 1.2,
                transition: 'all 0.12s',
              }}>
              <Box sx={{
                width: 16, height: 16, borderRadius: '50%', flexShrink: 0,
                border: `2px solid ${reportReason === reason ? C.accent : C.textSub}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {reportReason === reason && (
                  <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: C.accent }} />
                )}
              </Box>
              <Typography fontSize={13} sx={{ color: C.text }}>{reason}</Typography>
            </Box>
          ))}
        </DialogContent>
        <DialogActions sx={{ px: 2.5, pb: 2, gap: 1 }}>
          <Box onClick={() => { setReportDialog({ open: false, targetId: null }); setReportReason(''); }}
            sx={{
              flex: 1, py: 1, textAlign: 'center', borderRadius: 2, cursor: 'pointer',
              border: `1px solid ${isDark ? '#1A1A1A' : '#EBEBEB'}`,
              fontSize: 13, fontWeight: 600, color: C.textSub,
              '&:hover': { backgroundColor: C.roomHover },
            }}>
            취소
          </Box>
          <Box onClick={handleReportSubmit}
            sx={{
              flex: 1, py: 1, textAlign: 'center', borderRadius: 2, cursor: 'pointer',
              backgroundColor: reportReason ? C.accent : (isDark ? '#1A1A1A' : '#EBEBEB'),
              fontSize: 13, fontWeight: 700,
              color: reportReason ? '#0A0A0A' : C.textSub,
              transition: 'all 0.15s',
            }}>
            신고 접수
          </Box>
        </DialogActions>
      </Dialog>

      <GroupCreateModal
        open={showGroupCreate}
        onClose={() => setShowGroupCreate(false)}
        onCreated={async (newRoom) => {
          const res = await getRooms();
          setRooms(res.data);
          const created = res.data.find(r => r.id === newRoom.roomId);
          if (created) openRoom(created);
        }}
      />
    </Box>
  );
}
