const db       = require('../config/db');
const oracledb = require('oracledb');

const CommentModel = {

  create: async (postId, userId, content) => {
    const result = await db.query(
      `INSERT INTO comments (post_id, user_id, content)
       VALUES (:1, :2, :3) RETURNING id INTO :4`,
      [postId, userId, content,
        { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }]
    );
    await db.query(
      `UPDATE posts SET comments_count = comments_count + 1 WHERE id = :1`,
      [postId]
    );
    return result.outBinds[0];
  },

  getByPost: async (postId) => {
    const result = await db.query(
      `SELECT c.id, c.post_id, c.user_id, c.content, c.created_at,
              u.username, u.profile_image
       FROM comments c
       JOIN users u ON u.id = c.user_id
       WHERE c.post_id = :1 AND c.is_deleted = 0
       ORDER BY c.created_at ASC`,
      [postId]
    );
    return result.rows;
  },

  update: async (commentId, content) => {
    await db.query(
      `UPDATE comments SET content = :1 WHERE id = :2`,
      [content, commentId]
    );
  },

  delete: async (commentId, postId) => {
    await db.query(`UPDATE comments SET is_deleted = 1 WHERE id = :1`, [commentId]);
    await db.query(`UPDATE posts SET comments_count = comments_count - 1 WHERE id = :1`, [postId]);
  },

  findById: async (commentId) => {
    const result = await db.query(
      `SELECT * FROM comments WHERE id = :1`,
      [commentId]
    );
    return result.rows[0];
  },
};

module.exports = CommentModel;