const db       = require('../config/db');
const oracledb = require('oracledb');

const StoryController = {

  // 스토리 목록 (24시간 이내, 유저별 그룹)
  getStories: async (req, res, next) => {
    try {
      const result = await db.query(
        `SELECT u.id AS user_id, u.username, u.profile_image,
                COUNT(s.id) AS story_count,
                SUM(CASE WHEN sv.user_id IS NOT NULL THEN 1 ELSE 0 END) AS viewed_count,
                MAX(s.created_at) AS latest_at
         FROM stories s
         JOIN users u ON u.id = s.user_id
         LEFT JOIN story_views sv ON sv.story_id = s.id AND sv.user_id = :1
         WHERE s.expires_at > CURRENT_TIMESTAMP
         GROUP BY u.id, u.username, u.profile_image
         ORDER BY latest_at DESC`,
        [req.userId]
      );
      res.json(result.rows);
    } catch (err) { next(err); }
  },

  // 특정 유저의 스토리 목록
  getUserStories: async (req, res, next) => {
    try {
      const result = await db.query(
        `SELECT s.id, s.user_id, s.image_url, s.created_at, s.expires_at,
                u.username, u.profile_image,
                (SELECT COUNT(*) FROM story_views WHERE story_id = s.id AND user_id = :1) AS is_viewed
         FROM stories s JOIN users u ON u.id = s.user_id
         WHERE s.user_id = :2 AND s.expires_at > CURRENT_TIMESTAMP
         ORDER BY s.created_at ASC`,
        [req.userId, req.params.userId]
      );
      res.json(result.rows);
    } catch (err) { next(err); }
  },

  // 스토리 업로드
  upload: async (req, res, next) => {
    try {
      if (!req.file) return res.status(400).json({ message: '이미지를 선택해주세요.' });
      const imageUrl = `/uploads/${req.file.filename}`;
      const result = await db.query(
        `INSERT INTO stories (user_id, image_url)
         VALUES (:1, :2) RETURNING id INTO :3`,
        [req.userId, imageUrl,
          { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }]
      );
      res.status(201).json({ message: '스토리가 업로드되었어요.', storyId: result.outBinds });
    } catch (err) { next(err); }
  },

  // 스토리 조회 기록
  markViewed: async (req, res, next) => {
    try {
      await db.query(
        `INSERT INTO story_views (story_id, user_id) VALUES (:1, :2)`,
        [req.params.storyId, req.userId]
      ).catch(() => {}); // 이미 조회한 경우 무시
      res.json({ ok: true });
    } catch (err) { next(err); }
  },
};

module.exports = StoryController;