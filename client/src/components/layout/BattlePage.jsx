import { useState, useEffect } from 'react';
import { Box, Typography, CircularProgress, useTheme, useMediaQuery, Button, Avatar } from '@mui/material';
import axiosInstance from '../../api/axiosInstance';
import toast from 'react-hot-toast';
import useThemeStore from '../../store/themeStore';

export default function BattlePage() {
  const [match, setMatch] = useState([]);
  const [winners, setWinners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
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
      <Typography fontSize={48} mb={2}>⚔️</Typography>
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
              background: 'radial-gradient(circle, rgba(232,201,109,0.2) 0%, rgba(0,0,0,0.4) 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              opacity: 0, transition: 'opacity 0.3s',
              backdropFilter: 'blur(3px)'
            }}>
              <Box sx={{
                width: 90, height: 90, borderRadius: '50%',
                bgcolor: '#E8C96D', display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 0 40px rgba(232,201,109,0.6)', transform: 'scale(1.1)'
              }}>
                <Typography fontWeight={900} color="#0A0A0A" fontSize={20}>PICK</Typography>
              </Box>
            </Box>

            <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, p: 3, background: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)', zIndex: 2 }}>
              <Typography fontWeight={800} color="#fff" fontSize={20} sx={{ letterSpacing: '-0.03em' }}>@{post.username}</Typography>
              <Typography color="#E8C96D" fontSize={12} fontWeight={800} sx={{ textTransform: 'uppercase', mt: 0.5 }}>#{post.style}</Typography>
            </Box>
          </Box>
        ))}

        {!isMobile && (
          <Box sx={{
            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            width: 76, height: 76, borderRadius: '50%', bgcolor: '#0D0D0D',
            border: '3px solid #E8C96D', display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 10, boxShadow: '0 0 30px rgba(0,0,0,0.8)'
          }}>
            <Typography fontWeight={900} color="#E8C96D" fontSize={24} sx={{ fontFamily: '"Montserrat", sans-serif' }}>VS</Typography>
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
              <Box key={win.id} sx={{ flexShrink: 0, width: 100, textAlign: 'center' }}>
                <Box sx={{ position: 'relative', mb: 1 }}>
                  <Avatar 
                    src={`http://localhost:5000${win.thumbnail}`} 
                    sx={{ width: 80, height: 80, mx: 'auto', 
                      border: idx === 0 ? '2px solid #FFD700' : 
                              idx === 1 ? '2px solid #C0C0C0' :
                              idx === 2 ? '2px solid #CD7F32' :
                              `1px solid ${isDark ? '#333' : '#DDD'}` 
                    }}
                  />
                  {idx === 0 && <Typography sx={{ position: 'absolute', top: -5, right: -5, fontSize: 20 }}>🥇</Typography>}
                  {idx === 1 && <Typography sx={{ position: 'absolute', top: -5, right: -5, fontSize: 20 }}>🥈</Typography>}
                  {idx === 2 && <Typography sx={{ position: 'absolute', top: -5, right: -5, fontSize: 20 }}>🥉</Typography>}
                  {idx === 0 && (
                    <Box sx={{ 
                      position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)',
                      bgcolor: '#E8C96D', color: '#0A0A0A', fontSize: 10, fontWeight: 900, px: 1, borderRadius: 1
                    }}>
                      TOP
                    </Box>
                  )}
                </Box>
                <Typography fontSize={12} fontWeight={700} noWrap sx={{ color: isDark ? '#EEE' : '#333' }}>
                  @{win.username}
                </Typography>
                <Typography fontSize={10} sx={{ color: '#E8C96D', fontWeight: 800 }}>
                  {win.win_count} WINS
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );
}