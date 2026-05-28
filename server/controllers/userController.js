const db             = require('../config/db');
const { formatLastSeen } = require('../utils/formatTime');

const UserController = {

  // 내 정보
  getMe: async (req, res, next) => {
    try {
      const result = await db.query(
        `SELECT id, username, email, profile_image, bio, height, weight,
                preferred_style, is_online, last_seen_at, created_at
         FROM users WHERE id = :1 AND is_active = 1`,
        [req.userId]
      );
      if (!result.rows[0]) return res.status(404).json({ message: '유저를 찾을 수 없습니다.' });
      res.json(result.rows[0]);
    } catch (err) { next(err); }
  },

  // 프로필 조회
  getProfile: async (req, res, next) => {
    try {
      const { username } = req.params;
      const result = await db.query(
        `SELECT u.id, u.username, u.profile_image, u.bio, u.height, u.weight,
                u.preferred_style, u.is_online, u.last_seen_at,
                (SELECT COUNT(*) FROM follows WHERE following_id = u.id) AS follower_count,
                (SELECT COUNT(*) FROM follows WHERE follower_id  = u.id) AS following_count,
                (SELECT COUNT(*) FROM posts WHERE user_id = u.id AND is_deleted = 0) AS post_count,
                (SELECT COUNT(*) FROM follows WHERE follower_id = :1 AND following_id = u.id) AS is_following
         FROM users u WHERE u.username = :2 AND u.is_active = 1`,
        [req.userId, username]
      );
      if (!result.rows[0]) return res.status(404).json({ message: '유저를 찾을 수 없습니다.' });
      const profile = result.rows[0];
      profile.last_seen_text = formatLastSeen(profile.last_seen_at);
      res.json(profile);
    } catch (err) { next(err); }
  },

  // 프로필 수정
  updateProfile: async (req, res, next) => {
    try {
      const { username, bio, height, weight, preferred_style } = req.body;
      const profile_image = req.file ? `/uploads/${req.file.filename}` : null;

      if (profile_image) {
        await db.query(
          `UPDATE users SET username=:1, bio=:2, height=:3, weight=:4,
           preferred_style=:5, profile_image=:6 WHERE id=:7`,
          [username, bio, height||null, weight||null, preferred_style||null, profile_image, req.userId]
        );
      } else {
        await db.query(
          `UPDATE users SET username=:1, bio=:2, height=:3, weight=:4,
           preferred_style=:5 WHERE id=:6`,
          [username, bio, height||null, weight||null, preferred_style||null, req.userId]
        );
      }
      const updated = await db.query(
        `SELECT id, username, email, profile_image, bio, height, weight, preferred_style
         FROM users WHERE id = :1`, [req.userId]
      );
      res.json({ message: '프로필이 수정되었습니다.', user: updated.rows[0] });
    } catch (err) { next(err); }
  },

  // 유저 검색
  search: async (req, res, next) => {
    try {
      const { q } = req.query;
      if (!q) return res.json([]);
      const result = await db.query(
        `SELECT id, username, profile_image, bio, preferred_style
         FROM users
         WHERE LOWER(username) LIKE LOWER(:1) AND is_active = 1 AND id != :2
         FETCH FIRST 10 ROWS ONLY`,
        [`%${q}%`, req.userId]
      );
      res.json(result.rows);
    } catch (err) { next(err); }
  },

  // 추천 팔로우 (같은 스타일)
  getRecommended: async (req, res, next) => {
    try {
      const result = await db.query(
        `SELECT u.id, u.username, u.profile_image, u.bio, u.preferred_style,
                (SELECT COUNT(*) FROM follows WHERE following_id = u.id) AS follower_count
         FROM users u
         WHERE u.id != :1
         AND u.is_active = 1
         AND u.id NOT IN (SELECT following_id FROM follows WHERE follower_id = :2)
         AND (
           u.preferred_style = (SELECT preferred_style FROM users WHERE id = :3)
           OR u.preferred_style IS NOT NULL
         )
         ORDER BY
           CASE WHEN u.preferred_style = (SELECT preferred_style FROM users WHERE id = :4)
                THEN 0 ELSE 1 END,
           (SELECT COUNT(*) FROM follows WHERE following_id = u.id) DESC
         FETCH FIRST 5 ROWS ONLY`,
        [req.userId, req.userId, req.userId, req.userId]
      );
      res.json(result.rows);
    } catch (err) { next(err); }
  },

  // 팔로워 목록
  getFollowers: async (req, res, next) => {
    try {
      const result = await db.query(
        `SELECT u.id, u.username, u.profile_image, u.preferred_style
         FROM follows f JOIN users u ON u.id = f.follower_id
         WHERE f.following_id = :1`,
        [req.params.id]
      );
      res.json(result.rows);
    } catch (err) { next(err); }
  },

  // 팔로잉 목록
  getFollowing: async (req, res, next) => {
    try {
      const result = await db.query(
        `SELECT u.id, u.username, u.profile_image, u.preferred_style
         FROM follows f JOIN users u ON u.id = f.following_id
         WHERE f.follower_id = :1`,
        [req.params.id]
      );
      res.json(result.rows);
    } catch (err) { next(err); }
  },
};

module.exports = UserController;