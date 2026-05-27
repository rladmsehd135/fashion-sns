const router            = require('express').Router();
const CommentController = require('../controllers/commentController');
const authMiddleware    = require('../middlewares/authMiddleware');

// 댓글 작성 / 조회 (postId 기준)
router.post('/posts/:id/comments',  authMiddleware, CommentController.create);
router.get('/posts/:id/comments',   authMiddleware, CommentController.getByPost);

// 댓글 수정 / 삭제 (commentId 기준)
router.put('/:id',                  authMiddleware, CommentController.update);
router.delete('/:id',               authMiddleware, CommentController.delete);

module.exports = router;