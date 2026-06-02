const router         = require('express').Router();
const authMiddleware = require('../middlewares/authMiddleware');
const upload         = require('../middlewares/uploadMiddleware');
const db             = require('../config/db');

// 스토리 목록 (팔로잉 + 내 스토리)
router.get('/', authMiddleware, async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT u.id AS user_id, u.username, u.profile_image,
              COUNT(s.id) AS story_count,
              MAX(s.created_at) AS latest_story,
              (SELECT COUNT(*) FROM story_views sv
               JOIN stories s2 ON s2.id = sv.story_id
               WHERE s2.user_id = u.id AND sv.user_id = :1
               AND s2.expires_at > CURRENT_TIMESTAMP) AS viewed_count
       FROM users u
       JOIN stories s ON s.user_id = u.id
       WHERE s.expires_at > CURRENT_TIMESTAMP
       AND (u.id = :2 OR u.id IN (
         SELECT following_id FROM follows WHERE follower_id = :3
       ))
       GROUP BY u.id, u.username, u.profile_image
       ORDER BY CASE WHEN u.id = :4 THEN 0 ELSE 1 END, MAX(s.created_at) DESC`,
      [req.userId, req.userId, req.userId, req.userId]
    );
    res.json(result.rows);
  } catch (err) { next(err); }
});

// 특정 유저 스토리 조회
router.get('/:userId', authMiddleware, async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT s.*, u.username, u.profile_image,
              (SELECT COUNT(*) FROM story_views WHERE story_id = s.id) AS view_count,
              (SELECT COUNT(*) FROM story_views WHERE story_id = s.id AND user_id = :1) AS is_viewed,
              (SELECT LISTAGG(u2.username || ':' || u2.id || ':' || NVL(u2.profile_image,''), ',')
                      WITHIN GROUP (ORDER BY st.id)
               FROM story_tags st JOIN users u2 ON u2.id = st.user_id
               WHERE st.story_id = s.id) AS tagged_users_raw
       FROM stories s JOIN users u ON u.id = s.user_id
       WHERE s.user_id = :2 AND s.expires_at > CURRENT_TIMESTAMP
       ORDER BY s.created_at ASC`,
      [req.userId, req.params.userId]
    );
    if (parseInt(req.params.userId) !== req.userId) {
      for (const story of result.rows) {
        if (!story.is_viewed) {
          await db.query(
            `INSERT INTO story_views (story_id, user_id) VALUES (:1, :2)`,
            [story.id, req.userId]
          ).catch(() => {});
        }
      }
    }

    // tagged_users_raw → [{id, username, profile_image}] 파싱
    const stories = result.rows.map(s => {
      const raw = s.tagged_users_raw;
      const tagged_users = raw
        ? raw.split(',').map(entry => {
            const [username, id, profile_image] = entry.split(':');
            return { id: Number(id), username, profile_image: profile_image || null };
          })
        : [];
      const { tagged_users_raw, ...rest } = s;
      return { ...rest, tagged_users };
    });
    res.json(stories);
  } catch (err) { next(err); }
});

// 스토리 업로드
router.post('/', authMiddleware, upload.single('image'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: '이미지를 업로드해주세요.' });
    const imageUrl = `/uploads/${req.file.filename}`;
    await db.query(
      `INSERT INTO stories (user_id, image_url) VALUES (:1, :2)`,
      [req.userId, imageUrl]
    );

    // 업로드된 스토리 ID 조회
    const storyRes = await db.query(
      `SELECT id FROM stories WHERE user_id = :1 AND image_url = :2
       ORDER BY id DESC FETCH FIRST 1 ROWS ONLY`,
      [req.userId, imageUrl]
    );
    const storyId = storyRes.rows[0]?.id;

    // 사람 태그 처리
    const mentionedUsers = req.body.mentionedUsers ? JSON.parse(req.body.mentionedUsers) : [];
    const io = req.app.get('io');
    for (const uid of mentionedUsers) {
      await db.query(
        `INSERT INTO story_tags (story_id, user_id) VALUES (:1, :2)`,
        [storyId, uid]
      ).catch(() => {});
      await db.query(
        `INSERT INTO notifications (user_id, sender_id, type) VALUES (:1, :2, 'story_tag')`,
        [uid, req.userId]
      ).catch(() => {});
      const senderRes = await db.query(
        `SELECT username, profile_image FROM users WHERE id = :1`, [req.userId]
      );
      if (io) io.to(`user_${uid}`).emit('notification:new', {
        type: 'story_tag',
        sender_id: req.userId,
        username: senderRes.rows[0]?.username,
        profile_image: senderRes.rows[0]?.profile_image,
        created_at: new Date().toISOString(),
      });
    }

    res.status(201).json({ message: '스토리가 업로드되었습니다.' });
  } catch (err) { next(err); }
});

// 스토리 삭제
router.delete('/:storyId', authMiddleware, async (req, res, next) => {
  try {
    const storyId = parseInt(req.params.storyId);
    const story = await db.query(`SELECT user_id FROM stories WHERE id = :1`, [storyId]);
    if (!story.rows[0]) return res.status(404).json({ message: '스토리를 찾을 수 없습니다.' });
    if (story.rows[0].user_id !== req.userId) return res.status(403).json({ message: '권한이 없습니다.' });
    await db.query(`DELETE FROM stories WHERE id = :1`, [storyId]);
    res.json({ message: '스토리가 삭제되었습니다.' });
  } catch (err) { next(err); }
});

