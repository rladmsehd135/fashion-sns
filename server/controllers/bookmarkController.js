const db = require('../config/db');

const BookmarkController = {

  toggle: async (req, res, next) => {
    try {
      const postId = parseInt(req.params.postId);
      const existing = await db.query(
        `SELECT id FROM bookmarks WHERE user_id = :1 AND post_id = :2`,
        [req.userId, postId]
      );
      if (existing.rows.length > 0) {
        await db.query(`DELETE FROM bookmarks WHERE user_id = :1 AND post_id = :2`, [req.userId, postId]);
        await db.query(`UPDATE posts SET bookmarks_count = bookmarks_count - 1 WHERE id = :1`, [postId]);
        return res.json({ bookmarked: false });
      }
      await db.query(`INSERT INTO bookmarks (user_id, post_id) VALUES (:1, :2)`, [req.userId, postId]);
      await db.query(`UPDATE posts SET bookmarks_count = bookmarks_count + 1 WHERE id = :1`, [postId]);
      res.json({ bookmarked: true });
    } catch (err) {
      next(err);
    }
  },

  getMyBookmarks: async (req, res, next) => {
    try {
      const result = await db.query(
        `SELECT p.id, p.title, p.content, p.style, p.likes_count, p.created_at,
                u.username, u.profile_image,
                (SELECT image_url FROM post_images WHERE post_id = p.id AND sort_order = 0
                 FETCH FIRST 1 ROWS ONLY) AS thumbnail
         FROM bookmarks b
         JOIN posts p ON p.id = b.post_id
         JOIN users u ON u.id = p.user_id
         WHERE b.user_id = :1 AND p.is_deleted = 0
         ORDER BY b.created_at DESC`,
        [req.userId]
      );
      res.json(result.rows);
    } catch (err) {
      next(err);
    }
  },
};

module.exports = BookmarkController;