const router         = require('express').Router();
const PostController = require('../controllers/postController');
const authMiddleware = require('../middlewares/authMiddleware');
const upload         = require('../middlewares/uploadMiddleware');

router.get('/feed',          authMiddleware, PostController.getFeed);
router.get('/explore',       authMiddleware, PostController.getExplore);
router.get('/recommended',   authMiddleware, PostController.getRecommended);
router.post('/',             authMiddleware, upload.array('images', 5), PostController.create);
router.get('/user/:id',      authMiddleware, PostController.getByUser);
router.get('/:id',           authMiddleware, PostController.getOne);
router.put('/:id',           authMiddleware, PostController.update);
router.delete('/:id',        authMiddleware, PostController.delete);
router.post('/:id/like',     authMiddleware, PostController.toggleLike);

module.exports = router;