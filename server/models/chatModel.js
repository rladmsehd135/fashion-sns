const db       = require('../config/db');
const oracledb = require('oracledb');

const ChatModel = {

  findRoomById: async (roomId) => {
    const result = await db.query(
      `SELECT * FROM chat_rooms WHERE id = :1`,
      [roomId]
    );
    return result.rows[0] || null;
  },

  createMessage: async (roomId, userId, messageType, content, imageUrl) => {
    const result = await db.query(
      `INSERT INTO chat_messages (room_id, sender_id, message_type, content, image_url)
       VALUES (:1, :2, :3, :4, :5) RETURNING id INTO :6`,
      [roomId, userId, messageType, content, imageUrl,
        { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }]
    );
    await db.query(
      `UPDATE chat_rooms SET last_message = :1, last_message_at = CURRENT_TIMESTAMP WHERE id = :2`,
      [content || '사진', roomId]
    );
    return result.outBinds;
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
