import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, Avatar, Typography, Dialog, IconButton, 
  InputBase, DialogContent, Button 
} from '@mui/material';
import {
  AddRounded, CloseRounded, DeleteOutlineRounded,
  FavoriteRounded, FavoriteBorderRounded, SendRounded, PauseRounded,
  PersonAddRounded,
} from '@mui/icons-material';
import { getStories, uploadStory, likeStory, replyToStory } from '../../api/postApi';
import UserTagInput from '../common/UserTagInput';
import useThemeStore from '../../store/themeStore';
import useAuthStore from '../../store/authStore';
import toast from 'react-hot-toast';
import confirmToast from '../../utils/confirmToast';

const timeAgo = (d) => {
  if (!d) return '';
  const m = Math.floor((Date.now() - new Date(d)) / 60000);
  if (m < 1) return '방금';
  if (m < 60) return `${m}분`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}시간`;
  return `${Math.floor(h / 24)}일`;
};

export default function StoryBar() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { mode } = useThemeStore();
  const isDark = mode === 'dark';

  const [stories,       setStories]       = useState([]);
  const [viewing,       setViewing]       = useState(null);
  const [userStories,   setUserStories]   = useState([]);
  const [storyIdx,      setStoryIdx]      = useState(0);
  const [progress,      setProgress]      = useState(0);
  const [isPaused,      setIsPaused]      = useState(false);
  const [likedIds,      setLikedIds]      = useState(new Set());
  const [message,       setMessage]       = useState('');
  const [sending,       setSending]       = useState(false);
  const [suggested,     setSuggested]     = useState([]);
  const [followedSug,   setFollowedSug]   = useState({});

  const [uploadPreview, setUploadPreview] = useState(null);
  const [uploadTagged,  setUploadTagged]  = useState([]);

  const fileRef      = useRef(null);
  const timerRef     = useRef(null);
  const pressStart   = useRef(null);
  const pauseTimer   = useRef(null);
  const inputActive  = useRef(false);

  // stories / viewing 최신값을 클로저에서 안전하게 읽기 위한 ref
  const storiesRef  = useRef(stories);
  const viewingRef  = useRef(viewing);
  useEffect(() => { storiesRef.current = stories; }, [stories]);
  useEffect(() => { viewingRef.current = viewing; }, [viewing]);

  useEffect(() => {
    getStories().then(r => setStories(r.data)).catch(() => {});
    import('../../api/axiosInstance').then(({ default: axios }) => {
      axios.get('/users/recommended?limit=10')
        .then(r => setSuggested(r.data || []))
        .catch(() => {});
    });
  }, []);

  // 스토리 전환: 메시지·진행률 초기화 (좋아요는 ID 기준 유지)
  useEffect(() => {
    setMessage('');
    setProgress(0);
  }, [storyIdx, viewing?.user_id]);

  // ── 타이머 ──
  useEffect(() => {
    if (!viewing || isPaused) { clearInterval(timerRef.current); return; }
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setProgress(prev => {
        if (prev < 100) return prev + 2;
        clearInterval(timerRef.current);
        // 현재 유저의 다음 스토리가 있으면 이동
        setStoryIdx(cur => {
          const stories_   = storiesRef.current;
          const uStories   = userStories; // 클로저가 오래됐을 수 있으므로 아래에서 처리
          return cur; // 실제 전환은 아래 useEffect에서 처리
        });
        setProgress(0);
        // 전환 트리거
        setProgress(-1); // sentinel
        return 0;
      });
    }, 100);
    return () => clearInterval(timerRef.current);
  }, [viewing, storyIdx, isPaused]);

  // sentinel(-1) 감지 → 다음 스토리 or 다음 유저 or 닫기
  useEffect(() => {
    if (progress !== -1) return;
    setProgress(0);
    setStoryIdx(cur => {
      // userStories는 이 시점에 최신값
      return cur; // 아래에서 직접 처리
    });
    // 직접 전환 처리
    advanceStory();
  }, [progress]);

  const advanceStory = useCallback(() => {
    setStoryIdx(cur => {
      // userStories ref가 없으므로 state를 useRef로 따로 관리
      return cur; // placeholder — 아래 ref 방식으로 대체
    });
  }, []);

  // — 위 sentinel 방식이 복잡하므로, 단순화: 타이머 onComplete ref 사용 —
  const userStoriesRef = useRef(userStories);
  useEffect(() => { userStoriesRef.current = userStories; }, [userStories]);

  const storyIdxRef = useRef(storyIdx);
  useEffect(() => { storyIdxRef.current = storyIdx; }, [storyIdx]);

  // 실제 타이머 (위 타이머 대체)
  useEffect(() => {
    if (!viewing || isPaused) { clearInterval(timerRef.current); return; }
    clearInterval(timerRef.current);
    setProgress(0);
    timerRef.current = setInterval(() => {
      setProgress(p => {
        if (p < 100) return p + 2;
        clearInterval(timerRef.current);
        // 다음 스토리 or 다음 유저
        const uStories = userStoriesRef.current;
        const idx      = storyIdxRef.current;
        if (idx < uStories.length - 1) {
          setStoryIdx(idx + 1);
        } else {
          goNextUser();
        }
        return 0;
      });
    }, 100);
    return () => clearInterval(timerRef.current);
  }, [viewing, storyIdx, isPaused]); // storyIdx 바뀌면 재시작

  // 다음 유저 스토리로 자동 이동
  const goNextUser = useCallback(async () => {
    const all  = storiesRef.current;
    const view = viewingRef.current;
    if (!view) return;
    const idx  = all.findIndex(s => s.user_id === view.user_id);
    const next = all[idx + 1];
    if (next) {
      const { getUserStories } = await import('../../api/postApi');
      const res = await getUserStories(next.user_id);
      setUserStories(res.data);
      setViewing(next);
      setStoryIdx(0);
      setIsPaused(false);
    } else {
      setViewing(null);
    }
  }, []);

  const openStory = async (storyUser) => {
    const { getUserStories } = await import('../../api/postApi');
    const res = await getUserStories(storyUser.user_id);
    setUserStories(res.data);
    setViewing(storyUser);
    setStoryIdx(0);
    setIsPaused(false);
  };

  const handleUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const previewUrl = URL.createObjectURL(file);
    setUploadPreview({ file, previewUrl });
    setUploadTagged([]);
    e.target.value = ''; // 같은 파일 재선택 허용
  };

  const handleConfirmUpload = async () => {
    if (!uploadPreview) return;
    const fd = new FormData();
    fd.append('image', uploadPreview.file);
    fd.append('mentionedUsers', JSON.stringify(uploadTagged.map(u => u.id)));
    try {
      await uploadStory(fd);
      getStories().then(r => setStories(r.data)).catch(() => {});
      toast.success('스토리가 업로드됐어요!');
    } catch { toast.error('업로드에 실패했어요.'); }
    finally {
      URL.revokeObjectURL(uploadPreview.previewUrl);
      setUploadPreview(null);
      setUploadTagged([]);
    }
  };

  const handleDelete = () => {
    confirmToast('이 스토리를 삭제할까요?', async () => {
      try {
        const { deleteStory } = await import('../../api/postApi');
        await deleteStory(userStories[storyIdx].id);
        toast.success('삭제됐어요.');
        const updated = userStories.filter((_, i) => i !== storyIdx);
        setUserStories(updated);
        if (updated.length === 0) setViewing(null);
        else setStoryIdx(Math.min(storyIdx, updated.length - 1));
        getStories().then(r => setStories(r.data)).catch(() => {});
      } catch { toast.error('삭제에 실패했어요.'); }
    });
  };

  const handleLike = () => {
    const s = userStories[storyIdx];
    if (!s || likedIds.has(s.id)) return;
    setLikedIds(prev => new Set([...prev, s.id]));
    likeStory(s.id).catch(() => {});
  };

  const handleSend = async () => {
    if (!message.trim() || sending) return;
    const s = userStories[storyIdx];
    if (!s) return;
    setSending(true);
    try {
      await replyToStory(s.id, message.trim());
      setMessage('');
      toast.success('답장을 보냈어요!');
      setViewing(null);
      navigate('/chat');
    } catch { toast.error('전송에 실패했어요.'); }
    finally { setSending(false); }
  };

  // 탭 vs 홀드 구분
  const handlePressStart = useCallback(() => {
    if (inputActive.current) return;
    pressStart.current = Date.now();
    pauseTimer.current = setTimeout(() => setIsPaused(true), 180);
  }, []);

  const handlePressEnd = useCallback((e) => {
    if (inputActive.current) return;
    clearTimeout(pauseTimer.current);
    if (isPaused) { setIsPaused(false); return; }
    const held = Date.now() - (pressStart.current || 0);
    if (held >= 200) return; // 홀드였으면 무시
    const x = e.clientX ?? e.changedTouches?.[0]?.clientX ?? window.innerWidth / 2;
    if (x < window.innerWidth / 2) {
      // 왼쪽: 이전 스토리
      if (storyIdxRef.current > 0) setStoryIdx(storyIdxRef.current - 1);
      else setViewing(null);
    } else {
      // 오른쪽: 다음 스토리 or 다음 유저
      const idx      = storyIdxRef.current;
      const uStories = userStoriesRef.current;
      if (idx < uStories.length - 1) setStoryIdx(idx + 1);
      else goNextUser();
    }
  }, [isPaused, goNextUser]);

  const handleFollowSuggested = async (userId, username) => {
    try {
      const { toggleFollow } = await import('../../api/userApi');
      await toggleFollow(userId);
      setFollowedSug(prev => ({ ...prev, [userId]: true }));
      toast.success(`${username}님을 팔로우했습니다.`);
    } catch { toast.error('잠시 후 다시 시도해주세요.'); }
  };

  const currentStory = userStories[storyIdx];
  const myStory      = stories.find(s => s.user_id === user?.id);
  const otherStories = stories.filter(s => s.user_id !== user?.id);
  const isOwn        = viewing?.user_id === user?.id;
  const isLiked      = likedIds.has(currentStory?.id);

  return (
    <>
      {/* ── 스토리 바 ── */}
      <Box sx={{ display:'flex', gap:2, px:2, py:2, overflowX:'auto', borderBottom:'1px solid #1E1E1E', '&::-webkit-scrollbar':{display:'none'} }}>
        {/* 내 스토리 */}
        <Box sx={{ display:'flex', flexDirection:'column', alignItems:'center', gap:0.8, flexShrink:0 }}>
          <Box sx={{ position:'relative' }}>
            <Box
              onClick={() => myStory ? openStory(myStory) : fileRef.current?.click()}
              sx={{ width:62, height:62, borderRadius:'50%', cursor:'pointer',
                background: myStory ? 'linear-gradient(45deg,#E8C96D,#D4AF37,#FFD700)' : 'transparent',
                p: myStory ? '2px' : 0 }}>
              <Avatar src={user?.profile_image ? `http://localhost:5000${user.profile_image}` : null}
                sx={{ width:'100%', height:'100%', bgcolor:'#1A1A1A', color:'#E8C96D', fontWeight:800, fontSize:20,
                  border: myStory ? '2px solid #0A0A0A' : '2px solid #2A2A2A' }}>
                {user?.username?.[0]?.toUpperCase()}
              </Avatar>
            </Box>
            {!myStory && (
              <Box onClick={() => fileRef.current?.click()}
                sx={{ position:'absolute', bottom:0, right:0, width:20, height:20, borderRadius:'50%',
                  backgroundColor:'#0095F6', border:'2px solid #0A0A0A',
                  display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
                <AddRounded sx={{ fontSize:14, color:'#fff' }} />
              </Box>
            )}
          </Box>
          <Typography variant="caption" sx={{ fontSize:11, color:'#A0A0A0', maxWidth:62, textAlign:'center', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
            내 스토리
          </Typography>
        </Box>

        {/* 다른 유저 스토리 */}
        {otherStories.map(su => {
          const viewed = su.viewed_count >= su.story_count;
          return (
            <Box key={su.user_id} sx={{ display:'flex', flexDirection:'column', alignItems:'center', gap:0.8, flexShrink:0 }}>
              <Box onClick={() => openStory(su)}
                sx={{ width:62, height:62, borderRadius:'50%', cursor:'pointer',
                  background: viewed ? 'linear-gradient(45deg,#3A3A3A,#2A2A2A)' : 'linear-gradient(45deg,#F58529,#DD2A7B,#8134AF,#515BD4)',
                  p:'2px' }}>
                <Avatar src={su.profile_image ? `http://localhost:5000${su.profile_image}` : null}
                  sx={{ width:'100%', height:'100%', bgcolor:'#1A1A1A', color:'#F0F0F0', fontWeight:700, fontSize:20,
                    border:'2px solid #0A0A0A', filter: viewed ? 'grayscale(60%)' : 'none' }}>
                  {su.username?.[0]?.toUpperCase()}
                </Avatar>
              </Box>
              <Typography variant="caption"
                sx={{ fontSize:11, color: viewed ? '#505050' : '#F0F0F0', maxWidth:62, textAlign:'center', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                {su.username}
              </Typography>
            </Box>
          );
        })}

        {/* 스토리 없을 때 — 추천 유저 */}
        {otherStories.length === 0 && suggested.filter(u => !followedSug[u.id]).slice(0, 8).map(u => (
          <Box key={u.id} sx={{ display:'flex', flexDirection:'column', alignItems:'center', gap:0.8, flexShrink:0 }}>
            <Box sx={{ position:'relative' }}>
              <Box
                onClick={() => navigate(`/profile/${u.username}`)}
                sx={{
                  width:62, height:62, borderRadius:'50%', cursor:'pointer',
                  background: isDark ? 'linear-gradient(45deg,#2A2A2A,#222)' : 'linear-gradient(45deg,#E0E0E0,#D0D0D0)',
                  p:'2px',
                }}>
                <Avatar
                  src={u.profile_image ? `http://localhost:5000${u.profile_image}` : null}
                  sx={{ width:'100%', height:'100%', bgcolor: isDark ? '#1A1A1A' : '#F0F0F0', color: isDark ? '#888' : '#999', fontWeight:700, fontSize:20,
                    border: isDark ? '2px solid #0A0A0A' : '2px solid #FFFFFF' }}>
                  {u.username?.[0]?.toUpperCase()}
                </Avatar>
              </Box>
              {/* 팔로우 버튼 */}
              <Box
                onClick={() => handleFollowSuggested(u.id, u.username)}
                sx={{
                  position:'absolute', bottom:0, right:0,
                  width:22, height:22, borderRadius:'50%',
                  backgroundColor:'#0095F6',
                  border: isDark ? '2px solid #0A0A0A' : '2px solid #FFFFFF',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  cursor:'pointer',
                  '&:hover':{ backgroundColor:'#1877F2' },
                }}>
                <PersonAddRounded sx={{ fontSize:12, color:'#fff' }} />
              </Box>
            </Box>
            <Typography variant="caption"
              sx={{ fontSize:11, color: isDark ? '#888' : '#999', maxWidth:62, textAlign:'center', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
              {u.username}
            </Typography>
          </Box>
        ))}
      </Box>

      <input ref={fileRef} type="file" accept="image/*" style={{ display:'none' }} onChange={handleUpload} />

      {/* ── 스토리 업로드 미리보기 + 태그 모달 ── */}
      <Dialog open={Boolean(uploadPreview)} onClose={() => setUploadPreview(null)}
        PaperProps={{ sx: { bgcolor: isDark ? '#111111' : '#FFFFFF', borderRadius: 3, maxWidth: 400, width: '100%' } }}>
        <DialogContent sx={{ p: 0 }}>
          {uploadPreview && (
            <Box component="img" src={uploadPreview.previewUrl}
              sx={{ width: '100%', maxHeight: 320, objectFit: 'cover', borderRadius: '12px 12px 0 0', display: 'block' }} />
          )}
          <Box sx={{ px: 2.5, pt: 2, pb: 3 }}>
            <UserTagInput tagged={uploadTagged} onChange={setUploadTagged} />
            <Box sx={{ display: 'flex', gap: 1.5, mt: 2.5 }}>
              <Button fullWidth variant="outlined" onClick={() => setUploadPreview(null)}
                sx={{ borderColor: isDark ? '#333' : '#DDD', color: isDark ? '#AAA' : '#666', borderRadius: 2 }}>
                취소
              </Button>
              <Button fullWidth variant="contained" onClick={handleConfirmUpload}
                sx={{ bgcolor: '#E8C96D', color: '#0A0A0A', fontWeight: 700, borderRadius: 2, '&:hover': { bgcolor: '#D4AF37' } }}>
                공유
              </Button>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>

      {/* ── 스토리 뷰어 ── */}
      <Dialog fullScreen open={Boolean(viewing)} onClose={() => setViewing(null)}
        PaperProps={{ sx:{ bgcolor:'#000' } }}>
        {viewing && currentStory && (
          <Box sx={{ position:'relative', width:'100%', height:'100vh', overflow:'hidden', bgcolor:'#000' }}>

            {/* 진행 바 */}
            <Box sx={{ position:'absolute', top:8, left:0, right:0, zIndex:30, px:1.5, display:'flex', gap:0.4 }}>
              {userStories.map((_, i) => (
                <Box key={i} sx={{ flex:1, height:2.5, backgroundColor:'rgba(255,255,255,0.3)', borderRadius:2, overflow:'hidden' }}>
                  <Box sx={{
                    height:'100%', borderRadius:2, backgroundColor:'#fff',
                    width: i < storyIdx ? '100%' : i === storyIdx ? `${progress}%` : '0%',
                    transition: i === storyIdx ? 'none' : undefined,
                  }} />
                </Box>
              ))}
            </Box>

            {/* 헤더 */}
            <Box sx={{ position:'absolute', top:20, left:0, right:0, zIndex:30, display:'flex', alignItems:'center', px:1.5, pt:1 }}>
              <Avatar src={viewing.profile_image ? `http://localhost:5000${viewing.profile_image}` : null}
                sx={{ width:36, height:36, mr:1, border:'1.5px solid rgba(255,255,255,0.5)', flexShrink:0 }}>
                {viewing.username?.[0]?.toUpperCase()}
              </Avatar>
              <Box sx={{ flex:1 }}>
                <Typography fontWeight={700} color="#fff" fontSize={14} lineHeight={1.2}>{viewing.username}</Typography>
                <Typography fontSize={11} sx={{ color:'rgba(255,255,255,0.6)' }}>{timeAgo(currentStory.created_at)}</Typography>
              </Box>
              <Box sx={{ display:'flex', alignItems:'center' }}>
                {isPaused && (
                  <Box sx={{ display:'flex', alignItems:'center', mr:0.5, px:1, py:0.3, borderRadius:10, backgroundColor:'rgba(255,255,255,0.15)' }}>
                    <PauseRounded sx={{ fontSize:16, color:'#fff' }} />
                  </Box>
                )}
                {isOwn && (
                  <IconButton onClick={handleDelete} sx={{ color:'rgba(255,255,255,0.85)', p:1 }}>
                    <DeleteOutlineRounded sx={{ fontSize:22 }} />
                  </IconButton>
                )}
                <IconButton onClick={() => setViewing(null)} sx={{ color:'#fff', p:1 }}>
                  <CloseRounded sx={{ fontSize:22 }} />
                </IconButton>
              </Box>
            </Box>

            {/* 이미지 */}
            <Box component="img"
              src={`http://localhost:5000${currentStory.image_url}`}
              sx={{ width:'100%', height:'100%', objectFit:'contain', objectPosition:'center', display:'block', userSelect:'none' }}
            />

            {/* 태그된 유저 표시 */}
            {currentStory.tagged_users?.length > 0 && (
              <Box sx={{
                position: 'absolute',
                bottom: isOwn ? 110 : 130, // 조회수나 답장창 위로 배치
                left: 15,
                zIndex: 25,
                display: 'flex',
                flexWrap: 'wrap',
                gap: 0.8
              }}>
                {currentStory.tagged_users.map(u => (
                  <Box
                    key={u.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      setViewing(null);
                      navigate(`/profile/${u.username}`);
                    }}
                    sx={{
                      display: 'flex', alignItems: 'center', gap: 0.5,
                      px: 1.2, py: 0.5, borderRadius: 10,
                      backgroundColor: 'rgba(0,0,0,0.5)',
                      border: '1px solid rgba(255,255,255,0.3)',
                      backdropFilter: 'blur(4px)',
                      cursor: 'pointer',
                      '&:hover': { backgroundColor: 'rgba(255,255,255,0.2)' }
                    }}
                  >
                    <PersonAddRounded sx={{ fontSize: 14, color: '#E8C96D' }} />
                    <Typography sx={{ color: '#fff', fontSize: 12, fontWeight: 600 }}>
                      {u.username}
                    </Typography>
                  </Box>
                ))}
              </Box>
            )}

            {/* 탭 오버레이 (이미지 위, 버튼 아래) */}
            <Box sx={{ position:'absolute', top:0, left:0, right:0, bottom: isOwn ? 60 : 80, zIndex:10 }}
              onMouseDown={handlePressStart} onMouseUp={handlePressEnd}
              onTouchStart={handlePressStart} onTouchEnd={handlePressEnd}
            />

            {/* 하단 그라데이션 */}
            <Box sx={{ position:'absolute', bottom:0, left:0, right:0, height:150,
              background:'linear-gradient(to top,rgba(0,0,0,0.7) 0%,transparent 100%)',
              pointerEvents:'none', zIndex:15 }} />

            {/* 타인: 답장 + 좋아요 */}
            {!isOwn && (
              <Box sx={{ position:'absolute', bottom:0, left:0, right:0, px:1.5, pb:{ xs:3, sm:2.5 }, pt:1,
                display:'flex', alignItems:'center', gap:1, zIndex:20 }}>
                <Box onClick={e => e.stopPropagation()}
                  sx={{ flex:1, display:'flex', alignItems:'center',
                    backgroundColor:'rgba(255,255,255,0.12)', borderRadius:30,
                    border:'1px solid rgba(255,255,255,0.25)', px:2, py:0.6, backdropFilter:'blur(4px)' }}>
                  <InputBase
                    placeholder="답장하기..."
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    onFocus={() => { inputActive.current = true;  setIsPaused(true);  }}
                    onBlur={()  => { inputActive.current = false; setIsPaused(false); }}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                    sx={{ flex:1, color:'#fff', fontSize:14, '& input::placeholder':{ color:'rgba(255,255,255,0.55)' } }}
                  />
                </Box>

                {/* 좋아요 */}
                <IconButton onClick={e => { e.stopPropagation(); handleLike(); }}
                  sx={{ color: isLiked ? '#FF4D6D' : 'rgba(255,255,255,0.85)', p:0.8,
                    transform: isLiked ? 'scale(1.3)' : 'scale(1)',
                    transition:'transform 0.18s cubic-bezier(0.34,1.56,0.64,1),color 0.15s' }}>
                  {isLiked ? <FavoriteRounded sx={{ fontSize:28 }} /> : <FavoriteBorderRounded sx={{ fontSize:28 }} />}
                </IconButton>

                {/* 전송 */}
                {message.trim() && (
                  <IconButton onClick={e => { e.stopPropagation(); handleSend(); }} disabled={sending}
                    sx={{ color:'#fff', p:0.8 }}>
                    <SendRounded sx={{ fontSize:24 }} />
                  </IconButton>
                )}
              </Box>
            )}

            {/* 본인: 조회수 */}
            {isOwn && (
              <Box sx={{ position:'absolute', bottom:0, left:0, right:0, pb:3, display:'flex', justifyContent:'center', zIndex:20 }}>
                <Box sx={{ px:2, py:0.8, borderRadius:20, backgroundColor:'rgba(255,255,255,0.12)', backdropFilter:'blur(4px)' }}>
                  <Typography fontSize={13} sx={{ color:'rgba(255,255,255,0.7)' }}>
                    👁 {currentStory.view_count ?? 0}명이 봤어요
                  </Typography>
                </Box>
              </Box>
            )}
          </Box>
        )}
      </Dialog>
    </>
  );
}
