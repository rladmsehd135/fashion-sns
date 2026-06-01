const db = require('../config/db');
const oracledb = require('oracledb');
const { updateStylePref, getRecommendedFeed } = require('../utils/recommendUtil');

const PostController = {

  create: async (req, res, next) => {
    try {
      const { title, content, style, tags, items } = req.body;
      if (!content || !style) return res.status(400).json({ message: '내용과 스타일은 필수입니다.' });

      const parsedTags  = tags  ? JSON.parse(tags)  : [];
      const parsedItems = items ? JSON.parse(items) : [];

      const result = await db.query(
        `INSERT INTO posts (user_id, title, content, style, tags)
         VALUES (:1, :2, :3, :4, :5) RETURNING id INTO :6`,
        [
          req.userId, title || null, content, style,
          JSON.stringify(parsedTags),
          { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
        ]
      );
      const postId = result.outBinds;

      if (req.files && req.files.length > 0) {
        for (let i = 0; i < req.files.length; i++) {
          await db.query(
            `INSERT INTO post_images (post_id, image_url, sort_order) VALUES (:1, :2, :3)`,
            [postId, `/uploads/${req.files[i].filename}`, i]
          );
        }
      }

      if (parsedItems.length > 0) {
        for (const item of parsedItems) {
          await db.query(
            `INSERT INTO post_items
             (post_id, brand_name, item_name, category, purchase_url,
              price, currency, size_purchased, fit_review, rating, review_text)
             VALUES (:1, :2, :3, :4, :5, :6, :7, :8, :9, :10, :11)`,
            [
              postId,
              item.brand_name    || null,
              item.item_name,
              item.category,
              item.purchase_url  || null,
              item.price         || null,
              item.currency      || 'KRW',
              item.size_purchased || null,
              item.fit_review    || null,
              item.rating        || null,
              item.review_text   || null,
            ]
          );
        }
      }

      // 본인이 작성한 스타일은 선호도의 핵심 지표이므로 가중치를 +5로 높임
      await updateStylePref(req.userId, style, 5);
      res.status(201).json({ message: '게시물이 작성되었습니다.', postId });
    } catch (err) { next(err); }
  },

  getOne: async (req, res, next) => {
    try {
      const { id } = req.params;
      const result = await db.query(
        `SELECT p.id, p.user_id, p.title, p.content, p.style, p.tags,
                p.likes_count, p.comments_count, p.bookmarks_count, p.created_at,
                u.username, u.profile_image,
                (SELECT COUNT(*) FROM likes     WHERE post_id = p.id AND user_id = :1) AS is_liked,
                (SELECT COUNT(*) FROM bookmarks WHERE post_id = p.id AND user_id = :2) AS is_bookmarked
         FROM posts p JOIN users u ON u.id = p.user_id
         WHERE p.id = :3 AND p.is_deleted = 0`,
        [req.userId, req.userId, id]
      );
      if (!result.rows[0]) return res.status(404).json({ message: '게시물을 찾을 수 없습니다.' });
      const images = await db.query(`SELECT * FROM post_images WHERE post_id = :1 ORDER BY sort_order`, [id]);
      const items  = await db.query(`SELECT * FROM post_items  WHERE post_id = :1`, [id]);

      // 본인 게시물이 아닐 때만 뷰 추적 (스타일 선호도 +1)
      if (result.rows[0].user_id !== req.userId && result.rows[0].style) {
        // 단순 조회 시에도 가중치를 +2로 높여 선호도를 더 민감하게 반영
        updateStylePref(req.userId, result.rows[0].style, 2).catch(() => {});
      }

      res.json({ ...result.rows[0], images: images.rows, items: items.rows });
    } catch (err) { next(err); }
  },

  getFeed: async (req, res, next) => {
    try {
      const page   = parseInt(req.query.page)  || 1;
      const limit  = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;
      const result = await db.query(
        `SELECT * FROM (
           SELECT p.id, p.user_id, p.title, p.content, p.style, p.tags,
                  p.likes_count, p.comments_count, p.created_at,
                  u.username, u.profile_image,
                  (SELECT COUNT(*) FROM likes WHERE post_id = p.id AND user_id = :1) AS is_liked,
                  (SELECT image_url FROM post_images WHERE post_id = p.id AND sort_order = 0
                   FETCH FIRST 1 ROWS ONLY) AS thumbnail,
                  (SELECT LISTAGG(image_url, ',') WITHIN GROUP (ORDER BY sort_order)
                   FROM post_images WHERE post_id = p.id) AS image_urls,
                  ROW_NUMBER() OVER (ORDER BY p.created_at DESC) AS rn
           FROM posts p JOIN users u ON u.id = p.user_id
           WHERE p.user_id IN (SELECT following_id FROM follows WHERE follower_id = :2)
           AND p.is_deleted = 0
         ) WHERE rn BETWEEN :3 AND :4`,
        [req.userId, req.userId, offset + 1, offset + limit]
      );
      res.json(result.rows);
    } catch (err) { next(err); }
  },

  getExplore: async (req, res, next) => {
    try {
      const { style } = req.query;
      const page   = parseInt(req.query.page)  || 1;
      const limit  = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;

      const params = style
        ? [style, offset + 1, offset + limit]
        : [offset + 1, offset + limit];

      const sql = style
        ? `SELECT * FROM (
             SELECT p.id, p.user_id, p.title, p.content, p.style, p.tags,
                    p.likes_count, p.comments_count, p.created_at,
                    u.username, u.profile_image,
                    (SELECT image_url FROM post_images WHERE post_id = p.id AND sort_order = 0
                     FETCH FIRST 1 ROWS ONLY) AS thumbnail,
                    (SELECT LISTAGG(image_url, ',') WITHIN GROUP (ORDER BY sort_order)
                     FROM post_images WHERE post_id = p.id) AS image_urls,
                    ROW_NUMBER() OVER (ORDER BY p.created_at DESC) AS rn
             FROM posts p JOIN users u ON u.id = p.user_id
             WHERE p.style = :1 AND p.is_deleted = 0
           ) WHERE rn BETWEEN :2 AND :3`
        : `SELECT * FROM (
             SELECT p.id, p.user_id, p.title, p.content, p.style, p.tags,
                    p.likes_count, p.comments_count, p.created_at,
                    u.username, u.profile_image,
                    (SELECT image_url FROM post_images WHERE post_id = p.id AND sort_order = 0
                     FETCH FIRST 1 ROWS ONLY) AS thumbnail,
                    (SELECT LISTAGG(image_url, ',') WITHIN GROUP (ORDER BY sort_order)
                     FROM post_images WHERE post_id = p.id) AS image_urls,
                    ROW_NUMBER() OVER (ORDER BY p.created_at DESC) AS rn
             FROM posts p JOIN users u ON u.id = p.user_id
             WHERE p.is_deleted = 0
           ) WHERE rn BETWEEN :1 AND :2`;

      const result = await db.query(sql, params);
      res.json(result.rows);
    } catch (err) { next(err); }
  },

  getRecommended: async (req, res, next) => {
    try {
      const page  = parseInt(req.query.page)  || 1;
      const limit = parseInt(req.query.limit) || 10;
      const posts = await getRecommendedFeed(req.userId, page, limit);
      res.json(posts);
    } catch (err) { next(err); }
  },

  getByUser: async (req, res, next) => {
    try {
      const result = await db.query(
        `SELECT p.id, p.user_id, p.title, p.content, p.style, p.tags,
                p.likes_count, p.comments_count, p.created_at,
                u.username, u.profile_image,
                (SELECT image_url FROM post_images WHERE post_id = p.id AND sort_order = 0
                 FETCH FIRST 1 ROWS ONLY) AS thumbnail,
                (SELECT LISTAGG(image_url, ',') WITHIN GROUP (ORDER BY sort_order)
                 FROM post_images WHERE post_id = p.id) AS image_urls
         FROM posts p JOIN users u ON u.id = p.user_id
         WHERE p.user_id = :1 AND p.is_deleted = 0
         ORDER BY p.created_at DESC`,
        [req.params.id]
      );
      res.json(result.rows);
    } catch (err) { next(err); }
  },

  update: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { title, content, style, tags, items, deletedImageIds } = req.body;
      const post = await db.query(`SELECT * FROM posts WHERE id = :1`, [id]);
      if (!post.rows[0]) return res.status(404).json({ message: '게시물을 찾을 수 없습니다.' });
      if (Number(post.rows[0].user_id) !== Number(req.userId)) return res.status(403).json({ message: '권한이 없습니다.' });

      const parsedTags = tags ? JSON.parse(tags) : [];
      const parsedItems = items ? JSON.parse(items) : [];
      const parsedDeletedImageIds = deletedImageIds ? JSON.parse(deletedImageIds) : [];

      // 1. 게시물 기본 정보 업데이트
      await db.query(
        `UPDATE posts SET title = :1, content = :2, style = :3, tags = :4 WHERE id = :5`,
        [title, content, style, JSON.stringify(parsedTags), id]
      );

      // 2. 이미지 처리
      // 기존 이미지 삭제
      if (parsedDeletedImageIds.length > 0) {
        await db.query(
          `DELETE FROM post_images WHERE id IN (${parsedDeletedImageIds.map((_, i) => `:${i + 1}`).join(',')}) AND post_id = :${parsedDeletedImageIds.length + 1}`,
          [...parsedDeletedImageIds, id]
        );
      }
      // 새 이미지 추가
      if (req.files && req.files.length > 0) {
        const maxRes = await db.query(`SELECT NVL(MAX(sort_order), -1) AS max_order FROM post_images WHERE post_id = :1`, [id]);
        let nextOrder = maxRes.rows[0].max_order + 1;

        for (const file of req.files) {
          await db.query(
            `INSERT INTO post_images (post_id, image_url, sort_order) VALUES (:1, :2, :3)`,
            [id, `/uploads/${file.filename}`, nextOrder++]
          );
        }
      }

      // 3. 아이템 처리 (기존 아이템 모두 삭제 후 새로 추가)
      await db.query(`DELETE FROM post_items WHERE post_id = :1`, [id]);
      if (parsedItems.length > 0) {
        for (const item of parsedItems) {
          await db.query(
            `INSERT INTO post_items (post_id, brand_name, item_name, category, purchase_url, price, currency, size_purchased, fit_review, rating, review_text)
             VALUES (:1, :2, :3, :4, :5, :6, :7, :8, :9, :10, :11)`,
            [id, item.brand_name || null, item.item_name, item.category, item.purchase_url || null,
             item.price || null, item.currency || 'KRW', item.size_purchased || null,
             item.fit_review || null, item.rating || null, item.review_text || null]
          );
        }
      }
      res.json({ message: '게시물이 수정되었습니다.' });
    } catch (err) { next(err); }
  },

  delete: async (req, res, next) => {
    try {
      const { id } = req.params;
      const post = await db.query(`SELECT * FROM posts WHERE id = :1`, [id]);
      if (!post.rows[0]) return res.status(404).json({ message: '게시물을 찾을 수 없습니다.' });
      if (post.rows[0].user_id !== req.userId) return res.status(403).json({ message: '권한이 없습니다.' });
      await db.query(`UPDATE posts SET is_deleted = 1 WHERE id = :1`, [id]);
      res.json({ message: '게시물이 삭제되었습니다.' });
    } catch (err) { next(err); }
  },

  toggleLike: async (req, res, next) => {
    try {
      const postId = parseInt(req.params.id);
      const existing = await db.query(
        `SELECT id FROM likes WHERE user_id = :1 AND post_id = :2`,
        [req.userId, postId]
      );
      if (existing.rows.length > 0) {
        await db.query(`DELETE FROM likes WHERE user_id = :1 AND post_id = :2`, [req.userId, postId]);
        await db.query(`UPDATE posts SET likes_count = likes_count - 1 WHERE id = :1`, [postId]);
        return res.json({ liked: false });
      }
      await db.query(`INSERT INTO likes (user_id, post_id) VALUES (:1, :2)`, [req.userId, postId]);
      await db.query(`UPDATE posts SET likes_count = likes_count + 1 WHERE id = :1`, [postId]);
      const post = await db.query(`SELECT user_id, style FROM posts WHERE id = :1`, [postId]);
      if (post.rows[0]) {
        if (post.rows[0].user_id !== req.userId) {
          await db.query(
            `INSERT INTO notifications (user_id, sender_id, type, post_id) VALUES (:1, :2, 'like', :3)`,
            [post.rows[0].user_id, req.userId, postId]
          );
          const io = req.app.get('io');
          io.to(`user_${post.rows[0].user_id}`).emit('notification:new', { type:'like' });
        }
        // 좋아요는 매우 강력한 선호 표기이므로 가중치를 +10으로 상향
        await updateStylePref(req.userId, post.rows[0].style, 10);
      }
      res.json({ liked: true });
    } catch (err) { next(err); }
  },
};

module.exports = PostController;