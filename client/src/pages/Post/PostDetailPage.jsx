import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Avatar, IconButton, Chip,
  TextField, Button, Divider, CircularProgress,
} from '@mui/material';
import { Favorite, FavoriteBorder, BookmarkBorder, Bookmark, ArrowBack, Send } from '@mui/icons-material';
import { getPost, toggleLike, toggleBookmark, getComments, createComment } from '../../api/postApi';
import useAuthStore from '../../store/authStore';
import { timeAgo } from '../../utils/formatDate';

const PostDetailPage = () => {
  const { id }     = useParams();
  const navigate   = useNavigate();
  const { user }   = useAuthStore();
  const [post, setPost]         = useState(null);
  const [comments, setComments] = useState([]);
  const [comment, setComment]   = useState('');
  const [loading, setLoading]   = useState(true);
  const [imgIndex, setImgIndex] = useState(0);

  useEffect(() => {
    const load = async () => {
      try {
        const [postRes, commentsRes] = await Promise.all([getPost(id), getComments(id)]);
        setPost(postRes.data);
        setComments(commentsRes.data);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleLike = async () => {
    const res = await toggleLike(id);
    setPost(prev => ({
      ...prev,
      is_liked:    res.data.liked ? 1 : 0,
      likes_count: res.data.liked ? prev.likes_count + 1 : prev.likes_count - 1,
    }));
  };

  const handleBookmark = async () => {
    const res = await toggleBookmark(id);
    setPost(prev => ({ ...prev, is_bookmarked: res.data.bookmarked ? 1 : 0 }));
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    await createComment(id, { content: comment });
    const res = await getComments(id);
    setComments(res.data);
    setComment('');
  };

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', pt: 10 }}>
      <CircularProgress sx={{ color: '#E8C96D' }} />
    </Box>
  );
  if (!post) return (
    <Box sx={{ textAlign: 'center', pt: 10 }}>
      <Typography>게시물을 찾을 수 없어요.</Typography>
    </Box>
  );

  return (
    <Box sx={{ maxWidth: 700, mx: 'auto', px: 2, py: 3 }}>
      <IconButton onClick={() => navigate(-1)} sx={{ mb: 2, color: '#A0A0A0' }}>
        <ArrowBack />
      </IconButton>

      {post.images?.length > 0 && (
        <Box sx={{ position: 'relative', mb: 2, borderRadius: 3, overflow: 'hidden' }}>
          <Box component="img"
            src={`http://localhost:5000${post.images[imgIndex].image_url}`}
            sx={{ width: '100%', maxHeight: 500, objectFit: 'cover' }} />
          {post.images.length > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5, mt: 1 }}>
              {post.images.map((_, i) => (
                <Box key={i} onClick={() => setImgIndex(i)}
                  sx={{ width: 8, height: 8, borderRadius: '50%', cursor: 'pointer',
                    backgroundColor: imgIndex === i ? '#E8C96D' : '#2A2A2A' }} />
              ))}
            </Box>
          )}
        </Box>
      )}

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
        <Avatar src={post.profile_image ? `http://localhost:5000${post.profile_image}` : null}
          sx={{ cursor: 'pointer' }}
          onClick={() => navigate(`/profile/${post.username}`)}>
          {post.username?.[0]?.toUpperCase()}
        </Avatar>
        <Box sx={{ flex: 1 }}>
          <Typography fontWeight={600} sx={{ cursor: 'pointer' }}
            onClick={() => navigate(`/profile/${post.username}`)}>
            {post.username}
          </Typography>
          <Typography variant="caption" color="text.secondary">{timeAgo(post.created_at)}</Typography>
        </Box>
        <Chip label={post.style} size="small"
          sx={{ backgroundColor: '#1A1A1A', color: '#E8C96D', border: '1px solid #2A2A2A' }} />
      </Box>

      {post.title && <Typography variant="h6" fontWeight={700} mb={1}>{post.title}</Typography>}
      <Typography color="text.secondary" mb={2}>{post.content}</Typography>

      {post.items?.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="caption" color="text.secondary" fontWeight={600} mb={1}>착용 아이템</Typography>
          {post.items.map(item => (
            <Box key={item.id} sx={{ p: 1.5, backgroundColor: '#1A1A1A', borderRadius: 2, mb: 1 }}>
              <Typography variant="body2" fontWeight={600}>{item.brand_name} — {item.item_name}</Typography>
              <Typography variant="caption" color="text.secondary">
                {item.category} · {item.size_purchased} ·{' '}
                {item.fit_review === 'true' ? '정사이즈' : item.fit_review === 'small' ? '작게 나옴' : '크게 나옴'}
              </Typography>
              {item.purchase_url && (
                <Typography variant="caption"
                  sx={{ display: 'block', color: '#E8C96D', mt: 0.5 }}
                  component="a" href={item.purchase_url} target="_blank">
                  구매처 보기 →
                </Typography>
              )}
            </Box>
          ))}
        </Box>
      )}

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <IconButton onClick={handleLike} sx={{ color: post.is_liked ? '#FF6B6B' : '#A0A0A0' }}>
          {post.is_liked ? <Favorite /> : <FavoriteBorder />}
        </IconButton>
        <Typography variant="body2" color="text.secondary">{post.likes_count}</Typography>
        <IconButton onClick={handleBookmark} sx={{ color: post.is_bookmarked ? '#E8C96D' : '#A0A0A0' }}>
          {post.is_bookmarked ? <Bookmark /> : <BookmarkBorder />}
        </IconButton>
      </Box>

      <Divider sx={{ mb: 2 }} />

      <Typography fontWeight={600} mb={2}>댓글 {comments.length}</Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 3 }}>
        {comments.map(c => (
          <Box key={c.id} sx={{ display: 'flex', gap: 1.5, pl: c.parent_id ? 4 : 0 }}>
            <Avatar sx={{ width: 32, height: 32, fontSize: 13 }}
              src={c.profile_image ? `http://localhost:5000${c.profile_image}` : null}>
              {c.username?.[0]?.toUpperCase()}
            </Avatar>
            <Box>
              <Typography variant="body2" fontWeight={600}>
                {c.username}
                <Typography component="span" variant="caption" color="text.secondary" ml={1}>
                  {timeAgo(c.created_at)}
                </Typography>
              </Typography>
              <Typography variant="body2" color="text.secondary">{c.content}</Typography>
            </Box>
          </Box>
        ))}
      </Box>

      <Box component="form" onSubmit={handleComment} sx={{ display: 'flex', gap: 1 }}>
        <TextField fullWidth size="small" placeholder="댓글을 입력하세요..."
          value={comment} onChange={e => setComment(e.target.value)} />
        <IconButton type="submit" sx={{ color: '#E8C96D' }}><Send /></IconButton>
      </Box>
    </Box>
  );
};

export default PostDetailPage;