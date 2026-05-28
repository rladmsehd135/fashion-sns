const router         = require('express').Router();
const UserController = require('../controllers/userController');
const authMiddleware = require('../middlewares/authMiddleware');
const upload         = require('../middlewares/uploadMiddleware');

router.get('/me',              authMiddleware, UserController.getMe);
router.get('/search',          authMiddleware, UserController.search);
router.get('/recommended',     authMiddleware, UserController.getRecommended);
router.get('/:username',       authMiddleware, UserController.getProfile);
router.put('/me/update',       authMiddleware, upload.single('profile_image'), UserController.updateProfile);
router.get('/:id/followers',   authMiddleware, UserController.getFollowers);
router.get('/:id/following',   authMiddleware, UserController.getFollowing);

module.exports = router;
