const router         = require('express').Router();
const UserController = require('../controllers/userController');
const authMiddleware = require('../middlewares/authMiddleware');
const upload         = require('../middlewares/uploadMiddleware');
const db             = require('../config/db');

router.get('/styles/list', async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT value, label, icon, description
       FROM styles
       WHERE is_active = 1
       ORDER BY sort_order ASC`
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

router.get('/me',                authMiddleware, UserController.getMe);
router.get('/me/style-report',   authMiddleware, UserController.getStyleReport);
router.get('/check-username',    UserController.checkUsername);
router.get('/search',            authMiddleware, UserController.search);
router.get('/recommended',       authMiddleware, UserController.getRecommended);
router.get('/:username',         authMiddleware, UserController.getProfile);
router.put('/me/update',         authMiddleware, upload.single('profile_image'), UserController.updateProfile);
router.get('/:id/followers',     authMiddleware, UserController.getFollowers);
router.get('/:id/following',     authMiddleware, UserController.getFollowing);
router.get('/:id/follow-status', authMiddleware, async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT COUNT(*) AS cnt FROM follows
       WHERE follower_id = :1 AND following_id = :2`,
      [req.userId, req.params.id]
    );
    res.json({ is_following: result.rows[0]?.cnt > 0 });
  } catch (err) { next(err); }
});

module.exports = router;
