import { useState, useEffect, useRef, Fragment } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Avatar, Typography, IconButton,
  CircularProgress, Menu, MenuItem, Divider,
  useMediaQuery, useTheme,
  Dialog,
} from '@mui/material';
import {
  FavoriteBorderRounded, FavoriteRounded,
  ChatBubbleOutlineRounded, BookmarkBorderRounded,
  BookmarkRounded, MoreHorizRounded,
  ArrowBackIosNewRounded, CloseRounded,
  ShoppingBagRounded, OpenInNewRounded, RepeatRounded,
} from '@mui/icons-material';
import { Popover } from '@mui/material';
import useThemeStore from '../../store/themeStore';
import toast from 'react-hot-toast';
import confirmToast from '../../utils/confirmToast';
import useAuthStore from '../../store/authStore';
import ReportDialog from '../../components/common/ReportDialog';
import FitReview from '../../components/common/FitReview';
import { reportPost } from '../../api/postApi';
import axiosInstance from '../../api/axiosInstance';

import { styleColors } from '../../constants/styleConstants';

const timeAgo = (date) => {
  if (!date) return '';
  const diff = Date.now() - new Date(date).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return '방금 전';
  if (m < 60) return `${m}분 전`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}시간 전`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}일 전`;
  return new Date(date).toLocaleDateString('ko-KR');
};

