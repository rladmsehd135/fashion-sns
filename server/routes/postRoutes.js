const router          = require('express').Router();
const PostController  = require('../controllers/postController');
const authMiddleware  = require('../middlewares/authMiddleware');
const upload          = require('../middlewares/uploadMiddleware');

// 피드 / 탐색
router.get('/feed',              authMiddleware, PostController.getFeed);
router.get('/explore',           authMiddleware, PostController.getExplore);

// 게시물 CRUD
router.post('/',                 authMiddleware, upload.array('images', 5), PostController.create);
router.get('/:id',               authMiddleware, PostController.getOne);
router.put('/:id',               authMiddleware, PostController.update);
router.delete('/:id',            authMiddleware, PostController.delete);

// 좋아요
router.post('/:id/like',         authMiddleware, PostController.toggleLike);

// 유저별 게시물
router.get('/user/:id',          authMiddleware, PostController.getByUser);

module.exports = router;