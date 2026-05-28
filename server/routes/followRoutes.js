const router          = require('express').Router();
const FollowController = require('../controllers/followController');
const authMiddleware  = require('../middlewares/authMiddleware');


router.post('/:userId', authMiddleware, FollowController.toggle);

module.exports = router;