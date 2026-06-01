const db = require('../config/db');

// 유저 선호 스타일 업데이트
const updateStylePref = async (userId, style, points) => {
  if (!style) return;
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

// 추천 피드
// 1) DB에서 점수 상위 60개 후보 추출 (Oracle 랜덤 함수 의존 X)
// 2) JS에서 Fisher-Yates 셔플 → 새로고침마다 다른 순서 보장
const getRecommendedFeed = async (userId, page = 1, limit = 10) => {
  const POOL_SIZE = 60;

  const result = await db.query(
    `SELECT * FROM (
      SELECT
        p.id, p.user_id, p.title, p.content, p.style, p.tags,
        p.likes_count, p.comments_count, p.created_at,
        u.username, u.profile_image,
        (SELECT COUNT(*) FROM likes     WHERE post_id = p.id AND user_id = :1) AS is_liked,
        (SELECT COUNT(*) FROM bookmarks WHERE post_id = p.id AND user_id = :2) AS is_bookmarked,
        (SELECT image_url FROM post_images WHERE post_id = p.id AND sort_order = 0
         FETCH FIRST 1 ROWS ONLY) AS thumbnail,
        (SELECT LISTAGG(image_url, ',') WITHIN GROUP (ORDER BY sort_order)
         FROM post_images WHERE post_id = p.id) AS image_urls,
        ROW_NUMBER() OVER (ORDER BY
          (
            (p.likes_count * 3)
            + (p.comments_count * 5)
            + CASE WHEN p.user_id IN (SELECT following_id FROM follows WHERE follower_id = :3)
                   THEN 15 ELSE 0 END
            + CASE
                WHEN p.created_at >= SYSTIMESTAMP - INTERVAL '24' HOUR THEN 20
                WHEN p.created_at >= SYSTIMESTAMP - INTERVAL '48' HOUR THEN 10
                ELSE 0
              END
            + LEAST(
                COALESCE((SELECT usp.score FROM user_style_prefs usp
                          WHERE usp.user_id = :4 AND usp.style = p.style), 0),
                30
              )
          ) DESC
        ) AS rn
      FROM posts p
      JOIN users u ON u.id = p.user_id
      WHERE p.is_deleted = 0
        AND p.user_id != :5
    ) WHERE rn <= :6`,
    [userId, userId, userId, userId, userId, POOL_SIZE]
  );

  // Fisher-Yates 셔플 (매 호출마다 다른 순서)
  const pool = result.rows;
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  // 이미지 있는 포스트를 앞으로 (그룹 내 순서는 셔플 결과 유지)
  pool.sort((a, b) => (b.thumbnail ? 1 : 0) - (a.thumbnail ? 1 : 0));

  const offset = (page - 1) * limit;
  return pool.slice(offset, offset + limit);
};

module.exports = { updateStylePref, getRecommendedFeed };