export default function PostDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user } = useAuthStore();
  const { mode } = useThemeStore();
  const isDark = mode === 'dark';

  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [imgIndex, setImgIndex] = useState(0);
  const commentRef = useRef(null);
  const [submitting, setSubmitting] = useState(false);
  const [replyTo, setReplyTo] = useState(null); // { id, username }
  const [pinAnchor,   setPinAnchor]   = useState(null); // { el, item }
  const [reportOpen,  setReportOpen]  = useState(false);

  const [menuAnchor, setMenuAnchor] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [postRes, commentRes] = await Promise.all([
          axiosInstance.get(`/posts/${id}`),
          axiosInstance.get(`/posts/${id}/comments`),
        ]);
        setPost(postRes.data);
        setComments(commentRes.data);
      } catch {
        toast.error('게시물을 불러오지 못했어요.');
        navigate(-1);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  const handleLike = async () => {
    if (!post) return;
    try {
      await axiosInstance.post(`/posts/${post.id}/like`);
      setPost(p => ({
        ...p,
        is_liked: !p.is_liked,
        likes_count: p.is_liked ? p.likes_count - 1 : p.likes_count + 1,
      }));
    } catch { }
  };

  const handleBookmark = async () => {
    if (!post) return;
    try {
      await axiosInstance.post(`/bookmarks/${post.id}`);
      setPost(p => ({ ...p, is_bookmarked: !p.is_bookmarked }));
    } catch { }
  };

  const isOwner = user?.username === post?.username || user?.id === post?.user_id;

  const handleMenuOpen = (e) => {
    e.stopPropagation();
    setMenuAnchor(e.currentTarget);
  };
  const handleMenuClose = () => setMenuAnchor(null);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/post/${id}`);
    toast.success('링크가 복사됐어요.');
    handleMenuClose();
  };

  const handleEditPost = () => {
    handleMenuClose();
    navigate(`/post/edit/${id}`);
  };

  const handleDeletePost = () => {
    handleMenuClose();
    confirmToast('게시물을 삭제할까요?', async () => {
      try {
        await axiosInstance.delete(`/posts/${id}`);
        toast.success('게시물이 삭제됐어요.');
        navigate(-1);
      } catch { toast.error('삭제에 실패했어요.'); }
    });
  };

  const handleFollowToggle = async () => {
    if (!post?.user_id) return;
    try {
      await axiosInstance.post(`/follow/${post.user_id}`);
      setIsFollowing(f => !f);
      toast.success(isFollowing ? `${post.username} 팔로우를 취소했어요.` : `${post.username}님을 팔로우했어요! 👋`);
    } catch {}
    handleMenuClose();
  };

  const handleReport = () => {
    handleMenuClose();
    setReportOpen(true);
  };

  const handleComment = async (e) => {
    if (e) e.preventDefault();
    const value = commentRef.current?.value?.trim();
    if (!value) return;
    setSubmitting(true);
    try {
      const body = { content: value };
      if (replyTo) body.parent_id = replyTo.id;
      const res = await axiosInstance.post(`/posts/${id}/comments`, body);

      const newComment = {
        ...res.data,
        username: res.data.username || user?.username,
        profile_image: res.data.profile_image || user?.profile_image,
        created_at: res.data.created_at || new Date().toISOString(),
        parent_id: replyTo?.id || null,
      };
      setComments(prev => [...prev, newComment]);
      setPost(p => ({ ...p, comments_count: (p.comments_count || 0) + 1 }));
      if (commentRef.current) commentRef.current.value = '';
      setReplyTo(null);
    } catch {
      toast.error('댓글 작성에 실패했어요.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', backgroundColor: '#080808'
      }}>
        <CircularProgress sx={{ color: '#E8C96D' }} />
      </Box>
    );
  }

  if (!post) return null;

  const isRepost      = !!post.repost_origin_id;
  const displayUser   = isRepost && post.origin_username   ? post.origin_username   : post.username;
  const displayAvatar = isRepost && post.origin_profile_image ? post.origin_profile_image : post.profile_image;

  const images = (post.images || []).map(img =>
    typeof img === 'string' ? img : img.image_url
  ).filter(Boolean);
  const parseTags = (raw) => {
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.map(t => String(t).replace(/^#/, '').trim()).filter(Boolean);
      }
    } catch { }
    return raw.split(',').map(t => t.trim().replace(/^#/, '')).filter(Boolean);
  };
  const tags = parseTags(post.tags);
  const color = styleColors[post.style] || '#808080';

  return (
    <Dialog
      fullScreen={isMobile}
      open={true}
      onClose={() => navigate(-1)}
      maxWidth="md" // lg(1200px)보다 md(900px)가 상세보기에 더 적절한 비율을 제공합니다
      fullWidth
      sx={{
        '& .MuiDialog-paper': {
          backgroundColor: '#0A0A0A',
          backgroundImage: 'none',
          borderRadius: isMobile ? 0 : '12px',
          height: isMobile ? '100vh' : '85vh',
          maxHeight: 1100,
          display: 'flex',
          flexDirection: 'column',
          border: isMobile ? 'none' : '1px solid #1E1E1E',
          boxShadow: '0 0 40px rgba(0,0,0,0.5)',
          margin: isMobile ? 0 : 2,
        }
      }}
    >
      {/* 닫기 버튼 (PC) - 메뉴와 겹치지 않게 왼쪽으로 이동하거나 배경 투명도 조절 */}
      {!isMobile && (
        <IconButton 
          onClick={() => navigate(-1)} 
          sx={{ 
            position: 'absolute', top: 12, left: 12, // 왼쪽으로 이동하여 메뉴와 분리
            zIndex: 500, color: '#fff', bgcolor: 'rgba(0,0,0,0.3)',
            '&:hover': { bgcolor: 'rgba(0,0,0,0.5)' }
          }}
        >
          <CloseRounded />
        </IconButton>
      )}
      <Box sx={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', height: '100%' }}>
        {/* 이미지 영역 인라이닝 */}
        <Box sx={{
          position: 'relative',
          backgroundColor: '#000',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: isMobile ? '100%' : '60%',
          minHeight: isMobile ? 300 : '100%',
          flexShrink: 0,
        }}>
          {images.length > 0 ? (
            <>
              <Box sx={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Box component="img"
                src={`http://localhost:5000${images[imgIndex]}`}
                sx={{ width: '100%', height: '100%', objectFit: 'contain', maxHeight: isMobile ? 400 : '100%', display: 'block' }}
              />
              {/* 아이템 핀 오버레이 */}
              {(post.items || [])
                .filter(item => Number(item.image_index) === imgIndex && item.x_pct != null && item.y_pct != null)
                .map((item, idx) => (
                  <Box
                    key={idx}
                    onClick={e => { e.stopPropagation(); setPinAnchor({ el: e.currentTarget, item }); }}
                    sx={{
                      position: 'absolute',
                      left: `${item.x_pct}%`,
                      top: `${item.y_pct}%`,
                      transform: 'translate(-50%, -50%)',
                      zIndex: 5,
                      cursor: 'pointer',
                      width: 32, height: 32,
                      borderRadius: '50%',
                      backgroundColor: 'rgba(10,10,10,0.75)',
                      border: '2px solid rgba(255,255,255,0.9)',
                      backdropFilter: 'blur(6px)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: '0 2px 12px rgba(0,0,0,0.5)',
                      transition: 'transform 0.15s, background-color 0.15s',
                      '&:hover': { transform: 'translate(-50%, -50%) scale(1.15)', backgroundColor: 'rgba(232,201,109,0.85)' },
                    }}
                  >
                    <ShoppingBagRounded sx={{ fontSize: 15, color: '#fff' }} />
                  </Box>
                ))
              }
              {/* 핀 팝오버 */}
              <Popover
                open={Boolean(pinAnchor)}
                anchorEl={pinAnchor?.el}
                onClose={() => setPinAnchor(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                transformOrigin={{ vertical: 'top', horizontal: 'center' }}
                PaperProps={{ sx: { backgroundColor: '#111', border: '1px solid #222', borderRadius: 2, p: 1.5, maxWidth: 220, boxShadow: '0 8px 32px rgba(0,0,0,0.6)' } }}
              >
                {pinAnchor?.item && (
                  <Box>
                    {pinAnchor.item.brand_name && (
                      <Typography fontSize={10} fontWeight={700} letterSpacing={1.5} sx={{ color: '#E8C96D', textTransform: 'uppercase', mb: 0.3 }}>
                        {pinAnchor.item.brand_name}
                      </Typography>
                    )}
                    <Typography fontSize={13} fontWeight={700} sx={{ color: '#EFEFEF', mb: 0.5 }}>
                      {pinAnchor.item.item_name}
                    </Typography>
                    {pinAnchor.item.price && (
                      <Typography fontSize={12} sx={{ color: '#A0A0A0', mb: 0.5 }}>
                        {Number(pinAnchor.item.price).toLocaleString()}원
                      </Typography>
                    )}
                    {pinAnchor.item.purchase_url && (
                      <Box
                        component="a"
                        href={pinAnchor.item.purchase_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={e => e.stopPropagation()}
                        sx={{ display: 'flex', alignItems: 'center', gap: 0.4, mt: 0.5, textDecoration: 'none' }}
                      >
                        <Typography fontSize={11} sx={{ color: '#4A90D9', fontWeight: 600 }}>구매하기</Typography>
                        <OpenInNewRounded sx={{ fontSize: 11, color: '#4A90D9' }} />
                      </Box>
                    )}
                  </Box>
                )}
              </Popover>
              </Box>
              {images.length > 1 && (
                <>
                  {imgIndex > 0 && (
                    <IconButton onClick={() => setImgIndex(i => i - 1)} sx={{ position: 'absolute', left: 12, backgroundColor: 'rgba(0,0,0,0.5)', color: '#fff', width: 32, height: 32, '&:hover': { backgroundColor: 'rgba(0,0,0,0.7)' } }}>
                      <ArrowBackIosNewRounded sx={{ fontSize: 14 }} />
                    </IconButton>
                  )}
                  {imgIndex < images.length - 1 && (
                    <IconButton onClick={() => setImgIndex(i => i + 1)} sx={{ position: 'absolute', right: 12, backgroundColor: 'rgba(0,0,0,0.5)', color: '#fff', width: 32, height: 32, transform: 'scaleX(-1)', '&:hover': { backgroundColor: 'rgba(0,0,0,0.7)' } }}>
                      <ArrowBackIosNewRounded sx={{ fontSize: 14 }} />
                    </IconButton>
                  )}
                  <Box sx={{ position: 'absolute', bottom: 12, display: 'flex', gap: 0.5 }}>
                    {images.map((_, i) => (
                      <Box key={i} onClick={() => setImgIndex(i)} sx={{ width: i === imgIndex ? 16 : 6, height: 6, borderRadius: 3, backgroundColor: i === imgIndex ? '#fff' : 'rgba(255,255,255,0.4)', cursor: 'pointer', transition: 'all 0.2s' }} />
                    ))}
                  </Box>
                </>
              )}
            </>
          ) : (
            <Box sx={{ width: '100%', height: '100%', minHeight: 400, background: `linear-gradient(135deg, ${color}20, #0D0D0D)`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
              <CheckroomRounded sx={{ fontSize: 56, color: color, opacity: 0.25 }} />
              <Typography sx={{ fontSize: 10, fontWeight: 800, letterSpacing: 4, color: color, opacity: 0.2, textTransform: 'uppercase' }}>No Photo</Typography>
            </Box>
          )}
        </Box>

        {/* 정보 영역 인라이닝 */}
        <Box sx={{
          width: isMobile ? '100%' : '40%',
          display: 'flex', flexDirection: 'column',
          backgroundColor: '#0A0A0A',
          borderLeft: isMobile ? 'none' : '1px solid #141414',
          height: '100%',
        }}>
          {/* 리포스트 배너 */}
          {isRepost && (
            <Box
              onClick={() => navigate(`/profile/${post.username}`)}
              sx={{
                display: 'flex', alignItems: 'center', gap: 1,
                px: 2, py: 0.9, cursor: 'pointer', flexShrink: 0,
                background: 'linear-gradient(90deg, rgba(232,201,109,0.1) 0%, transparent 100%)',
                borderBottom: '1px solid rgba(232,201,109,0.12)',
                '&:hover': { background: 'rgba(232,201,109,0.12)' },
              }}
            >
              <RepeatRounded sx={{ fontSize: 13, color: '#E8C96D' }} />
              <Avatar
                src={post.profile_image ? `http://localhost:5000${post.profile_image}` : null}
                sx={{ width: 18, height: 18, bgcolor: '#1A1A1A', color: '#E8C96D', fontSize: 8, fontWeight: 800 }}
              >
                {post.username?.[0]?.toUpperCase()}
              </Avatar>
              <Typography fontSize={12} fontWeight={700} sx={{ color: '#E8C96D' }}>{post.username}</Typography>
              <Typography fontSize={12} sx={{ color: '#505050' }}>님이 공유했어요</Typography>
            </Box>
          )}

          {/* 헤더 */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 2, py: 1.5, borderBottom: '1px solid #141414', flexShrink: 0 }}>
            <Avatar
              src={displayAvatar ? `http://localhost:5000${displayAvatar}` : null}
              sx={{ width: 36, height: 36, cursor: 'pointer', bgcolor: '#1A1A1A', color: '#E8C96D', fontWeight: 800, fontSize: 14, border: '1.5px solid #1E1E1E' }}
              onClick={() => navigate(`/profile/${displayUser}`)}
            >
              {displayUser?.[0]?.toUpperCase()}
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography fontSize={13} fontWeight={600} sx={{ cursor: 'pointer', '&:hover': { color: '#E8C96D' } }} onClick={() => navigate(`/profile/${displayUser}`)}>
                {displayUser}
              </Typography>
              <Box onClick={() => navigate(`/explore?style=${post.style}`)} sx={{ display: 'inline-flex', alignItems: 'center', px: 1, py: '1px', borderRadius: 4, mt: 0.2, cursor: 'pointer', backgroundColor: `${color}15`, border: `1px solid ${color}40`, transition: 'all 0.15s', '&:hover': { backgroundColor: `${color}28`, borderColor: `${color}70` } }}>
                <Typography sx={{ fontSize: 9, fontWeight: 700, color: color, letterSpacing: 0.5 }}>{post.style?.toUpperCase()}</Typography>
              </Box>
            </Box>
            <IconButton size="small" onClick={handleMenuOpen} sx={{ color: '#404040', '&:hover': { color: '#808080' } }}>
              <MoreHorizRounded sx={{ fontSize: 20 }} />
            </IconButton>

            {/* 메뉴 영역 */}
            <Menu
              anchorEl={menuAnchor}
              open={Boolean(menuAnchor)}
              onClose={handleMenuClose}
              PaperProps={{
                sx: {
                  backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF',
                  border: `1px solid ${isDark ? '#2A2A2A' : '#EBEBEB'}`,
                  borderRadius: 2,
                  boxShadow: isDark ? '0 8px 24px rgba(0,0,0,0.5)' : '0 8px 24px rgba(0,0,0,0.12)',
                  minWidth: 180,
                }
              }}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
              {isOwner ? [
                <MenuItem key="edit" onClick={handleEditPost} sx={{ fontSize: 14, py: 1.2, px: 2.5, color: isDark ? '#EFEFEF' : '#0A0A0A', '&:hover': { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' } }}>게시물 수정</MenuItem>,
                <MenuItem key="copy" onClick={handleCopyLink} sx={{ fontSize: 14, py: 1.2, px: 2.5, color: isDark ? '#EFEFEF' : '#0A0A0A', '&:hover': { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' } }}>링크 복사</MenuItem>,
                <Divider key="div" sx={{ borderColor: isDark ? '#2A2A2A' : '#EBEBEB', my: 0.5 }} />,
                <MenuItem key="delete" onClick={handleDeletePost} sx={{ fontSize: 14, py: 1.2, px: 2.5, color: '#FF4D6D', '&:hover': { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' } }}>게시물 삭제</MenuItem>,
              ] : [
                <MenuItem key="follow" onClick={handleFollowToggle} sx={{ fontSize: 14, py: 1.2, px: 2.5, color: isFollowing ? '#FF4D6D' : (isDark ? '#EFEFEF' : '#0A0A0A'), '&:hover': { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' } }}>{isFollowing ? `${post?.username} 팔로우 취소` : `${post?.username} 팔로우`}</MenuItem>,
                <MenuItem key="copy" onClick={handleCopyLink} sx={{ fontSize: 14, py: 1.2, px: 2.5, color: isDark ? '#EFEFEF' : '#0A0A0A', '&:hover': { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' } }}>링크 복사</MenuItem>,
                <Divider key="div" sx={{ borderColor: isDark ? '#2A2A2A' : '#EBEBEB', my: 0.5 }} />,
                <MenuItem key="report" onClick={handleReport} sx={{ fontSize: 14, py: 1.2, px: 2.5, color: '#FF4D6D', '&:hover': { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' } }}>신고</MenuItem>,
              ]}
            </Menu>
          </Box>

          {/* 댓글 + 본문 스크롤 영역 */}
          <Box sx={{ flex: 1, overflowY: 'auto', '&::-webkit-scrollbar': { width: 3 }, '&::-webkit-scrollbar-thumb': { backgroundColor: '#1E1E1E', borderRadius: 4 } }}>
            {/* 본문 */}
            <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid #0F0F0F' }}>
              <Box sx={{ display: 'flex', gap: 1.5 }}>
                <Avatar src={displayAvatar ? `http://localhost:5000${displayAvatar}` : null} sx={{ width: 30, height: 30, flexShrink: 0, bgcolor: '#1A1A1A', color: '#E8C96D', fontWeight: 800, fontSize: 12, mt: 0.2 }}>{displayUser?.[0]?.toUpperCase()}</Avatar>
                <Box>
                  {post.title && <Typography fontSize={14} fontWeight={700} mb={0.5} sx={{ color: '#EFEFEF' }}>{post.title}</Typography>}
                  <Typography fontSize={13} sx={{ color: '#C0C0C0', lineHeight: 1.6 }}>
                    <Typography component="span" fontWeight={700} sx={{ color: '#EFEFEF', mr: 0.8, fontSize: 13 }}>{displayUser}</Typography>
                    {post.content}
                  </Typography>
                  {tags.length > 0 && (
                    <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {tags.map(tag => <Typography key={tag} fontSize={12} onClick={() => navigate(`/tag/${encodeURIComponent(tag.trim())}`)} sx={{ color: '#4A90D9', cursor: 'pointer', '&:hover': { color: '#6FB3F5' }, fontWeight: 600 }}>#{tag.trim()}</Typography>)}
                    </Box>
                  )}
                  <Typography sx={{ fontSize: 11, color: '#3A3A3A', mt: 0.5 }}>{timeAgo(post.created_at)}</Typography>
                </Box>
              </Box>
            </Box>
            {/* 체형별 핏 리뷰 */}
            {post.items?.length > 0 && (
              <FitReview items={post.items} isDark={isDark} />
            )}

            {/* 댓글 목록 */}
            {comments.filter(c => !c.parent_id).map(c => (
              <Fragment key={c.id}>
                <Box sx={{ px: 2, py: 1.2, display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                  <Avatar src={c.profile_image ? `http://localhost:5000${c.profile_image}` : null} sx={{ width: 30, height: 30, flexShrink: 0, bgcolor: '#1A1A1A', color: '#E8C96D', fontWeight: 800, fontSize: 11, cursor: 'pointer', border: '1px solid #1E1E1E', mt: 0.2 }} onClick={() => navigate(`/profile/${c.username}`)}>{c.username?.[0]?.toUpperCase()}</Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography sx={{ fontSize: 13, color: '#C0C0C0', lineHeight: 1.6 }}><Typography component="span" fontWeight={700} sx={{ color: '#EFEFEF', mr: 0.8, fontSize: 13, cursor: 'pointer', '&:hover': { color: '#E8C96D' } }} onClick={() => navigate(`/profile/${c.username}`)}>{c.username}</Typography>{c.content}</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 0.4 }}>
                      <Typography sx={{ fontSize: 11, color: '#3A3A3A' }}>{timeAgo(c.created_at)}</Typography>
                      <Typography sx={{ fontSize: 11, color: '#3A3A3A', cursor: 'pointer', '&:hover': { color: '#808080' } }} onClick={() => { setReplyTo({ id: c.id, username: c.username }); commentRef.current?.focus(); }}>답글 달기</Typography>
                    </Box>
                  </Box>
                  <IconButton size="small" sx={{ color: '#2A2A2A', p: 0.3, mt: 0.2, '&:hover': { color: '#FF6B6B' } }}><FavoriteBorderRounded sx={{ fontSize: 12 }} /></IconButton>
                </Box>
                {comments.filter(r => r.parent_id === c.id).map(r => (
                  <Box key={r.id} sx={{ pl: 7, pr: 2, py: 1, display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                    <Avatar src={r.profile_image ? `http://localhost:5000${r.profile_image}` : null} sx={{ width: 24, height: 24, flexShrink: 0, bgcolor: '#1A1A1A', color: '#E8C96D', fontWeight: 800, fontSize: 10, cursor: 'pointer', border: '1px solid #1E1E1E', mt: 0.2 }} onClick={() => navigate(`/profile/${r.username}`)}>{r.username?.[0]?.toUpperCase()}</Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography sx={{ fontSize: 13, color: '#C0C0C0', lineHeight: 1.6 }}><Typography component="span" fontWeight={700} sx={{ color: '#EFEFEF', mr: 0.8, fontSize: 13, cursor: 'pointer', '&:hover': { color: '#E8C96D' } }} onClick={() => navigate(`/profile/${r.username}`)}>{r.username}</Typography>{r.content}</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 0.3 }}>
                        <Typography sx={{ fontSize: 11, color: '#3A3A3A' }}>{timeAgo(r.created_at)}</Typography>
                        <Typography sx={{ fontSize: 11, color: '#3A3A3A', cursor: 'pointer', '&:hover': { color: '#808080' } }} onClick={() => { setReplyTo({ id: c.id, username: c.username }); commentRef.current?.focus(); }}>답글 달기</Typography>
                      </Box>
                    </Box>
                    <IconButton size="small" sx={{ color: '#2A2A2A', p: 0.3, mt: 0.2, '&:hover': { color: '#FF6B6B' } }}><FavoriteBorderRounded sx={{ fontSize: 12 }} /></IconButton>
                  </Box>
                ))}
              </Fragment>
            ))}
            {comments.length === 0 && <Box sx={{ textAlign: 'center', py: 6 }}><Typography sx={{ fontSize: 24, mb: 1, opacity: 0.2 }}>💬</Typography><Typography fontSize={13} sx={{ color: '#303030' }}>첫 댓글을 남겨보세요</Typography></Box>}
          </Box>

          {/* 액션 버튼 및 입력창 영역 */}
          <Box sx={{ flexShrink: 0, borderTop: '1px solid #141414' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', px: 1.5, pt: 1 }}>
              <IconButton onClick={handleLike} sx={{ color: post.is_liked ? '#FF4D6D' : '#606060', transition: 'transform 0.15s ease', '&:active': { transform: 'scale(1.3)' }, p: 0.8 }}>{post.is_liked ? <FavoriteRounded sx={{ fontSize: 26 }} /> : <FavoriteBorderRounded sx={{ fontSize: 26 }} />}</IconButton>
              <IconButton sx={{ color: '#606060', p: 0.8 }} onClick={() => commentRef.current?.focus()}><ChatBubbleOutlineRounded sx={{ fontSize: 24 }} /></IconButton>
              <Box sx={{ flex: 1 }} />
              <IconButton onClick={handleBookmark} sx={{ color: post.is_bookmarked ? '#E8C96D' : '#606060', p: 0.8 }}>{post.is_bookmarked ? <BookmarkRounded sx={{ fontSize: 24 }} /> : <BookmarkBorderRounded sx={{ fontSize: 24 }} />}</IconButton>
            </Box>
            {post.likes_count > 0 && <Typography fontSize={13} fontWeight={700} sx={{ px: 2, pb: 0.5, color: '#C0C0C0' }}>좋아요 {post.likes_count.toLocaleString()}개</Typography>}
            <Typography variant="caption" sx={{ px: 2, pb: 1, color: '#363636', display: 'block' }}>{timeAgo(post.created_at)}</Typography>
            <Box sx={{ borderTop: '1px solid #0F0F0F' }}>
              {replyTo && <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, pt: 1, pb: 0.5 }}><Typography sx={{ fontSize: 11, color: '#505050' }}><Typography component="span" sx={{ color: '#909090', fontSize: 11 }}>@{replyTo.username}</Typography>에게 답글 달기</Typography><IconButton size="small" onClick={() => setReplyTo(null)} sx={{ color: '#404040', p: 0.3 }}><CloseRounded sx={{ fontSize: 14 }} /></IconButton></Box>}
              <Box component="form" onSubmit={handleComment} sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 2, pb: 2, pt: 1.5 }}><input ref={commentRef} placeholder={replyTo ? `@${replyTo.username}에게 답글...` : '댓글 달기...'} style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#C0C0C0', fontSize: '13px', fontFamily: 'inherit' }} /><Typography onClick={handleComment} sx={{ fontSize: 13, fontWeight: 700, flexShrink: 0, color: '#4FC3F7', cursor: 'pointer', '&:hover': { color: '#81D4FA' } }}>{submitting ? '...' : '게시'}</Typography></Box>
            </Box>
          </Box>
        </Box>
      </Box>
      <ReportDialog
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        onSubmit={reason => reportPost(id, reason)}
      />
    </Dialog>
  );
}