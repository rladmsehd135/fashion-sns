const ChatModel  = require('../models/chatModel');
const UserModel  = require('../models/userModel');
const { formatLastSeen } = require('../utils/formatTime');

const ChatController = {

  // 채팅 요청 보내기
  sendRequest: async (req, res, next) => {
    try {
      const receiverId = parseInt(req.params.userId);

      if (receiverId === req.userId) {
        return res.status(400).json({ message: '자기 자신에게 요청할 수 없습니다.' });
      }

      const existing = await ChatModel.findExistingRequest(req.userId, receiverId);
      if (existing) {
        return res.status(409).json({ message: '이미 채팅 요청을 보냈습니다.' });
      }

      const requestId = await ChatModel.createRequest(req.userId, receiverId);

      // 소켓으로 수신자에게 알림
      const io       = req.app.get('io');
      const sender   = await UserModel.findById(req.userId);
      io.to(`user_${receiverId}`).emit('chat:request_received', {
        requestId,
        sender: { id: sender.id, username: sender.username, profile_image: sender.profile_image },
      });

      res.status(201).json({ message: '채팅 요청을 보냈습니다.', requestId });
    } catch (err) {
      next(err);
    }
  },

  // 받은 요청 목록
  getRequests: async (req, res, next) => {
    try {
      const requests = await ChatModel.getReceivedRequests(req.userId);
      res.json(requests);
    } catch (err) {
      next(err);
    }
  },

  // 요청 수락
  acceptRequest: async (req, res, next) => {
    try {
      const { id: requestId } = req.params;
      const request           = await ChatModel.findRequest(requestId);

      if (!request) {
        return res.status(404).json({ message: '요청을 찾을 수 없습니다.' });
      }
      if (request.receiver_id !== req.userId) {
        return res.status(403).json({ message: '권한이 없습니다.' });
      }
      if (request.status !== 'pending') {
        return res.status(400).json({ message: '이미 처리된 요청입니다.' });
      }

      await ChatModel.updateRequestStatus(requestId, 'accepted');
      const roomId = await ChatModel.createRoom(requestId, request.sender_id, request.receiver_id);

      // 소켓으로 요청자에게 알림
      const io = req.app.get('io');
      io.to(`user_${request.sender_id}`).emit('chat:request_accepted', { roomId });

      res.json({ message: '채팅 요청을 수락했습니다.', roomId });
    } catch (err) {
      next(err);
    }
  },

  // 요청 거절
  rejectRequest: async (req, res, next) => {
    try {
      const { id: requestId } = req.params;
      const request           = await ChatModel.findRequest(requestId);

      if (!request) {
        return res.status(404).json({ message: '요청을 찾을 수 없습니다.' });
      }
      if (request.receiver_id !== req.userId) {
        return res.status(403).json({ message: '권한이 없습니다.' });
      }

      await ChatModel.updateRequestStatus(requestId, 'rejected');
      res.json({ message: '채팅 요청을 거절했습니다.' });
    } catch (err) {
      next(err);
    }
  },

  // 채팅방 목록
  getRooms: async (req, res, next) => {
    try {
      const rooms = await ChatModel.getRooms(req.userId);

      const result = rooms.map(room => ({
        ...room,
        partner_last_seen_text: formatLastSeen(room.partner_last_seen),
      }));

      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  // 메시지 히스토리
  getMessages: async (req, res, next) => {
    try {
      const { id: roomId } = req.params;
      const cursor         = req.query.cursor || null;
      const limit          = parseInt(req.query.limit) || 30;

      const room = await ChatModel.findRoomById(roomId);
      if (!room) {
        return res.status(404).json({ message: '채팅방을 찾을 수 없습니다.' });
      }
      if (room.user1_id !== req.userId && room.user2_id !== req.userId) {
        return res.status(403).json({ message: '권한이 없습니다.' });
      }

      const messages = await ChatModel.getMessages(roomId, cursor, limit);
      res.json(messages);
    } catch (err) {
      next(err);
    }
  },

  // 읽음 처리
  readMessages: async (req, res, next) => {
    try {
      const { id: roomId } = req.params;
      await ChatModel.updateReadAt(roomId, req.userId);

      // 상대방에게 읽음 알림
      const io   = req.app.get('io');
      const room = await ChatModel.findRoomById(roomId);
      const partnerId = room.user1_id === req.userId ? room.user2_id : room.user1_id;
      io.to(`user_${partnerId}`).emit('chat:message_read', { roomId });

      res.json({ message: '읽음 처리 완료' });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = ChatController;