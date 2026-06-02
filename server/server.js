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

const PROFANITY = [
  '씨발','씨팔','시발','시팔','씨빨','시빨',
  '개새끼','개새','새끼','개새기',
  '병신','빙신','지랄','존나','졸라',
  '창녀','창년','걸레','보지','자지',
  '개년','개놈','개소리',
  '미친놈','미친년','미친새끼',
  '뒤져','뒤지라','죽어라',
  '잡년','잡놈','호로새끼','호로년',
];
function filterProfanity(text) {
  if (!text) return text;
  let r = text;
  PROFANITY.forEach(w => { r = r.split(w).join('*'.repeat(w.length)); });
  return r;
}

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

    // 온라인 상태 업데이트 + username 저장
    try {
      const uRes = await db.query(
        `UPDATE users SET is_online = 1, last_seen_at = CURRENT_TIMESTAMP WHERE id = :1 RETURNING username INTO :2`,
        [userId, { dir: oracledb.BIND_OUT, type: oracledb.STRING, maxSize: 100 }]
      );
      socket.username = uRes.outBinds || '알 수 없음';
      io.emit('user:online', { userId });
    } catch (err) {
      console.error('온라인 상태 업데이트 에러:', err);
      socket.username = '알 수 없음';
    }

    socket.on('room:join', (roomId) => {
      socket.join(`room_${roomId}`);
    });
    socket.on('typing:start', ({ roomId }) => {
      socket.to(`room_${roomId}`).emit('chat:typing_start', {
        roomId, userId: socket.userId, username: socket.username,
      });
    });

    socket.on('typing:stop', ({ roomId }) => {
      socket.to(`room_${roomId}`).emit('chat:typing_stop', {
        roomId, userId: socket.userId,
      });
    });
    socket.on('room:leave', (roomId) => socket.leave(`room_${roomId}`));

    socket.on('message:send', async ({ roomId, content, imageUrl, messageType }) => {
      try {
        const room = await db.query(`SELECT * FROM chat_rooms WHERE id = :1`, [roomId]);
        if (!room.rows[0]) return;

        const type = messageType || 'text';
        const filteredContent = filterProfanity(content);
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
          [roomId, userId, filteredContent || null, imageUrl || null, type,
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

        // 그룹 채팅 미읽음 카운트 포함
        if (isGroup) {
          const cntRes = await db.query(
            `SELECT COUNT(*) AS cnt FROM group_members WHERE room_id = :1`, [roomId]
          );
          msgData.unread_count = Math.max(0, Number(cntRes.rows[0]?.cnt || 1) - 1);
        } else {
          msgData.unread_count = 0;
        }
        msgData.is_read = false;

        const preview = type === 'image' ? '📷 사진' : filteredContent;
        await db.query(
          `UPDATE chat_rooms SET last_message = :1, last_message_at = CURRENT_TIMESTAMP WHERE id = :2`,
          [preview, roomId]
        );

        io.to(`room_${roomId}`).emit('chat:message', msgData);

        // 채팅방 열지 않은 그룹 멤버에게도 room_update 알림
        if (isGroup) {
          const members = await db.query(
            `SELECT user_id FROM group_members WHERE room_id = :1 AND user_id != :2`,
            [roomId, userId]
          );
          const payload = {
            roomId: Number(roomId),
            lastMessage: type === 'image' ? '📷 사진' : (filteredContent || ''),
            lastMessageAt: new Date().toISOString(),
          };
          for (const { user_id } of members.rows) {
            io.to(`user_${user_id}`).emit('chat:room_update', payload);
          }
        }
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