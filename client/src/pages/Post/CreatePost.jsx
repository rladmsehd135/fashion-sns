import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, TextField, Button, Chip,
  IconButton, Select, MenuItem, FormControl,
  InputLabel, CircularProgress, Alert, Dialog,
} from '@mui/material';
import { AddPhotoAlternate, Close, PinDropRounded, CheckRounded } from '@mui/icons-material';
import { createPost, getCategories } from '../../api/postApi';
import axiosInstance from '../../api/axiosInstance';
import UserTagInput from '../../components/common/UserTagInput';
import toast from 'react-hot-toast';

const CreatePost = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: '', content: '', style: '', tags: [] });
  const [mentionedUsers, setMentionedUsers] = useState([]);
  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [items, setItems] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [styleList, setStyleList] = useState([]);
  const [categoryList, setCategoryList] = useState([]);
  const [stylesLoading, setStylesLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  // 핀 배치 모달 상태
  const [pinModal, setPinModal] = useState(null); // { itemIndex, imageIndex }
  const pinImgRef = useRef(null);

  useEffect(() => {
    setStylesLoading(true);
    Promise.all([
      axiosInstance.get('/users/styles/list'),
      getCategories(),
    ])
      .then(([stylesRes, catsRes]) => {
        setStyleList(stylesRes.data);
        setCategoryList(catsRes.data);
      })
      .catch(() => setError('목록을 불러오지 못했습니다.'))
      .finally(() => setStylesLoading(false));
  }, []);

  const handleImages = (e) => {
    const files = Array.from(e.target.files);
    setImages(prev => {
      const combined = [...prev, ...files];
      if (combined.length > 5) {
        toast.error('사진은 최대 5장까지 올릴 수 있어요.');
        return combined.slice(0, 5);
      }
      return combined;
    });
    setPreviews(prev => {
      const newPreviews = files.map(f => URL.createObjectURL(f));
      const combined = [...prev, ...newPreviews];
      return combined.slice(0, 5);
    });
    // 같은 파일 다시 선택 가능하도록 초기화
    e.target.value = '';
  };

  const addTag = (e) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      const tag = tagInput.startsWith('#') ? tagInput : `#${tagInput}`;
      setForm(prev => ({ ...prev, tags: [...prev.tags, tag] }));
      setTagInput('');
    }
  };

  const removeTag = (i) => setForm(prev => ({ ...prev, tags: prev.tags.filter((_, idx) => idx !== i) }));
  const addItem = () => setItems(prev => [...prev, {
    brand_name: '', item_name: '', category: categoryList[0]?.value || 'top',
    purchase_url: '', price: '', size_purchased: '',
    fit_review: 'true', rating: 5, review_text: '',
    x_pct: null, y_pct: null, image_index: 0,
  }]);

  const handlePinClick = (e) => {
    if (!pinImgRef.current || !pinModal) return;
    const rect = pinImgRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width * 100).toFixed(1);
    const y = ((e.clientY - rect.top) / rect.height * 100).toFixed(1);
    updateItem(pinModal.itemIndex, 'x_pct', x);
    updateItem(pinModal.itemIndex, 'y_pct', y);
    updateItem(pinModal.itemIndex, 'image_index', pinModal.imageIndex);
    setPinModal(null);
  };
  const updateItem = (i, key, val) => setItems(prev => prev.map((item, idx) => idx === i ? { ...item, [key]: val } : item));
  const removeItem = (i) => setItems(prev => prev.filter((_, idx) => idx !== i));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.content || !form.style) return setError('내용과 스타일을 입력해주세요.');
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('title', form.title);
      formData.append('content', form.content);
      formData.append('style', form.style);
      formData.append('tags', JSON.stringify(form.tags));
      formData.append('items', JSON.stringify(items));
      formData.append('mentionedUsers', JSON.stringify(mentionedUsers.map(u => u.id)));
      images.forEach(img => formData.append('images', img));
      await createPost(formData);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || '게시물 작성에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 700, mx: 'auto', px: 2, py: 3 }}>
      <Typography variant="h6" fontWeight={700} mb={3}>새 게시물</Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        {/* 이미지 업로드 */}
        <Box>
          <input type="file" multiple accept="image/*" id="img-upload"
            style={{ display: 'none' }} onChange={handleImages}
            disabled={images.length >= 5} />
          <label htmlFor="img-upload">
            <Box sx={{
              border: `2px dashed ${images.length >= 5 ? '#E8C96D' : '#2A2A2A'}`,
              borderRadius: 3, p: 3,
              textAlign: 'center', cursor: images.length >= 5 ? 'not-allowed' : 'pointer',
              '&:hover': { borderColor: '#E8C96D' }, transition: 'all 0.2s',
              opacity: images.length >= 5 ? 0.6 : 1,
            }}>
              <AddPhotoAlternate sx={{ fontSize: 40, color: '#A0A0A0' }} />
              <Typography color="text.secondary">
                사진 추가 ({images.length}/5)
              </Typography>
            </Box>
          </label>
          {previews.length > 0 && (
            <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
              {previews.map((src, i) => (
                <Box key={i} sx={{ position: 'relative' }}>
                  <Box component="img" src={src}
                    sx={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 2 }} />
                  <IconButton size="small"
                    onClick={() => {
                      setImages(prev => prev.filter((_, idx) => idx !== i));
                      setPreviews(prev => prev.filter((_, idx) => idx !== i));
                    }}
                    sx={{
                      position: 'absolute', top: -8, right: -8,
                      backgroundColor: '#2A2A2A', width: 20, height: 20
                    }}>
                    <Close sx={{ fontSize: 12 }} />
                  </IconButton>
                </Box>
              ))}
            </Box>
          )}
        </Box>

        <TextField label="제목 (선택)" value={form.title}
          onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))} fullWidth />

        <TextField label="내용 *" value={form.content} multiline rows={4}
          onChange={e => setForm(prev => ({ ...prev, content: e.target.value }))} fullWidth required />

        <FormControl fullWidth required disabled={stylesLoading}>
          <InputLabel>스타일</InputLabel>
          <Select value={form.style} label="스타일"
            onChange={e => setForm(prev => ({ ...prev, style: e.target.value }))}>
            {styleList.map(s => (
              <MenuItem key={s.value} value={s.value}>
                {s.icon ? `${s.icon} ` : ''}{s.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* 태그 */}
        <Box>
          <TextField label="태그 (Enter로 추가)" value={tagInput}
            onChange={e => setTagInput(e.target.value)}
            onKeyDown={addTag} fullWidth />
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 1 }}>
            {form.tags.map((tag, i) => (
              <Chip key={i} label={tag} onDelete={() => removeTag(i)}
                size="small" sx={{ backgroundColor: '#1A1A1A', color: '#E8C96D' }} />
            ))}
          </Box>
        </Box>

        {/* 사람 태그 */}
        <UserTagInput tagged={mentionedUsers} onChange={setMentionedUsers} />

        {/* 아이템 태그 */}
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="body2" fontWeight={600}>착용 아이템</Typography>
            <Button size="small" onClick={addItem} sx={{ color: '#E8C96D' }}>+ 추가</Button>
          </Box>
          {items.map((item, i) => (
            <Box key={i} sx={{
              p: 2, backgroundColor: '#1A1A1A', borderRadius: 2, mb: 1.5,
              border: '1px solid #2A2A2A'
            }}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <IconButton size="small" onClick={() => removeItem(i)}><Close fontSize="small" /></IconButton>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <TextField label="브랜드" size="small" value={item.brand_name}
                    onChange={e => updateItem(i, 'brand_name', e.target.value)} sx={{ flex: 1 }} />
                  <TextField label="아이템명 *" size="small" value={item.item_name}
                    onChange={e => updateItem(i, 'item_name', e.target.value)} sx={{ flex: 2 }} />
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <FormControl size="small" sx={{ flex: 1 }}>
                    <InputLabel>카테고리</InputLabel>
                    <Select value={item.category} label="카테고리"
                      onChange={e => updateItem(i, 'category', e.target.value)}>
                      {categoryList.map(c => <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>)}
                    </Select>
                  </FormControl>
                  <TextField label="사이즈" size="small" value={item.size_purchased}
                    onChange={e => updateItem(i, 'size_purchased', e.target.value)} sx={{ flex: 1 }} />
                  <FormControl size="small" sx={{ flex: 1 }}>
                    <InputLabel>핏</InputLabel>
                    <Select value={item.fit_review} label="핏"
                      onChange={e => updateItem(i, 'fit_review', e.target.value)}>
                      <MenuItem value="small">작음</MenuItem>
                      <MenuItem value="true">정사이즈</MenuItem>
                      <MenuItem value="large">큼</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
                <TextField label="구매처 URL" size="small" value={item.purchase_url}
                  onChange={e => updateItem(i, 'purchase_url', e.target.value)} fullWidth />
                {/* 핀 위치 지정 (이미지가 있을 때만) */}
                {previews.length > 0 && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                    <Button
                      size="small"
                      startIcon={<PinDropRounded sx={{ fontSize: 14 }} />}
                      onClick={() => setPinModal({ itemIndex: i, imageIndex: item.image_index || 0 })}
                      sx={{
                        fontSize: 11, color: item.x_pct != null ? '#4CAF50' : '#E8C96D',
                        borderColor: item.x_pct != null ? '#4CAF50' : '#E8C96D',
                        border: '1px solid', borderRadius: 1.5, px: 1.2, py: 0.4,
                      }}
                    >
                      {item.x_pct != null ? `위치 지정됨 (${item.x_pct}%, ${item.y_pct}%)` : '사진에서 위치 지정'}
                    </Button>
                    {item.x_pct != null && (
                      <IconButton size="small" onClick={() => { updateItem(i, 'x_pct', null); updateItem(i, 'y_pct', null); }}
                        sx={{ color: '#505050', width: 20, height: 20 }}>
                        <Close sx={{ fontSize: 12 }} />
                      </IconButton>
                    )}
                  </Box>
                )}
              </Box>
            </Box>
          ))}
        </Box>

        {/* 핀 배치 모달 */}
        <Dialog open={Boolean(pinModal)} onClose={() => setPinModal(null)} maxWidth="sm" fullWidth
          PaperProps={{ sx: { backgroundColor: '#0A0A0A', border: '1px solid #222', borderRadius: 2 } }}>
          <Box sx={{ p: 2 }}>
            <Typography fontWeight={700} fontSize={14} sx={{ color: '#EFEFEF', mb: 0.5 }}>
              위치를 클릭해서 핀을 꽂아주세요
            </Typography>
            <Typography fontSize={11} sx={{ color: '#606060', mb: 1.5 }}>
              사진 위를 클릭하면 해당 위치에 아이템 핀이 표시됩니다
            </Typography>
            {/* 이미지 선택 탭 */}
            {previews.length > 1 && pinModal && (
              <Box sx={{ display: 'flex', gap: 0.8, mb: 1.5, overflowX: 'auto' }}>
                {previews.map((src, idx) => (
                  <Box key={idx} onClick={() => setPinModal(p => ({ ...p, imageIndex: idx }))}
                    sx={{
                      width: 48, height: 48, borderRadius: 1, overflow: 'hidden', flexShrink: 0, cursor: 'pointer',
                      border: `2px solid ${pinModal?.imageIndex === idx ? '#E8C96D' : '#2A2A2A'}`,
                    }}>
                    <Box component="img" src={src} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </Box>
                ))}
              </Box>
            )}
            {pinModal && previews[pinModal.imageIndex] && (
              <Box
                ref={pinImgRef}
                onClick={handlePinClick}
                sx={{ position: 'relative', cursor: 'crosshair', userSelect: 'none', borderRadius: 1, overflow: 'hidden' }}
              >
                <Box component="img"
                  src={previews[pinModal.imageIndex]}
                  sx={{ width: '100%', display: 'block', maxHeight: 400, objectFit: 'contain', backgroundColor: '#111' }}
                  draggable={false}
                />
                {/* 기존 핀 미리보기 */}
                {items.filter((it, idx) => idx !== pinModal.itemIndex && Number(it.image_index) === pinModal.imageIndex && it.x_pct != null)
                  .map((it, idx) => (
                    <Box key={idx} sx={{
                      position: 'absolute', left: `${it.x_pct}%`, top: `${it.y_pct}%`,
                      transform: 'translate(-50%,-50%)',
                      width: 20, height: 20, borderRadius: '50%',
                      backgroundColor: 'rgba(80,80,80,0.8)', border: '1.5px solid #888',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      pointerEvents: 'none',
                    }}>
                      <PinDropRounded sx={{ fontSize: 11, color: '#ccc' }} />
                    </Box>
                  ))
                }
              </Box>
            )}
            <Button onClick={() => setPinModal(null)} size="small"
              sx={{ mt: 1.5, color: '#606060' }}>취소</Button>
          </Box>
        </Dialog>

        <Button type="submit" variant="contained" size="large" disabled={loading}
          sx={{
            backgroundColor: '#E8C96D', color: '#0A0A0A', fontWeight: 700,
            '&:hover': { backgroundColor: '#D4B55A' }
          }}>
          {loading ? <CircularProgress size={24} /> : '게시물 올리기'}
        </Button>
      </Box>
    </Box>
  );
};

export default CreatePost;
