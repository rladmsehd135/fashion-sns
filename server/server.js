const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const app = require('./app');
const db = require('./config/db');
const { initGroupTables } = require('./config/db');
const { accessSecret } = require('./config/jwt');
const ChatModel = require('./models/chatModel');
const oracledb = require('oracledb');
require('dotenv').config();

const startServer = async () => {
  await db.init();
  await initGroupTables();

  const server = http.createServer(app);
  const io = new Server(server, {
    cors: { origin: process.env.CLIENT_URL, credentials: true },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('토큰 없음'));
    try {
      const decoded = jwt.verify(token, accessSecret);
      socket.userId = decoded.id;
      next();
    } catch {
      next(new Error('유효하지 않은 토큰'));
    }
  });

  app.set('io', io);

  io.on('connection', async (socket) => {
    const userId = socket.userId;
    socket.join(`user_${userId}`);

    // 온라인 상태 업데이트
    try {
      await db.query(
        `UPDATE users SET is_online = 1, last_seen_at = CURRENT_TIMESTAMP WHERE id = :1`,
        [userId]
      );
      io.emit('user:online', { userId });
    } catch (err) {
      console.error('온라인 상태 업데이트 에러:', err);
    }

    socket.on('room:join', (roomId) => {
      socket.join(`room_${roomId}`);
    });
    socket.on('typing:start', ({ roomId }) => {
      socket.to(`room_${roomId}`).emit('chat:typing_start', { roomId });
    });

    socket.on('typing:stop', ({ roomId }) => {
      socket.to(`room_${roomId}`).emit('chat:typing_stop', { roomId });
    });
    socket.on('room:leave', (roomId) => socket.leave(`room_${roomId}`));

    socket.on('message:send', async ({ roomId, content, imageUrl, messageType }) => {
      try {
        const room = await db.query(`SELECT * FROM chat_rooms WHERE id = :1`, [roomId]);
        if (!room.rows[0]) return;

        const type = messageType || 'text';
        const isGroup = room.rows[0].room_type === 'group';

        // 권한 체크
        if (isGroup) {
          const member = await db.query(
            `SELECT 1 FROM group_members WHERE room_id = :1 AND user_id = :2`,
            [roomId, userId]
          );
          if (!member.rows[0]) return;
        } else {
          if (room.rows[0].user1_id !== userId && room.rows[0].user2_id !== userId) return;
        }

        const result = await db.query(
          `INSERT INTO chat_messages (room_id, sender_id, content, image_url, message_type)
           VALUES (:1, :2, :3, :4, :5) RETURNING id INTO :6`,
          [roomId, userId, content || null, imageUrl || null, type,
            { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }]
        );
        const msgId = result.outBinds;

        const msg = await db.query(
          `SELECT m.id, m.room_id, m.sender_id, m.content, m.image_url,
                  m.message_type, m.created_at, u.username, u.profile_image
           FROM chat_messages m JOIN users u ON u.id = m.sender_id
           WHERE m.id = :1`, [msgId]
        );
        const msgData = msg.rows[0];

        const preview = type === 'image' ? '📷 사진' : content;
        await db.query(
          `UPDATE chat_rooms SET last_message = :1, last_message_at = CURRENT_TIMESTAMP WHERE id = :2`,
          [preview, roomId]
        );

        io.to(`room_${roomId}`).emit('chat:message', msgData);
      } catch (err) {
        console.error('메시지 전송 오류:', err);
      }
    });

    socket.on('disconnect', async () => {
      try {
        await db.query(
          `UPDATE users SET is_online = 0, last_seen_at = CURRENT_TIMESTAMP WHERE id = :1`,
          [userId]
        );
        io.emit('user:offline', { userId, lastSeenAt: new Date() });
      } catch (err) {
        console.error('오프라인 상태 업데이트 에러:', err);
      }
    });
  });

  const PORT = process.env.PORT || 5000;
  server.listen(PORT, () => console.log(`서버 실행 중 → http://localhost:${PORT}`));
};

startServer().catch(console.error);