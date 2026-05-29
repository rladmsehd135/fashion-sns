const db = require('../config/db');

// 유저 선호 스타일 업데이트
const updateStylePref = async (userId, style, points) => {
  const existing = await db.query(
    `SELECT id FROM user_style_prefs WHERE user_id = :1 AND style = :2`,
    [userId, style]
  );
  if (existing.rows.length > 0) {
    await db.query(
      `UPDATE user_style_prefs SET score = score + :1, updated_at = CURRENT_TIMESTAMP
       WHERE user_id = :2 AND style = :3`,
      [points, userId, style]
    );
  } else {
    await db.query(
      `INSERT INTO user_style_prefs (user_id, style, score) VALUES (:1, :2, :3)`,
      [userId, style, points]
    );
  }
};

// 추천 피드 스코어 계산
const getRecommendedFeed = async (userId, page = 1, limit = 10) => {
  const offset = (page - 1) * limit;
  const result = await db.query(
    `SELECT * FROM (
      SELECT p.id, p.user_id, p.title, p.content, p.style, p.tags,
             p.likes_count, p.comments_count, p.created_at,
             u.username, u.profile_image,
             (SELECT COUNT(*) FROM likes WHERE post_id = p.id AND user_id = :1) AS is_liked,
             (SELECT COUNT(*) FROM bookmarks WHERE post_id = p.id AND user_id = :2) AS is_bookmarked,
             (SELECT image_url FROM post_images WHERE post_id = p.id AND sort_order = 0
              FETCH FIRST 1 ROWS ONLY) AS thumbnail,
             (
               (p.likes_count * 3)
               + (p.comments_count * 5)
               + (CASE WHEN p.user_id IN
                   (SELECT following_id FROM follows WHERE follower_id = :3)
                  THEN 15 ELSE 0 END)
               + (CASE
                   WHEN p.created_at >= SYSTIMESTAMP - INTERVAL '24' HOUR THEN 20
                   WHEN p.created_at >= SYSTIMESTAMP - INTERVAL '48' HOUR THEN 10
                   ELSE 0 END)
               + (CASE WHEN EXISTS
                   (SELECT 1 FROM user_style_prefs usp
                    WHERE usp.user_id = :4 AND usp.style = p.style AND usp.score > 0)
                  THEN 13 ELSE 0 END)
             ) AS score,
             ROW_NUMBER() OVER (ORDER BY
               (p.likes_count * 3 + p.comments_count * 5) DESC,
               p.created_at DESC
             ) AS rn
      FROM posts p
      JOIN users u ON u.id = p.user_id
      WHERE p.is_deleted = 0
    ) WHERE rn BETWEEN :5 AND :6`,
    [userId, userId, userId, userId, offset + 1, offset + limit]
  );
  return result.rows;
};

module.exports = { updateStylePref, getRecommendedFeed };
