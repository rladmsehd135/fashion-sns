const router         = require('express').Router();
const authMiddleware = require('../middlewares/authMiddleware');
const upload         = require('../middlewares/uploadMiddleware');
const db             = require('../config/db');
const oracledb       = require('oracledb');

// 스토리 목록 (팔로잉 + 내 스토리)
router.get('/', authMiddleware, async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT u.id AS user_id, u.username, u.profile_image,
              COUNT(s.id) AS story_count,
              MAX(s.created_at) AS latest_story,
              (SELECT COUNT(*) FROM story_views sv
               JOIN stories s2 ON s2.id = sv.story_id
               WHERE s2.user_id = u.id AND sv.user_id = :1
               AND s2.expires_at > CURRENT_TIMESTAMP) AS viewed_count
       FROM users u
       JOIN stories s ON s.user_id = u.id
       WHERE s.expires_at > CURRENT_TIMESTAMP
       AND (u.id = :2 OR u.id IN (
         SELECT following_id FROM follows WHERE follower_id = :3
       ))
       GROUP BY u.id, u.username, u.profile_image
       ORDER BY CASE WHEN u.id = :4 THEN 0 ELSE 1 END, MAX(s.created_at) DESC`,
      [req.userId, req.userId, req.userId, req.userId]
    );
    res.json(result.rows);
  } catch (err) { next(err); }
});

// 특정 유저 스토리 조회
router.get('/:userId', authMiddleware, async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT s.*, u.username, u.profile_image,
              (SELECT COUNT(*) FROM story_views WHERE story_id = s.id) AS view_count,
              (SELECT COUNT(*) FROM story_views WHERE story_id = s.id AND user_id = :1) AS is_viewed
       FROM stories s JOIN users u ON u.id = s.user_id
       WHERE s.user_id = :2 AND s.expires_at > CURRENT_TIMESTAMP
       ORDER BY s.created_at ASC`,
      [req.userId, req.params.userId]
    );
    // 본인 스토리 아니면 viewed 처리
    if (parseInt(req.params.userId) !== req.userId) {
      for (const story of result.rows) {
        if (!story.is_viewed) {
          await db.query(
            `INSERT INTO story_views (story_id, user_id) VALUES (:1, :2)`,
            [story.id, req.userId]
          ).catch(() => {});
        }
      }
    }
    res.json(result.rows);
  } catch (err) { next(err); }
});

// 스토리 업로드
router.post('/', authMiddleware, upload.single('image'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: '이미지를 업로드해주세요.' });
    await db.query(
      `INSERT INTO stories (user_id, image_url) VALUES (:1, :2)`,
      [req.userId, `/uploads/${req.file.filename}`]
    );
    res.status(201).json({ message: '스토리가 업로드되었습니다.' });
  } catch (err) { next(err); }
});

module.exports = router;