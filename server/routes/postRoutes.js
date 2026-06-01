const router         = require('express').Router();
const PostController = require('../controllers/postController');
const authMiddleware = require('../middlewares/authMiddleware');
const upload         = require('../middlewares/uploadMiddleware');

// 아이템 카테고리 목록 (DB 테이블 추가 전까지 서버 단일 관리)
router.get('/categories', (req, res) => {
  res.json([
    { value: 'top',    label: '상의' },
    { value: 'bottom', label: '하의' },
    { value: 'outer',  label: '아우터' },
    { value: 'shoes',  label: '신발' },
    { value: 'bag',    label: '가방' },
    { value: 'acc',    label: '액세서리' },
    { value: 'etc',    label: '기타' },
  ]);
});

router.get('/feed',          authMiddleware, PostController.getFeed);
router.get('/explore',       authMiddleware, PostController.getExplore);
router.get('/recommended',   authMiddleware, PostController.getRecommended);
router.post('/',             authMiddleware, upload.array('images', 5), PostController.create);
router.get('/user/:id',      authMiddleware, PostController.getByUser);
router.get('/:id',           authMiddleware, PostController.getOne);
router.put('/:id',           authMiddleware, upload.array('images', 5), PostController.update);
router.delete('/:id',        authMiddleware, PostController.delete);
router.post('/:id/like',     authMiddleware, PostController.toggleLike);

module.exports = router;