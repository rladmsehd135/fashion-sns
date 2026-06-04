import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, CircularProgress, useTheme, useMediaQuery, Button, Avatar, Tooltip } from '@mui/material';
import { SportsEsportsRounded } from '@mui/icons-material';
import axiosInstance from '../../api/axiosInstance';
import RankBadge from '../common/RankBadge';
import toast from 'react-hot-toast';
import useThemeStore from '../../store/themeStore';

export default function BattlePage() {
  const [match, setMatch] = useState([]);
  const [winners, setWinners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { mode } = useThemeStore();
  const isDark = mode === 'dark';

  const loadMatch = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get('/posts/battle/match');
      setMatch(res.data);
    } catch (err) {
      if (err.response?.status === 404) {
        setMatch([]);
      } else {
        toast.error('대결을 불러오지 못했어요.');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadWinners = async () => {
    try {
      const res = await axiosInstance.get('/posts/battle/winners');
      setWinners(res.data);
    } catch {}
  };

  useEffect(() => { loadMatch(); loadWinners(); }, []);

  const handleVote = async (postId) => {
    if (voting) return;
    setVoting(true);
    try {
      await axiosInstance.post(`/posts/battle/${postId}/vote`);
      toast.success('투표 완료!', { duration: 800 });
      loadMatch(); 
      loadWinners(); // 랭킹 갱신
    } catch {
      toast.error('투표에 실패했어요.');
    } finally {
      setVoting(false);
    }
  };

  if (loading && match.length === 0) return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pt: 20, gap: 2 }}>
      <CircularProgress sx={{ color: '#E8C96D' }} />
      <Typography fontSize={13} color="text.secondary">대결 상대를 찾는 중...</Typography>
    </Box>
  );

  if (!loading && match.length < 2) return (
    <Box sx={{ textAlign: 'center', pt: 20, px: 2 }}>
      <SportsEsportsRounded sx={{ fontSize: 48, mb: 2, color: isDark ? '#2A2A2A' : '#D0D0D0' }} />
      <Typography fontWeight={900} fontSize={22} mb={1} sx={{ color: isDark ? '#EFEFEF' : '#0A0A0A' }}>
        대결할 게시물이 부족해요
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={4}>
        다른 유저들이 게시물을 더 올릴 때까지 조금만 기다려주세요!
      </Typography>
      <Button 
        onClick={loadMatch} 
        variant="outlined"
        sx={{ borderColor: '#E8C96D', color: '#E8C96D', borderRadius: 2, px: 4 }}
      >
        다시 시도
      </Button>
    </Box>
  );

  return (
    <Box sx={{ 
      minHeight: '100vh',
      display: 'flex', flexDirection: 'column', 
      p: { xs: 2, md: 4 }, pb: 10,
      backgroundColor: isDark ? '#0A0A0A' : '#F5F5F0'
    }}>
      <Box sx={{ textAlign: 'center', mb: 5 }}>
        <Typography fontWeight={900} fontSize={28} letterSpacing={8} sx={{ color: '#E8C96D', fontFamily: '"Montserrat", sans-serif' }}>
          STYLE BATTLE
        </Typography>
        <Typography fontSize={11} fontWeight={800} sx={{ color: isDark ? '#444' : '#999', textTransform: 'uppercase', letterSpacing: 3, mt: 0.5 }}>
          Whose fit is more aesthetic?
        </Typography>
      </Box>

      <Box sx={{ flex: 1, display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 2, position: 'relative' }}>
        {match.map((post) => (
          <Box key={post.id} 
            onClick={() => handleVote(post.id)}
            sx={{
              flex: 1, position: 'relative', overflow: 'hidden', borderRadius: 5,
              cursor: 'pointer', transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
              aspectRatio: isMobile ? '4/5' : 'auto',
              border: `1px solid ${isDark ? '#1A1A1A' : '#EBEBEB'}`,
              '&:hover': { transform: 'scale(1.015)', boxShadow: '0 30px 60px rgba(0,0,0,0.4)' },
              '&:hover .overlay': { opacity: 1 }
            }}
          >
            <Box component="img" src={`http://localhost:5000${post.thumbnail}`}
              sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            
            <Box className="overlay" sx={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(135deg, rgba(232,201,109,0.15) 0%, rgba(0,0,0,0.55) 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              opacity: 0, transition: 'opacity 0.28s cubic-bezier(0.22,1,0.36,1)',
              backdropFilter: 'blur(4px)',
            }}>
              <Box sx={{
                width: 86, height: 86, borderRadius: '50%',
                background: 'linear-gradient(145deg, #F2D060 0%, #C8991A 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 0 0 6px rgba(232,201,109,0.2), 0 8px 32px rgba(232,201,109,0.5)',
                transition: 'transform 0.2s',
              }}>
                <Typography sx={{ fontFamily:'"Montserrat",sans-serif', fontWeight:900, color:'#0A0A0A', fontSize:16, letterSpacing:'0.12em' }}>
                  PICK
                </Typography>
              </Box>
            </Box>

            <Box sx={{
              position: 'absolute', bottom: 0, left: 0, right: 0, p: 3, zIndex: 2,
              background: 'linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.4) 60%, transparent 100%)',
            }}>
              <Typography sx={{ fontFamily:'"Montserrat",sans-serif', fontWeight:800, color:'#fff', fontSize:19, letterSpacing:'-0.02em', lineHeight:1.2 }}>
                @{post.username}
              </Typography>
              <Typography sx={{ color:'#E8C96D', fontSize:11, fontWeight:800, textTransform:'uppercase', letterSpacing:'0.14em', mt:0.5 }}>
                {post.style}
              </Typography>
            </Box>
          </Box>
        ))}

        {!isMobile && (
          <Box sx={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 72, height: 72, borderRadius: '50%',
            background: isDark ? '#080808' : '#F0F0F0',
            border: '2px solid transparent',
            backgroundImage: isDark
              ? 'linear-gradient(#080808, #080808), linear-gradient(135deg, #F2D060, #C8991A)'
              : 'linear-gradient(#F0F0F0, #F0F0F0), linear-gradient(135deg, #F2D060, #C8991A)',
            backgroundOrigin: 'border-box',
            backgroundClip: 'padding-box, border-box',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 10,
            boxShadow: '0 0 0 4px rgba(0,0,0,0.6), 0 4px 24px rgba(0,0,0,0.8)',
          }}>
            <Typography sx={{
              fontFamily:'"Montserrat",sans-serif',
              fontWeight:900, fontSize:20, letterSpacing:'0.06em',
              background:'linear-gradient(135deg, #F2D060, #C8991A)',
              WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent',
            }}>VS</Typography>
          </Box>
        )}
      </Box>
      
      <Box sx={{ textAlign: 'center', mt: 4, mb: 8 }}>
        <Typography onClick={() => loadMatch()} 
          sx={{ 
            cursor: 'pointer', color: isDark ? '#333' : '#CCC', fontSize: 12, fontWeight: 800, 
            letterSpacing: 2, '&:hover': { color: '#E8C96D' }, transition: 'color 0.2s' 
          }}>
          SKIP THIS MATCH
        </Typography>
      </Box>

      {/* ── 우승자 랭킹 (Hall of Fame) ── */}
      {winners.length > 0 && (
        <Box sx={{ mt: 'auto' }}>
          <Typography fontSize={11} fontWeight={800} letterSpacing={3} sx={{ color: '#E8C96D', mb: 2, textAlign: 'center' }}>
            CURRENT STYLE KINGS
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, overflowX: 'auto', pb: 2, px: 1, '&::-webkit-scrollbar': { display: 'none' } }}>
            {winners.map((win, idx) => (
          <Box 
            key={win.id} 
            onClick={() => navigate(`/profile/${win.username}`)}
            sx={{ 
              flexShrink: 0, width: 90, textAlign: 'center', cursor: 'pointer',
              '&:hover': { opacity: 0.75, transition: 'opacity 0.2s' }
            }}
          >
                <Box sx={{ position: 'relative', mb: 1, display: 'inline-block' }}>
                  {/* 아바타 — 1등은 링 애니메이션 */}
                  <Box sx={{
                    p: '2px', borderRadius: '50%',
                    background: idx === 0 ? 'linear-gradient(135deg, #FFE566, #F5A623)' :
                                idx === 1 ? 'linear-gradient(135deg, #F0F0F8, #8E8EA8)' :
                                idx === 2 ? 'linear-gradient(135deg, #ECA96A, #8B3A00)' :
                                (isDark ? '#2A2A2A' : '#E0E0E0'),
                    boxShadow: idx === 0 ? '0 0 14px rgba(255,200,0,0.45)' :
                               idx === 1 ? '0 0 10px rgba(160,160,185,0.35)' :
                               idx === 2 ? '0 0 10px rgba(180,90,30,0.35)' : 'none',
                  }}>
                    <Avatar
                      src={win.thumbnail ? `http://localhost:5000${win.thumbnail}` : null}
                      sx={{
                        width: 72, height: 72,
                        bgcolor: isDark ? '#1A1A1A' : '#F0F0F0',
                        color: '#E8C96D', fontWeight: 800, fontSize: 22,
                        border: `2.5px solid ${isDark ? '#0A0A0A' : '#FFFFFF'}`,
                      }}
                    >
                      {win.username?.[0]?.toUpperCase()}
                    </Avatar>
                  </Box>
                  {/* 배지 오버레이 */}
                  {idx < 3 && (
                    <Box sx={{ position: 'absolute', bottom: 0, right: -2 }}>
                      <RankBadge rank={idx + 1} wins={Number(win.total_wins)} size="overlay" />
                    </Box>
                  )}
                  {/* 4·5위 순위 번호 */}
                  {idx >= 3 && (
                    <Box sx={{
                      position: 'absolute', bottom: 0, right: -2,
                      width: 20, height: 20, borderRadius: '50%',
                      backgroundColor: isDark ? '#1A1A1A' : '#E8E8E8',
                      border: `1.5px solid ${isDark ? '#2A2A2A' : '#CCC'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Typography fontSize={9} fontWeight={800} sx={{ color: isDark ? '#888' : '#666' }}>
                        {idx + 1}
                      </Typography>
                    </Box>
                  )}
                </Box>
                <Typography fontSize={11} fontWeight={700} noWrap sx={{ color: isDark ? '#EEE' : '#333', mt: 0.5 }}>
                  @{win.username}
                </Typography>
                <Typography fontSize={10} fontWeight={800} sx={{
                  color: idx === 0 ? '#FFE566' : idx === 1 ? '#B0B0C8' : idx === 2 ? '#ECA96A' : '#E8C96D',
                }}>
                  {Number(win.total_wins)} WINS
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );
}