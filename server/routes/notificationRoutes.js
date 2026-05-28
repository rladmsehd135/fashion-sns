const router                 = require('express').Router();
const NotificationController = require('../controllers/notificationController');
const authMiddleware         = require('../middlewares/authMiddleware');

router.get('/',         authMiddleware, NotificationController.getAll);
router.put('/read',     authMiddleware, NotificationController.readAll);
router.put('/:id/read', authMiddleware, NotificationController.readOne);

module.exports = router;