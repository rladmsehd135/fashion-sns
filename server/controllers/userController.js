const db = require('../config/db');
const { formatLastSeen } = require('../utils/formatTime');

const UserController = {

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

  updateProfile: async (req, res, next) => {
    try {
      const { username, bio, height, weight, preferred_style, style_1, style_2 } = req.body;
      const profile_image = req.file ? `/uploads/${req.file.filename}` : null;

      if (profile_image) {
        await db.query(
          `UPDATE users SET username=:1, bio=:2, height=:3, weight=:4,
         preferred_style=:5, style_1=:6, style_2=:7, profile_image=:8
         WHERE id=:9`,
          [username, bio, height || null, weight || null,
            preferred_style || null, style_1 || null, style_2 || null,
            profile_image, req.userId]
        );
      } else {
        await db.query(
          `UPDATE users SET username=:1, bio=:2, height=:3, weight=:4,
         preferred_style=:5, style_1=:6, style_2=:7
         WHERE id=:8`,
          [username, bio, height || null, weight || null,
            preferred_style || null, style_1 || null, style_2 || null,
            req.userId]
        );
      }
      const updated = await db.query(
        `SELECT id, username, email, profile_image, bio, height, weight,
              preferred_style, style_1, style_2
       FROM users WHERE id = :1`, [req.userId]
      );
      res.json({ message: '프로필이 수정되었습니다.', user: updated.rows[0] });
    } catch (err) { next(err); }
  },

  search: async (req, res, next) => {
    try {
      const { q } = req.query;
      const keyword = q?.trim();
      if (!keyword) return res.json({ users: [], posts: [] });

      const searchPattern = `%${keyword}%`;
      const users = await db.query(
        `SELECT id, username, profile_image, bio, preferred_style
         FROM users
         WHERE LOWER(username) LIKE LOWER(:1) AND is_active = 1 AND id != :2
         FETCH FIRST 10 ROWS ONLY`,
        [searchPattern, req.userId]
      );

      const posts = await db.query(
        `SELECT p.id, p.user_id, p.title, p.content, p.style, p.tags,
                p.likes_count, p.comments_count, p.created_at,
                u.username, u.profile_image,
                (SELECT COUNT(*) FROM likes WHERE post_id = p.id AND user_id = :1) AS is_liked,
                (SELECT COUNT(*) FROM bookmarks WHERE post_id = p.id AND user_id = :2) AS is_bookmarked,
                (SELECT image_url FROM post_images WHERE post_id = p.id AND sort_order = 0
                 FETCH FIRST 1 ROWS ONLY) AS thumbnail
         FROM posts p
         JOIN users u ON u.id = p.user_id
         WHERE p.is_deleted = 0
         AND (
           LOWER(p.title) LIKE LOWER(:3)
           OR LOWER(p.content) LIKE LOWER(:4)
           OR LOWER(p.tags) LIKE LOWER(:5)
           OR LOWER(u.username) LIKE LOWER(:6)
         )
         ORDER BY p.created_at DESC
         FETCH FIRST 20 ROWS ONLY`,
        [req.userId, req.userId, searchPattern, searchPattern, searchPattern, searchPattern]
      );

      res.json({ users: users.rows, posts: posts.rows });
    } catch (err) { next(err); }
  },

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

  checkUsername: async (req, res, next) => {
    try {
      const { username } = req.query;
      if (!username || !username.trim()) {
        return res.status(400).json({ message: '닉네임을 입력해주세요.' });
      }
      const result = await db.query(
        `SELECT id FROM users WHERE username = :1`,
        [username.trim()]
      );
      res.json({ available: result.rows.length === 0 });
    } catch (err) { next(err); }
  },

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