// 스토리 좋아요 (❤️ 반응 전송)
router.post('/:storyId/like', authMiddleware, async (req, res, next) => {
  try {
    const storyId = parseInt(req.params.storyId);
    const storyRes = await db.query(
      `SELECT user_id FROM stories WHERE id = :1 AND expires_at > CURRENT_TIMESTAMP`,
      [storyId]
    );
    if (!storyRes.rows[0]) return res.status(404).json({ message: '스토리를 찾을 수 없습니다.' });
    const ownerId = storyRes.rows[0].user_id;
    if (ownerId === req.userId) return res.json({ ok: true });

    const senderRes = await db.query(
      `SELECT username, profile_image FROM users WHERE id = :1`, [req.userId]
    );

    // type 컬럼 제약이 있을 수 있으므로 실패해도 소켓 알림은 전송
    await db.query(
      `INSERT INTO notifications (user_id, sender_id, type) VALUES (:1, :2, 'story_like')`,
      [ownerId, req.userId]
    ).catch(() => {});

    const io = req.app.get('io');
    io.to(`user_${ownerId}`).emit('notification:new', {
      type: 'story_like',
      sender_id: req.userId,
      username: senderRes.rows[0]?.username,
      profile_image: senderRes.rows[0]?.profile_image,
      created_at: new Date().toISOString(),
    });
    res.json({ ok: true });
  } catch (err) { next(err); }
});

// 스토리 답장 (DM으로 전송)
router.post('/:storyId/reply', authMiddleware, async (req, res, next) => {
  try {
    const storyId = parseInt(req.params.storyId);
    const { message } = req.body;
    if (!message?.trim()) return res.status(400).json({ message: '메시지를 입력해주세요.' });

    const storyRes = await db.query(
      `SELECT s.user_id, s.image_url AS story_image, u.username FROM stories s
       JOIN users u ON u.id = s.user_id
       WHERE s.id = :1 AND s.expires_at > CURRENT_TIMESTAMP`,
      [storyId]
    );
    if (!storyRes.rows[0]) return res.status(404).json({ message: '스토리를 찾을 수 없습니다.' });
    const ownerId        = storyRes.rows[0].user_id;
    const ownerUsername  = storyRes.rows[0].username;
    const storyImageUrl  = storyRes.rows[0].story_image;
    if (ownerId === req.userId) return res.status(400).json({ message: '본인 스토리에 답장할 수 없습니다.' });

    // 기존 DM 방 찾기 (Oracle thin: 반복 플레이스홀더마다 개별 값 필요)
    let roomId;
    const roomRes = await db.query(
      `SELECT id FROM chat_rooms
       WHERE ((user1_id = :1 AND user2_id = :2) OR (user1_id = :3 AND user2_id = :4))
         AND (room_type IS NULL OR room_type = 'direct')
       FETCH FIRST 1 ROWS ONLY`,
      [req.userId, ownerId, ownerId, req.userId]
    );

    if (roomRes.rows[0]) {
      roomId = roomRes.rows[0].id;
    } else {
      await db.query(
        `INSERT INTO chat_rooms (user1_id, user2_id, room_type) VALUES (:1, :2, 'direct')`,
        [req.userId, ownerId]
      );
      const found = await db.query(
        `SELECT id FROM chat_rooms
         WHERE ((user1_id = :1 AND user2_id = :2) OR (user1_id = :3 AND user2_id = :4))
           AND room_type = 'direct'
         ORDER BY id DESC FETCH FIRST 1 ROWS ONLY`,
        [req.userId, ownerId, ownerId, req.userId]
      );
      roomId = found.rows[0]?.id;
    }
    if (!roomId) return res.status(500).json({ message: '채팅방 생성에 실패했습니다.' });

    // content에 JSON으로 답장 텍스트 + 스토리 주인 이름 저장
    const text = message.trim();
    const replyContent = JSON.stringify({ text, storyOwner: ownerUsername });
    await db.query(
      `INSERT INTO chat_messages (room_id, sender_id, content, image_url, message_type)
       VALUES (:1, :2, :3, :4, 'story_reply')`,
      [roomId, req.userId, replyContent, storyImageUrl]
    );
    await db.query(
      `UPDATE chat_rooms SET last_message = :1, last_message_at = CURRENT_TIMESTAMP WHERE id = :2`,
      ['📸 스토리에 답장했어요', roomId]
    );

    const msgData = (await db.query(
      `SELECT m.id, m.room_id, m.sender_id, m.content, m.image_url,
              m.message_type, m.created_at, u.username, u.profile_image
       FROM chat_messages m JOIN users u ON u.id = m.sender_id
       WHERE m.room_id = :1 AND m.sender_id = :2
       ORDER BY m.id DESC FETCH FIRST 1 ROWS ONLY`,
      [roomId, req.userId]
    )).rows[0];

    const io = req.app.get('io');
    if (msgData) {
      io.to(`room_${roomId}`).emit('chat:message', { ...msgData, unread_count: 0, is_read: false });
    }
    io.to(`user_${ownerId}`).emit('chat:room_update', {
      roomId: Number(roomId),
      lastMessage: '📸 스토리에 답장했어요',
      lastMessageAt: new Date().toISOString(),
    });

    // 소켓 알림 전송 (DB insert는 제약 에러 무시)
    const senderRes = await db.query(
      `SELECT username, profile_image FROM users WHERE id = :1`, [req.userId]
    );
    await db.query(
      `INSERT INTO notifications (user_id, sender_id, type) VALUES (:1, :2, 'story_reply')`,
      [ownerId, req.userId]
    ).catch(() => {});
    io.to(`user_${ownerId}`).emit('notification:new', {
      type: 'story_reply',
      sender_id: req.userId,
      username: senderRes.rows[0]?.username,
      profile_image: senderRes.rows[0]?.profile_image,
      created_at: new Date().toISOString(),
    });

    res.json({ ok: true, roomId });
  } catch (err) { next(err); }
});

module.exports = router;
