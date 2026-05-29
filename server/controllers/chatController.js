const db             = require('../config/db');
const oracledb       = require('oracledb');
const { formatLastSeen } = require('../utils/formatTime');

const ChatController = {

  sendRequest: async (req, res, next) => {
    try {
      const receiverId = parseInt(req.params.userId);
      if (receiverId === req.userId) return res.status(400).json({ message: '자기 자신에게 요청할 수 없습니다.' });
      const existing = await db.query(
        `SELECT id FROM chat_requests WHERE sender_id = :1 AND receiver_id = :2`,
        [req.userId, receiverId]
      );
      if (existing.rows.length > 0) return res.status(409).json({ message: '이미 요청을 보냈습니다.' });
      const result = await db.query(
        `INSERT INTO chat_requests (sender_id, receiver_id) VALUES (:1, :2) RETURNING id INTO :3`,
        [req.userId, receiverId, { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }]
      );
      await db.query(
        `INSERT INTO notifications (user_id, sender_id, type) VALUES (:1, :2, 'chat_request')`,
        [receiverId, req.userId]
      );
      const sender = await db.query(`SELECT id, username, profile_image FROM users WHERE id = :1`, [req.userId]);
      const io     = req.app.get('io');
      io.to(`user_${receiverId}`).emit('chat:request_received', {
        requestId: result.outBinds[0], sender: sender.rows[0],
      });
      io.to(`user_${receiverId}`).emit('notification:new', {
        type: 'chat_request',
        sender_id: req.userId,
        username: sender.rows[0].username,
        profile_image: sender.rows[0].profile_image,
        created_at: new Date().toISOString(),
      });
      res.status(201).json({ message: '채팅 요청을 보냈습니다.', requestId: result.outBinds[0] });
    } catch (err) {
      next(err);
    }
  },

  getRequests: async (req, res, next) => {
    try {
      const result = await db.query(
        `SELECT cr.id, cr.sender_id, cr.status, cr.created_at, u.username, u.profile_image
         FROM chat_requests cr JOIN users u ON u.id = cr.sender_id
         WHERE cr.receiver_id = :1 AND cr.status = 'pending'
         ORDER BY cr.created_at DESC`,
        [req.userId]
      );
      res.json(result.rows);
    } catch (err) {
      next(err);
    }
  },

  acceptRequest: async (req, res, next) => {
    try {
      const { id } = req.params;
      const req_   = await db.query(`SELECT * FROM chat_requests WHERE id = :1`, [id]);
      const request = req_.rows[0];
      if (!request)                           return res.status(404).json({ message: '요청을 찾을 수 없습니다.' });
      if (request.receiver_id !== req.userId) return res.status(403).json({ message: '권한이 없습니다.' });
      if (request.status !== 'pending')       return res.status(400).json({ message: '이미 처리된 요청입니다.' });
      await db.query(`UPDATE chat_requests SET status = 'accepted' WHERE id = :1`, [id]);
      const room = await db.query(
        `INSERT INTO chat_rooms (request_id, user1_id, user2_id) VALUES (:1, :2, :3) RETURNING id INTO :4`,
        [id, request.sender_id, request.receiver_id,
          { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }]
      );
      const roomId   = room.outBinds[0];
      const acceptor = await db.query(`SELECT username, profile_image FROM users WHERE id = :1`, [req.userId]);
      await db.query(
        `INSERT INTO notifications (user_id, sender_id, type) VALUES (:1, :2, 'chat_accepted')`,
        [request.sender_id, req.userId]
      );
      const io = req.app.get('io');
      io.to(`user_${request.sender_id}`).emit('chat:request_accepted', { roomId });
      io.to(`user_${request.sender_id}`).emit('notification:new', {
        type: 'chat_accepted',
        sender_id: req.userId,
        username: acceptor.rows[0].username,
        profile_image: acceptor.rows[0].profile_image,
        created_at: new Date().toISOString(),
      });
      res.json({ message: '채팅 요청을 수락했습니다.', roomId });
    } catch (err) {
      next(err);
    }
  },

  rejectRequest: async (req, res, next) => {
    try {
      const { id }  = req.params;
      const req_    = await db.query(`SELECT * FROM chat_requests WHERE id = :1`, [id]);
      const request = req_.rows[0];
      if (!request)                           return res.status(404).json({ message: '요청을 찾을 수 없습니다.' });
      if (request.receiver_id !== req.userId) return res.status(403).json({ message: '권한이 없습니다.' });
      await db.query(`UPDATE chat_requests SET status = 'rejected' WHERE id = :1`, [id]);
      res.json({ message: '채팅 요청을 거절했습니다.' });
    } catch (err) {
      next(err);
    }
  },

  getRooms: async (req, res, next) => {
    try {
      const result = await db.query(
        `SELECT cr.id, cr.last_message, cr.last_message_at,
                CASE WHEN cr.user1_id = :1 THEN u2.id            ELSE u1.id            END AS partner_id,
                CASE WHEN cr.user1_id = :2 THEN u2.username      ELSE u1.username      END AS partner_username,
                CASE WHEN cr.user1_id = :3 THEN u2.profile_image ELSE u1.profile_image END AS partner_image,
                CASE WHEN cr.user1_id = :4 THEN u2.is_online     ELSE u1.is_online     END AS partner_online,
                CASE WHEN cr.user1_id = :5 THEN u2.last_seen_at  ELSE u1.last_seen_at  END AS partner_last_seen,
                (SELECT COUNT(*) FROM chat_messages cm
                 WHERE cm.room_id = cr.id AND cm.sender_id != :6 AND cm.is_deleted = 0
                 AND cm.created_at > CASE WHEN cr.user1_id = :7 THEN cr.user1_read_at ELSE cr.user2_read_at END
                ) AS unread_count
         FROM chat_rooms cr
         JOIN users u1 ON u1.id = cr.user1_id
         JOIN users u2 ON u2.id = cr.user2_id
         WHERE cr.user1_id = :8 OR cr.user2_id = :9
         ORDER BY cr.last_message_at DESC NULLS LAST`,
        [req.userId, req.userId, req.userId, req.userId, req.userId,
         req.userId, req.userId, req.userId, req.userId]
      );
      const rooms = result.rows.map(r => ({
        ...r, partner_last_seen_text: formatLastSeen(r.partner_last_seen),
      }));
      res.json(rooms);
    } catch (err) {
      next(err);
    }
  },

  getMessages: async (req, res, next) => {
    try {
      const { id }   = req.params;
      const cursor   = req.query.cursor || null;
      const limit    = parseInt(req.query.limit) || 30;
      const room     = await db.query(`SELECT * FROM chat_rooms WHERE id = :1`, [id]);
      if (!room.rows[0]) return res.status(404).json({ message: '채팅방을 찾을 수 없습니다.' });
      if (room.rows[0].user1_id !== req.userId && room.rows[0].user2_id !== req.userId) {
        return res.status(403).json({ message: '권한이 없습니다.' });
      }
      const result = cursor
        ? await db.query(
            `SELECT * FROM (
               SELECT m.id, m.room_id, m.sender_id, m.message_type, m.content, m.image_url, m.created_at,
                      u.username, u.profile_image
               FROM chat_messages m JOIN users u ON u.id = m.sender_id
               WHERE m.room_id = :1 AND m.is_deleted = 0 AND m.id < :2
               ORDER BY m.created_at DESC
             ) WHERE ROWNUM <= :3`,
            [id, cursor, limit]
          )
        : await db.query(
            `SELECT * FROM (
               SELECT m.id, m.room_id, m.sender_id, m.message_type, m.content, m.image_url, m.created_at,
                      u.username, u.profile_image
               FROM chat_messages m JOIN users u ON u.id = m.sender_id
               WHERE m.room_id = :1 AND m.is_deleted = 0
               ORDER BY m.created_at DESC
             ) WHERE ROWNUM <= :2`,
            [id, limit]
          );
      res.json(result.rows.reverse());
    } catch (err) {
      next(err);
    }
  },

  readMessages: async (req, res, next) => {
    try {
      const { id }   = req.params;
      const room     = await db.query(`SELECT * FROM chat_rooms WHERE id = :1`, [id]);
      if (!room.rows[0]) return res.status(404).json({ message: '채팅방을 찾을 수 없습니다.' });
      const column   = room.rows[0].user1_id === req.userId ? 'user1_read_at' : 'user2_read_at';
      await db.query(`UPDATE chat_rooms SET ${column} = CURRENT_TIMESTAMP WHERE id = :1`, [id]);
      const partnerId = room.rows[0].user1_id === req.userId ? room.rows[0].user2_id : room.rows[0].user1_id;
      const io        = req.app.get('io');
      io.to(`user_${partnerId}`).emit('chat:message_read', { roomId: id });
      res.json({ message: '읽음 처리 완료' });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = ChatController;