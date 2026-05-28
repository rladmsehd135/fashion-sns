const router         = require('express').Router();
const ChatController = require('../controllers/chatController');
const authMiddleware = require('../middlewares/authMiddleware');

router.post('/request/:userId',    authMiddleware, ChatController.sendRequest);
router.get('/requests',            authMiddleware, ChatController.getRequests);
router.put('/requests/:id/accept', authMiddleware, ChatController.acceptRequest);
router.put('/requests/:id/reject', authMiddleware, ChatController.rejectRequest);
router.get('/rooms',               authMiddleware, ChatController.getRooms);
router.get('/rooms/:id/messages',  authMiddleware, ChatController.getMessages);
router.put('/rooms/:id/read',      authMiddleware, ChatController.readMessages);

module.exports = router;