const db = require('../config/db');
const oracledb = require('oracledb');

const CommentController = {

  create: async (req, res, next) => {
    try {
      const { content, parent_id } = req.body;
      if (!content?.trim()) {
        return res.status(400).json({ message: '댓글 내용을 입력해주세요.' });
      }
      const result = await db.query(
        `INSERT INTO comments (post_id, user_id, parent_id, content)
       VALUES (:1, :2, :3, :4) RETURNING id INTO :5`,
        [req.params.id, req.userId, parent_id || null, content.trim(),
        { dir: require('oracledb').BIND_OUT, type: require('oracledb').NUMBER }]
      );
      await db.query(
        `UPDATE posts SET comments_count = comments_count + 1 WHERE id = :1`,
        [req.params.id]
      );

      const commentId = result.outBinds;
      const newComment = await db.query(
        `SELECT c.id, c.post_id, c.user_id, c.parent_id, c.content, c.created_at,
              u.username, u.profile_image
       FROM comments c JOIN users u ON u.id = c.user_id
       WHERE c.id = :1`,
        [commentId]
      );

      // 알림 발송
      const sender = newComment.rows[0];
      const io = req.app.get('io');
      const notifPayload = {
        type: 'comment',
        username: sender?.username,
        profile_image: sender?.profile_image,
      };

      if (parent_id) {
        // 대댓글: 부모 댓글 작성자에게 알림
        const parentRes = await db.query(
          `SELECT user_id FROM comments WHERE id = :1`, [parent_id]
        );
        const parentAuthorId = parentRes.rows[0]?.user_id;
        if (parentAuthorId && parentAuthorId !== req.userId) {
          await db.query(
            `INSERT INTO notifications (user_id, sender_id, type, post_id) VALUES (:1, :2, 'comment', :3)`,
            [parentAuthorId, req.userId, req.params.id]
          );
          io.to(`user_${parentAuthorId}`).emit('notification:new', notifPayload);
        }
      } else {
        // 댓글: 게시물 작성자에게 알림
        const postRes = await db.query(
          `SELECT user_id FROM posts WHERE id = :1`, [req.params.id]
        );
        const postOwnerId = postRes.rows[0]?.user_id;
        if (postOwnerId && postOwnerId !== req.userId) {
          await db.query(
            `INSERT INTO notifications (user_id, sender_id, type, post_id) VALUES (:1, :2, 'comment', :3)`,
            [postOwnerId, req.userId, req.params.id]
          );
          io.to(`user_${postOwnerId}`).emit('notification:new', notifPayload);
        }
      }

      res.status(201).json(newComment.rows[0] || { id: commentId, content, created_at: new Date() });
    } catch (err) { next(err); }
  },
  getComments: async (req, res, next) => {
    try {
      const result = await db.query(
        `SELECT c.id, c.post_id, c.user_id, c.parent_id, c.content,
              c.is_deleted, c.created_at,
              u.username, u.profile_image
       FROM comments c JOIN users u ON u.id = c.user_id
       WHERE c.post_id = :1 AND c.is_deleted = 0
       ORDER BY c.created_at ASC`,
        [req.params.id]
      );
      res.json(result.rows);
    } catch (err) { next(err); }
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
      const { id } = req.params;
      const { content } = req.body;
      const comment = await db.query(`SELECT * FROM comments WHERE id = :1`, [id]);
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