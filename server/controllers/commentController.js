const db       = require('../config/db');
const oracledb = require('oracledb');

const CommentController = {

  create: async (req, res, next) => {
    try {
      const { id: postId }      = req.params;
      const { content, parent_id } = req.body;
      if (!content) return res.status(400).json({ message: '내용을 입력해주세요.' });
      const result = await db.query(
        `INSERT INTO comments (post_id, user_id, content, parent_id)
         VALUES (:1, :2, :3, :4) RETURNING id INTO :5`,
        [postId, req.userId, content, parent_id || null,
          { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }]
      );
      await db.query(`UPDATE posts SET comments_count = comments_count + 1 WHERE id = :1`, [postId]);
      // 알림
      const post = await db.query(`SELECT user_id FROM posts WHERE id = :1`, [postId]);
      if (post.rows[0] && post.rows[0].user_id !== req.userId) {
        await db.query(
          `INSERT INTO notifications (user_id, sender_id, type, post_id, comment_id)
           VALUES (:1, :2, 'comment', :3, :4)`,
          [post.rows[0].user_id, req.userId, postId, result.outBinds[0]]
        );
        const io = req.app.get('io');
        io.to(`user_${post.rows[0].user_id}`).emit('notification:new', { type: 'comment' });
      }
      res.status(201).json({ message: '댓글이 작성되었습니다.', commentId: result.outBinds[0] });
    } catch (err) {
      next(err);
    }
  },

  getByPost: async (req, res, next) => {
    try {
      const result = await db.query(
        `SELECT c.id, c.post_id, c.user_id, c.content, c.parent_id, c.created_at,
                u.username, u.profile_image
         FROM comments c JOIN users u ON u.id = c.user_id
         WHERE c.post_id = :1 AND c.is_deleted = 0
         ORDER BY c.created_at ASC`,
        [req.params.id]
      );
      res.json(result.rows);
    } catch (err) {
      next(err);
    }
  },

  update: async (req, res, next) => {
    try {
      const { id }      = req.params;
      const { content } = req.body;
      const comment     = await db.query(`SELECT * FROM comments WHERE id = :1`, [id]);
      if (!comment.rows[0]) return res.status(404).json({ message: '댓글을 찾을 수 없습니다.' });
      if (comment.rows[0].user_id !== req.userId) return res.status(403).json({ message: '권한이 없습니다.' });
      await db.query(`UPDATE comments SET content = :1 WHERE id = :2`, [content, id]);
      res.json({ message: '댓글이 수정되었습니다.' });
    } catch (err) {
      next(err);
    }
  },

  delete: async (req, res, next) => {
    try {
      const { id } = req.params;
      const comment = await db.query(`SELECT * FROM comments WHERE id = :1`, [id]);
      if (!comment.rows[0]) return res.status(404).json({ message: '댓글을 찾을 수 없습니다.' });
      if (comment.rows[0].user_id !== req.userId) return res.status(403).json({ message: '권한이 없습니다.' });
      await db.query(`UPDATE comments SET is_deleted = 1 WHERE id = :1`, [id]);
      await db.query(`UPDATE posts SET comments_count = comments_count - 1 WHERE id = :1`, [comment.rows[0].post_id]);
      res.json({ message: '댓글이 삭제되었습니다.' });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = CommentController;