const db = require('../config/db');

const dateFilter = (period) => {
  if (period === 'week')  return `AND p.created_at >= SYSDATE - 7`;
  if (period === 'month') return `AND p.created_at >= ADD_MONTHS(SYSDATE, -1)`;
  return '';
};

// 브랜드별 썸네일 조회 (상위 3장)
const getBrandThumbs = async (brandName) => {
  const res = await db.query(
    `SELECT DISTINCT img.image_url FROM (
       SELECT DISTINCT p2.id, p2.likes_count
       FROM post_items pit2 JOIN posts p2 ON p2.id = pit2.post_id AND p2.is_deleted = 0
       WHERE pit2.brand_name = :1
       ORDER BY p2.likes_count DESC
       FETCH FIRST 5 ROWS ONLY
     ) p2
     JOIN post_images img ON img.post_id = p2.id AND img.sort_order = 0
     FETCH FIRST 3 ROWS ONLY`,
    [brandName]
  );
  return res.rows.map(r => r.image_url);
};

const getItemThumbs = async (itemName) => {
  const res = await db.query(
    `SELECT DISTINCT img.image_url FROM (
       SELECT DISTINCT p2.id, p2.likes_count
       FROM post_items pit2 JOIN posts p2 ON p2.id = pit2.post_id AND p2.is_deleted = 0
       WHERE pit2.item_name = :1
       ORDER BY p2.likes_count DESC
       FETCH FIRST 5 ROWS ONLY
     ) p2
     JOIN post_images img ON img.post_id = p2.id AND img.sort_order = 0
     FETCH FIRST 3 ROWS ONLY`,
    [itemName]
  );
  return res.rows.map(r => r.image_url);
};

const getStyleThumbs = async (style) => {
  const res = await db.query(
    `SELECT DISTINCT img.image_url FROM (
       SELECT DISTINCT p2.id, p2.likes_count
       FROM posts p2 WHERE p2.style = :1 AND p2.is_deleted = 0
       ORDER BY p2.likes_count DESC
       FETCH FIRST 5 ROWS ONLY
     ) p2
     JOIN post_images img ON img.post_id = p2.id AND img.sort_order = 0
     FETCH FIRST 3 ROWS ONLY`,
    [style]
  );
  return res.rows.map(r => r.image_url);
};

const RankingController = {
  getBrandRanking: async (req, res, next) => {
    try {
      const df = dateFilter(req.query.period);
      const result = await db.query(
        `SELECT pit.brand_name,
                COUNT(DISTINCT p.id)       AS post_count,
                NVL(SUM(p.likes_count), 0) AS total_likes,
                (COUNT(DISTINCT p.id) * 5 + NVL(SUM(p.likes_count), 0) * 2) AS score
         FROM post_items pit
         JOIN posts p ON p.id = pit.post_id AND p.is_deleted = 0 ${df}
         WHERE pit.brand_name IS NOT NULL AND LENGTH(TRIM(pit.brand_name)) > 0
         GROUP BY pit.brand_name
         ORDER BY score DESC
         FETCH FIRST 20 ROWS ONLY`
      );

      const brands = result.rows;
      for (const b of brands) {
        b.thumbnails = await getBrandThumbs(b.brand_name);
      }
      res.json(brands);
    } catch (err) { next(err); }
  },

  getItemRanking: async (req, res, next) => {
    try {
      const df = dateFilter(req.query.period);
      const catFilter = req.query.category ? `AND pit.category = '${req.query.category.replace(/'/g, "''")}'` : '';
      const result = await db.query(
        `SELECT pit.item_name, pit.brand_name, pit.category,
                COUNT(DISTINCT p.id)       AS post_count,
                NVL(SUM(p.likes_count), 0) AS total_likes,
                MIN(pit.price)             AS min_price,
                (COUNT(DISTINCT p.id) * 5 + NVL(SUM(p.likes_count), 0) * 2) AS score
         FROM post_items pit
         JOIN posts p ON p.id = pit.post_id AND p.is_deleted = 0 ${df}
         WHERE pit.item_name IS NOT NULL AND LENGTH(TRIM(pit.item_name)) > 0 ${catFilter}
         GROUP BY pit.item_name, pit.brand_name, pit.category
         ORDER BY score DESC
         FETCH FIRST 20 ROWS ONLY`
      );

      const items = result.rows;
      for (const it of items) {
        it.thumbnails = await getItemThumbs(it.item_name);
      }
      res.json(items);
    } catch (err) { next(err); }
  },

  getStyleRanking: async (req, res, next) => {
    try {
      const df = dateFilter(req.query.period);
      const result = await db.query(
        `SELECT p.style,
                COUNT(*)                   AS post_count,
                NVL(SUM(p.likes_count), 0) AS total_likes,
                (COUNT(*) * 3 + NVL(SUM(p.likes_count), 0) * 2) AS score
         FROM posts p
         WHERE p.is_deleted = 0 AND p.style IS NOT NULL ${df}
         GROUP BY p.style
         ORDER BY score DESC
         FETCH FIRST 15 ROWS ONLY`
      );

      const styles = result.rows;
      for (const s of styles) {
        s.thumbnails = await getStyleThumbs(s.style);
      }
      res.json(styles);
    } catch (err) { next(err); }
  },
};

module.exports = RankingController;
