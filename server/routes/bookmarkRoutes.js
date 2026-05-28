const router             = require('express').Router();
const BookmarkController = require('../controllers/bookmarkController');
const authMiddleware     = require('../middlewares/authMiddleware');

router.post('/:postId',  authMiddleware, BookmarkController.toggle);
router.get('/',          authMiddleware, BookmarkController.getMyBookmarks);

module.exports = router;