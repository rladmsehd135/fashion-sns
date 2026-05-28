const router            = require('express').Router();
const CommentController = require('../controllers/commentController');
const authMiddleware    = require('../middlewares/authMiddleware');

router.post('/posts/:id/comments',  authMiddleware, CommentController.create);
router.get('/posts/:id/comments',   authMiddleware, CommentController.getByPost);
router.put('/comments/:id',         authMiddleware, CommentController.update);
router.delete('/comments/:id',      authMiddleware, CommentController.delete);

module.exports = router;