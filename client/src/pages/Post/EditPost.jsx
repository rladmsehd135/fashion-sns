import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box, Typography, TextField, Button, Chip,
  IconButton, Select, MenuItem, FormControl,
  InputLabel, CircularProgress, Alert,
  Rating,
} from '@mui/material';
import { ArrowBackRounded, AddPhotoAlternate, Close, DeleteOutlineRounded, CloseRounded } from '@mui/icons-material';
import axiosInstance from '../../api/axiosInstance';
import toast from 'react-hot-toast';
import { getCategories } from '../../api/postApi'; // getCategories API를 사용합니다.
import useThemeStore from '../../store/themeStore'; // useThemeStore 임포트
import useAuthStore from '../../store/authStore'; // useAuthStore 임포트
import { styleColors } from '../../constants/styleConstants';

const EditPost = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  // 게시물 기본 정보
  const [form, setForm] = useState({ title: '', content: '', style: '', tags: [] });
  const [tagInput, setTagInput] = useState('');
  const [styleList, setStyleList] = useState([]);
  const [stylesLoading, setStylesLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // 이미지 관련 상태
  const [currentImages, setCurrentImages] = useState([]); // 현재 표시되는 모든 이미지 (기존 + 새로 추가)
  const [newImageFiles, setNewImageFiles] = useState([]); // 새로 업로드된 File 객체들
  const [deletedImageIds, setDeletedImageIds] = useState([]); // 삭제될 기존 이미지 ID 목록

  // 아이템 관련 상태
  const [items, setItems] = useState([]);
  const [categoryList, setCategoryList] = useState([]);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setStylesLoading(true);
        const [stylesRes, postRes, categoryRes] = await Promise.all([
          axiosInstance.get('/users/styles/list'),
          axiosInstance.get(`/posts/${id}`),
          getCategories(),
        ]);
        
        setStyleList(stylesRes.data);
        const postData = postRes.data;
        
        // 태그 파싱 (JSON 혹은 콤마 구분자 처리)
        let parsedTags = [];
        if (postData.tags) {
          try {
            parsedTags = typeof postData.tags === 'string' ? JSON.parse(postData.tags) : postData.tags;
          } catch (e) {
            parsedTags = postData.tags.split(',').map(t => t.trim());
          }
        }

        setForm({
          title: postData.title || '',
          content: postData.content || '',
          style: postData.style || '',
          tags: Array.isArray(parsedTags) ? parsedTags : []
        });
        
        // 이미지 및 아이템 데이터 초기화
        setCurrentImages(postData.images || []);
        setItems(postData.items || []);
        setCategoryList(categoryRes.data); // 카테고리 목록 설정
      } catch (err) {
        setError('게시물 정보를 불러오지 못했습니다.');
        toast.error('권한이 없거나 게시물을 찾을 수 없습니다.');
        navigate(-1);
      } finally {
        setLoading(false);
        setStylesLoading(false);
      }
    }; 
    loadInitialData();
  }, [id, navigate]);

  const addTag = (e) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      const tag = tagInput.startsWith('#') ? tagInput : `#${tagInput}`;
      if (!form.tags.includes(tag)) {
        setForm(prev => ({ ...prev, tags: [...prev.tags, tag] }));
      }
      setTagInput('');
    }
  };

  const removeTag = (i) => setForm(prev => ({ ...prev, tags: prev.tags.filter((_, idx) => idx !== i) }));

  // 이미지 핸들링
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const newFiles = files.slice(0, 5 - currentImages.length); // 최대 5장 제한

    if (newFiles.length === 0 && files.length > 0) {
      toast.error('사진은 최대 5장까지 올릴 수 있어요.');
    }

    setNewImageFiles(prev => [...prev, ...newFiles]);
    setCurrentImages(prev => [
      ...prev,
      ...newFiles.map(file => ({
        id: `new_${Date.now()}_${Math.random()}`, // 임시 ID 부여
        image_url: URL.createObjectURL(file),
        isNew: true,
        file: file,
      }))
    ]);
    e.target.value = ''; // 같은 파일 다시 선택 가능하도록 초기화
  };

  const handleRemoveImage = (indexToRemove) => {
    const imageToRemove = currentImages[indexToRemove];

    if (imageToRemove.isNew) {
      // 새로 추가된 이미지인 경우 newImageFiles에서도 제거
      setNewImageFiles(prev => prev.filter(file => file !== imageToRemove.file));
      URL.revokeObjectURL(imageToRemove.image_url); // 미리보기 URL 해제
    } else {
      // 기존 이미지인 경우 deletedImageIds에 추가
      setDeletedImageIds(prev => [...prev, imageToRemove.id]);
    }
    setCurrentImages(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  // 아이템 핸들링
  const addItem = () => setItems(prev => [...prev, {
    brand_name: '', item_name: '', category: categoryList[0]?.value || 'top',
    purchase_url: '', price: '', size_purchased: '',
    fit_review: 'true', rating: 5, review_text: '', currency: 'KRW', // currency 추가
  }]);
  const updateItem = (i, key, val) => setItems(prev => prev.map((item, idx) => idx === i ? { ...item, [key]: val } : item));
  const removeItem = (i) => setItems(prev => prev.filter((_, idx) => idx !== i));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.content || !form.style) return setError('내용과 스타일을 입력해주세요.');
    if (currentImages.length === 0) return setError('사진을 최소 1장 업로드해주세요.');

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('title', form.title);
      formData.append('content', form.content);
      formData.append('style', form.style);
      formData.append('tags', JSON.stringify(form.tags));
      formData.append('items', JSON.stringify(items));
      formData.append('deletedImageIds', JSON.stringify(deletedImageIds));

      newImageFiles.forEach(file => {
        formData.append('images', file);
      });

      await axiosInstance.put(`/posts/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      toast.success('게시물이 수정되었습니다.');
      navigate(`/profile/${user?.username}`);
    } catch (err) {
      setError(err.response?.data?.message || '게시물 수정에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Box sx={{ display:'flex', justifyContent:'center', py:10 }}><CircularProgress sx={{ color:'#E8C96D' }} /></Box>;

  return (
    <Box sx={{ maxWidth: 700, mx: 'auto', px: 2, py: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <IconButton onClick={() => navigate(-1)}><ArrowBackRounded /></IconButton>
        <Typography variant="h6" fontWeight={700}>게시물 수정</Typography>
      </Box>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        {/* 이미지 업로드 및 미리보기 */}
        <Box>
          <input type="file" multiple accept="image/*" id="img-upload"
            style={{ display: 'none' }} onChange={handleImageUpload}
            disabled={currentImages.length >= 5} />
          <label htmlFor="img-upload">
            <Box sx={{
              border: `2px dashed ${currentImages.length >= 5 ? '#E8C96D' : '#2A2A2A'}`,
              borderRadius: 3, p: 3,
              textAlign: 'center', cursor: currentImages.length >= 5 ? 'not-allowed' : 'pointer',
              '&:hover': { borderColor: '#E8C96D' }, transition: 'all 0.2s',
              opacity: currentImages.length >= 5 ? 0.6 : 1,
            }}>
              <AddPhotoAlternate sx={{ fontSize: 40, color: '#A0A0A0' }} />
              <Typography color="text.secondary">
                사진 추가 ({currentImages.length}/5)
              </Typography>
            </Box>
          </label>
          {currentImages.length > 0 && (
            <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
              {currentImages.map((img, i) => (
                <Box key={img.id || i} sx={{ position: 'relative' }}>
                  <Box component="img" src={img.isNew ? img.image_url : `http://localhost:5000${img.image_url}`}
                    sx={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 2 }} />
                  <IconButton size="small" onClick={() => handleRemoveImage(i)}
                    sx={{ position: 'absolute', top: -8, right: -8, backgroundColor: '#2A2A2A', width: 20, height: 20 }}>
                    <Close sx={{ fontSize: 12 }} />
                  </IconButton>
                </Box>
              ))}
            </Box>
          )}
        </Box>

        <TextField label="제목" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} fullWidth />
        <TextField label="내용 *" value={form.content} multiline rows={6} onChange={e => setForm(p => ({ ...p, content: e.target.value }))} fullWidth required />
        <FormControl fullWidth required disabled={stylesLoading}>
          <InputLabel>스타일</InputLabel>
          <Select value={form.style} label="스타일" onChange={e => setForm(p => ({ ...p, style: e.target.value }))}>
            {styleList.map(s => <MenuItem key={s.value} value={s.value}>{s.icon} {s.label}</MenuItem>)}
          </Select>
        </FormControl>
        <Box>
          <TextField label="태그 (Enter)" value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={addTag} fullWidth />
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 1 }}>
            {form.tags.map((tag, i) => <Chip key={i} label={tag} onDelete={() => removeTag(i)} size="small" sx={{ backgroundColor:'#1A1A1A', color:'#E8C96D' }} />)}
          </Box>
        </Box>

        {/* 아이템 수정 */}
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="body2" fontWeight={600}>착용 아이템</Typography>
            <Button size="small" onClick={addItem} sx={{ color: '#E8C96D' }}>+ 추가</Button>
          </Box>
          {items.map((item, i) => (
            <Box key={i} sx={{ p: 2, backgroundColor: '#1A1A1A', borderRadius: 2, mb: 1.5, border: '1px solid #2A2A2A' }}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <IconButton size="small" onClick={() => removeItem(i)}><DeleteOutlineRounded fontSize="small" /></IconButton>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <TextField label="브랜드" size="small" value={item.brand_name || ''} onChange={e => updateItem(i, 'brand_name', e.target.value)} sx={{ flex: 1 }} />
                  <TextField label="아이템명 *" size="small" value={item.item_name || ''} onChange={e => updateItem(i, 'item_name', e.target.value)} sx={{ flex: 2 }} required />
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <FormControl size="small" sx={{ flex: 1 }}>
                    <InputLabel>카테고리</InputLabel>
                    <Select value={item.category || 'top'} label="카테고리" onChange={e => updateItem(i, 'category', e.target.value)}>
                      {categoryList.map(c => <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>)}
                    </Select>
                  </FormControl>
                  <TextField label="사이즈" size="small" value={item.size_purchased || ''} onChange={e => updateItem(i, 'size_purchased', e.target.value)} sx={{ flex: 1 }} />
                  <FormControl size="small" sx={{ flex: 1 }}>
                    <InputLabel>핏</InputLabel>
                    <Select value={item.fit_review || 'true'} label="핏" onChange={e => updateItem(i, 'fit_review', e.target.value)}>
                      <MenuItem value="small">작음</MenuItem>
                      <MenuItem value="true">정사이즈</MenuItem>
                      <MenuItem value="large">큼</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
                <TextField label="구매처 URL" size="small" value={item.purchase_url || ''} onChange={e => updateItem(i, 'purchase_url', e.target.value)} fullWidth />
                <Rating name={`rating-${i}`} value={item.rating || 5} onChange={(_, val) => updateItem(i, 'rating', val)} precision={0.5} sx={{ color: '#E8C96D' }} />
              </Box>
            </Box>
          ))}
        </Box>

        <Button type="submit" variant="contained" disabled={submitting} sx={{ backgroundColor:'#E8C96D', color:'#0A0A0A', fontWeight:700, py:1.5 }}>
          {submitting ? <CircularProgress size={24} /> : '수정 완료'}
        </Button>
      </Box>
    </Box>
  );
};

export default EditPost;