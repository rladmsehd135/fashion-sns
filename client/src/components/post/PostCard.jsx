import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Avatar, IconButton, Menu, MenuItem, Divider } from '@mui/material';
import {
  FavoriteRounded, FavoriteBorderRounded,
  BookmarkRounded, BookmarkBorderRounded,
  ChatBubbleOutlineRounded, MoreHorizRounded,
  CheckroomRounded, RepeatRounded, LinkRounded,
  AutoStoriesRounded, EmojiEventsRounded
} from '@mui/icons-material';
import toast from 'react-hot-toast';
import { toggleLike, toggleBookmark, repostPost } from '../../api/postApi';
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

  const C = {
    bg: isDark ? '#111111' : '#FFFFFF',
    border: isDark ? '#1E1E1E' : '#EBEBEB',
    avatarBg: isDark ? '#1A1A1A' : '#F0F0F0',
    iconColor: isDark ? '#505050' : '#AAAAAA',
    textMain: isDark ? '#E0E0E0' : '#111111',
    textSub: isDark ? '#606060' : '#666666',
    textUser: isDark ? '#A0A0A0' : '#444444',
    textTime: isDark ? '#404040' : '#AAAAAA',
    dot: isDark ? '#2A2A2A' : '#DDDDDD',
    likeCount: isDark ? '#C0C0C0' : '#262626',
    tagColor: '#E8C96D',
    menuBg: isDark ? '#1A1A1A' : '#FFFFFF',
    menuBorder: isDark ? '#2A2A2A' : '#EBEBEB',
    menuText: isDark ? '#EFEFEF' : '#0A0A0A',
    menuHover: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
    repostBg: isDark ? 'rgba(232,201,109,0.02)' : 'rgba(232,201,109,0.03)',
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
      setPost(prev => ({
        ...prev,
        is_liked: res.data.liked ? 1 : 0,
        likes_count: res.data.liked ? prev.likes_count + 1 : prev.likes_count - 1,
      }));
    } catch { toast.error('잠시 후 다시 시도해주세요.'); }
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

  const handleRepost = async (e) => {
    e.stopPropagation();
    setShareAnchor(null);
    try {
      await repostPost(post.id);
      setPost(prev => ({ ...prev, repost_count: (Number(prev.repost_count) || 0) + 1 }));
      toast.success('내 피드에 리포스트했어요!');
    } catch (err) {
      const msg = err.response?.data?.message || '리포스트에 실패했어요.';
      toast.error(msg);
    }
  };
  const handleMenuClose = () => setMenuAnchor(null);



  const handleEdit = () => {
    handleMenuClose();
    navigate(`/post/edit/${post.id}`);
  };

  const handleDelete = async () => {
    handleMenuClose();
    if (!window.confirm('게시물을 삭제할까요?')) return;
    try {
      await axiosInstance.delete(`/posts/${post.id}`);
      toast.success('게시물이 삭제됐어요.');
      setDeleted(true);
    } catch { toast.error('삭제에 실패했어요.'); }
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
    toast('신고가 접수됐어요.', { icon: '🚩', style: { background: isDark ? '#0F0F0F' : '#fff', color: isDark ? '#F0F0F0' : '#0A0A0A', fontSize: '13px' } });
    handleMenuClose();
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
        {imageList.length > 1 && (
          <Box sx={{
            position: 'absolute', top: 8, right: 8,
            backgroundColor: 'rgba(0,0,0,0.6)',
            borderRadius: 1, px: 0.8, py: 0.3,
          }}>
            <Typography fontSize={10} color="#fff" fontWeight={700}>1/{imageList.length}</Typography>
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
      boxShadow: isDark ? 'none' : '0 0 0 1px rgba(0,0,0,0.05)',
    }}>

      {/* 리포스트 상단 라벨 */}
      {isRepost && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, px: 2.5, pt: 1.5, pb: 0 }}>
          <RepeatRounded sx={{ fontSize: 16, color: C.textSub }} />
          <Typography fontSize={12} fontWeight={700} sx={{ color: C.textSub }}>
            {post.username}님이 리포스트했습니다
          </Typography>
        </Box>
      )}

      {/* 헤더 */}
      <Box sx={{ 
        display: 'flex', alignItems: 'center', gap: 1.5, px: 2, py: 1.5,
        position: 'relative',
        backgroundColor: isRepost ? C.repostBg : 'transparent',
      }}>
        {isRepost && <Box sx={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, bgcolor: '#E8C96D' }} />}
        <Avatar
          src={displayImage ? `http://localhost:5000${displayImage}` : null}
          sx={{
            width: 36, height: 36, cursor: 'pointer',
            bgcolor: C.avatarBg, color: '#E8C96D',
            fontWeight: 800, fontSize: 14,
            border: `1.5px solid ${C.border}`,
          }}
          onClick={() => navigate(`/profile/${displayUser}`)}>
          {displayUser?.[0]?.toUpperCase()}
        </Avatar>

        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
              <Typography fontSize={13} fontWeight={800}
              sx={{ cursor: 'pointer', color: C.textMain, '&:hover': { color: '#E8C96D' }, transition: 'color 0.15s', letterSpacing: '-0.01em' }}
              onClick={() => navigate(`/profile/${displayUser}`)}>
              {displayUser}
              </Typography>
              {/* 작성자가 1,2,3등인 경우 뱃지 표시 (post 데이터에 담겨있다고 가정) */}
              {post.win_rank >= 1 && post.win_rank <= 3 && (
                <EmojiEventsRounded sx={{ 
                  fontSize: 14, 
                  color: post.win_rank === 1 ? '#FFD700' : post.win_rank === 2 ? '#C0C0C0' : '#CD7F32' 
                }} />
              )}
            </Box>
            <Box sx={{ width: 2, height: 2, borderRadius: '50%', backgroundColor: C.dot }} />
            <Typography variant="caption" sx={{ color: C.textTime }}>
              {timeAgo(post.created_at)}
            </Typography>
          </Box>
          {/* 스타일 뱃지 — 클릭 시 해당 스타일 탐색 */}
          {post.style && (
            <Box
              onClick={(e) => { e.stopPropagation(); navigate(`/explore?style=${post.style}`); }}
              sx={{
                display: 'inline-flex', alignItems: 'center',
                px: 0.8, py: '1px', borderRadius: 4, mt: 0.2,
                cursor: 'pointer',
                backgroundColor: `${styleColor}15`,
                border: `1px solid ${styleColor}40`,
                transition: 'all 0.15s',
                '&:hover': { backgroundColor: `${styleColor}25`, borderColor: `${styleColor}70` },
              }}>
              <Typography sx={{ fontSize: 9, fontWeight: 700, color: styleColor, letterSpacing: 0.8, textTransform: 'uppercase' }}>
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
        <Box sx={{ position: 'relative', overflow: 'hidden' }}>
          <Box component="img"
            src={`http://localhost:5000${imageList[imgIndex]}`}
            onClick={() => navigate(`/post/${post.id}`)}
            sx={{
              width: '100%', maxHeight: 520,
              objectFit: 'cover', display: 'block', cursor: 'pointer',
              transition: 'transform 0.4s ease',
              '&:hover': { transform: imageList.length === 1 ? 'scale(1.02)' : 'none' },
            }} />
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
      <Box sx={{ display: 'flex', alignItems: 'center', px: 1.5, pt: 1 }}
        onClick={e => e.stopPropagation()}>
        <IconButton disableRipple size="small" onClick={handleLike}
          sx={{
            color: post.is_liked ? '#FF4D6D' : C.iconColor,
            transition: 'transform 0.15s ease',
            '&:active': { transform: 'scale(1.3)' }, p: 0.8,
          }}>
          {post.is_liked ? <FavoriteRounded sx={{ fontSize: 24 }} /> : <FavoriteBorderRounded sx={{ fontSize: 24 }} />}
        </IconButton>
        <IconButton disableRipple size="small" sx={{ color: C.iconColor, p: 0.8 }}
          onClick={() => navigate(`/post/${post.id}`)}>
          <ChatBubbleOutlineRounded sx={{ fontSize: 22 }} />
        </IconButton>
        {/* 공유/리포스트 버튼 */}
        <IconButton disableRipple size="small" onClick={handleShareOpen}
          sx={{ color: C.iconColor, p: 0.8 }}>
          <RepeatRounded sx={{ fontSize: 22 }} />
        </IconButton>
        {Number(post.repost_count) > 0 && (
          <Typography fontSize={11} sx={{ color: C.iconColor, ml: -0.4, mr: 0.4 }}>
            {post.repost_count}
          </Typography>
        )}
        <Box sx={{ flex: 1 }} />
        <IconButton disableRipple size="small" onClick={handleBookmark}
          sx={{ color: post.is_bookmarked ? '#E8C96D' : C.iconColor, p: 0.8 }}>
          {post.is_bookmarked ? <BookmarkRounded sx={{ fontSize: 22 }} /> : <BookmarkBorderRounded sx={{ fontSize: 22 }} />}
        </IconButton>
      </Box>

      {/* 공유 드롭다운 */}
      <Menu anchorEl={shareAnchor} open={Boolean(shareAnchor)} onClose={() => setShareAnchor(null)}
        onClick={e => e.stopPropagation()}
        PaperProps={{ sx: { bgcolor: isDark ? '#161616' : '#FFFFFF', border: `1px solid ${isDark ? '#2A2A2A' : '#EBEBEB'}`, borderRadius: 2, minWidth: 170 } }}>
        <MenuItem onClick={handleRepost} sx={menuItemSx}>
          <RepeatRounded sx={{ fontSize: 18, mr: 1.2, color: '#E8C96D' }} />
          내 피드에 리포스트
        </MenuItem>
        <MenuItem onClick={handleCopyLink} sx={menuItemSx}>
          <LinkRounded sx={{ fontSize: 18, mr: 1.2 }} />
          링크 복사
        </MenuItem>
      </Menu>

      {/* 좋아요 수 */}
      {post.likes_count > 0 && (
        <Typography fontSize={12} fontWeight={700} sx={{ px: 2, pb: 0.5, color: C.likeCount }}>
          좋아요 {post.likes_count.toLocaleString()}개
        </Typography>
      )}

      {/* 내용 */}
      <Box sx={{ 
        px: 2, pb: 2, cursor: 'pointer',
        borderLeft: isRepost ? `3px solid #E8C96D` : 'none',
        backgroundColor: isRepost ? C.repostBg : 'transparent',
      }}
      onClick={() => navigate(`/post/${post.id}`)}>
        {post.title && (
          <Typography fontSize={14} fontWeight={800} mb={0.5} sx={{ color: C.textMain, letterSpacing: '-0.02em', lineHeight: 1.3 }}>
            {post.title}
          </Typography>
        )}
        <Typography fontSize={13} sx={{
          color: C.textSub,
          display: '-webkit-box', WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          <Typography component="span" fontSize={13} fontWeight={600} sx={{ color: C.textUser, mr: 0.7 }}>
            {displayUser}
          </Typography>
          {post.content}
        </Typography>
        {tags.length > 0 && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.7, mt: 1 }}>
            {tags.map((tag, idx) => (
              <Typography key={`${tag}-${idx}`} component="span"
                fontSize={12} fontWeight={700}
                onClick={(e) => { e.stopPropagation(); navigate(`/search?q=${encodeURIComponent(String(tag).startsWith('#') ? tag : '#' + tag)}`); }}
                sx={{ color: C.tagColor, lineHeight: 1.4, cursor: 'pointer', '&:hover': { opacity: 0.75 } }}>
                {String(tag).startsWith('#') ? tag : `#${tag}`}
              </Typography>
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default PostCard;
