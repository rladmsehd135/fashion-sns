const db = require('../config/db');
const { formatLastSeen } = require('../utils/formatTime');
const { generateStyleSummary } = require('../utils/aiService');

const UserController = {

  blockUser: async (req, res, next) => {
    try {
      const targetId = parseInt(req.params.id);
      if (targetId === req.userId) return res.status(400).json({ message: '자기 자신을 차단할 수 없습니다.' });
      await db.query(
        `MERGE INTO user_blocks ub USING DUAL
         ON (ub.blocker_id = :1 AND ub.blocked_id = :2)
         WHEN NOT MATCHED THEN INSERT (blocker_id, blocked_id) VALUES (:3, :4)`,
        [req.userId, targetId, req.userId, targetId]
      );
      res.json({ message: '차단되었습니다.' });
    } catch (err) { next(err); }
  },

  reportUser: async (req, res, next) => {
    try {
      const targetId = parseInt(req.params.id);
      const { reason } = req.body;
      if (!reason?.trim()) return res.status(400).json({ message: '신고 사유를 선택해주세요.' });
      if (targetId === req.userId) return res.status(400).json({ message: '자기 자신을 신고할 수 없습니다.' });
      await db.query(
        `INSERT INTO user_reports (reporter_id, reported_id, reason) VALUES (:1, :2, :3)`,
        [req.userId, targetId, reason.trim()]
      );
      res.json({ message: '신고가 접수되었습니다.' });
    } catch (err) { next(err); }
  },

  getStylePrefs: async (req, res, next) => {
    try {
      const result = await db.query(
        `SELECT style, score FROM user_style_prefs
         WHERE user_id = :1
         ORDER BY score DESC
         FETCH FIRST 5 ROWS ONLY`,
        [req.userId]
      );
      res.json(result.rows);
    } catch (err) { next(err); }
  },

  getMutuals: async (req, res, next) => {
    try {
      const result = await db.query(
        `SELECT u.id, u.username, u.profile_image
         FROM follows f1
         JOIN follows f2 ON f2.follower_id = f1.following_id AND f2.following_id = f1.follower_id
         JOIN users u ON u.id = f1.following_id
         WHERE f1.follower_id = :1 AND u.is_active = 1
         ORDER BY u.username ASC`,
        [req.userId]
      );
      res.json(result.rows);
    } catch (err) { next(err); }
  },

  getMe: async (req, res, next) => {
    try {
      const result = await db.query(
        `SELECT id, username, email, profile_image, bio, height, weight,
                preferred_style, style_1, style_2, is_online, last_seen_at, created_at,
                style_archetype, style_archetype_desc
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
                u.style_archetype, u.style_archetype_desc, u.total_wins,
                u.preferred_style, u.is_online, u.last_seen_at,
                (SELECT rank FROM (
                  SELECT id, RANK() OVER (ORDER BY total_wins DESC) as rank FROM users WHERE is_active = 1 AND total_wins > 0
                ) WHERE id = u.id) as win_rank,
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
              preferred_style, style_1, style_2, style_archetype, style_archetype_desc
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
      const limit = Math.min(parseInt(req.query.limit) || 30, 50);
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
         FETCH FIRST :5 ROWS ONLY`,
        [req.userId, req.userId, req.userId, req.userId, limit]
      );
      res.json(result.rows);
    } catch (err) { next(err); }
  },

  getFollowers: async (req, res, next) => {
    try {
      const result = await db.query(
        `SELECT u.id, u.username, u.profile_image, u.bio, u.preferred_style,
              (SELECT COUNT(*) FROM follows
               WHERE follower_id = :1 AND following_id = u.id) AS is_following
       FROM follows f
       JOIN users u ON u.id = f.follower_id
       WHERE f.following_id = :2
       ORDER BY f.created_at DESC`,
        [req.userId, req.params.id]
      );
      res.json(result.rows);
    } catch (err) { next(err); }
  },

  getFollowing: async (req, res, next) => {
    try {
      const result = await db.query(
        `SELECT u.id, u.username, u.profile_image, u.bio, u.preferred_style,
              (SELECT COUNT(*) FROM follows
               WHERE follower_id = :1 AND following_id = u.id) AS is_following
       FROM follows f
       JOIN users u ON u.id = f.following_id
       WHERE f.follower_id = :2
       ORDER BY f.created_at DESC`,
        [req.userId, req.params.id]
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

  getStyleReport: async (req, res, next) => {
    try {
      // 1. 스타일 선호도 점수 집계
      const stylePrefs = await db.query(
        `SELECT style, score FROM user_style_prefs 
         WHERE user_id = :1 ORDER BY score DESC FETCH FIRST 3 ROWS ONLY`,
        [req.userId]
      );

      // 2. 착용 아이템 핏(Fit) 통계
      const fitStats = await db.query(
        `SELECT pi.fit_review, COUNT(*) as cnt 
         FROM post_items pi 
         JOIN posts p ON pi.post_id = p.id 
         WHERE p.user_id = :1 AND pi.fit_review IS NOT NULL
         GROUP BY pi.fit_review`,
        [req.userId]
      );

      // 3. AI 분석 요약 생성
      const aiReport = await generateStyleSummary(stylePrefs.rows, fitStats.rows);

      // 4. 페르소나(archetype) DB 저장
      if (aiReport.archetype) {
        await db.query(
          `UPDATE users SET style_archetype = :1, style_archetype_desc = :2 WHERE id = :3`,
          [aiReport.archetype, aiReport.archetypeDescription, req.userId]
        );
      }

      res.json({
        styles: stylePrefs.rows,
        fits: fitStats.rows,
        report: aiReport,
        updatedAt: new Date().toISOString()
      });
    } catch (err) { next(err); }
  },
};

module.exports = UserController;
