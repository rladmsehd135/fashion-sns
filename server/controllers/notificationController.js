const db = require('../config/db');

const NotificationController = {

  getAll: async (req, res, next) => {
    try {
      const result = await db.query(
        `SELECT n.id, n.type, n.is_read, n.created_at, n.post_id, n.comment_id,
                u.username AS sender_username, u.profile_image AS sender_image
         FROM notifications n
         JOIN users u ON u.id = n.sender_id
         WHERE n.user_id = :1
         ORDER BY n.created_at DESC
         FETCH FIRST 50 ROWS ONLY`,
        [req.userId]
      );
      res.json(result.rows);
    } catch (err) {
      next(err);
    }
  },

  readAll: async (req, res, next) => {
    try {
      await db.query(
        `UPDATE notifications SET is_read = 1 WHERE user_id = :1`,
        [req.userId]
      );
      res.json({ message: '모두 읽음 처리되었습니다.' });
    } catch (err) {
      next(err);
    }
  },

  readOne: async (req, res, next) => {
    try {
      await db.query(
        `UPDATE notifications SET is_read = 1 WHERE id = :1 AND user_id = :2`,
        [req.params.id, req.userId]
      );
      res.json({ message: '읽음 처리되었습니다.' });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = NotificationController;