import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Avatar, IconButton } from '@mui/material';
import {
  FavoriteRounded, FavoriteBorderRounded,
  BookmarkRounded, BookmarkBorderRounded,
  ChatBubbleOutlineRounded, MoreHorizRounded,
} from '@mui/icons-material';
import toast from 'react-hot-toast';
import { toggleLike, toggleBookmark } from '../../api/postApi';
import { timeAgo } from '../../utils/formatDate';

const styleColors = {
  techwear: '#4FC3F7',
  amekaji:  '#FFB74D',
  casual:   '#81C784',
  street:   '#F06292',
  workwear: '#CE93D8',
  etc:      '#90A4AE',
};

const PostCard = ({ post: initialPost, compact = false }) => {
  const navigate        = useNavigate();
  const [post, setPost] = useState(initialPost);

  const handleLike = async (e) => {
    e.stopPropagation();
    try {
      const res = await toggleLike(post.id);
      setPost(prev => ({
        ...prev,
        is_liked:    res.data.liked ? 1 : 0,
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

  const thumbnail   = post.thumbnail || post.images?.[0]?.image_url;
  const styleColor  = styleColors[post.style] || '#A0A0A0';

  // 그리드 카드 (탐색/프로필)
  if (compact) {
    return (
      <Box
        onClick={() => navigate(`/post/${post.id}`)}
        sx={{
          position: 'relative',
          paddingTop: '100%',
          backgroundColor: '#111',
          cursor: 'pointer',
          overflow: 'hidden',
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
            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'linear-gradient(135deg, #1A1A1A, #0D0D0D)',
          }}>
            <Typography sx={{ fontSize: 36 }}>👕</Typography>
          </Box>
        )}
        {/* 호버 오버레이 */}
        <Box className="overlay" sx={{
          position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3,
          opacity: 0, transition: 'opacity 0.2s ease',
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <FavoriteRounded sx={{ color: '#fff', fontSize: 22 }} />
            <Typography fontWeight={700} color="#fff">{post.likes_count}</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <ChatBubbleOutlineRounded sx={{ color: '#fff', fontSize: 22 }} />
            <Typography fontWeight={700} color="#fff">{post.comments_count}</Typography>
          </Box>
        </Box>
      </Box>
    );
  }

  // 피드 카드
  return (
    <Box sx={{ backgroundColor: '#111', borderBottom: '1px solid #1E1E1E' }}>
      {/* 헤더 */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 2, py: 1.5 }}>
        <Avatar
          src={post.profile_image ? `http://localhost:5000${post.profile_image}` : null}
          sx={{
            width: 38, height: 38,
            bgcolor: '#E8C96D', color: '#0A0A0A',
            fontWeight: 800, fontSize: 15,
            cursor: 'pointer',
            border: '2px solid transparent',
            backgroundClip: 'padding-box',
            outline: `2px solid ${styleColor}60`,
            outlineOffset: 2,
          }}
          onClick={() => navigate(`/profile/${post.username}`)}>
          {post.username?.[0]?.toUpperCase()}
        </Avatar>
        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" fontWeight={700}
              sx={{ cursor: 'pointer', '&:hover': { color: '#E8C96D' }, transition: 'color 0.2s' }}
              onClick={() => navigate(`/profile/${post.username}`)}>
              {post.username}
            </Typography>
            <Box sx={{ width: 3, height: 3, borderRadius: '50%', backgroundColor: '#333' }} />
            <Typography variant="caption" sx={{ color: '#505050' }}>{timeAgo(post.created_at)}</Typography>
          </Box>
          <Typography variant="caption"
            sx={{ color: styleColor, fontWeight: 600, fontSize: 10, letterSpacing: 1, textTransform: 'uppercase' }}>
            {post.style}
          </Typography>
        </Box>
        <IconButton size="small" sx={{ color: '#333' }}>
          <MoreHorizRounded fontSize="small" />
        </IconButton>
      </Box>

      {/* 이미지 */}
      {thumbnail && (
        <Box sx={{ position: 'relative', backgroundColor: '#0A0A0A', cursor: 'pointer' }}
          onClick={() => navigate(`/post/${post.id}`)}>
          <Box component="img"
            src={`http://localhost:5000${thumbnail}`}
            sx={{ width: '100%', maxHeight: 600, objectFit: 'cover', display: 'block' }} />
        </Box>
      )}

      {/* 액션 버튼 */}
      <Box sx={{ px: 1, pt: 0.5, display: 'flex', alignItems: 'center' }}>
        <IconButton onClick={handleLike} sx={{
          color: post.is_liked ? '#FF4D6D' : '#606060',
          transition: 'transform 0.15s ease',
          '&:active': { transform: 'scale(1.3)' },
        }}>
          {post.is_liked
            ? <FavoriteRounded sx={{ fontSize: 26 }} />
            : <FavoriteBorderRounded sx={{ fontSize: 26 }} />}
        </IconButton>
        <IconButton sx={{ color: '#606060' }} onClick={() => navigate(`/post/${post.id}`)}>
          <ChatBubbleOutlineRounded sx={{ fontSize: 24 }} />
        </IconButton>
        <Box sx={{ flex: 1 }} />
        <IconButton onClick={handleBookmark} sx={{ color: post.is_bookmarked ? '#E8C96D' : '#606060' }}>
          {post.is_bookmarked
            ? <BookmarkRounded sx={{ fontSize: 26 }} />
            : <BookmarkBorderRounded sx={{ fontSize: 26 }} />}
        </IconButton>
      </Box>

      {/* 좋아요 수 */}
      {post.likes_count > 0 && (
        <Typography variant="body2" fontWeight={700} sx={{ px: 2, pb: 0.5 }}>
          좋아요 {post.likes_count.toLocaleString()}개
        </Typography>
      )}

      {/* 내용 */}
      <Box sx={{ px: 2, pb: 1.5, cursor: 'pointer' }} onClick={() => navigate(`/post/${post.id}`)}>
        {post.title && (
          <Typography variant="body2" fontWeight={700} mb={0.3}>{post.title}</Typography>
        )}
        <Typography variant="body2" sx={{ color: '#C0C0C0',
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          <Typography component="span" variant="body2" fontWeight={700} mr={0.5}>{post.username}</Typography>
          {post.content}
        </Typography>
        {post.comments_count > 0 && (
          <Typography variant="caption" sx={{ color: '#505050', mt: 0.5, display: 'block' }}>
            댓글 {post.comments_count}개 모두 보기
          </Typography>
        )}
      </Box>
    </Box>
  );
};

export default PostCard;