const db = require('../config/db');

const UserModel = {

  findByEmail: async (email) => {
    const result = await db.query(
      `SELECT * FROM users WHERE email = :1 AND is_active = 1`,
      [email]
    );
    return result.rows[0];
  },

  findById: async (id) => {
    const result = await db.query(
      `SELECT id, username, email, profile_image, bio, height, weight,
              is_online, last_seen_at, created_at
       FROM users WHERE id = :1 AND is_active = 1`,
      [id]
    );
    return result.rows[0];
  },

  findByUsername: async (username) => {
    const result = await db.query(
      `SELECT id, username, email, profile_image, bio, height, weight,
              is_online, last_seen_at, created_at
       FROM users WHERE username = :1 AND is_active = 1`,
      [username]
    );
    return result.rows[0];
  },

  create: async ({ username, email, password_hash }) => {
    const result = await db.query(
      `INSERT INTO users (username, email, password_hash)
       VALUES (:1, :2, :3)
       RETURNING id INTO :4`,
      [username, email, password_hash,
        { dir: require('oracledb').BIND_OUT, type: require('oracledb').NUMBER }]
    );
    return result.outBinds[0];
  },

  updateRefreshToken: async (id, refreshToken) => {
    await db.query(
      `UPDATE users SET refresh_token = :1 WHERE id = :2`,
      [refreshToken, id]
    );
  },

  updateProfile: async (id, { username, bio, height, weight, profile_image }) => {
    await db.query(
      `UPDATE users
       SET username = :1, bio = :2, height = :3, weight = :4, profile_image = :5
       WHERE id = :6`,
      [username, bio, height, weight, profile_image, id]
    );
  },

  updateOnlineStatus: async (id, isOnline) => {
    await db.query(
      `UPDATE users SET is_online = :1, last_seen_at = CURRENT_TIMESTAMP WHERE id = :2`,
      [isOnline ? 1 : 0, id]
    );
  },

  getProfile: async (targetId, myId) => {
    const result = await db.query(
      `SELECT u.id, u.username, u.profile_image, u.bio, u.height, u.weight,
              u.is_online, u.last_seen_at,
              (SELECT COUNT(*) FROM follows WHERE following_id = u.id) AS follower_count,
              (SELECT COUNT(*) FROM follows WHERE follower_id  = u.id) AS following_count,
              (SELECT COUNT(*) FROM posts   WHERE user_id = u.id AND is_deleted = 0) AS post_count,
              (SELECT COUNT(*) FROM follows WHERE follower_id = :1 AND following_id = u.id) AS is_following
       FROM users u
       WHERE u.id = :2 AND u.is_active = 1`,
      [myId, targetId]
    );
    return result.rows[0];
  },
};

module.exports = UserModel;