import { useState, useEffect, useMemo } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Box, Typography, IconButton, Avatar, Badge,
  BottomNavigation, BottomNavigationAction,
  useMediaQuery, useTheme, Tooltip, Drawer,
} from '@mui/material';
import {
  HomeRounded, ExploreRounded, AddBoxRounded,
  PersonRounded, LogoutRounded, FavoriteBorderRounded,
  SendRounded, SearchRounded,
  DarkModeRounded, LightModeRounded, SettingsRounded,
} from '@mui/icons-material';
import toast from 'react-hot-toast';
import useAuthStore from '../../store/authStore';
import useNotificationStore from '../../store/notificationStore';
import useSocket from '../../hooks/useSocket';
import useThemeStore from '../../store/themeStore';
import { logout as logoutApi } from '../../api/authApi';
import axiosInstance from '../../api/axiosInstance';
import MiniChat from '../common/MiniChat';

const NotiItem = ({ n, notiIcon, notiText, timeAgoNoti }) => {
  const [isFollowing, setIsFollowing] = useState(n.is_following || false);
  const { mode } = useThemeStore();
  const isDark = mode === 'dark';

  useEffect(() => {
    setIsFollowing(n.is_following || false);
  }, [n.is_following]);

  const handleFollow = async (e) => {
    e.stopPropagation();
    if (!n.sender_id) return;
    try {
      await axiosInstance.post(`/follow/${n.sender_id}`);
      setIsFollowing(f => !f);
      toast.success(isFollowing ? '팔로우 취소했어요.' : `${n.username}님을 팔로우했어요!`);
    } catch {}
  };

  return (
    <Box sx={{
      display:'flex', alignItems:'center', gap:1.5,
      px:1, py:1.3, borderRadius:2, cursor:'pointer',
      transition:'all 0.15s',
      '&:hover':{ backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)' },
    }}>
      <Box sx={{ position:'relative', flexShrink:0 }}>
        <Avatar
          src={n.profile_image ? `http://localhost:5000${n.profile_image}` : null}
          sx={{
            width:42, height:42,
            bgcolor: isDark ? '#1A1A1A' : '#F0F0F0',
            color:'#E8C96D', fontWeight:800, fontSize:16,
            border:`1.5px solid ${isDark ? '#2A2A2A' : '#E8E8E8'}`,
          }}>
          {n.username?.[0]?.toUpperCase()}
        </Avatar>
        <Box sx={{
          position:'absolute', bottom:-2, right:-2,
          width:18, height:18, borderRadius:'50%',
          backgroundColor: isDark ? '#1A1A1A' : '#F0F0F0',
          display:'flex', alignItems:'center', justifyContent:'center',
          fontSize:10, border:`1.5px solid ${isDark ? '#0D0D0D' : '#FFFFFF'}`,
        }}>
          {notiIcon(n.type)}
        </Box>
      </Box>
      <Box sx={{ flex:1, minWidth:0 }}>
        <Typography fontSize={13} sx={{ color: isDark ? '#C0C0C0' : '#333333', lineHeight:1.5 }}>
          <Typography component="span" fontWeight={700}
            sx={{ color: isDark ? '#EFEFEF' : '#0A0A0A', mr:0.5, cursor:'pointer',
              '&:hover':{ color:'#E8C96D' } }}>
            {n.username}
          </Typography>
          {notiText(n)}
        </Typography>
        <Typography fontSize={11} sx={{ color: isDark ? '#3A3A3A' : '#AAAAAA', mt:0.2 }}>
          {timeAgoNoti(n.created_at)}
        </Typography>
      </Box>
      {n.type === 'follow' && (
        <Box onClick={handleFollow}
          sx={{
            px:1.5, py:0.5, borderRadius:8, flexShrink:0,
            cursor:'pointer', fontSize:12, fontWeight:700,
            backgroundColor: isFollowing ? 'transparent' : '#EFEFEF',
            color: isFollowing ? '#808080' : '#0A0A0A',
            border: isFollowing ? `1px solid ${isDark ? '#2A2A2A' : '#DDDDDD'}` : 'none',
            transition:'all 0.15s', '&:hover':{ opacity:0.85 },
          }}>
          {isFollowing ? '팔로잉' : '맞팔로우'}
        </Box>
      )}
    </Box>
  );
};

