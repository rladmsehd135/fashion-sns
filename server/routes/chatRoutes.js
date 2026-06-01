const router         = require('express').Router();
const ChatController = require('../controllers/chatController');
const authMiddleware = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');
router.post('/request/:userId',    authMiddleware, ChatController.sendRequest);
router.get('/requests',            authMiddleware, ChatController.getRequests);
router.put('/requests/:id/accept', authMiddleware, ChatController.acceptRequest);
router.put('/requests/:id/reject', authMiddleware, ChatController.rejectRequest);
router.get('/rooms',               authMiddleware, ChatController.getRooms);
router.get('/rooms/:id/messages',  authMiddleware, ChatController.getMessages);
router.put('/rooms/:id/read',      authMiddleware, ChatController.readMessages);
router.post('/groups',             authMiddleware, ChatController.createGroup);
router.get('/groups/:id/members',  authMiddleware, ChatController.getGroupMembers);
router.post('/upload', authMiddleware, upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: '이미지를 선택해주세요.' });
  res.json({ imageUrl: `/uploads/${req.file.filename}` });
});


module.exports = router;