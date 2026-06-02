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

      await updateStylePref(req.userId, style, 5);

      // 사람 태그 처리
      const mentionedUsers = req.body.mentionedUsers ? JSON.parse(req.body.mentionedUsers) : [];
      const io = req.app.get('io');
      for (const uid of mentionedUsers) {
        await db.query(
          `INSERT INTO post_tags (post_id, user_id) VALUES (:1, :2)`,
          [postId, uid]
        ).catch(() => {}); // 중복 무시
        await db.query(
          `INSERT INTO notifications (user_id, sender_id, type, post_id) VALUES (:1, :2, 'tag', :3)`,
          [uid, req.userId, postId]
        ).catch(() => {});
        if (io) io.to(`user_${uid}`).emit('notification:new', { type: 'tag', sender_id: req.userId, post_id: postId });
      }

      res.status(201).json({ message: '게시물이 작성되었습니다.', postId });
    } catch (err) { next(err); }
  },

  getOne: async (req, res, next) => {
    try {
      const { id } = req.params;
      const result = await db.query(
        `SELECT p.id, p.user_id, p.title, p.content, p.style, p.tags,
                p.likes_count, p.comments_count, p.bookmarks_count, p.created_at,
                u.username, u.profile_image, p.repost_origin_id,
                ou.username AS origin_username, ou.profile_image AS origin_profile_image,
                (SELECT COUNT(*) FROM likes     WHERE post_id = p.id AND user_id = :1) AS is_liked,
                (SELECT COUNT(*) FROM bookmarks WHERE post_id = p.id AND user_id = :2) AS is_bookmarked
         FROM posts p JOIN users u ON u.id = p.user_id
         LEFT JOIN posts op ON op.id = p.repost_origin_id
         LEFT JOIN users ou ON ou.id = op.user_id
         WHERE p.id = :3 AND p.is_deleted = 0`,
        [req.userId, req.userId, id]
      );
      if (!result.rows[0]) return res.status(404).json({ message: '게시물을 찾을 수 없습니다.' });
      const images   = await db.query(`SELECT * FROM post_images WHERE post_id = :1 ORDER BY sort_order`, [id]);
      const items    = await db.query(`SELECT * FROM post_items  WHERE post_id = :1`, [id]);
      const tagsRes  = await db.query(
        `SELECT u.id, u.username, u.profile_image FROM post_tags pt
         JOIN users u ON u.id = pt.user_id WHERE pt.post_id = :1`, [id]
      );

      if (result.rows[0].user_id !== req.userId && result.rows[0].style) {
        updateStylePref(req.userId, result.rows[0].style, 2).catch(() => {});
      }

      res.json({ ...result.rows[0], images: images.rows, items: items.rows, tagged_users: tagsRes.rows });
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
                  p.likes_count, p.comments_count, p.repost_count, p.created_at, p.repost_origin_id,
                  u.username, u.profile_image,
                  (SELECT rank FROM (SELECT id, RANK() OVER (ORDER BY total_wins DESC) as rank FROM users WHERE total_wins > 0) WHERE id = u.id) as win_rank,
                  ou.username AS origin_username, ou.profile_image AS origin_profile_image,
                  (SELECT COUNT(*) FROM likes     WHERE post_id = p.id AND user_id = :1) AS is_liked,
                  (SELECT COUNT(*) FROM bookmarks WHERE post_id = p.id AND user_id = :2) AS is_bookmarked,
                  (SELECT image_url FROM post_images WHERE post_id = p.id AND sort_order = 0
                   FETCH FIRST 1 ROWS ONLY) AS thumbnail,
                  (SELECT LISTAGG(image_url, ',') WITHIN GROUP (ORDER BY sort_order)
                   FROM post_images WHERE post_id = p.id) AS image_urls,
                  (SELECT LISTAGG(u2.username, ',') WITHIN GROUP (ORDER BY pt.id)
                   FROM post_tags pt JOIN users u2 ON u2.id = pt.user_id
                   WHERE pt.post_id = p.id) AS tagged_usernames,
                  ROW_NUMBER() OVER (ORDER BY p.created_at DESC) AS rn
           FROM posts p 
           JOIN users u ON u.id = p.user_id
           LEFT JOIN posts op ON op.id = p.repost_origin_id
           LEFT JOIN users ou ON ou.id = op.user_id
           WHERE p.user_id IN (SELECT following_id FROM follows WHERE follower_id = :3)
           AND p.is_deleted = 0
         ) WHERE rn BETWEEN :4 AND :5`,
        [req.userId, req.userId, req.userId, offset + 1, offset + limit]
      );
      res.json(result.rows);
    } catch (err) { next(err); }
  },

  getExplore: async (req, res, next) => {
    try {
      const { style, bodyFilter } = req.query;
      const page   = parseInt(req.query.page)  || 1;
      const limit  = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;

      // 체형 필터: 현재 유저의 키/몸무게 ±5cm/±7kg 범위
      const extraParams = [];
      let bodyClause    = '';
      if (bodyFilter === 'true') {
        const uRes = await db.query(
          `SELECT height, weight FROM users WHERE id = :1`, [req.userId]
        );
        const h = uRes.rows[0]?.height;
        const w = uRes.rows[0]?.weight;
        if (h && w) {
          extraParams.push(h - 5, h + 5, w - 7, w + 7);
        }
      }

      // 동적 bind 인덱스 빌더
      let idx = 1;
      const styleClause = style ? ` AND p.style = :${idx++}` : '';
      if (extraParams.length > 0) {
        bodyClause = ` AND u.height BETWEEN :${idx++} AND :${idx++} AND u.weight BETWEEN :${idx++} AND :${idx++}`;
      }
      const allParams = [
        ...(style ? [style] : []),
        ...extraParams,
        offset + 1, offset + limit,
      ];

      const sql = `SELECT * FROM (
         SELECT p.id, p.user_id, p.title, p.content, p.style, p.tags,
                p.likes_count, p.comments_count, p.created_at, p.repost_origin_id,
                u.username, u.profile_image, u.height, u.weight,
                (SELECT rank FROM (SELECT id, RANK() OVER (ORDER BY total_wins DESC) as rank FROM users WHERE total_wins > 0) WHERE id = u.id) as win_rank,
                ou.username AS origin_username, ou.profile_image AS origin_profile_image,
                (SELECT image_url FROM post_images WHERE post_id = p.id AND sort_order = 0
                 FETCH FIRST 1 ROWS ONLY) AS thumbnail,
                (SELECT LISTAGG(image_url, ',') WITHIN GROUP (ORDER BY sort_order)
                 FROM post_images WHERE post_id = p.id) AS image_urls,
                ROW_NUMBER() OVER (ORDER BY p.created_at DESC) AS rn
         FROM posts p 
         JOIN users u ON u.id = p.user_id
         LEFT JOIN posts op ON op.id = p.repost_origin_id
         LEFT JOIN users ou ON ou.id = op.user_id
         WHERE p.is_deleted = 0${styleClause}${bodyClause}
       ) WHERE rn BETWEEN :${idx} AND :${idx + 1}`;

      const result = await db.query(sql, allParams);
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
                p.likes_count, p.comments_count, p.created_at, p.repost_origin_id,
                u.username, u.profile_image,
                (SELECT rank FROM (SELECT id, RANK() OVER (ORDER BY total_wins DESC) as rank FROM users WHERE total_wins > 0) WHERE id = u.id) as win_rank,
                ou.username AS origin_username, ou.profile_image AS origin_profile_image,
                (SELECT image_url FROM post_images WHERE post_id = p.id AND sort_order = 0
                 FETCH FIRST 1 ROWS ONLY) AS thumbnail,
                (SELECT LISTAGG(image_url, ',') WITHIN GROUP (ORDER BY sort_order)
                 FROM post_images WHERE post_id = p.id) AS image_urls
         FROM posts p 
         JOIN users u ON u.id = p.user_id
         LEFT JOIN posts op ON op.id = p.repost_origin_id
         LEFT JOIN users ou ON ou.id = op.user_id
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

  repost: async (req, res, next) => {
    try {
      const origId = parseInt(req.params.id);
      const orig   = await db.query(
        `SELECT id, user_id, content, style, tags FROM posts WHERE id = :1 AND is_deleted = 0`, [origId]
      );
      if (!orig.rows[0]) return res.status(404).json({ message: '게시물을 찾을 수 없습니다.' });
      if (orig.rows[0].user_id === req.userId) return res.status(400).json({ message: '본인 게시물은 리포스트할 수 없습니다.' });

      // 이미 리포스트했는지 확인
      const already = await db.query(
        `SELECT id FROM posts WHERE user_id = :1 AND repost_origin_id = :2 AND is_deleted = 0`,
        [req.userId, origId]
      ).catch(() => ({ rows: [] }));
      if (already.rows.length > 0) return res.status(409).json({ message: '이미 리포스트한 게시물입니다.' });

      // 리포스트 생성 (원본 콘텐츠 복사 + repost_origin_id 기록)
      const newPost = await db.query(
        `INSERT INTO posts (user_id, content, style, tags, repost_origin_id)
         VALUES (:1, :2, :3, :4, :5) RETURNING id INTO :6`,
        [req.userId, orig.rows[0].content, orig.rows[0].style, orig.rows[0].tags, origId,
          { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }]
      );
      const newPostId = newPost.outBinds;

      // 원본 이미지 복사 (참조)
      const imgs = await db.query(
        `SELECT image_url, sort_order FROM post_images WHERE post_id = :1 ORDER BY sort_order`, [origId]
      );
      for (const img of imgs.rows) {
        await db.query(
          `INSERT INTO post_images (post_id, image_url, sort_order) VALUES (:1, :2, :3)`,
          [newPostId, img.image_url, img.sort_order]
        );
      }

      // 원본 게시물 리포스트 카운트 증가
      await db.query(
        `UPDATE posts SET repost_count = NVL(repost_count, 0) + 1 WHERE id = :1`, [origId]
      ).catch(() => {});

      res.status(201).json({ message: '리포스트됐어요!', postId: newPostId });
    } catch (err) { next(err); }
  },

  // 스타일 배틀을 위한 랜덤 포스트 2개 가져오기
  getBattleMatch: async (req, res, next) => {
    try {
      // 이미지가 있는 포스트 중 같은 스타일인 2개를 랜덤하게 선택 (Oracle SAMPLE/DBMS_RANDOM 활용)
      // 여기서는 간단하게 전체에서 랜덤으로 2개를 가져옵니다.
      const result = await db.query(
        `SELECT * FROM (
           SELECT p.id, p.title, p.style, u.username,
                  (SELECT image_url FROM post_images WHERE post_id = p.id AND sort_order = 0 FETCH FIRST 1 ROWS ONLY) AS thumbnail
           FROM posts p
           JOIN users u ON u.id = p.user_id
           WHERE p.is_deleted = 0 AND p.user_id != :1
           AND EXISTS (SELECT 1 FROM post_images WHERE post_id = p.id)
           ORDER BY DBMS_RANDOM.VALUE
         ) WHERE ROWNUM <= 2`,
        [req.userId]
      );

      if (result.rows.length < 2) {
        return res.status(404).json({ message: '대결할 게시물이 충분하지 않습니다.' });
      }

      res.json(result.rows);
    } catch (err) { next(err); }
  },

  // 배틀 우승자 (상위 랭킹) 가져오기
  getBattleWinners: async (req, res, next) => {
    try {
      const result = await db.query(
        `SELECT p.id, p.win_count, u.username, u.profile_image,
                (SELECT image_url FROM post_images WHERE post_id = p.id AND sort_order = 0 FETCH FIRST 1 ROWS ONLY) AS thumbnail
         FROM posts p
         JOIN users u ON u.id = p.user_id
         WHERE p.win_count > 0 AND p.is_deleted = 0
         ORDER BY p.win_count DESC
         FETCH FIRST 5 ROWS ONLY`
      );

      res.json(result.rows);
    } catch (err) { next(err); }
  },

  // 투표 결과 반영
  votePost: async (req, res, next) => {
    try {
      const { id } = req.params; // 승리한 포스트 ID
      await db.query(
        `UPDATE posts SET win_count = win_count + 1 WHERE id = :1`,
        [id]
      );

      // 작성자의 누적 우승 횟수도 함께 업데이트
      await db.query(
        `UPDATE users SET total_wins = total_wins + 1 
         WHERE id = (SELECT user_id FROM posts WHERE id = :1)`,
        [id]
      );
      
      // 투표 보상으로 투표자의 스타일 선호도 미세하게 상승 (+1)
      const post = await db.query(`SELECT style FROM posts WHERE id = :1`, [id]);
      if (post.rows[0]?.style) {
        const { updateStylePref } = require('../utils/recommendUtil');
        await updateStylePref(req.userId, post.rows[0].style, 1);
      }

      res.json({ message: '투표가 완료되었습니다.' });
    } catch (err) { next(err); }
  },
};

module.exports = PostController;