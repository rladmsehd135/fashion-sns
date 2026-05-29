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
  amekaji: '#FFB74D',
  casual: '#81C784',
  street: '#F06292',
  workwear: '#CE93D8',
  etc: '#90A4AE',
};

const PostCard = ({ post: initialPost, compact = false }) => {
  const navigate = useNavigate();
  const [post, setPost] = useState(initialPost);

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

  const thumbnail = post.thumbnail || post.images?.[0]?.image_url;
  const styleColor = styleColors[post.style] || '#A0A0A0';
  const tags = (() => {
    if (!post.tags) return [];
    if (Array.isArray(post.tags)) return post.tags;
    try {
      return JSON.parse(post.tags);
    } catch {
      return [];
    }
  })();

  if (compact) {
    return (
      <Box
        onClick={() => navigate(`/post/${post.id}`)}
        sx={{
          aspectRatio: '1/1',
          position: 'relative',
          backgroundColor: '#111',
          cursor: 'pointer',
          overflow: 'hidden',
          '&:hover .overlay': { opacity: 1 },
        }}>
        {thumbnail ? (
          <Box
            component="img"
            src={`http://localhost:5000${thumbnail}`}
            sx={{
              position: 'absolute',
              top: 0, left: 0,
              width: '100%', height: '100%',
              objectFit: 'cover',
              transition: 'transform 0.3s ease',
              '&:hover': { transform: 'scale(1.05)' },
            }}
          />
        ) : (
          <Box sx={{
            position: 'absolute', top: 0, left: 0,
            width: '100%', height: '100%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'linear-gradient(135deg,#1A1A1A,#0D0D0D)',
          }}>
            <Typography sx={{ fontSize: 32 }}>👕</Typography>
          </Box>
        )}

        {/* 호버 오버레이 */}
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
      </Box>
    );
  }

  // 피드 카드
  // 피드 카드 (compact=false)
return (
  <Box sx={{
    backgroundColor:'#080808',
    borderBottom:'1px solid #111',
    pb:0.5,
  }}>
    {/* 헤더 */}
    <Box sx={{ display:'flex', alignItems:'center', gap:1.5, px:2, py:1.5 }}>
      <Avatar
        src={post.profile_image ? `http://localhost:5000${post.profile_image}` : null}
        sx={{
          width:36, height:36, cursor:'pointer',
          bgcolor:'#1A1A1A', color:'#E8C96D',
          fontWeight:800, fontSize:14,
          border:'1.5px solid #1E1E1E',
        }}
        onClick={() => navigate(`/profile/${post.username}`)}>
        {post.username?.[0]?.toUpperCase()}
      </Avatar>
      <Box sx={{ flex:1 }}>
        <Box sx={{ display:'flex', alignItems:'center', gap:1 }}>
          <Typography fontSize={13} fontWeight={600}
            sx={{ cursor:'pointer', '&:hover':{ color:'#E8C96D' }, transition:'color 0.15s' }}
            onClick={() => navigate(`/profile/${post.username}`)}>
            {post.username}
          </Typography>
          <Box sx={{ width:2, height:2, borderRadius:'50%', backgroundColor:'#282828' }} />
          <Typography variant="caption" sx={{ color:'#363636' }}>
            {timeAgo(post.created_at)}
          </Typography>
        </Box>
        <Typography sx={{
          fontSize:10, fontWeight:700, letterSpacing:1,
          color: styleColors[post.style] || '#505050',
          textTransform:'uppercase', lineHeight:1.4,
        }}>
          {post.style}
        </Typography>
      </Box>
      <IconButton size="small" sx={{ color:'#282828' }}>
        <MoreHorizRounded sx={{ fontSize:18 }} />
      </IconButton>
    </Box>

    {/* 이미지 */}
    {thumbnail && (
      <Box
        sx={{ cursor:'pointer', overflow:'hidden',
          '&:hover img':{ transform:'scale(1.02)' } }}
        onClick={() => navigate(`/post/${post.id}`)}>
        <Box component="img"
          src={`http://localhost:5000${thumbnail}`}
          sx={{
            width:'100%', maxHeight:520,
            objectFit:'cover', display:'block',
            transition:'transform 0.4s ease',
          }} />
      </Box>
    )}

    {/* 액션 */}
    <Box sx={{ display:'flex', alignItems:'center', px:1.5, pt:1 }}
      onClick={e => e.stopPropagation()}>
      <IconButton disableRipple size="small" onClick={handleLike}
        sx={{
          color: post.is_liked ? '#FF4D6D' : '#404040',
          transition:'transform 0.15s ease',
          '&:active':{ transform:'scale(1.3)' },
          p:0.8,
        }}>
        {post.is_liked
          ? <FavoriteRounded sx={{ fontSize:24 }} />
          : <FavoriteBorderRounded sx={{ fontSize:24 }} />}
      </IconButton>
      <IconButton disableRipple size="small" sx={{ color:'#404040', p:0.8 }}
        onClick={() => navigate(`/post/${post.id}`)}>
        <ChatBubbleOutlineRounded sx={{ fontSize:22 }} />
      </IconButton>
      <Box sx={{ flex:1 }} />
      <IconButton disableRipple size="small" onClick={handleBookmark}
        sx={{ color: post.is_bookmarked ? '#E8C96D' : '#404040', p:0.8 }}>
        {post.is_bookmarked
          ? <BookmarkRounded sx={{ fontSize:22 }} />
          : <BookmarkBorderRounded sx={{ fontSize:22 }} />}
      </IconButton>
    </Box>

    {/* 좋아요 수 */}
    {post.likes_count > 0 && (
      <Typography fontSize={12} fontWeight={700}
        sx={{ px:2, pb:0.5, color:'#C0C0C0' }}>
        좋아요 {post.likes_count.toLocaleString()}개
      </Typography>
    )}

    {/* 내용 */}
    <Box sx={{ px:2, pb:2, cursor:'pointer' }}
      onClick={() => navigate(`/post/${post.id}`)}>
      {post.title && (
        <Typography fontSize={13} fontWeight={600} mb={0.3}
          sx={{ color:'#D0D0D0' }}>
          {post.title}
        </Typography>
      )}
      <Typography fontSize={13} sx={{ color:'#505050',
        display:'-webkit-box', WebkitLineClamp:2,
        WebkitBoxOrient:'vertical', overflow:'hidden' }}>
        <Typography component="span" fontSize={13} fontWeight={600}
          sx={{ color:'#909090', mr:0.7 }}>
          {post.username}
        </Typography>
        {post.content}
      </Typography>
      {tags.length > 0 && (
        <Box sx={{ display:'flex', flexWrap:'wrap', gap:0.7, mt:1 }}>
          {tags.map((tag, index) => (
            <Typography
              key={`${tag}-${index}`}
              component="span"
              fontSize={12}
              fontWeight={700}
              sx={{ color:'#E8C96D', lineHeight:1.4 }}>
              {String(tag).startsWith('#') ? tag : `#${tag}`}
            </Typography>
          ))}
        </Box>
      )}
      {post.comments_count > 0 && (
        <Typography variant="caption" sx={{ color:'#363636', mt:0.5, display:'block' }}>
          댓글 {post.comments_count}개 모두 보기
        </Typography>
      )}
    </Box>
  </Box>
);
};

export default PostCard;