export default function Navbar() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const theme     = useTheme();
  const isMobile  = useMediaQuery(theme.breakpoints.down('md'));
  const { user, logout, isLoggedIn }                          = useAuthStore();
  const { unreadCount, unreadChat,
          notifications, resetUnreadCount,
          setNotifications, setUnreadChat }                   = useNotificationStore();
  const { mode, toggleMode }                                  = useThemeStore();
  const isDark = mode === 'dark';

  const [expanded, setExpanded] = useState(false);
  const [notiOpen, setNotiOpen] = useState(false);
  const [notiTab, setNotiTab]   = useState('모두');
  useSocket();

  useEffect(() => {
    if (!isLoggedIn) return;
    axiosInstance.get('/chat/rooms').then(res => {
      const total = res.data.reduce((sum, r) => sum + (Number(r.unread_count) || 0), 0);
      setUnreadChat(Math.min(total, 99));
    }).catch(() => {});
  }, [isLoggedIn]);

  const navItems = [
    { label:'홈',     icon:<HomeRounded />,    path:'/' },
    { label:'탐색',   icon:<ExploreRounded />, path:'/explore' },
    { label:'검색',   icon:<SearchRounded />,  path:'/search' },
    { label:'업로드', icon:<AddBoxRounded />,  path:'/post/create' },
    { label:'프로필', icon:<PersonRounded />,  path:`/profile/${user?.username}` },
  ];

  const isActive = (path) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path.split(':')[0]);

  const chatBadge = unreadChat > 99 ? '99+' : unreadChat || 0;
  const sideWidth = expanded ? 240 : 72;

  const C = useMemo(() => ({
    bg:       isDark ? '#0D0D0D' : '#FFFFFF',
    bgMain:   isDark ? '#0A0A0A' : '#F5F5F0',
    border:   isDark ? '#1A1A1A' : '#EBEBEB',
    border2:  isDark ? '#141414' : '#F0F0F0',
    text:     isDark ? '#F0F0F0' : '#0A0A0A',
    textSub:  isDark ? '#505050' : '#AAAAAA',
    textMid:  isDark ? '#C0C0C0' : '#555555',
    hover:    isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
    active:   isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)',
    avatarBg: isDark ? '#1A1A1A' : '#F0F0F0',
    drawerBg: isDark ? '#0D0D0D' : '#FFFFFF',
  }), [isDark]);

  const handleLogout = async () => {
    try {
      await logoutApi();
      localStorage.removeItem('accessToken');
      logout();
      toast.success('로그아웃 되었습니다.');
      navigate('/login');
    } catch {
      localStorage.removeItem('accessToken');
      logout();
      navigate('/login');
    }
  };

  const openNoti = async () => {
    setNotiOpen(true);
    resetUnreadCount();
    try {
      const res = await axiosInstance.get('/notifications');
      const followNotiIds = res.data
        .filter(n => n.type === 'follow')
        .map(n => n.sender_id).filter(Boolean);
      const followChecks = await Promise.all(
        followNotiIds.map(id =>
          axiosInstance.get(`/users/${id}/follow-status`)
            .catch(() => ({ data: { is_following: false } }))
        )
      );
      const followStatusMap = {};
      followNotiIds.forEach((id, i) => {
        followStatusMap[id] = followChecks[i]?.data?.is_following || false;
      });
      const list = res.data.map(n => ({
        type:          n.type,
        sender_id:     n.sender_id,
        username:      n.sender_username,
        profile_image: n.sender_image,
        created_at:    n.created_at,
        is_read:       n.is_read,
        is_following:  followStatusMap[n.sender_id] || false,
      }));
      setNotifications(list, 0);
    } catch {}
  };

  const notiIcon = (type) => {
    if (type === 'follow')  return '👤';
    if (type === 'like')    return '❤️';
    if (type === 'comment') return '💬';
    return '🔔';
  };

  const notiText = (n) => {
    if (n.type === 'follow')  return '님이 팔로우하기 시작했어요.';
    if (n.type === 'like')    return '님이 좋아요를 눌렀어요.';
    if (n.type === 'comment') return '님이 댓글을 남겼어요.';
    return '새 알림이 있어요.';
  };

  const timeAgoNoti = (date) => {
    if (!date) return '방금 전';
    const diff = Date.now() - new Date(date).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1)  return '방금 전';
    if (m < 60) return `${m}분 전`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}시간 전`;
    const d = Math.floor(h / 24);
    if (d < 7)  return `${d}일 전`;
    return new Date(date).toLocaleDateString('ko-KR', { month:'long', day:'numeric' });
  };

  const filteredNotifications = notifications.filter(n => {
    if (notiTab === '모두')   return true;
    if (notiTab === '팔로우') return n.type === 'follow';
    if (notiTab === '좋아요') return n.type === 'like';
    if (notiTab === '댓글')   return n.type === 'comment';
    return true;
  });

  const now = new Date();
  const thisMonth = filteredNotifications.filter(n => {
    if (!n.created_at) return true;
    const d = new Date(n.created_at);
    return now.getFullYear() === d.getFullYear() && now.getMonth() === d.getMonth();
  });
  const older = filteredNotifications.filter(n => {
    if (!n.created_at) return false;
    const d = new Date(n.created_at);
    return !(now.getFullYear() === d.getFullYear() && now.getMonth() === d.getMonth());
  });

  const SideItem = ({ icon, label, path, onClick, badge }) => {
    const active = path ? isActive(path) : false;
    const textTransition = expanded
      ? 'max-width 0.32s cubic-bezier(0.4,0,0.2,1), opacity 0.22s ease 0.06s'
      : 'max-width 0.22s cubic-bezier(0.4,0,0.2,1), opacity 0.1s ease';
    return (
      <Tooltip title={!expanded ? label : ''} placement="right" arrow>
        <Box
          onClick={onClick || (() => navigate(path))}
          sx={{
            display:'flex', alignItems:'center',
            mx:1, borderRadius:2, cursor:'pointer',
            color: active ? C.text : C.textSub,
            backgroundColor: active ? C.active : 'transparent',
            position:'relative',
            transition:'background-color 0.15s ease, color 0.15s ease',
            '&:hover':{ color: C.text, backgroundColor: C.hover },
            '& svg':{ fontSize:24, transition:'transform 0.15s ease' },
            '&:hover svg':{ transform:'scale(1.1)' },
          }}>
          {/* 아이콘 — 항상 52px 고정 존에 가운데 정렬 */}
          <Box sx={{
            width:52, height:44,
            display:'flex', alignItems:'center', justifyContent:'center',
            flexShrink:0,
          }}>
            {badge !== undefined ? (
              <Badge badgeContent={badge} color="error"
                sx={{ '& .MuiBadge-badge':{ fontSize:9, minWidth:16, height:16, top:-2, right:-2 } }}>
                {icon}
              </Badge>
            ) : icon}
          </Box>
          {/* 텍스트 — 슬라이드인 */}
          <Typography fontWeight={active ? 700 : 400} fontSize={14}
            sx={{
              whiteSpace:'nowrap', overflow:'hidden',
              maxWidth: expanded ? 140 : 0,
              opacity: expanded ? 1 : 0,
              transition: textTransition,
            }}>
            {label}
          </Typography>
          {active && (
            <Box sx={{
              position:'absolute', left:0, top:'20%', bottom:'20%',
              width:3, borderRadius:'0 3px 3px 0',
              backgroundColor:'#E8C96D',
            }} />
          )}
        </Box>
      </Tooltip>
    );
  };

  return (
    <Box sx={{ display:'flex', minHeight:'100vh', backgroundColor: C.bgMain }}>

      {/* ── PC 사이드바 ── */}
      {!isMobile && (
        <Box
          onMouseEnter={() => setExpanded(true)}
          onMouseLeave={() => setExpanded(false)}
          sx={{
            width:sideWidth, flexShrink:0,
            position:'fixed', left:0, top:0, bottom:0,
            backgroundColor: C.bg,
            borderRight:`1px solid ${C.border}`,
            display:'flex', flexDirection:'column',
            py:2, zIndex:200,
            transition:'width 0.25s cubic-bezier(0.4,0,0.2,1)',
            overflow:'hidden',
          }}>

          {/* 로고 */}
          <Box onClick={() => navigate('/')}
            sx={{
              display:'flex', alignItems:'center',
              mx:1, mb:2, borderRadius:2, cursor:'pointer',
              transition:'background-color 0.15s',
              '&:hover':{ backgroundColor: C.hover },
            }}>
            <Box sx={{ width:52, height:48, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <Box sx={{
                width:32, height:32, borderRadius:2,
                background:'linear-gradient(135deg, #E8C96D, #B8952D)',
                display:'flex', alignItems:'center', justifyContent:'center',
              }}>
                <Typography fontWeight={900} fontSize={16} sx={{ color:'#0A0A0A', lineHeight:1 }}>F</Typography>
              </Box>
            </Box>
            <Box sx={{
              overflow:'hidden',
              maxWidth: expanded ? 140 : 0,
              opacity: expanded ? 1 : 0,
              transition: expanded
                ? 'max-width 0.32s cubic-bezier(0.4,0,0.2,1), opacity 0.22s ease 0.06s'
                : 'max-width 0.22s cubic-bezier(0.4,0,0.2,1), opacity 0.1s ease',
            }}>
              <Typography fontWeight={900} letterSpacing={3} fontSize={17}
                sx={{
                  background:'linear-gradient(135deg, #E8C96D, #D4AF37)',
                  WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent',
                  lineHeight:1, whiteSpace:'nowrap',
                }}>
                FITLOG
              </Typography>
              <Typography sx={{ color: isDark ? '#2A2A2A' : '#CCCCCC', letterSpacing:2, fontSize:8, lineHeight:1.5, whiteSpace:'nowrap' }}>
                FASHION ARCHIVE
              </Typography>
            </Box>
          </Box>

          {/* 네비 */}
          <Box sx={{ flex:1, display:'flex', flexDirection:'column', gap:0.5 }}>
            {navItems.map(item => <SideItem key={item.label} {...item} />)}
            <SideItem icon={<SendRounded />} label="채팅" path="/chat"
              onClick={() => navigate('/chat')} badge={chatBadge} />
          </Box>

          <Box sx={{ mx:2, my:1.5, height:'1px', backgroundColor: C.border }} />

          <SideItem
            icon={isDark ? <LightModeRounded /> : <DarkModeRounded />}
            label={isDark ? '라이트 모드' : '다크 모드'}
            onClick={toggleMode}
          />
          <SideItem icon={<SettingsRounded />} label="계정 설정" path="/settings" />
          <SideItem icon={<FavoriteBorderRounded />} label="알림"
            badge={unreadCount || undefined} onClick={openNoti} />

          <Box sx={{ my:0.5 }} />

          {/* 유저 */}
          <Box onClick={() => navigate(`/profile/${user?.username}`)}
            sx={{
              display:'flex', alignItems:'center',
              mx:1, borderRadius:2, cursor:'pointer',
              transition:'background-color 0.15s',
              '&:hover':{ backgroundColor: C.hover },
            }}>
            <Box sx={{ width:52, height:50, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <Avatar
                src={user?.profile_image ? `http://localhost:5000${user.profile_image}` : null}
                sx={{
                  width:34, height:34,
                  bgcolor:'#E8C96D', color:'#0A0A0A',
                  fontSize:13, fontWeight:800,
                  border:`2px solid ${isDark ? '#2A2A2A' : '#E8E8E8'}`,
                }}>
                {user?.username?.[0]?.toUpperCase()}
              </Avatar>
            </Box>
            <Box sx={{
              display:'flex', alignItems:'center', flex:1, minWidth:0, gap:1,
              overflow:'hidden',
              maxWidth: expanded ? 200 : 0,
              opacity: expanded ? 1 : 0,
              transition: expanded
                ? 'max-width 0.32s cubic-bezier(0.4,0,0.2,1), opacity 0.22s ease 0.06s'
                : 'max-width 0.22s cubic-bezier(0.4,0,0.2,1), opacity 0.1s ease',
            }}>
              <Box sx={{ flex:1, minWidth:0 }}>
                <Typography variant="body2" fontWeight={600} noWrap fontSize={13} sx={{ color: C.text }}>
                  {user?.username}
                </Typography>
                <Typography variant="caption" sx={{ color: C.textSub, fontSize:11 }}>
                  내 프로필
                </Typography>
              </Box>
              <IconButton disableRipple size="small"
                onClick={(e) => { e.stopPropagation(); handleLogout(); }}
                sx={{ color: C.textSub, flexShrink:0, '&:hover':{ color:'#FF6B6B' }, p:0.5, mr:0.5 }}>
                <LogoutRounded sx={{ fontSize:16 }} />
              </IconButton>
            </Box>
          </Box>
        </Box>
      )}

      {/* ── 모바일 상단바 ── */}
      {isMobile && (
        <Box sx={{
          position:'fixed', top:0, left:0, right:0, zIndex:200,
          backgroundColor: isDark ? 'rgba(10,10,10,0.92)' : 'rgba(255,255,255,0.92)',
          backdropFilter:'blur(24px)',
          borderBottom:`1px solid ${C.border}`,
          display:'flex', alignItems:'center', justifyContent:'space-between',
          px:2, height:52,
        }}>
          <Box sx={{ display:'flex', alignItems:'center', gap:1 }}>
            <Box sx={{
              width:26, height:26, borderRadius:1.5,
              background:'linear-gradient(135deg, #E8C96D, #B8952D)',
              display:'flex', alignItems:'center', justifyContent:'center',
            }}>
              <Typography fontWeight={900} fontSize={13} sx={{ color:'#0A0A0A' }}>F</Typography>
            </Box>
            <Typography fontWeight={900} letterSpacing={3} fontSize={17}
              sx={{
                background:'linear-gradient(135deg, #E8C96D, #D4AF37)',
                WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent',
              }}>
              FITLOG
            </Typography>
          </Box>
          <Box sx={{ display:'flex', gap:0.5 }}>
            <IconButton disableRipple size="small" onClick={toggleMode}
              sx={{ color: isDark ? '#808080' : '#555555' }}>
              {isDark
                ? <LightModeRounded sx={{ fontSize:22 }} />
                : <DarkModeRounded sx={{ fontSize:22 }} />}
            </IconButton>
            <IconButton disableRipple size="small"
              onClick={() => navigate('/settings')}
              sx={{ color: isDark ? '#808080' : '#555555' }}>
              <SettingsRounded sx={{ fontSize:22 }} />
            </IconButton>
            <IconButton disableRipple size="small" onClick={openNoti}
              sx={{ color: isDark ? '#808080' : '#555555' }}>
              <Badge badgeContent={unreadCount} color="error"
                sx={{ '& .MuiBadge-badge':{ fontSize:9, minWidth:15, height:15 } }}>
                <FavoriteBorderRounded sx={{ fontSize:25 }} />
              </Badge>
            </IconButton>
            <IconButton disableRipple size="small"
              onClick={() => navigate('/chat')}
              sx={{ color: isDark ? '#808080' : '#555555' }}>
              <Badge badgeContent={chatBadge} color="error"
                sx={{ '& .MuiBadge-badge':{ fontSize:9, minWidth:15, height:15 } }}>
                <SendRounded sx={{ fontSize:23 }} />
              </Badge>
            </IconButton>
          </Box>
        </Box>
      )}

      {/* ── 알림 드로어 ── */}
      <Drawer
        anchor={isMobile ? 'bottom' : 'left'}
        open={notiOpen}
        onClose={() => { setNotiOpen(false); resetUnreadCount(); }}
        PaperProps={{
          sx:{
            width: isMobile ? '100%' : 380,
            ml: isMobile ? 0 : `${sideWidth}px`,
            backgroundColor: C.drawerBg,
            borderRight:`1px solid ${C.border}`,
            borderTop: isMobile ? `1px solid ${C.border}` : 'none',
            borderRadius: isMobile ? '20px 20px 0 0' : 0,
            maxHeight: isMobile ? '85vh' : '100vh',
            display:'flex', flexDirection:'column',
          },
        }}>

        {/* 헤더 + 필터 */}
        <Box sx={{ px:3, pt:3, pb:1.5, flexShrink:0, borderBottom:`1px solid ${C.border2}` }}>
          <Typography fontWeight={700} fontSize={18} mb={2} sx={{ color: C.text }}>알림</Typography>
          <Box sx={{ display:'flex', gap:1, overflowX:'auto', pb:0.5,
            '&::-webkit-scrollbar':{ display:'none' } }}>
            {['모두','팔로우','좋아요','댓글'].map(tab => (
              <Box key={tab} onClick={() => setNotiTab(tab)}
                sx={{
                  px:1.5, py:0.5, borderRadius:20, flexShrink:0, cursor:'pointer',
                  backgroundColor: notiTab === tab
                    ? (isDark ? '#F0F0F0' : '#0A0A0A')
                    : (isDark ? '#1A1A1A' : '#F0F0F0'),
                  color: notiTab === tab
                    ? (isDark ? '#0A0A0A' : '#FFFFFF')
                    : (isDark ? '#707070' : '#888888'),
                  fontSize:12, fontWeight: notiTab === tab ? 700 : 400,
                  border:`1px solid ${notiTab === tab
                    ? (isDark ? '#F0F0F0' : '#0A0A0A')
                    : (isDark ? '#2A2A2A' : '#E0E0E0')}`,
                  transition:'all 0.15s',
                }}>
                {tab}
              </Box>
            ))}
          </Box>
        </Box>

        {/* 스크롤 영역 */}
        <Box sx={{
          flex:1, overflowY:'auto', px:2, py:1,
          '&::-webkit-scrollbar':{ width:3 },
          '&::-webkit-scrollbar-thumb':{ backgroundColor: isDark ? '#2A2A2A' : '#DDDDDD', borderRadius:4 },
        }}>
          {filteredNotifications.length === 0 ? (
            <Box sx={{ textAlign:'center', py:8 }}>
              <Typography sx={{ fontSize:36, mb:2, opacity:0.2 }}>🔔</Typography>
              <Typography color="text.secondary" fontSize={13}>알림이 없어요</Typography>
            </Box>
          ) : (
            <>
              {thisMonth.length > 0 && (
                <>
                  <Typography fontSize={12} fontWeight={700}
                    sx={{ color: isDark ? '#505050' : '#AAAAAA', px:1, py:1.5, letterSpacing:0.5 }}>
                    이번 달
                  </Typography>
                  {thisMonth.map((n, i) => (
                    <NotiItem key={`m-${i}`} n={n}
                      notiIcon={notiIcon} notiText={notiText} timeAgoNoti={timeAgoNoti} />
                  ))}
                </>
              )}
              {older.length > 0 && (
                <>
                  <Typography fontSize={12} fontWeight={700}
                    sx={{ color: isDark ? '#505050' : '#AAAAAA', px:1, py:1.5, mt:0.5, letterSpacing:0.5 }}>
                    이전 활동
                  </Typography>
                  {older.map((n, i) => (
                    <NotiItem key={`o-${i}`} n={n}
                      notiIcon={notiIcon} notiText={notiText} timeAgoNoti={timeAgoNoti} />
                  ))}
                </>
              )}
            </>
          )}
        </Box>
      </Drawer>

      {/* ── PC 오른쪽 상단 아이콘 ── */}
      {!isMobile && (
        <Box sx={{
          position:'fixed', top:14, right:20,
          display:'flex', alignItems:'center', gap:0.5,
          zIndex:100,
        }}>
          <Tooltip title={isDark ? '라이트 모드' : '다크 모드'} arrow>
            <IconButton disableRipple onClick={toggleMode}
              sx={{ color: isDark ? '#505050' : '#888888', '&:hover':{ color: C.text } }}>
              {isDark
                ? <LightModeRounded sx={{ fontSize:22 }} />
                : <DarkModeRounded sx={{ fontSize:22 }} />}
            </IconButton>
          </Tooltip>
          <Tooltip title="알림" arrow>
            <IconButton disableRipple onClick={openNoti}
              sx={{ color: isDark ? '#505050' : '#888888', '&:hover':{ color: C.text } }}>
              <Badge badgeContent={unreadCount} color="error"
                sx={{ '& .MuiBadge-badge':{ fontSize:9, minWidth:16, height:16 } }}>
                <FavoriteBorderRounded sx={{ fontSize:24 }} />
              </Badge>
            </IconButton>
          </Tooltip>
          <Tooltip title="채팅" arrow>
            <IconButton disableRipple onClick={() => navigate('/chat')}
              sx={{ color: isDark ? '#505050' : '#888888', '&:hover':{ color: C.text } }}>
              <Badge badgeContent={chatBadge} color="error" max={99}
                sx={{ '& .MuiBadge-badge':{ fontSize:9, minWidth:16, height:16 } }}>
                <SendRounded sx={{ fontSize:22 }} />
              </Badge>
            </IconButton>
          </Tooltip>
          <Tooltip title="내 프로필" arrow>
            <Avatar
              src={user?.profile_image ? `http://localhost:5000${user.profile_image}` : null}
              onClick={() => navigate(`/profile/${user?.username}`)}
              sx={{
                width:30, height:30, ml:0.5, cursor:'pointer',
                bgcolor:'#E8C96D', color:'#0A0A0A',
                fontSize:12, fontWeight:800,
                border:`1.5px solid ${isDark ? '#252525' : '#E0E0E0'}`,
                '&:hover':{ borderColor:'#E8C96D' },
              }}>
              {user?.username?.[0]?.toUpperCase()}
            </Avatar>
          </Tooltip>
        </Box>
      )}

      {/* ── 메인 콘텐츠 ── */}
      <Box sx={{
        flex:1,
        ml: isMobile ? 0 : `${72}px`,
        mt: isMobile ? '52px' : 0,
        mb: isMobile ? '56px' : 0,
        minHeight:'100vh',
        maxWidth: isMobile ? '100%' : 'calc(100vw - 72px)',
        transition:'margin-left 0.25s cubic-bezier(0.4,0,0.2,1)',
      }}>
        <Outlet />
      </Box>

      {/* ── 미니 채팅 (PC 전용, 채팅 페이지 제외) ── */}
      {!isMobile && location.pathname !== '/chat' && <MiniChat />}

      {/* ── 모바일 하단 네비 ── */}
      {isMobile && (
        <BottomNavigation
          value={navItems.findIndex(item => isActive(item.path))}
          onChange={(_, val) => navigate(navItems[val].path)}
          sx={{
            position:'fixed', bottom:0, left:0, right:0, zIndex:200,
            height:56,
            backgroundColor: isDark ? 'rgba(10,10,10,0.95)' : 'rgba(255,255,255,0.95)',
            backdropFilter:'blur(24px)',
            borderTop:`1px solid ${C.border}`,
          }}>
          {navItems.map(item => (
            <BottomNavigationAction key={item.label} icon={item.icon}
              sx={{
                color: isDark ? '#404040' : '#AAAAAA',
                '&.Mui-selected':{ color:'#E8C96D' },
                minWidth:'auto',
              }} />
          ))}
        </BottomNavigation>
      )}
    </Box>
  );
}