const router = require('express').Router();
const authMiddleware = require('../middlewares/authMiddleware');
const db = require('../config/db');
const { generateOutfitComplete } = require('../utils/aiService');

// POST /ai/outfit  — 아이템 1개 기반 코디 완성
router.post('/outfit', authMiddleware, async (req, res, next) => {
  try {
    const { name, brand, category } = req.body;
    if (!name || !category) return res.status(400).json({ message: '아이템명과 카테고리를 입력해주세요.' });

    const userRes = await db.query(
      `SELECT height, weight, preferred_style, style_archetype FROM users WHERE id = :1`,
      [req.userId]
    );
    const userProfile = userRes.rows[0] || {};

    const result = await generateOutfitComplete({ name, brand, category }, userProfile);
    res.json(result);
  } catch (err) { next(err); }
});

// GET /ai/style-timeline/:username  — 스타일 진화 타임라인
router.get('/style-timeline/:username', authMiddleware, async (req, res, next) => {
  try {
    const { username } = req.params;
    const userRes = await db.query(`SELECT id FROM users WHERE username = :1 AND is_active = 1`, [username]);
    if (!userRes.rows[0]) return res.status(404).json({ message: '유저를 찾을 수 없습니다.' });
    const userId = userRes.rows[0].id;

    // 최근 12개월 게시물 월별 집계
    const result = await db.query(
      `SELECT
         TO_CHAR(p.created_at, 'YYYY-MM') AS month,
         p.style,
         COUNT(*) AS cnt,
         MIN(
           (SELECT image_url FROM post_images WHERE post_id = p.id AND sort_order = 0 FETCH FIRST 1 ROWS ONLY)
         ) AS thumbnail
       FROM posts p
       WHERE p.user_id = :1
         AND p.is_deleted = 0
         AND p.created_at >= ADD_MONTHS(SYSDATE, -12)
       GROUP BY TO_CHAR(p.created_at, 'YYYY-MM'), p.style
       ORDER BY month ASC, cnt DESC`,
      [userId]
    );

    // 월별로 묶어서 dominant style 계산
    const monthMap = {};
    for (const row of result.rows) {
      if (!monthMap[row.month]) monthMap[row.month] = { month: row.month, styles: [], totalCount: 0, thumbnail: row.thumbnail };
      monthMap[row.month].styles.push({ style: row.style, count: Number(row.cnt) });
      monthMap[row.month].totalCount += Number(row.cnt);
      if (!monthMap[row.month].thumbnail && row.thumbnail) monthMap[row.month].thumbnail = row.thumbnail;
    }

    const timeline = Object.values(monthMap).map(m => ({
      ...m,
      dominantStyle: m.styles[0]?.style || null,
    }));

    res.json(timeline);
  } catch (err) { next(err); }
});

// GET /ai/fit-review?brand=X&item=Y&height=H&weight=W  — 체형별 핏 리뷰
router.get('/fit-review', authMiddleware, async (req, res, next) => {
  try {
    const { brand, item, height, weight } = req.query;
    if (!height || !weight) return res.status(400).json({ message: '키와 몸무게 정보가 필요합니다.' });

    const h = Number(height), w = Number(weight);
    const hMin = h - 6, hMax = h + 6, wMin = w - 8, wMax = w + 8;

    let itemCondition = '';
    const params = [hMin, hMax, wMin, wMax];
    if (brand) { itemCondition += ` AND LOWER(pi2.brand_name) LIKE '%' || LOWER(:${params.length + 1}) || '%'`; params.push(brand); }
    if (item)  { itemCondition += ` AND LOWER(pi2.item_name)  LIKE '%' || LOWER(:${params.length + 1}) || '%'`; params.push(item); }

    const result = await db.query(
      `SELECT DISTINCT p.id, p.style, p.content,
              u.username, u.profile_image, u.height, u.weight,
              (SELECT image_url FROM post_images WHERE post_id = p.id AND sort_order = 0 FETCH FIRST 1 ROWS ONLY) AS thumbnail
       FROM posts p
       JOIN users u ON u.id = p.user_id
       JOIN post_items pi2 ON pi2.post_id = p.id
       WHERE p.is_deleted = 0
         AND u.height BETWEEN :1 AND :2
         AND u.weight BETWEEN :3 AND :4
         ${itemCondition}
       FETCH FIRST 12 ROWS ONLY`,
      params
    );

    res.json(result.rows);
  } catch (err) { next(err); }
});

module.exports = router;
