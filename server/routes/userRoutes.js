const router         = require('express').Router();
const UserController = require('../controllers/userController');
const authMiddleware = require('../middlewares/authMiddleware');
const upload         = require('../middlewares/uploadMiddleware');

router.get('/:username',          authMiddleware, UserController.getProfile);
router.put('/me',                 authMiddleware, upload.single('profile_image'), UserController.updateProfile);
router.get('/:id/followers',      authMiddleware, UserController.getFollowers);
router.get('/:id/following',      authMiddleware, UserController.getFollowing);

module.exports = router;