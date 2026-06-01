const db = require('../config/db');
const oracledb = require('oracledb');
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
      const io = req.app.get('io');
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
      const req_ = await db.query(`SELECT * FROM chat_requests WHERE id = :1`, [id]);
      const request = req_.rows[0];
      if (!request) return res.status(404).json({ message: '요청을 찾을 수 없습니다.' });
      if (request.receiver_id !== req.userId) return res.status(403).json({ message: '권한이 없습니다.' });
      if (request.status !== 'pending') return res.status(400).json({ message: '이미 처리된 요청입니다.' });
      await db.query(`UPDATE chat_requests SET status = 'accepted' WHERE id = :1`, [id]);
      const room = await db.query(
        `INSERT INTO chat_rooms (request_id, user1_id, user2_id) VALUES (:1, :2, :3) RETURNING id INTO :4`,
        [id, request.sender_id, request.receiver_id,
          { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }]
      );
      const roomId = room.outBinds[0];
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
      const { id } = req.params;
      const req_ = await db.query(`SELECT * FROM chat_requests WHERE id = :1`, [id]);
      const request = req_.rows[0];
      if (!request) return res.status(404).json({ message: '요청을 찾을 수 없습니다.' });
      if (request.receiver_id !== req.userId) return res.status(403).json({ message: '권한이 없습니다.' });
      await db.query(`UPDATE chat_requests SET status = 'rejected' WHERE id = :1`, [id]);
      res.json({ message: '채팅 요청을 거절했습니다.' });
    } catch (err) {
      next(err);
    }
  },

  getRooms: async (req, res, next) => {
    try {
      // 1:1 채팅방
      const directResult = await db.query(
        `SELECT cr.id, cr.last_message, cr.last_message_at,
                'direct' AS room_type,
                CASE WHEN cr.user1_id = :1 THEN u2.id            ELSE u1.id            END AS partner_id,
                CASE WHEN cr.user1_id = :2 THEN u2.username      ELSE u1.username      END AS partner_username,
                CASE WHEN cr.user1_id = :3 THEN u2.profile_image ELSE u1.profile_image END AS partner_image,
                CASE WHEN cr.user1_id = :4 THEN u2.is_online     ELSE u1.is_online     END AS partner_online,
                CASE WHEN cr.user1_id = :5 THEN u2.last_seen_at  ELSE u1.last_seen_at  END AS partner_last_seen,
                (SELECT COUNT(*) FROM chat_messages cm
                 WHERE cm.room_id = cr.id AND cm.sender_id != :6 AND cm.is_deleted = 0
                 AND cm.created_at > CASE WHEN cr.user1_id = :7 THEN NVL(cr.user1_read_at, DATE '2000-01-01')
                                          ELSE NVL(cr.user2_read_at, DATE '2000-01-01') END
                ) AS unread_count
         FROM chat_rooms cr
         JOIN users u1 ON u1.id = cr.user1_id
         JOIN users u2 ON u2.id = cr.user2_id
         WHERE (cr.user1_id = :8 OR cr.user2_id = :9) AND (cr.room_type = 'direct' OR cr.room_type IS NULL)
         ORDER BY cr.last_message_at DESC NULLS LAST`,
        Array(9).fill(req.userId)
      );

      // 단체 채팅방
      const groupResult = await db.query(
        `SELECT cr.id, cr.last_message, cr.last_message_at,
                'group' AS room_type,
                cr.room_name, cr.room_image,
                (SELECT COUNT(*) FROM group_members WHERE room_id = cr.id) AS member_count,
                (SELECT COUNT(*) FROM chat_messages cm
                 WHERE cm.room_id = cr.id AND cm.sender_id != :1 AND cm.is_deleted = 0
                 AND cm.created_at > NVL(
                   (SELECT last_read_at FROM group_read_status WHERE room_id = cr.id AND user_id = :2),
                   DATE '2000-01-01'
                 )
                ) AS unread_count
         FROM chat_rooms cr
         JOIN group_members gm ON gm.room_id = cr.id AND gm.user_id = :3
         WHERE cr.room_type = 'group'
         ORDER BY cr.last_message_at DESC NULLS LAST`,
        [req.userId, req.userId, req.userId]
      );

      // 단체방 멤버 미리보기 (아바타 3개)
      const groupIds = groupResult.rows.map(r => r.id);
      let memberPreviews = {};
      for (const gid of groupIds) {
        const mRes = await db.query(
          `SELECT u.id, u.username, u.profile_image FROM group_members gm
           JOIN users u ON u.id = gm.user_id
           WHERE gm.room_id = :1 AND gm.user_id != :2
           FETCH FIRST 3 ROWS ONLY`,
          [gid, req.userId]
        );
        memberPreviews[gid] = mRes.rows;
      }

      const direct = directResult.rows.map(r => ({
        ...r, partner_last_seen_text: formatLastSeen(r.partner_last_seen),
      }));
      const groups = groupResult.rows.map(r => ({
        ...r, member_previews: memberPreviews[r.id] || [],
      }));

      const all = [...direct, ...groups].sort((a, b) => {
        const ta = a.last_message_at ? new Date(a.last_message_at).getTime() : 0;
        const tb = b.last_message_at ? new Date(b.last_message_at).getTime() : 0;
        return tb - ta;
      });
      res.json(all);
    } catch (err) {
      next(err);
    }
  },

  createGroup: async (req, res, next) => {
    try {
      const { name, memberIds } = req.body;
      if (!name?.trim()) return res.status(400).json({ message: '그룹 이름을 입력해주세요.' });
      const ids = Array.isArray(memberIds) ? memberIds.map(Number).filter(Boolean) : [];

      const roomRes = await db.query(
        `INSERT INTO chat_rooms (room_type, room_name) VALUES ('group', :1) RETURNING id INTO :2`,
        [name.trim(), { dir: require('oracledb').BIND_OUT, type: require('oracledb').NUMBER }]
      );
      const roomId = roomRes.outBinds;

      // 생성자 + 초대 멤버 등록
      const allMembers = [...new Set([req.userId, ...ids])];
      for (const uid of allMembers) {
        await db.query(
          `INSERT INTO group_members (room_id, user_id, is_admin) VALUES (:1, :2, :3)`,
          [roomId, uid, uid === req.userId ? 1 : 0]
        );
        await db.query(
          `INSERT INTO group_read_status (room_id, user_id) VALUES (:1, :2)`,
          [roomId, uid]
        );
      }

      // 초대된 멤버들 소켓 알림
      const io = req.app.get('io');
      for (const uid of ids) {
        io.to(`user_${uid}`).emit('chat:group_created', { roomId, name: name.trim() });
      }

      res.status(201).json({ roomId, name: name.trim() });
    } catch (err) { next(err); }
  },

  getGroupMembers: async (req, res, next) => {
    try {
      const { id } = req.params;
      const result = await db.query(
        `SELECT u.id, u.username, u.profile_image, gm.is_admin
         FROM group_members gm JOIN users u ON u.id = gm.user_id
         WHERE gm.room_id = :1 ORDER BY gm.is_admin DESC, gm.joined_at ASC`,
        [id]
      );
      res.json(result.rows);
    } catch (err) { next(err); }
  },

  getMessages: async (req, res, next) => {
    try {
      const { id } = req.params;
      const limit = parseInt(req.query.limit) || 50;
      const room = await db.query(`SELECT * FROM chat_rooms WHERE id = :1`, [id]);
      if (!room.rows[0]) return res.status(404).json({ message: '채팅방을 찾을 수 없습니다.' });

      const isGroup = room.rows[0].room_type === 'group';

      if (isGroup) {
        const member = await db.query(
          `SELECT 1 FROM group_members WHERE room_id = :1 AND user_id = :2`,
          [id, req.userId]
        );
        if (!member.rows[0]) return res.status(403).json({ message: '권한이 없습니다.' });
      } else {
        if (room.rows[0].user1_id !== req.userId && room.rows[0].user2_id !== req.userId) {
          return res.status(403).json({ message: '권한이 없습니다.' });
        }
      }

      const result = await db.query(
        `SELECT * FROM (
           SELECT m.id, m.room_id, m.sender_id, m.message_type,
                  m.content, m.image_url, m.created_at,
                  u.username, u.profile_image,
                  CASE
                    WHEN m.sender_id = :sender_id THEN
                      CASE WHEN (
                        SELECT CASE WHEN cr.user1_id = m.sender_id THEN cr.user2_read_at
                                    ELSE cr.user1_read_at END
                        FROM chat_rooms cr WHERE cr.id = m.room_id
                      ) > m.created_at THEN 1 ELSE 0 END
                    ELSE 1
                  END AS is_read
           FROM chat_messages m JOIN users u ON u.id = m.sender_id
           WHERE m.room_id = :room_id AND m.is_deleted = 0
           ORDER BY m.created_at DESC
         ) WHERE ROWNUM <= :limit`,
        { sender_id: req.userId, room_id: id, limit }
      );
      res.json(result.rows.reverse());
    } catch (err) {
      next(err);
    }
  },

  readMessages: async (req, res, next) => {
    try {
      const { id } = req.params;
      const room = await db.query(`SELECT * FROM chat_rooms WHERE id = :1`, [id]);
      if (!room.rows[0]) return res.status(404).json({ message: '채팅방을 찾을 수 없습니다.' });

      const isGroup = room.rows[0].room_type === 'group';
      const io = req.app.get('io');

      if (isGroup) {
        await db.query(
          `MERGE INTO group_read_status grs
           USING DUAL ON (grs.room_id = :1 AND grs.user_id = :2)
           WHEN MATCHED THEN UPDATE SET last_read_at = CURRENT_TIMESTAMP
           WHEN NOT MATCHED THEN INSERT (room_id, user_id, last_read_at) VALUES (:3, :4, CURRENT_TIMESTAMP)`,
          [id, req.userId, id, req.userId]
        );
      } else {
        const column = room.rows[0].user1_id === req.userId ? 'user1_read_at' : 'user2_read_at';
        await db.query(`UPDATE chat_rooms SET ${column} = CURRENT_TIMESTAMP WHERE id = :1`, [id]);
        const partnerId = room.rows[0].user1_id === req.userId ? room.rows[0].user2_id : room.rows[0].user1_id;
        io.to(`user_${partnerId}`).emit('chat:message_read', { roomId: id });
      }
      res.json({ message: '읽음 처리 완료' });
    } catch (err) {
      next(err);
    }
  },
};



module.exports = ChatController;