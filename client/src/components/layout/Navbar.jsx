import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Box, Typography, IconButton, Avatar, Badge,
  BottomNavigation, BottomNavigationAction,
  useMediaQuery, useTheme, Tooltip, Drawer,
} from '@mui/material';
import {
  HomeRounded, ExploreRounded, AddBoxRounded,
  PersonRounded, LogoutRounded, FavoriteBorderRounded,
  SendRounded, ChatRounded, SearchRounded,
} from '@mui/icons-material';
import toast from 'react-hot-toast';
import useAuthStore from '../../store/authStore';
import useNotificationStore from '../../store/notificationStore';
import useSocket from '../../hooks/useSocket';
import { logout as logoutApi } from '../../api/authApi';

const Navbar = () => {
  const navigate  = useNavigate();
  const location  = useLocation();
  const theme     = useTheme();
  const isMobile  = useMediaQuery(theme.breakpoints.down('md'));
  const { user, logout }                             = useAuthStore();
  const { unreadCount, unreadChat, resetUnreadChat } = useNotificationStore();
  const [expanded, setExpanded]   = useState(false);
  const [notiOpen, setNotiOpen]   = useState(false);
  useSocket();

  const navItems = [
    { label: '홈',     icon: <HomeRounded />,    path: '/' },
    { label: '탐색',   icon: <ExploreRounded />, path: '/explore' },
    { label: '검색',   icon: <SearchRounded />,  path: '/search' },
    { label: '업로드', icon: <AddBoxRounded />,  path: '/post/create' },
    { label: '프로필', icon: <PersonRounded />,  path: `/profile/${user?.username}` },
  ];

  const isActive = (path) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path.split(':')[0]);

  const chatBadge  = unreadChat > 99 ? '99+' : unreadChat || 0;
  const sideWidth  = expanded ? 240 : 72;

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

  const SideItem = ({ icon, label, path, onClick, badge }) => {
    const active = path ? isActive(path) : false;
    return (
      <Tooltip title={!expanded ? label : ''} placement="right" arrow>
        <Box
          onClick={onClick || (() => navigate(path))}
          sx={{
            display: 'flex', alignItems: 'center',
            gap: expanded ? 2 : 0,
            px: expanded ? 2 : 0,
            py: 1.5,
            borderRadius: 3,
            cursor: 'pointer',
            justifyContent: expanded ? 'flex-start' : 'center',
            color: active ? '#F0F0F0' : '#505050',
            backgroundColor: active ? 'rgba(255,255,255,0.07)' : 'transparent',
            position: 'relative',
            overflow: 'hidden',
            transition: 'all 0.2s ease',
            '&:hover': {
              color: '#F0F0F0',
              backgroundColor: 'rgba(255,255,255,0.05)',
            },
            '&:hover .nav-label': { opacity: 1 },
            '& svg': {
              fontSize: 26,
              transition: 'transform 0.2s ease',
            },
            '&:hover svg': { transform: 'scale(1.1)' },
          }}>
          {badge !== undefined ? (
            <Badge badgeContent={badge} color="error"
              sx={{ '& .MuiBadge-badge': { fontSize: 9, minWidth: 16, height: 16, top: -2, right: -2 } }}>
              {icon}
            </Badge>
          ) : icon}
          {expanded && (
            <Typography
              className="nav-label"
              fontWeight={active ? 700 : 400}
              fontSize={15}
              sx={{ whiteSpace: 'nowrap', transition: 'opacity 0.2s' }}>
              {label}
            </Typography>
          )}
          {active && (
            <Box sx={{
              position: 'absolute', left: 0, top: '20%', bottom: '20%',
              width: 3, borderRadius: '0 3px 3px 0',
              backgroundColor: '#E8C96D',
            }} />
          )}
        </Box>
      </Tooltip>
    );
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: '#0A0A0A' }}>

      {/* ── PC 사이드바 ── */}
      {!isMobile && (
        <Box
          onMouseEnter={() => setExpanded(true)}
          onMouseLeave={() => setExpanded(false)}
          sx={{
            width: sideWidth,
            flexShrink: 0,
            position: 'fixed', left: 0, top: 0, bottom: 0,
            backgroundColor: '#0D0D0D',
            borderRight: '1px solid #1A1A1A',
            display: 'flex', flexDirection: 'column',
            py: 2,
            zIndex: 200,
            transition: 'width 0.25s cubic-bezier(0.4,0,0.2,1)',
            overflow: 'hidden',
          }}>

          {/* 로고 */}
          <Box
            onClick={() => navigate('/')}
            sx={{
              px: expanded ? 2.5 : 0,
              py: 1.5, mb: 2,
              display: 'flex', alignItems: 'center',
              justifyContent: expanded ? 'flex-start' : 'center',
              cursor: 'pointer', gap: 1.5,
              transition: 'all 0.25s ease',
            }}>
            <Box sx={{
              width: 32, height: 32, borderRadius: 2, flexShrink: 0,
              background: 'linear-gradient(135deg, #E8C96D, #B8952D)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Typography fontWeight={900} fontSize={16} sx={{ color: '#0A0A0A', lineHeight: 1 }}>F</Typography>
            </Box>
            {expanded && (
              <Box>
                <Typography fontWeight={900} letterSpacing={3} fontSize={17}
                  sx={{
                    background: 'linear-gradient(135deg, #E8C96D, #D4AF37)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    lineHeight: 1,
                  }}>
                  FITLOG
                </Typography>
                <Typography sx={{ color: '#2A2A2A', letterSpacing: 2, fontSize: 8, lineHeight: 1.5 }}>
                  FASHION ARCHIVE
                </Typography>
              </Box>
            )}
          </Box>

          {/* 네비 아이템 */}
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', px: expanded ? 1.5 : 1, gap: 0.5 }}>
            {navItems.map(item => (
              <SideItem key={item.label} {...item} />
            ))}
            <SideItem
              icon={<SendRounded />}
              label="채팅"
              path="/chat"
              onClick={() => { resetUnreadChat(); navigate('/chat'); }}
              badge={chatBadge}
            />
          </Box>

          {/* 구분선 */}
          <Box sx={{ mx: 1.5, my: 1.5, height: '1px', backgroundColor: '#1A1A1A' }} />

          {/* 알림 */}
          <Box sx={{ px: expanded ? 1.5 : 1, mb: 0.5 }}>
            <SideItem
              icon={<FavoriteBorderRounded />}
              label="알림"
              badge={unreadCount}
              onClick={() => setNotiOpen(true)}
            />
          </Box>

          {/* 유저 */}
          <Box
            onClick={() => navigate(`/profile/${user?.username}`)}
            sx={{
              mx: 1, p: 1.5,
              borderRadius: 3, cursor: 'pointer',
              display: 'flex', alignItems: 'center',
              gap: expanded ? 1.5 : 0,
              justifyContent: expanded ? 'flex-start' : 'center',
              transition: 'all 0.25s ease',
              '&:hover': { backgroundColor: 'rgba(255,255,255,0.04)' },
            }}>
            <Avatar
              src={user?.profile_image ? `http://localhost:5000${user.profile_image}` : null}
              sx={{
                width: 34, height: 34, flexShrink: 0,
                bgcolor: '#E8C96D', color: '#0A0A0A',
                fontSize: 13, fontWeight: 800,
                border: '2px solid #2A2A2A',
              }}>
              {user?.username?.[0]?.toUpperCase()}
            </Avatar>
            {expanded && (
              <>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body2" fontWeight={600} noWrap fontSize={13}>
                    {user?.username}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#404040', fontSize: 11 }}>
                    내 프로필
                  </Typography>
                </Box>
                <IconButton size="small"
                  onClick={(e) => { e.stopPropagation(); handleLogout(); }}
                  sx={{ color: '#333', flexShrink: 0, '&:hover': { color: '#FF6B6B' }, p: 0.5 }}>
                  <LogoutRounded sx={{ fontSize: 16 }} />
                </IconButton>
              </>
            )}
          </Box>
        </Box>
      )}

      {/* ── 모바일 상단 바 ── */}
      {isMobile && (
        <Box sx={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200,
          backgroundColor: 'rgba(10,10,10,0.92)',
          backdropFilter: 'blur(24px)',
          borderBottom: '1px solid #1A1A1A',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          px: 2, height: 52,
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{
              width: 26, height: 26, borderRadius: 1.5,
              background: 'linear-gradient(135deg, #E8C96D, #B8952D)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Typography fontWeight={900} fontSize={13} sx={{ color: '#0A0A0A' }}>F</Typography>
            </Box>
            <Typography fontWeight={900} letterSpacing={3} fontSize={17}
              sx={{
                background: 'linear-gradient(135deg, #E8C96D, #D4AF37)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}>
              FITLOG
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <IconButton size="small" onClick={() => setNotiOpen(true)} sx={{ color: '#808080' }}>
              <Badge badgeContent={unreadCount} color="error"
                sx={{ '& .MuiBadge-badge': { fontSize: 9, minWidth: 15, height: 15 } }}>
                <FavoriteBorderRounded sx={{ fontSize: 25 }} />
              </Badge>
            </IconButton>
            <IconButton size="small" onClick={() => { resetUnreadChat(); navigate('/chat'); }} sx={{ color: '#808080' }}>
              <Badge badgeContent={chatBadge} color="error"
                sx={{ '& .MuiBadge-badge': { fontSize: 9, minWidth: 15, height: 15 } }}>
                <SendRounded sx={{ fontSize: 23 }} />
              </Badge>
            </IconButton>
          </Box>
        </Box>
      )}

      {/* ── 알림 드로어 ── */}
      <Drawer anchor={isMobile ? 'bottom' : 'left'} open={notiOpen} onClose={() => setNotiOpen(false)}
        PaperProps={{
          sx: {
            width: isMobile ? '100%' : 380,
            ml: isMobile ? 0 : `${sideWidth}px`,
            backgroundColor: '#0D0D0D',
            borderRight: '1px solid #1A1A1A',
            borderTop: isMobile ? '1px solid #1A1A1A' : 'none',
            borderRadius: isMobile ? '20px 20px 0 0' : 0,
            maxHeight: isMobile ? '80vh' : '100vh',
          },
        }}>
        <Box sx={{ p: 3 }}>
          <Typography fontWeight={700} fontSize={18} mb={3}>알림</Typography>
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography sx={{ fontSize: 48, mb: 2 }}>🔔</Typography>
            <Typography color="text.secondary" fontSize={14}>새 알림이 없어요</Typography>
          </Box>
        </Box>
      </Drawer>

      {/* ── 오른쪽 상단 아이콘 (PC) ── */}
      {!isMobile && (
        <Box sx={{
          position: 'fixed', top: 18, right: 28,
          display: 'flex', alignItems: 'center', gap: 0.5,
          zIndex: 100,
        }}>
          <Tooltip title="알림" arrow>
            <IconButton onClick={() => setNotiOpen(true)}
              sx={{ color: '#505050', '&:hover': { color: '#F0F0F0', backgroundColor: 'rgba(255,255,255,0.05)' } }}>
              <Badge badgeContent={unreadCount} color="error"
                sx={{ '& .MuiBadge-badge': { fontSize: 10, minWidth: 17, height: 17 } }}>
                <FavoriteBorderRounded sx={{ fontSize: 26 }} />
              </Badge>
            </IconButton>
          </Tooltip>
          <Tooltip title="채팅" arrow>
            <IconButton onClick={() => { resetUnreadChat(); navigate('/chat'); }}
              sx={{ color: '#505050', '&:hover': { color: '#F0F0F0', backgroundColor: 'rgba(255,255,255,0.05)' } }}>
              <Badge badgeContent={chatBadge} color="error" max={99}
                sx={{ '& .MuiBadge-badge': { fontSize: 10, minWidth: 17, height: 17 } }}>
                <SendRounded sx={{ fontSize: 24 }} />
              </Badge>
            </IconButton>
          </Tooltip>
          <Tooltip title="내 프로필" arrow>
            <Avatar
              src={user?.profile_image ? `http://localhost:5000${user.profile_image}` : null}
              onClick={() => navigate(`/profile/${user?.username}`)}
              sx={{
                width: 32, height: 32, ml: 0.5, cursor: 'pointer',
                bgcolor: '#E8C96D', color: '#0A0A0A',
                fontSize: 13, fontWeight: 800,
                border: '2px solid #2A2A2A',
                transition: 'border-color 0.2s',
                '&:hover': { borderColor: '#E8C96D' },
              }}>
              {user?.username?.[0]?.toUpperCase()}
            </Avatar>
          </Tooltip>
        </Box>
      )}

      {/* ── 메인 콘텐츠 ── */}
      <Box sx={{
        flex: 1,
        ml: isMobile ? 0 : `${72}px`,
        mt: isMobile ? '52px' : 0,
        mb: isMobile ? '56px' : 0,
        minHeight: '100vh',
        transition: 'margin-left 0.25s cubic-bezier(0.4,0,0.2,1)',
      }}>
        <Outlet />
      </Box>

      {/* ── 모바일 하단 네비 ── */}
      {isMobile && (
        <BottomNavigation
          value={navItems.findIndex(item => isActive(item.path))}
          onChange={(_, val) => navigate(navItems[val].path)}
          sx={{
            position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 200,
            height: 56,
            backgroundColor: 'rgba(10,10,10,0.95)',
            backdropFilter: 'blur(24px)',
            borderTop: '1px solid #1A1A1A',
          }}>
          {navItems.map(item => (
            <BottomNavigationAction key={item.label} icon={item.icon}
              sx={{ color: '#404040', '&.Mui-selected': { color: '#F0F0F0' }, minWidth: 'auto' }} />
          ))}
        </BottomNavigation>
      )}
    </Box>
  );
};

export default Navbar;