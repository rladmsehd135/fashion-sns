import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Avatar, Typography, Button,
  Tab, Tabs, CircularProgress, Chip,
  Dialog, IconButton, Divider, Tooltip,
} from '@mui/material';
import {
  GridOnRounded, BookmarkBorderRounded, CloseRounded,
  AutoAwesomeRounded, CalendarMonthRounded, PsychologyRounded, HelpOutlineRounded, TrendingUpRounded,
} from '@mui/icons-material';
import RankBadge from '../../components/common/RankBadge';
import OOTDCalendar from './OOTDCalendar';
import StyleTimeline from './StyleTimeline';
import { getProfile, toggleFollow, getFollowers, getFollowing } from '../../api/userApi';
import { getUserPosts, getMyBookmarks } from '../../api/postApi';
import { sendRequest, getRooms } from '../../api/chatApi';
import useAuthStore from '../../store/authStore';
import useThemeStore from '../../store/themeStore';
import PostCard from '../../components/post/PostCard';
import StyleReportModal from './StyleReportModal';
import StyleMatchModal from './StyleMatchModal';
import toast from 'react-hot-toast';

const FollowModal = ({ open, onClose, type, userId, isDark }) => {
  const navigate     = useNavigate();
  const { user: me } = useAuthStore();
  const [list, setList]           = useState([]);
  const [loading, setLoading]     = useState(false);
  const [followMap, setFollowMap] = useState({});

  const C = {
    bg:      isDark ? '#0D0D0D' : '#FFFFFF',
    border:  isDark ? '#1A1A1A' : '#EBEBEB',
    text:    isDark ? '#EFEFEF' : '#0A0A0A',
    textSub: isDark ? '#606060' : '#AAAAAA',
    hover:   isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
    avatarBg:isDark ? '#1A1A1A' : '#F0F0F0',
  };

  useEffect(() => {
    if (!open || !userId) return;
    setLoading(true);
    setFollowMap({});
    const api = type === 'followers' ? getFollowers(userId) : getFollowing(userId);
    api.then(res => {
      const data = res.data || [];
      setList(data);
      const map = {};
      data.forEach(u => { map[u.id] = u.is_following > 0; });
      setFollowMap(map);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [open, type, userId]);

  const handleFollow = async (u) => {
    if (u.id === me?.id) return;
    try {
      await toggleFollow(u.id);
      setFollowMap(prev => ({ ...prev, [u.id]: !prev[u.id] }));
    } catch {}
  };

  const handleUserClick = (username) => {
    onClose();
    navigate(`/profile/${username}`);
  };

  const renderButton = (u) => {
    if (u.id === me?.id) return null;
    const isFollowing = followMap[u.id] ?? false;

    if (type === 'following') {
      return (
        <Box onClick={() => handleFollow(u)}
          sx={{
            px:1.5, py:0.5, borderRadius:8, flexShrink:0,
            cursor:'pointer', fontSize:12, fontWeight:700,
            backgroundColor:'transparent',
            color: isDark ? '#808080' : '#AAAAAA',
            border:`1px solid ${isDark ? '#2A2A2A' : '#DDDDDD'}`,
            transition:'all 0.15s',
            '&:hover':{ color:'#FF6B6B', borderColor:'#FF6B6B' },
          }}>
          팔로잉
        </Box>
      );
    }

    return (
      <Box onClick={() => handleFollow(u)}
        sx={{
          px:1.5, py:0.5, borderRadius:8, flexShrink:0,
          cursor:'pointer', fontSize:12, fontWeight:700,
          backgroundColor: isFollowing
            ? 'transparent'
            : (isDark ? '#EFEFEF' : '#0A0A0A'),
          color: isFollowing
            ? (isDark ? '#808080' : '#AAAAAA')
            : (isDark ? '#0A0A0A' : '#FFFFFF'),
          border: isFollowing
            ? `1px solid ${isDark ? '#2A2A2A' : '#DDDDDD'}`
            : 'none',
          transition:'all 0.15s',
          '&:hover':{ opacity:0.85 },
        }}>
        {isFollowing ? '팔로잉' : '맞팔로우'}
      </Box>
    );
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth
      PaperProps={{
        sx:{
          backgroundColor: C.bg, backgroundImage:'none',
          border:`1px solid ${C.border}`,
          borderRadius:3, maxHeight:'70vh',
        },
      }}>

      {/* 헤더 */}
      <Box sx={{
        display:'flex', alignItems:'center', justifyContent:'center',
        px:2, py:1.5, borderBottom:`1px solid ${C.border}`,
        position:'relative',
      }}>
        <Typography fontWeight={700} fontSize={15} sx={{ color: C.text }}>
          {type === 'followers' ? '팔로워' : '팔로잉'}
        </Typography>
        <IconButton onClick={onClose} size="small"
          sx={{ position:'absolute', right:8, color: C.textSub,
            '&:hover':{ color: C.text } }}>
          <CloseRounded sx={{ fontSize:20 }} />
        </IconButton>
      </Box>

      {/* 목록 */}
      <Box sx={{
        overflowY:'auto',
        '&::-webkit-scrollbar':{ width:3 },
        '&::-webkit-scrollbar-thumb':{ backgroundColor: isDark ? '#2A2A2A' : '#DDDDDD', borderRadius:4 },
      }}>
        {loading ? (
          <Box sx={{ display:'flex', justifyContent:'center', py:6 }}>
            <CircularProgress size={24} sx={{ color:'#E8C96D' }} />
          </Box>
        ) : list.length === 0 ? (
          <Box sx={{ textAlign:'center', py:6 }}>
            <Typography fontSize={13} sx={{ color: C.textSub }}>
              {type === 'followers' ? '팔로워가 없어요' : '팔로잉이 없어요'}
            </Typography>
          </Box>
        ) : list.map((u, idx) => (
          <Box key={u.id}>
            <Box sx={{
              display:'flex', alignItems:'center', gap:1.5,
              px:2, py:1.5, transition:'background 0.15s',
              '&:hover':{ backgroundColor: C.hover },
            }}>
              <Avatar
                src={u.profile_image ? `http://localhost:5000${u.profile_image}` : null}
                sx={{
                  width:44, height:44, flexShrink:0,
                  bgcolor: C.avatarBg, color:'#E8C96D',
                  fontWeight:800, fontSize:16,
                  border:`1.5px solid ${C.border}`,
                  cursor:'pointer',
                }}
                onClick={() => handleUserClick(u.username)}>
                {u.username?.[0]?.toUpperCase()}
              </Avatar>

              <Box sx={{ flex:1, minWidth:0, cursor:'pointer' }}
                onClick={() => handleUserClick(u.username)}>
                <Typography fontSize={13} fontWeight={700}
                  sx={{ color: C.text, '&:hover':{ color:'#E8C96D' } }}>
                  {u.username}
                </Typography>
                {u.bio && (
                  <Typography fontSize={12} noWrap sx={{ color: C.textSub, mt:0.2 }}>
                    {u.bio}
                  </Typography>
                )}
              </Box>

              {renderButton(u)}
            </Box>
            {idx < list.length - 1 && (
              <Divider sx={{ borderColor: C.border, mx:2 }} />
            )}
          </Box>
        ))}
      </Box>
    </Dialog>
  );
};

const Profile = () => {
  const { username } = useParams();
  const navigate     = useNavigate();
  const { user: me } = useAuthStore();
  const { mode }     = useThemeStore();
  const isDark       = mode === 'dark';

  const [profile, setProfile]     = useState(null);
  const [posts, setPosts]         = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [tab, setTab]             = useState(0);
  const [loading, setLoading]     = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState('followers');
  const [showReport, setShowReport] = useState(false);
  const [showMatch, setShowMatch] = useState(false);

  const isMe = me?.username === username;

  // 순위별 배지 색상 결정 (Oracle RANK()는 문자열로 올 수 있어 Number 변환)
  const getRankBadge = (rank, wins) => {
    const r = Number(rank);
    const w = Number(wins);
    if (!w || w <= 0) return null;
    if (r === 1) return { color: '#FFD700', label: '1st Style King' };
    if (r === 2) return { color: '#C0C0C0', label: '2nd Style King' };
    if (r === 3) return { color: '#CD7F32', label: '3rd Style King' };
    return null;
  };
  const rankBadge = getRankBadge(profile?.win_rank, profile?.total_wins);

  const C = {
    bg:          isDark ? '#0A0A0A' : '#FFFFFF',
    text:        isDark ? '#F0F0F0' : '#0A0A0A',
    textSub:     isDark ? '#D0D0D0' : '#444444',
    textMid:     isDark ? '#808080' : '#888888',
    border:      isDark ? '#1E1E1E' : '#EBEBEB',
    chipBg:      isDark ? '#1A1A1A' : '#F5F5F5',
    chipBd:      isDark ? '#2A2A2A' : '#E0E0E0',
    btnBd:       isDark ? '#2A2A2A' : '#DBDBDB',
    btnColor:    isDark ? '#F0F0F0' : '#262626',
    avatarBorder:isDark ? '#0A0A0A' : '#FFFFFF',
    tabInactive: isDark ? '#505050' : '#AAAAAA',
    tabActive:   isDark ? '#F0F0F0' : '#0A0A0A',
    indicator:   isDark ? '#F0F0F0' : '#0A0A0A',
  };

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      setLoading(true);
      try {
        const res = await getProfile(username);
        if (!isMounted) return;
        setProfile(res.data);
        const requests = [getUserPosts(res.data.id)];
        if (me?.username === username) requests.push(getMyBookmarks());
        const [postRes, bmRes] = await Promise.all(requests);
        if (!isMounted) return;
        setPosts(postRes.data || []);
        if (bmRes) setBookmarks(bmRes.data || []);
      } catch (err) { console.error(err); }
      finally { if (isMounted) setLoading(false); }
    };
    loadData();
    return () => { isMounted = false; };
  }, [username, me?.username]);

  const handleMessage = async () => {
    try {
      const roomsRes = await getRooms();
      const existing = roomsRes.data.find(r => r.partner_id === profile.id);
      if (existing) { navigate('/chat', { state:{ openRoomId: existing.id } }); return; }
      await sendRequest(profile.id);
      toast.success('채팅 요청을 보냈습니다.');
      navigate('/chat');
    } catch (err) {
      if (err.response?.status === 409) navigate('/chat');
      else toast.error('잠시 후 다시 시도해주세요.');
    }
  };

  const handleFollow = async () => {
    try {
      const res = await toggleFollow(profile.id);
      setProfile(prev => ({
        ...prev,
        is_following: res.data.following ? 1 : 0,
        follower_count: res.data.following
          ? prev.follower_count + 1
          : prev.follower_count - 1,
      }));
      toast.success(res.data.following
        ? `${profile.username}님을 팔로우했어요.`
        : '팔로우를 취소했어요.');
    } catch { toast.error('잠시 후 다시 시도해주세요.'); }
  };

  const openModal = (type) => {
    setModalType(type);
    setModalOpen(true);
  };

  if (loading) return (
    <Box sx={{ display:'flex', justifyContent:'center', pt:10 }}>
      <CircularProgress sx={{ color:'#E8C96D' }} size={28} />
    </Box>
  );
  if (!profile) return (
    <Box sx={{ textAlign:'center', pt:10 }}>
      <Typography>유저를 찾을 수 없어요.</Typography>
    </Box>
  );

  // tab: 0=게시물, 1=타임라인, 2=캘린더(isMe), 3=저장됨(isMe)
  const displayPosts = (isMe && tab === 3) ? bookmarks : posts;

  return (
    <Box sx={{ maxWidth:935, mx:'auto', backgroundColor: C.bg, minHeight:'100vh' }}>

      <FollowModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        type={modalType}
        userId={profile.id}
        isDark={isDark}
      />

      <StyleReportModal
        open={showReport}
        onClose={() => setShowReport(false)}
        isDark={isDark}
      />

      <StyleMatchModal
        open={showMatch}
        onClose={() => setShowMatch(false)}
        targetUser={profile}
        isDark={isDark}
      />

      {/* 프로필 헤더 */}
      <Box sx={{ px:{ xs:2, md:4 }, pt:4, pb:3 }}>
        <Box sx={{ display:'flex', alignItems:'flex-start', gap:{ xs:3, md:6 }, mb:3 }}>

          {/* 아바타 */}
          <Box sx={{ flexShrink: 0, position: 'relative' }}>
            <Box sx={{
              p: '3px', borderRadius: '50%',
              background: profile.is_following || isMe
                ? 'linear-gradient(45deg, #E8C96D, #D4AF37)'
                : C.border,
            }}>
              <Avatar
                src={profile.profile_image
                  ? `http://localhost:5000${profile.profile_image}` : null}
                sx={{
                  width: { xs: 80, md: 150 }, height: { xs: 80, md: 150 },
                  fontSize: { xs: 28, md: 52 },
                  bgcolor: isDark ? '#1A1A1A' : '#F0F0F0',
                  color: '#E8C96D', fontWeight: 800,
                  border: `3px solid ${C.avatarBorder}`,
                }}>
                {profile.username?.[0]?.toUpperCase()}
              </Avatar>
            </Box>
            {/* 배틀 순위 오버레이 배지 (인스타 인증 배지 스타일) */}
            {rankBadge && (
              <Box sx={{
                position: 'absolute',
                bottom: { xs: 2, md: 6 },
                right: { xs: 2, md: 6 },
                border: `2.5px solid ${C.bg}`,
                borderRadius: '50%',
                lineHeight: 0,
              }}>
                <RankBadge rank={profile.win_rank} wins={profile.total_wins} size="overlay" />
              </Box>
            )}
          </Box>

          {/* 정보 */}
          <Box sx={{ flex:1, pt:1 }}>
            <Box sx={{ mb: 2 }}>
              {profile?.style_archetype && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                  <Typography fontSize={10} fontWeight={800} letterSpacing={2} sx={{ color: '#E8C96D', opacity: 0.8 }}>
                    {profile.style_archetype}
                  </Typography>
                  <Tooltip 
                    title={profile.style_archetype_desc ? (
                      <Box sx={{ p: 0.5 }}><strong>{profile.style_archetype}</strong>: {profile.style_archetype_desc}</Box>
                    ) : "AI가 당신의 스타일을 분석하여 부여한 고유한 정체성입니다."}
                    arrow placement="top"
                  >
                    <HelpOutlineRounded sx={{ fontSize: 12, color: '#E8C96D', opacity: 0.5, cursor: 'help' }} />
                  </Tooltip>
                </Box>
              )}
              <Box sx={{ display:'flex', alignItems:'center', gap:2, flexWrap:'wrap' }}>
                <Typography fontWeight={200}
                  sx={{ fontSize:{ xs:18, md:28 }, color: C.text, letterSpacing: '0.04em', fontFamily: '"Montserrat", sans-serif' }}>
                  {profile.username}
                </Typography>
                <RankBadge rank={profile.win_rank} wins={profile.total_wins} size="large" />
              </Box>
            </Box>

            <Box sx={{ display:'flex', alignItems:'center', gap:1, mb:2, flexWrap:'wrap' }}>
              {isMe ? (
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Button size="small" variant="outlined"
                    onClick={() => navigate('/profile/edit')}
                    sx={{
                      borderColor: C.btnBd, color: C.btnColor,
                      borderRadius: 2, fontWeight: 600,
                      '&:hover': { borderColor: '#E8C96D', color: '#E8C96D' },
                    }}>
                    프로필 수정
                  </Button>
                  <Button
                    size="small" variant="outlined"
                    onClick={() => setShowReport(true)}
                    startIcon={<AutoAwesomeRounded sx={{ fontSize: 16 }} />}
                    sx={{
                      borderColor: '#E8C96D', color: '#E8C96D',
                      borderRadius: 2, fontWeight: 700,
                      backgroundColor: isDark ? 'rgba(232,201,109,0.05)' : 'rgba(232,201,109,0.02)',
                      '&:hover': { backgroundColor: 'rgba(232,201,109,0.1)' },
                    }}>
                    스타일 분석
                  </Button>
                  <Button
                    size="small" variant="contained"
                    onClick={() => navigate('/outfit-ai')}
                    startIcon={<AutoAwesomeRounded sx={{ fontSize: 16 }} />}
                    sx={{
                      background: 'linear-gradient(135deg, #E8C96D, #D4AF37)',
                      color: '#0A0A0A', borderRadius: 2, fontWeight: 700,
                      boxShadow: '0 2px 8px rgba(232,201,109,0.35)',
                      '&:hover': { opacity: 0.9 },
                    }}>
                    AI 코디
                  </Button>
                </Box>
              ) : (
                <>
                  <Button
                    variant={profile.is_following ? 'outlined' : 'contained'}
                    size="small" onClick={handleFollow}
                    sx={profile.is_following ? {
                      borderColor: C.btnBd, color: C.btnColor,
                      borderRadius:2, fontWeight:600, px:3, py:0.5,
                    } : {
                      borderRadius:2, fontWeight:700, px:3, py:0.5, fontSize:13,
                    }}>
                    {profile.is_following ? '팔로잉' : '팔로우'}
                  </Button>
                  <Button variant="outlined" size="small" onClick={() => setShowMatch(true)}
                    startIcon={<PsychologyRounded sx={{ fontSize: 16 }} />}
                    sx={{
                      borderColor: '#E8C96D', color: '#E8C96D',
                      borderRadius:2, fontWeight:600, px:2, py:0.5, fontSize:13,
                    }}>
                    케미 확인
                  </Button>
                  <Button variant="outlined" size="small" onClick={handleMessage}
                    sx={{
                      borderColor: C.btnBd, color: C.btnColor,
                      borderRadius:2, fontWeight:600, px:2, py:0.5, fontSize:13,
                    }}>
                    메시지
                  </Button>
                </>
              )}
            </Box>

            {/* 통계 */}
            <Box sx={{ display:'flex', gap:0, mb:2, alignItems:'center' }}>
              {[
                { label:'게시물',  value: profile.post_count,      onClick: null },
                { label:'팔로워',  value: profile.follower_count,  onClick: () => openModal('followers') },
                { label:'팔로잉',  value: profile.following_count, onClick: () => openModal('following') },
              ].map((item, i) => (
                <Box key={item.label} sx={{ display:'flex', alignItems:'center' }}>
                  {i > 0 && (
                    <Box sx={{ width:'1px', height:28, backgroundColor: C.border, mx:{ xs:2.5, md:3 }, flexShrink:0 }} />
                  )}
                  <Box
                    onClick={item.onClick || undefined}
                    sx={{
                      textAlign:'center',
                      cursor: item.onClick ? 'pointer' : 'default',
                      transition:'all 0.18s cubic-bezier(0.22,1,0.36,1)',
                      '&:hover': item.onClick ? {
                        '& .stat-num': { color:'#E8C96D' },
                      } : {},
                    }}>
                    <Typography
                      className="stat-num"
                      sx={{
                        fontFamily:'"Montserrat","Pretendard",sans-serif',
                        fontWeight:800, fontSize:{ xs:17, md:20 },
                        color: C.text, lineHeight:1.1,
                        transition:'color 0.18s',
                        letterSpacing:'-0.02em',
                      }}>
                      {item.value?.toLocaleString() ?? '—'}
                    </Typography>
                    <Typography sx={{ fontSize:11, color: C.textMid, mt:'2px', fontWeight:500, letterSpacing:'0.02em' }}>
                      {item.label}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>

            {/* 바이오 */}
            {profile.bio && (
              <Typography variant="body2"
                sx={{ color: C.textSub, lineHeight:1.6, mb:1 }}>
                {profile.bio}
              </Typography>
            )}

            {/* 체형 */}
            {(profile.height || profile.weight) && (
              <Box sx={{ display:'flex', gap:1 }}>
                {profile.height && (
                  <Chip label={`${profile.height}cm`} size="small"
                    sx={{ backgroundColor: C.chipBg, color: C.textMid,
                      border:`1px solid ${C.chipBd}`, height:22, fontSize:11 }} />
                )}
                {profile.weight && (
                  <Chip label={`${profile.weight}kg`} size="small"
                    sx={{ backgroundColor: C.chipBg, color: C.textMid,
                      border:`1px solid ${C.chipBd}`, height:22, fontSize:11 }} />
                )}
              </Box>
            )}
          </Box>
        </Box>
      </Box>

      {/* 탭 */}
      <Box sx={{ borderTop:`1px solid ${C.border}`, width:'100%', overflow:'hidden' }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} centered
          sx={{
            minHeight:48,
            '& .MuiTabs-scroller':{ overflow:'hidden !important' },
            '& .MuiTab-root':{
              color: C.tabInactive, minWidth:72, fontSize:12,
              letterSpacing:1, minHeight:48, padding:'12px 12px', overflow:'hidden',
            },
            '& .Mui-selected':{ color: C.tabActive },
            '& .MuiTabs-indicator':{
              backgroundColor: C.indicator, height:'2px', top:0, bottom:'auto',
            },
          }}>
          <Tab icon={<GridOnRounded sx={{ fontSize:20 }} />}
            label="게시물" iconPosition="start" sx={{ gap:0.5 }} />
          <Tab icon={<TrendingUpRounded sx={{ fontSize:20 }} />}
            label="타임라인" iconPosition="start" sx={{ gap:0.5 }} />
          {isMe && (
            <Tab icon={<CalendarMonthRounded sx={{ fontSize:20 }} />}
              label="캘린더" iconPosition="start" sx={{ gap:0.5 }} />
          )}
          {isMe && (
            <Tab icon={<BookmarkBorderRounded sx={{ fontSize:20 }} />}
              label="저장됨" iconPosition="start" sx={{ gap:0.5 }} />
          )}
        </Tabs>
      </Box>

      {/* 타임라인 탭 */}
      {tab === 1 ? (
        <StyleTimeline username={username} isDark={isDark} />
      ) : isMe && tab === 2 ? (
        <OOTDCalendar posts={posts} isDark={isDark} />
      ) : displayPosts.length === 0 ? (
        <Box sx={{ textAlign:'center', py:15 }}>
          <Box sx={{ display:'flex', justifyContent:'center', mb:2 }}>
            {tab === 0
              ? <GridOnRounded        sx={{ fontSize:48, color: isDark ? '#2A2A2A' : '#D0D0D0' }} />
              : <BookmarkBorderRounded sx={{ fontSize:48, color: isDark ? '#2A2A2A' : '#D0D0D0' }} />
            }
          </Box>
          <Typography fontWeight={700} fontSize={20} mb={1} sx={{ color: C.text }}>
            {tab === 0 ? '아직 게시물이 없어요' : '저장된 게시물이 없어요'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {tab === 0 && isMe ? '첫 번째 게시물을 공유해보세요!' : ''}
          </Typography>
          {tab === 0 && isMe && (
            <Button variant="contained" sx={{ mt:2 }}
              onClick={() => navigate('/post/create')}>
              게시물 올리기
            </Button>
          )}
        </Box>
      ) : (
        <Box sx={{
          display:'grid', gridTemplateColumns:'repeat(3, 1fr)',
          gap:'3px', mt:'3px',
        }}>
          {displayPosts.map(post => <PostCard key={post.id} post={post} compact />)}
        </Box>
      )}
    </Box>
  );
};

export default Profile;