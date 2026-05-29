const db = require('../config/db');
const oracledb = require('oracledb');

const FollowController = {
  toggle: async (req, res, next) => {
    try {
      const followingId = parseInt(req.params.userId);
      const followerId  = req.userId;

      if (followerId === followingId) {
        return res.status(400).json({ message: '자기 자신을 팔로우할 수 없어요.' });
      }

      const existing = await db.query(
        `SELECT * FROM follows WHERE follower_id = :1 AND following_id = :2`,
        [followerId, followingId]
      );

      if (existing.rows.length > 0) {
        // 언팔로우
        await db.query(
          `DELETE FROM follows WHERE follower_id = :1 AND following_id = :2`,
          [followerId, followingId]
        );
        return res.json({ following: false, message: '팔로우를 취소했어요.' });
      }

      // 팔로우
      await db.query(
        `INSERT INTO follows (follower_id, following_id) VALUES (:1, :2)`,
        [followerId, followingId]
      );

      // 알림 생성
      await db.query(
        `INSERT INTO notifications (user_id, sender_id, type)
         VALUES (:1, :2, 'follow')`,
        [followingId, followerId]
      );

      // 소켓 알림 전송
      const io = req.app.get('io');
      if (io) {
        // 팔로우 당한 유저에게 알림
        const sender = await db.query(
          `SELECT username, profile_image FROM users WHERE id = :1`,
          [followerId]
        );
        io.to(`user_${followingId}`).emit('notification:new', {
          type:          'follow',
          sender_id:     followerId,
          username:      sender.rows[0]?.username,
          profile_image: sender.rows[0]?.profile_image,
          message:       `${sender.rows[0]?.username}님이 회원님을 팔로우하기 시작했어요.`,
        });
      }

      res.json({ following: true, message: '팔로우했어요.' });
    } catch (err) { next(err); }
  },
};

module.exports = FollowController;