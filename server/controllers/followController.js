const db = require('../config/db');

const FollowController = {
  toggle: async (req, res, next) => {
    try {
      const followingId = parseInt(req.params.userId);
      if (followingId === req.userId) {
        return res.status(400).json({ message: '자기 자신을 팔로우할 수 없습니다.' });
      }
      const existing = await db.query(
        `SELECT * FROM follows WHERE follower_id = :1 AND following_id = :2`,
        [req.userId, followingId]
      );
      if (existing.rows.length > 0) {
        await db.query(
          `DELETE FROM follows WHERE follower_id = :1 AND following_id = :2`,
          [req.userId, followingId]
        );
        return res.json({ following: false });
      }
      await db.query(
        `INSERT INTO follows (follower_id, following_id) VALUES (:1, :2)`,
        [req.userId, followingId]
      );
      // 알림 생성
      await db.query(
        `INSERT INTO notifications (user_id, sender_id, type) VALUES (:1, :2, 'follow')`,
        [followingId, req.userId]
      );
      const io = req.app.get('io');
      io.to(`user_${followingId}`).emit('notification:new', { type: 'follow', senderId: req.userId });
      res.json({ following: true });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = FollowController;