const http       = require('http');
const { Server } = require('socket.io');
const jwt        = require('jsonwebtoken');
const app        = require('./app');
const db         = require('./config/db');
const { accessSecret } = require('./config/jwt');
const UserModel  = require('./models/userModel');
const ChatModel  = require('./models/chatModel');
require('dotenv').config();

const startServer = async () => {
  // DB 먼저 연결
  await db.init();

  const server = http.createServer(app);

  const io = new Server(server, {
    cors: {
      origin:      process.env.CLIENT_URL,
      credentials: true,
    },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('인증 토큰이 없습니다.'));
    try {
      const decoded = jwt.verify(token, accessSecret);
      socket.userId = decoded.id;
      next();
    } catch {
      next(new Error('유효하지 않은 토큰입니다.'));
    }
  });

  app.set('io', io);

  io.on('connection', async (socket) => {
    const userId = socket.userId;
    console.log(`소켓 연결 - userId: ${userId}`);

    socket.join(`user_${userId}`);
    await UserModel.updateOnlineStatus(userId, true);
    io.emit('user:online', { userId });

    socket.on('room:join',  (roomId) => socket.join(`room_${roomId}`));
    socket.on('room:leave', (roomId) => socket.leave(`room_${roomId}`));

    socket.on('message:send', async ({ roomId, content, messageType = 'text', imageUrl = null }) => {
      try {
        const room = await ChatModel.findRoomById(roomId);
        if (!room) return;
        if (room.user1_id !== userId && room.user2_id !== userId) return;

        const messageId = await ChatModel.createMessage(roomId, userId, messageType, content, imageUrl);
        io.to(`room_${roomId}`).emit('chat:message', {
          id: messageId, room_id: roomId, sender_id: userId,
          message_type: messageType, content, image_url: imageUrl,
          created_at: new Date(),
        });
      } catch (err) {
        console.error('메시지 전송 에러:', err);
      }
    });

    socket.on('typing:start', ({ roomId }) => socket.to(`room_${roomId}`).emit('chat:typing_start', { userId }));
    socket.on('typing:stop',  ({ roomId }) => socket.to(`room_${roomId}`).emit('chat:typing_stop',  { userId }));

    socket.on('message:read', async ({ roomId }) => {
      try {
        await ChatModel.updateReadAt(roomId, userId);
        const room      = await ChatModel.findRoomById(roomId);
        const partnerId = room.user1_id === userId ? room.user2_id : room.user1_id;
        io.to(`user_${partnerId}`).emit('chat:message_read', { roomId });
      } catch (err) {
        console.error('읽음 처리 에러:', err);
      }
    });

    socket.on('disconnect', async () => {
      await UserModel.updateOnlineStatus(userId, false);
      io.emit('user:offline', { userId, lastSeenAt: new Date() });
    });
  });

  const PORT = process.env.PORT || 5000;
  server.listen(PORT, () => {
    console.log(`서버 실행 중 → http://localhost:${PORT}`);
  });
};

startServer().catch(console.error);