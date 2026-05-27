const db       = require('../config/db');
const oracledb = require('oracledb');

const ChatModel = {

  createRequest: async (senderId, receiverId) => {
    const result = await db.query(
      `INSERT INTO chat_requests (sender_id, receiver_id)
       VALUES (:1, :2) RETURNING id INTO :3`,
      [senderId, receiverId,
        { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }]
    );
    return result.outBinds[0];
  },

  findRequest: async (requestId) => {
    const result = await db.query(
      `SELECT * FROM chat_requests WHERE id = :1`, [requestId]
    );
    return result.rows[0];
  },

  findExistingRequest: async (senderId, receiverId) => {
    const result = await db.query(
      `SELECT * FROM chat_requests WHERE sender_id = :1 AND receiver_id = :2`,
      [senderId, receiverId]
    );
    return result.rows[0];
  },

  getReceivedRequests: async (userId) => {
    const result = await db.query(
      `SELECT cr.id, cr.sender_id, cr.status, cr.created_at,
              u.username, u.profile_image
       FROM chat_requests cr
       JOIN users u ON u.id = cr.sender_id
       WHERE cr.receiver_id = :1 AND cr.status = 'pending'
       ORDER BY cr.created_at DESC`,
      [userId]
    );
    return result.rows;
  },

  updateRequestStatus: async (requestId, status) => {
    await db.query(
      `UPDATE chat_requests SET status = :1 WHERE id = :2`,
      [status, requestId]
    );
  },

  createRoom: async (requestId, user1Id, user2Id) => {
    const result = await db.query(
      `INSERT INTO chat_rooms (request_id, user1_id, user2_id)
       VALUES (:1, :2, :3) RETURNING id INTO :4`,
      [requestId, user1Id, user2Id,
        { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }]
    );
    return result.outBinds[0];
  },

  findRoomById: async (roomId) => {
    const result = await db.query(
      `SELECT * FROM chat_rooms WHERE id = :1`, [roomId]
    );
    return result.rows[0];
  },

  getRooms: async (userId) => {
    const result = await db.query(
      `SELECT cr.id, cr.last_message, cr.last_message_at, cr.created_at,
              CASE WHEN cr.user1_id = :1 THEN u2.id          ELSE u1.id          END AS partner_id,
              CASE WHEN cr.user1_id = :2 THEN u2.username    ELSE u1.username    END AS partner_username,
              CASE WHEN cr.user1_id = :3 THEN u2.profile_image ELSE u1.profile_image END AS partner_image,
              CASE WHEN cr.user1_id = :4 THEN u2.is_online   ELSE u1.is_online   END AS partner_online,
              CASE WHEN cr.user1_id = :5 THEN u2.last_seen_at ELSE u1.last_seen_at END AS partner_last_seen,
              (SELECT COUNT(*) FROM chat_messages cm
               WHERE cm.room_id = cr.id
               AND cm.sender_id != :6
               AND cm.is_deleted = 0
               AND cm.created_at > CASE WHEN cr.user1_id = :7 THEN cr.user1_read_at ELSE cr.user2_read_at END
              ) AS unread_count
       FROM chat_rooms cr
       JOIN users u1 ON u1.id = cr.user1_id
       JOIN users u2 ON u2.id = cr.user2_id
       WHERE cr.user1_id = :8 OR cr.user2_id = :9
       ORDER BY cr.last_message_at DESC NULLS LAST`,
      [userId, userId, userId, userId, userId, userId, userId, userId, userId]
    );
    return result.rows;
  },

  createMessage: async (roomId, senderId, messageType, content, imageUrl) => {
    const result = await db.query(
      `INSERT INTO chat_messages (room_id, sender_id, message_type, content, image_url)
       VALUES (:1, :2, :3, :4, :5) RETURNING id INTO :6`,
      [roomId, senderId, messageType, content, imageUrl,
        { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }]
    );
    const preview = messageType === 'image' ? '사진을 보냈습니다.' : content;
    await db.query(
      `UPDATE chat_rooms SET last_message = :1, last_message_at = CURRENT_TIMESTAMP WHERE id = :2`,
      [preview, roomId]
    );
    return result.outBinds[0];
  },

  getMessages: async (roomId, cursor, limit = 30) => {
    const result = cursor
      ? await db.query(
          `SELECT * FROM (
             SELECT m.id, m.room_id, m.sender_id, m.message_type,
                    m.content, m.image_url, m.created_at,
                    u.username, u.profile_image
             FROM chat_messages m
             JOIN users u ON u.id = m.sender_id
             WHERE m.room_id = :1 AND m.is_deleted = 0 AND m.id < :2
             ORDER BY m.created_at DESC
           ) WHERE ROWNUM <= :3`,
          [roomId, cursor, limit]
        )
      : await db.query(
          `SELECT * FROM (
             SELECT m.id, m.room_id, m.sender_id, m.message_type,
                    m.content, m.image_url, m.created_at,
                    u.username, u.profile_image
             FROM chat_messages m
             JOIN users u ON u.id = m.sender_id
             WHERE m.room_id = :1 AND m.is_deleted = 0
             ORDER BY m.created_at DESC
           ) WHERE ROWNUM <= :2`,
          [roomId, limit]
        );
    return result.rows.reverse();
  },

  updateReadAt: async (roomId, userId) => {
    const room = await ChatModel.findRoomById(roomId);
    if (!room) return;
    const column = room.user1_id === userId ? 'user1_read_at' : 'user2_read_at';
    await db.query(
      `UPDATE chat_rooms SET ${column} = CURRENT_TIMESTAMP WHERE id = :1`,
      [roomId]
    );
  },
};

module.exports = ChatModel;