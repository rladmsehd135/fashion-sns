import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Avatar, IconButton, Menu, MenuItem, Divider, Dialog, DialogContent } from '@mui/material';
import {
  FavoriteRounded, FavoriteBorderRounded,
  BookmarkRounded, BookmarkBorderRounded,
  ChatBubbleOutlineRounded, MoreHorizRounded,
  CheckroomRounded, RepeatRounded, LinkRounded,
  AutoStoriesRounded,
} from '@mui/icons-material';
import RankBadge from '../common/RankBadge';
import toast from 'react-hot-toast';
import confirmToast from '../../utils/confirmToast';
import { toggleLike, toggleBookmark, repostPost, unrepostPost, reportPost } from '../../api/postApi';
import ReportDialog from '../common/ReportDialog';
import { timeAgo } from '../../utils/formatDate';
import useThemeStore from '../../store/themeStore';
import useAuthStore from '../../store/authStore';
import axiosInstance from '../../api/axiosInstance';
import { styleColors } from '../../constants/styleConstants';

const PostCard = ({ post: initialPost, compact = false }) => {
  const navigate = useNavigate();
  const { mode } = useThemeStore();
  const { user } = useAuthStore();
  const isDark = mode === 'dark';
  const [post, setPost] = useState(initialPost);
  const [imgIndex, setImgIndex] = useState(0);
  const [deleted, setDeleted] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [shareAnchor, setShareAnchor] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isReposted,    setIsReposted]    = useState(() => Number(initialPost?.is_reposted) > 0);
  const [repostDialog,  setRepostDialog]  = useState(false);
  const [reportOpen,    setReportOpen]    = useState(false);
  const [likeAnimating, setLikeAnimating] = useState(false);
  const [imgLoaded,     setImgLoaded]     = useState(false);
  const [heartBurst,    setHeartBurst]    = useState(false);
  const clickTimerRef = useRef(null);

  // Props로 받은 데이터가 변경되면 내부 상태도 동기화 (실시간 반영 해결)
  useEffect(() => {
    setPost(initialPost);
  }, [initialPost]);

  const C = {
    bg:         isDark ? '#000000' : '#FFFFFF',
    border:     isDark ? '#262626' : '#EFEFEF',
    avatarBg:   isDark ? '#262626' : '#EFEFEF',
    iconColor:  '#8E8E8E',
    textMain:   isDark ? '#F5F5F5' : '#000000',
    textSub:    isDark ? '#A8A8A8' : '#737373',
    textUser:   isDark ? '#F5F5F5' : '#000000',
    textTime:   isDark ? '#737373' : '#8E8E8E',
    dot:        '#8E8E8E',
    likeCount:  isDark ? '#F5F5F5' : '#000000',
    tagColor:   '#0095F6',
    menuBg:     isDark ? '#262626' : '#FFFFFF',
    menuBorder: isDark ? '#363636' : '#DBDBDB',
    menuText:   isDark ? '#F5F5F5' : '#000000',
    menuHover:  isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
  };

  if (!post) return null;

  const isOwner = user?.id === post.user_id || user?.username === post.username;
  const isRepost = !!post.repost_origin_id;
  // 리포스트인 경우 원작자 정보를, 아니면 작성자 정보를 표시
  const displayUser = isRepost && post.origin_username ? post.origin_username : post.username;
  const displayImage = isRepost && post.origin_profile_image ? post.origin_profile_image : post.profile_image;

  const menuItemSx = {
    fontSize: 14, py: 1.2, px: 2.5,
    color: C.menuText,
    '&:hover': { backgroundColor: C.menuHover },
  };
  const dangerItemSx = { ...menuItemSx, color: '#FF4D6D' };

  const handleLike = async (e) => {
    e.stopPropagation();
    try {
      const res = await toggleLike(post.id);
      if (res.data.liked) {
        setLikeAnimating(true);
        setTimeout(() => setLikeAnimating(false), 400);
      }
      setPost(prev => ({
        ...prev,
        is_liked: res.data.liked ? 1 : 0,
        likes_count: res.data.liked ? prev.likes_count + 1 : prev.likes_count - 1,
      }));
    } catch { toast.error('잠시 후 다시 시도해주세요.'); }
  };

  const handleImageDoubleTap = async () => {
    setHeartBurst(true);
    setTimeout(() => setHeartBurst(false), 750);
    if (!post.is_liked) {
      try {
        const res = await toggleLike(post.id);
        if (res.data.liked) {
          setLikeAnimating(true);
          setTimeout(() => setLikeAnimating(false), 400);
          setPost(prev => ({ ...prev, is_liked: 1, likes_count: prev.likes_count + 1 }));
        }
      } catch {}
    }
  };

  const handleImageClick = (e) => {
    e.stopPropagation();
    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current);
      clickTimerRef.current = null;
      handleImageDoubleTap();
    } else {
      clickTimerRef.current = setTimeout(() => {
        clickTimerRef.current = null;
        navigate(`/post/${post.id}`);
      }, 230);
    }
  };

  const handleBookmark = async (e) => {
    e.stopPropagation();
    try {
      const res = await toggleBookmark(post.id);
      setPost(prev => ({ ...prev, is_bookmarked: res.data.bookmarked ? 1 : 0 }));
      toast.success(res.data.bookmarked ? '저장했어요.' : '저장 취소했어요.');
    } catch { toast.error('잠시 후 다시 시도해주세요.'); }
  };

  const handleMenuOpen = (e) => { e.stopPropagation(); setMenuAnchor(e.currentTarget); };

  const handleShareOpen = (e) => { e.stopPropagation(); setShareAnchor(e.currentTarget); };

  const handleCopyLink = (e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    navigator.clipboard.writeText(`${window.location.origin}/post/${post.id}`);
    toast.success('링크가 복사됐어요!');
    setShareAnchor(null);
    setMenuAnchor(null);
  };

  const handleRepostOpen = (e) => {
    e.stopPropagation();
    setShareAnchor(null);
    setRepostDialog(true);
  };

  const handleRepostConfirm = async () => {
    setRepostDialog(false);
    try {
      await repostPost(post.id);
      setIsReposted(true);
      setPost(prev => ({ ...prev, repost_count: (Number(prev.repost_count) || 0) + 1 }));
      toast.success('내 피드에 공유했어요!');
    } catch (err) {
      if (err.response?.status === 409) {
        setIsReposted(true);
        toast.error('이미 공유한 게시물이에요.');
      } else {
        toast.error(err.response?.data?.message || '공유에 실패했어요.');
      }
    }
  };

  const handleUnrepost = async () => {
    setRepostDialog(false);
    try {
      await unrepostPost(post.id);
      setIsReposted(false);
      setPost(prev => ({ ...prev, repost_count: Math.max((Number(prev.repost_count) || 0) - 1, 0) }));
      toast.success('공유를 취소했어요.');
    } catch {
      toast.error('취소에 실패했어요.');
    }
  };
  const handleMenuClose = () => setMenuAnchor(null);



  const handleEdit = () => {
    handleMenuClose();
    navigate(`/post/edit/${post.id}`);
  };

  const handleDelete = () => {
    handleMenuClose();
    confirmToast('게시물을 삭제할까요?', async () => {
      try {
        await axiosInstance.delete(`/posts/${post.id}`);
        toast.success('게시물이 삭제됐어요.');
        setDeleted(true);
      } catch { toast.error('삭제에 실패했어요.'); }
    });
  };

  const handleFollow = async () => {
    try {
      await axiosInstance.post(`/follow/${post.user_id}`);
      setIsFollowing(f => !f);
      toast.success(isFollowing ? `${post.username}님 팔로우를 취소했어요.` : `${post.username}님을 팔로우했어요! 👋`);
    } catch {}
    handleMenuClose();
  };

  const handleReport = () => {
    handleMenuClose();
    setReportOpen(true);
  };

  const handleGoToPost = () => { navigate(`/post/${post.id}`); handleMenuClose(); };

  if (deleted) return null;

  const thumbnail = post.thumbnail || post.images?.[0]?.image_url;

  const imageList = (() => {
    if (post.images?.length > 0)
      return post.images.map(img => typeof img === 'string' ? img : img.image_url);
    if (post.image_urls)
      return post.image_urls.split(',').filter(Boolean);
    if (thumbnail) return [thumbnail];
    return [];
  })();

  const tags = (() => {
    if (!post.tags) return [];
    if (Array.isArray(post.tags)) return post.tags;
    try { return JSON.parse(post.tags); } catch { return []; }
  })();

  // compact 모드 (탐색 그리드)
  if (compact) {
    return (
      <Box onClick={() => navigate(`/post/${post.id}`)}
        sx={{
          aspectRatio: '1/1', position: 'relative',
          backgroundColor: isDark ? '#111' : '#F0F0F0',
          cursor: 'pointer', overflow: 'hidden',
          '&:hover .overlay': { opacity: 1 },
        }}>
        {thumbnail ? (
          <Box component="img"
            src={`http://localhost:5000${thumbnail}`}
            sx={{
              position: 'absolute', top: 0, left: 0,
              width: '100%', height: '100%', objectFit: 'cover',
              transition: 'transform 0.3s ease',
              '&:hover': { transform: 'scale(1.05)' },
            }} />
        ) : (
          <Box sx={{
            position: 'absolute', top: 0, left: 0,
            width: '100%', height: '100%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: isDark
              ? 'linear-gradient(145deg, #1C1A16 0%, #0F0E0B 60%, #151310 100%)'
              : 'linear-gradient(145deg, #F7F3EC 0%, #EDE8DF 60%, #E8E2D8 100%)',
          }}>
            <Box sx={{
              position: 'absolute', inset: 0,
              backgroundImage: isDark
                ? 'radial-gradient(circle, rgba(232,201,109,0.05) 1px, transparent 1px)'
                : 'radial-gradient(circle, rgba(232,201,109,0.15) 1px, transparent 1px)',
              backgroundSize: '14px 14px',
            }} />
            <CheckroomRounded sx={{ fontSize: 38, color: '#E8C96D', opacity: 0.45, zIndex: 1 }} />
          </Box>
        )}
        <Box className="overlay" sx={{
          position: 'absolute', top: 0, left: 0,
          width: '100%', height: '100%',
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3,
          opacity: 0, transition: 'opacity 0.2s ease',
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <FavoriteRounded sx={{ color: '#fff', fontSize: 18 }} />
            <Typography fontWeight={700} color="#fff" fontSize={13}>{post.likes_count}</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <ChatBubbleOutlineRounded sx={{ color: '#fff', fontSize: 18 }} />
            <Typography fontWeight={700} color="#fff" fontSize={13}>{post.comments_count}</Typography>
          </Box>
        </Box>
        {/* 다중 이미지 표시 */}
        {imageList.length > 1 && (
          <Box sx={{
            position: 'absolute', top: 8, right: 8,
            backgroundColor: 'rgba(0,0,0,0.6)',
            borderRadius: 1, px: 0.8, py: 0.3,
          }}>
            <Typography fontSize={10} color="#fff" fontWeight={700}>1/{imageList.length}</Typography>
          </Box>
        )}
        {/* 리포스트 뱃지 — 좌상단 */}
        {isRepost && (
          <Box sx={{
            position: 'absolute', top: 7, left: 7,
            display: 'flex', alignItems: 'center', gap: 0.4,
            backgroundColor: 'rgba(10,10,10,0.72)',
            backdropFilter: 'blur(6px)',
            border: '1px solid rgba(232,201,109,0.55)',
            borderRadius: 10, px: 0.8, py: 0.3,
          }}>
            <RepeatRounded sx={{ fontSize: 11, color: '#E8C96D' }} />
            <Typography fontSize={9} fontWeight={800} sx={{ color: '#E8C96D', letterSpacing: 0.3 }}>
              공유됨
            </Typography>
          </Box>
        )}
      </Box>
    );
  }

  const styleColor = styleColors[post.style] || C.textSub;

  // 피드 카드
  return (
    <Box sx={{
      backgroundColor: C.bg,
      borderBottom: `1px solid ${C.border}`,
      pb: 0.5,
      transition: 'background-color 0.15s',
    }}>

      {/* 리포스트 상단 배너 */}
      {isRepost && (
        <Box
          onClick={() => navigate(`/profile/${post.username}`)}
          sx={{
            display: 'flex', alignItems: 'center', gap: 0.8,
            px: 2, py: 0.7,
            borderBottom: `1px solid ${C.border}`,
            cursor: 'pointer',
            '&:hover': { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' },
          }}
        >
          <RepeatRounded sx={{ fontSize: 13, color: C.iconColor, flexShrink: 0 }} />
          <Typography fontSize={12} sx={{ color: C.textSub }}>
            <Typography component="span" fontSize={12} fontWeight={700} sx={{ color: C.textSub }}>
              {post.username}
            </Typography>
            님이 공유했어요
          </Typography>
        </Box>
      )}

      {/* 헤더 */}
      <Box sx={{
        display: 'flex', alignItems: 'center', gap: 1.5, px: 2, py: 1.2,
        position: 'relative',
      }}>
        <Avatar
          src={displayImage ? `http://localhost:5000${displayImage}` : null}
          sx={{
            width: 38, height: 38, cursor: 'pointer',
            bgcolor: C.avatarBg, color: '#E8C96D',
            fontWeight: 800, fontSize: 14,
            border: `1.5px solid ${isDark ? '#242424' : '#E8E8E8'}`,
            transition: 'transform 0.18s cubic-bezier(0.22,1,0.36,1)',
            '&:hover': { transform: 'scale(1.06)' },
          }}
          onClick={() => navigate(`/profile/${displayUser}`)}>
          {displayUser?.[0]?.toUpperCase()}
        </Avatar>

        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
            <Typography fontSize={14} fontWeight={700}
              sx={{ cursor: 'pointer', color: C.textMain, '&:hover': { opacity: 0.7 }, transition: 'opacity 0.15s' }}
              onClick={() => navigate(`/profile/${displayUser}`)}>
              {displayUser}
            </Typography>
            <RankBadge rank={post.win_rank} wins={post.total_wins} size="inline" />
          </Box>
          {/* 스타일 뱃지 */}
          {post.style && (
            <Box
              onClick={(e) => { e.stopPropagation(); navigate(`/explore?style=${post.style}`); }}
              sx={{
                display: 'inline-flex', alignItems: 'center',
                px: 0.9, py: '1px', borderRadius: 3, mt: 0.3,
                cursor: 'pointer',
                backgroundColor: `${styleColor}18`,
                border: `1px solid ${styleColor}45`,
                transition: 'opacity 0.15s',
                '&:hover': { opacity: 0.7 },
              }}>
              <Typography sx={{ fontSize: 9.5, fontWeight: 700, color: styleColor, letterSpacing: 0.5, textTransform: 'uppercase' }}>
                {post.style}
              </Typography>
            </Box>
          )}
        </Box>

        <IconButton size="small"
          onClick={handleMenuOpen}
          sx={{ color: C.dot, '&:hover': { color: C.textSub } }}>
          <MoreHorizRounded sx={{ fontSize: 18 }} />
        </IconButton>
      </Box>

      {/* ... 메뉴 */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
        onClick={e => e.stopPropagation()}
        PaperProps={{
          sx: {
            backgroundColor: C.menuBg,
            border: `1px solid ${C.menuBorder}`,
            borderRadius: 2,
            boxShadow: isDark ? '0 8px 24px rgba(0,0,0,0.5)' : '0 8px 24px rgba(0,0,0,0.12)',
            minWidth: 180,
          }
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}>
        {isOwner ? [
          <MenuItem key="edit" onClick={handleEdit} sx={menuItemSx}>게시물 수정</MenuItem>,
          <MenuItem key="copy" onClick={handleCopyLink} sx={menuItemSx}>링크 복사</MenuItem>,
          <Divider key="div" sx={{ borderColor: C.menuBorder, my: 0.5 }} />,
          <MenuItem key="delete" onClick={handleDelete} sx={dangerItemSx}>게시물 삭제</MenuItem>,
        ] : [
          <MenuItem key="follow" onClick={handleFollow} sx={isFollowing ? dangerItemSx : menuItemSx}>
            {isFollowing ? `${displayUser} 팔로우 취소` : `${displayUser} 팔로우`}
          </MenuItem>,
          <MenuItem key="goto" onClick={handleGoToPost} sx={menuItemSx}>게시물로 이동</MenuItem>,
          <MenuItem key="copy" onClick={handleCopyLink} sx={menuItemSx}>링크 복사</MenuItem>,
          <Divider key="div" sx={{ borderColor: C.menuBorder, my: 0.5 }} />,
          <MenuItem key="report" onClick={handleReport} sx={dangerItemSx}>신고</MenuItem>,
        ]}
      </Menu>

      {/* 이미지 없을 때 플레이스홀더 */}
      {imageList.length === 0 && (
        <Box onClick={() => navigate(`/post/${post.id}`)} sx={{
          height: 220, position: 'relative', overflow: 'hidden', cursor: 'pointer',
          background: isDark
            ? 'linear-gradient(145deg, #1C1A16 0%, #0F0E0B 60%, #151310 100%)'
            : 'linear-gradient(145deg, #F7F3EC 0%, #EDE8DF 60%, #E8E2D8 100%)',
        }}>
          <Box sx={{
            position: 'absolute', inset: 0,
            backgroundImage: isDark
              ? 'radial-gradient(circle, rgba(232,201,109,0.05) 1px, transparent 1px)'
              : 'radial-gradient(circle, rgba(232,201,109,0.15) 1px, transparent 1px)',
            backgroundSize: '18px 18px',
          }} />
          <Box sx={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 1.2,
          }}>
            <CheckroomRounded sx={{ fontSize: 52, color: '#E8C96D', opacity: 0.35 }} />
            <Typography sx={{ fontSize: 9, fontWeight: 800, letterSpacing: 4, color: '#E8C96D', opacity: 0.3, textTransform: 'uppercase' }}>
              No Photo
            </Typography>
          </Box>
        </Box>
      )}

      {/* 이미지 캐러셀 */}
      {imageList.length > 0 && (
        <Box sx={{ 
          position: 'relative', overflow: 'hidden',
          backgroundColor: isDark ? '#121212' : '#F9F9F9', // 로딩 중 배경색
          width: '100%',
          aspectRatio: '4 / 5', // 세로가 약간 긴 표준 피드 비율 고정
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <Box component="img"
            src={`http://localhost:5000${imageList[imgIndex]}`}
            onClick={handleImageClick}
            onLoad={() => setImgLoaded(true)}
            sx={{
              width: '100%', height: '100%',
              objectFit: 'cover', display: 'block', cursor: 'pointer',
              opacity: imgLoaded ? 1 : 0,
              transition: 'opacity 0.3s ease, transform 0.4s cubic-bezier(0.22,1,0.36,1)',
              '&:hover': { transform: imageList.length === 1 ? 'scale(1.015)' : 'none' },
              userSelect: 'none',
            }} />

          {/* 더블클릭 하트 애니메이션 */}
          {heartBurst && (
            <Box sx={{
              position: 'absolute', top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              pointerEvents: 'none', zIndex: 10,
              '@keyframes heartBurst': {
                '0%':   { transform: 'translate(-50%, -50%) scale(0) rotate(-10deg)', opacity: 0 },
                '18%':  { transform: 'translate(-50%, -50%) scale(1.35) rotate(6deg)',  opacity: 1 },
                '38%':  { transform: 'translate(-50%, -50%) scale(0.95) rotate(-3deg)', opacity: 1 },
                '58%':  { transform: 'translate(-50%, -50%) scale(1.12) rotate(2deg)',  opacity: 1 },
                '78%':  { transform: 'translate(-50%, -50%) scale(1.05)',               opacity: 0.85 },
                '100%': { transform: 'translate(-50%, -50%) scale(1.4)',                opacity: 0 },
              },
              animation: 'heartBurst 0.72s cubic-bezier(0.22,1,0.36,1) forwards',
            }}>
              <FavoriteRounded sx={{
                fontSize: 110,
                color: 'rgba(255,255,255,0.96)',
                filter: 'drop-shadow(0 4px 24px rgba(255,77,109,0.65)) drop-shadow(0 0 8px rgba(255,77,109,0.4))',
              }} />
            </Box>
          )}
          {imgIndex > 0 && (
            <Box onClick={e => { e.stopPropagation(); setImgIndex(i => i - 1); }}
              sx={{
                position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
                width: 32, height: 32, borderRadius: '50%',
                backgroundColor: 'rgba(0,0,0,0.55)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: '#fff', fontSize: 22, fontWeight: 300, lineHeight: 1,
                '&:hover': { backgroundColor: 'rgba(0,0,0,0.75)' },
                userSelect: 'none', zIndex: 1,
              }}>‹</Box>
          )}
          {imgIndex < imageList.length - 1 && (
            <Box onClick={e => { e.stopPropagation(); setImgIndex(i => i + 1); }}
              sx={{
                position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                width: 32, height: 32, borderRadius: '50%',
                backgroundColor: 'rgba(0,0,0,0.55)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: '#fff', fontSize: 22, fontWeight: 300, lineHeight: 1,
                '&:hover': { backgroundColor: 'rgba(0,0,0,0.75)' },
                userSelect: 'none', zIndex: 1,
              }}>›</Box>
          )}
          {imageList.length > 1 && (
            <Box sx={{
              position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)',
              display: 'flex', gap: 0.6, zIndex: 1,
              backgroundColor: 'rgba(0,0,0,0.35)', borderRadius: 10, px: 1, py: 0.5,
            }}>
              {imageList.map((_, i) => (
                <Box key={i}
                  onClick={e => { e.stopPropagation(); setImgIndex(i); }}
                  sx={{
                    width: i === imgIndex ? 16 : 6, height: 6, borderRadius: 3,
                    backgroundColor: i === imgIndex ? '#FFFFFF' : 'rgba(255,255,255,0.45)',
                    cursor: 'pointer', transition: 'all 0.2s',
                  }} />
              ))}
            </Box>
          )}
        </Box>
      )}

      {/* 액션 버튼 */}
      <Box sx={{ display: 'flex', alignItems: 'center', px: 1.5, pt: 0.8 }}
        onClick={e => e.stopPropagation()}>
        {/* 좋아요 */}
        <IconButton disableRipple size="small" onClick={handleLike}
          sx={{
            color: post.is_liked ? '#ED4956' : C.iconColor,
            p: 0.8,
            animation: likeAnimating ? 'heartPop 0.38s cubic-bezier(0.22,1,0.36,1)' : 'none',
            '&:hover': { color: '#ED4956' },
            transition: 'color 0.15s',
          }}>
          {post.is_liked
            ? <FavoriteRounded  sx={{ fontSize: 24 }} />
            : <FavoriteBorderRounded sx={{ fontSize: 24 }} />}
        </IconButton>

        {/* 댓글 */}
        <IconButton disableRipple size="small"
          sx={{ color: C.iconColor, p: 0.8, '&:hover': { color: C.textMain }, transition: 'color 0.15s' }}
          onClick={() => navigate(`/post/${post.id}`)}>
          <ChatBubbleOutlineRounded sx={{ fontSize: 22 }} />
        </IconButton>

        {/* 공유 */}
        <IconButton disableRipple size="small" onClick={handleShareOpen}
          sx={{
            color: isReposted ? C.textMain : C.iconColor, p: 0.8,
            '&:hover': { color: C.textMain },
            transition: 'color 0.15s',
          }}>
          <RepeatRounded sx={{ fontSize: 22 }} />
        </IconButton>

        <Box sx={{ flex: 1 }} />

        {/* 북마크 */}
        <IconButton disableRipple size="small" onClick={handleBookmark}
          sx={{
            color: post.is_bookmarked ? C.textMain : C.iconColor, p: 0.8,
            '&:hover': { color: C.textMain },
            transition: 'color 0.15s',
          }}>
          {post.is_bookmarked
            ? <BookmarkRounded  sx={{ fontSize: 23 }} />
            : <BookmarkBorderRounded sx={{ fontSize: 23 }} />}
        </IconButton>
      </Box>

      {/* 공유 드롭다운 */}
      <Menu anchorEl={shareAnchor} open={Boolean(shareAnchor)} onClose={() => setShareAnchor(null)}
        onClick={e => e.stopPropagation()}
        PaperProps={{ sx: { bgcolor: isDark ? '#161616' : '#FFFFFF', border: `1px solid ${isDark ? '#2A2A2A' : '#EBEBEB'}`, borderRadius: 2, minWidth: 170 } }}>
        <MenuItem onClick={handleRepostOpen} sx={menuItemSx}>
          <RepeatRounded sx={{ fontSize: 18, mr: 1.2, color: isReposted ? '#4CAF50' : '#E8C96D' }} />
          {isReposted ? '공유 취소하기' : '내 피드에 공유'}
        </MenuItem>
        <MenuItem onClick={handleCopyLink} sx={menuItemSx}>
          <LinkRounded sx={{ fontSize: 18, mr: 1.2 }} />
          링크 복사
        </MenuItem>
      </Menu>

      {/* 리포스트 확인 다이얼로그 */}
      <Dialog
        open={repostDialog}
        onClose={() => setRepostDialog(false)}
        onClick={e => e.stopPropagation()}
        PaperProps={{
          sx: {
            bgcolor: isDark ? '#111' : '#fff',
            border: `1px solid ${isDark ? '#222' : '#EBEBEB'}`,
            borderRadius: 3,
            minWidth: 300,
            maxWidth: 340,
            overflow: 'hidden',
          }
        }}
      >
        <DialogContent sx={{ p: 0 }}>
          {/* 썸네일 미리보기 */}
          {post.thumbnail && (
            <Box sx={{ position: 'relative', height: 140, overflow: 'hidden' }}>
              <Box component="img"
                src={`http://localhost:5000${post.thumbnail}`}
                sx={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(1px) brightness(0.6)' }}
              />
              <Box sx={{
                position: 'absolute', inset: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 0.5,
              }}>
                <RepeatRounded sx={{ fontSize: 32, color: isReposted ? '#4CAF50' : '#E8C96D' }} />
                <Typography fontSize={12} fontWeight={700} sx={{ color: '#fff' }}>
                  {isReposted ? '공유 취소' : '내 피드에 공유'}
                </Typography>
              </Box>
            </Box>
          )}
          <Box sx={{ px: 2.5, pt: 2, pb: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
              <Avatar
                src={post.profile_image ? `http://localhost:5000${(isRepost ? post.origin_profile_image : post.profile_image)}` : null}
                sx={{ width: 32, height: 32, bgcolor: isDark ? '#1A1A1A' : '#F0F0F0', color: '#E8C96D', fontSize: 12, fontWeight: 800 }}
              >
                {displayUser?.[0]?.toUpperCase()}
              </Avatar>
              <Box>
                <Typography fontSize={13} fontWeight={700} sx={{ color: isDark ? '#EFEFEF' : '#0A0A0A' }}>
                  {displayUser}
                </Typography>
                {post.content && (
                  <Typography fontSize={11} sx={{
                    color: isDark ? '#606060' : '#888',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200,
                  }}>
                    {post.content}
                  </Typography>
                )}
              </Box>
            </Box>

            {isReposted ? (
              <>
                <Typography fontSize={13} sx={{ color: isDark ? '#A0A0A0' : '#555', mb: 2, lineHeight: 1.5 }}>
                  이미 내 피드에 공유한 게시물이에요.<br />공유를 취소할까요?
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Box onClick={() => setRepostDialog(false)}
                    sx={{ flex: 1, py: 1.2, borderRadius: 2, textAlign: 'center', cursor: 'pointer', border: `1px solid ${isDark ? '#2A2A2A' : '#E0E0E0'}`, '&:hover': { bgcolor: isDark ? '#1A1A1A' : '#F5F5F5' } }}>
                    <Typography fontSize={13} fontWeight={600} sx={{ color: isDark ? '#A0A0A0' : '#666' }}>취소</Typography>
                  </Box>
                  <Box onClick={handleUnrepost}
                    sx={{ flex: 1, py: 1.2, borderRadius: 2, textAlign: 'center', cursor: 'pointer', bgcolor: '#FF4D6D', '&:hover': { bgcolor: '#E03355' } }}>
                    <Typography fontSize={13} fontWeight={700} sx={{ color: '#fff' }}>공유 취소</Typography>
                  </Box>
                </Box>
              </>
            ) : (
              <>
                <Typography fontSize={13} sx={{ color: isDark ? '#A0A0A0' : '#555', mb: 2, lineHeight: 1.5 }}>
                  이 게시물을 내 피드에 공유할까요?
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Box onClick={() => setRepostDialog(false)}
                    sx={{ flex: 1, py: 1.2, borderRadius: 2, textAlign: 'center', cursor: 'pointer', border: `1px solid ${isDark ? '#2A2A2A' : '#E0E0E0'}`, '&:hover': { bgcolor: isDark ? '#1A1A1A' : '#F5F5F5' } }}>
                    <Typography fontSize={13} fontWeight={600} sx={{ color: isDark ? '#A0A0A0' : '#666' }}>취소</Typography>
                  </Box>
                  <Box onClick={handleRepostConfirm}
                    sx={{ flex: 1, py: 1.2, borderRadius: 2, textAlign: 'center', cursor: 'pointer', background: 'linear-gradient(135deg, #E8C96D, #D4AF37)', '&:hover': { opacity: 0.9 } }}>
                    <Typography fontSize={13} fontWeight={700} sx={{ color: '#0A0A0A' }}>공유하기</Typography>
                  </Box>
                </Box>
              </>
            )}
          </Box>
          <Box sx={{ height: 12 }} />
        </DialogContent>
      </Dialog>

      {/* 좋아요 수 + 댓글 수 */}
      {(post.likes_count > 0 || post.comments_count > 0) && (
        <Box sx={{ display:'flex', alignItems:'center', gap:1.5, px:2, pb:0.5 }}>
          {post.likes_count > 0 && (
            <Typography fontSize={13} fontWeight={700} sx={{ color: C.textMain }}>
              좋아요 {Number(post.likes_count).toLocaleString()}개
            </Typography>
          )}
          {post.comments_count > 0 && (
            <Typography
              fontSize={13} fontWeight={400}
              sx={{ color: C.textSub, cursor: 'pointer', '&:hover': { color: C.textMain } }}
              onClick={() => navigate(`/post/${post.id}`)}>
              댓글 {Number(post.comments_count).toLocaleString()}개 모두 보기
            </Typography>
          )}
        </Box>
      )}

      {/* 내용 */}
      <Box sx={{ px: 2, pb: 1.5, cursor: 'pointer' }}
        onClick={() => navigate(`/post/${post.id}`)}>
        {post.title && (
          <Typography fontSize={14} fontWeight={700} mb={0.3} sx={{ color: C.textMain, letterSpacing: '-0.01em', lineHeight: 1.35 }}>
            {post.title}
          </Typography>
        )}
        <Typography fontSize={13} lineHeight={1.6} sx={{
          color: C.textSub,
          wordBreak: 'break-word',
          whiteSpace: 'pre-wrap', // 줄바꿈 기호(\n)가 있다면 그대로 반영
        }}>
          <Typography component="span" fontSize={13} fontWeight={700} sx={{ color: C.textMain, mr: 0.8 }}>
            {displayUser}
          </Typography>
          {post.content}
        </Typography>
        {tags.length > 0 && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.4, mt: 0.6 }}>
            {tags.map((tag, idx) => {
              const clean = String(tag).replace(/^#/, '');
              return (
                <Typography key={`${tag}-${idx}`} component="span"
                  fontSize={13} fontWeight={400}
                  onClick={(e) => { e.stopPropagation(); navigate(`/tag/${encodeURIComponent(clean)}`); }}
                  sx={{
                    color: C.tagColor, lineHeight: 1.5, cursor: 'pointer',
                    '&:hover': { opacity: 0.7 },
                    transition: 'opacity 0.12s',
                  }}>
                  #{clean}
                </Typography>
              );
            })}
          </Box>
        )}
        <Typography fontSize={11} sx={{ color: C.textTime, mt: 0.8, textTransform: 'uppercase', letterSpacing: 0.3 }}>
          {timeAgo(post.created_at)}
        </Typography>
      </Box>
      <ReportDialog
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        onSubmit={reason => reportPost(post.id, reason)}
      />
    </Box>
  );
};

export default PostCard;
