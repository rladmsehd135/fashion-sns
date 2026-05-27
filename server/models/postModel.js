const db       = require('../config/db');
const oracledb = require('oracledb');

const PostModel = {

  create: async ({ user_id, title, content, style, tags }) => {
    const result = await db.query(
      `INSERT INTO posts (user_id, title, content, style, tags)
       VALUES (:1, :2, :3, :4, :5)
       RETURNING id INTO :6`,
      [user_id, title, content, style, JSON.stringify(tags),
        { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }]
    );
    return result.outBinds[0];
  },

  addImages: async (postId, images) => {
    for (let i = 0; i < images.length; i++) {
      await db.query(
        `INSERT INTO post_images (post_id, image_url, sort_order) VALUES (:1, :2, :3)`,
        [postId, images[i], i]
      );
    }
  },

  addItems: async (postId, items) => {
    for (const item of items) {
      await db.query(
        `INSERT INTO post_items
          (post_id, brand_name, item_name, category, purchase_url,
           price, currency, size_purchased, fit_review, rating, review_text)
         VALUES (:1,:2,:3,:4,:5,:6,:7,:8,:9,:10,:11)`,
        [postId, item.brand_name, item.item_name, item.category,
         item.purchase_url, item.price, item.currency || 'KRW',
         item.size_purchased, item.fit_review, item.rating, item.review_text]
      );
    }
  },

  findById: async (postId, myId) => {
    const result = await db.query(
      `SELECT p.id, p.user_id, p.title, p.content, p.style, p.tags,
              p.likes_count, p.comments_count, p.created_at,
              u.username, u.profile_image,
              (SELECT COUNT(*) FROM likes WHERE post_id = p.id AND user_id = :1) AS is_liked
       FROM posts p
       JOIN users u ON u.id = p.user_id
       WHERE p.id = :2 AND p.is_deleted = 0`,
      [myId, postId]
    );
    return result.rows[0];
  },

  getImages: async (postId) => {
    const result = await db.query(
      `SELECT * FROM post_images WHERE post_id = :1 ORDER BY sort_order ASC`,
      [postId]
    );
    return result.rows;
  },

  getItems: async (postId) => {
    const result = await db.query(
      `SELECT * FROM post_items WHERE post_id = :1`,
      [postId]
    );
    return result.rows;
  },

  getFeed: async (userId, page = 1, limit = 10) => {
    const offset = (page - 1) * limit;
    const result = await db.query(
      `SELECT * FROM (
         SELECT p.id, p.user_id, p.title, p.content, p.style, p.tags,
                p.likes_count, p.comments_count, p.created_at,
                u.username, u.profile_image,
                (SELECT COUNT(*) FROM likes WHERE post_id = p.id AND user_id = :1) AS is_liked,
                ROW_NUMBER() OVER (ORDER BY p.created_at DESC) AS rn
         FROM posts p
         JOIN users u ON u.id = p.user_id
         WHERE p.user_id IN (SELECT following_id FROM follows WHERE follower_id = :2)
         AND p.is_deleted = 0
       ) WHERE rn BETWEEN :3 AND :4`,
      [userId, userId, offset + 1, offset + limit]
    );
    return result.rows;
  },

  getExplore: async (style, page = 1, limit = 10) => {
    const offset = (page - 1) * limit;
    const params = style
      ? [style, offset + 1, offset + limit]
      : [offset + 1, offset + limit];

    const sql = style
      ? `SELECT * FROM (
           SELECT p.id, p.user_id, p.title, p.content, p.style, p.tags,
                  p.likes_count, p.comments_count, p.created_at,
                  u.username, u.profile_image,
                  ROW_NUMBER() OVER (ORDER BY p.created_at DESC) AS rn
           FROM posts p
           JOIN users u ON u.id = p.user_id
           WHERE p.style = :1 AND p.is_deleted = 0
         ) WHERE rn BETWEEN :2 AND :3`
      : `SELECT * FROM (
           SELECT p.id, p.user_id, p.title, p.content, p.style, p.tags,
                  p.likes_count, p.comments_count, p.created_at,
                  u.username, u.profile_image,
                  ROW_NUMBER() OVER (ORDER BY p.created_at DESC) AS rn
           FROM posts p
           JOIN users u ON u.id = p.user_id
           WHERE p.is_deleted = 0
         ) WHERE rn BETWEEN :1 AND :2`;

    const result = await db.query(sql, params);
    return result.rows;
  },

  getByUser: async (userId) => {
    const result = await db.query(
      `SELECT p.id, p.user_id, p.title, p.content, p.style, p.tags,
              p.likes_count, p.comments_count, p.created_at,
              u.username, u.profile_image
       FROM posts p
       JOIN users u ON u.id = p.user_id
       WHERE p.user_id = :1 AND p.is_deleted = 0
       ORDER BY p.created_at DESC`,
      [userId]
    );
    return result.rows;
  },

  update: async (postId, { title, content, style, tags }) => {
    await db.query(
      `UPDATE posts SET title = :1, content = :2, style = :3, tags = :4 WHERE id = :5`,
      [title, content, style, JSON.stringify(tags), postId]
    );
  },

  delete: async (postId) => {
    await db.query(
      `UPDATE posts SET is_deleted = 1 WHERE id = :1`,
      [postId]
    );
  },

  toggleLike: async (userId, postId) => {
    const existing = await db.query(
      `SELECT id FROM likes WHERE user_id = :1 AND post_id = :2`,
      [userId, postId]
    );
    if (existing.rows.length > 0) {
      await db.query(`DELETE FROM likes WHERE user_id = :1 AND post_id = :2`, [userId, postId]);
      await db.query(`UPDATE posts SET likes_count = likes_count - 1 WHERE id = :1`, [postId]);
      return { liked: false };
    } else {
      await db.query(`INSERT INTO likes (user_id, post_id) VALUES (:1, :2)`, [userId, postId]);
      await db.query(`UPDATE posts SET likes_count = likes_count + 1 WHERE id = :1`, [postId]);
      return { liked: true };
    }
  },
};

module.exports = PostModel;