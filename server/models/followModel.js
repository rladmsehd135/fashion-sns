const db = require('../config/db');

const FollowModel = {

  toggle: async (followerId, followingId) => {
    const existing = await db.query(
      `SELECT * FROM follows WHERE follower_id = :1 AND following_id = :2`,
      [followerId, followingId]
    );
    if (existing.rows.length > 0) {
      await db.query(
        `DELETE FROM follows WHERE follower_id = :1 AND following_id = :2`,
        [followerId, followingId]
      );
      return { following: false };
    } else {
      await db.query(
        `INSERT INTO follows (follower_id, following_id) VALUES (:1, :2)`,
        [followerId, followingId]
      );
      return { following: true };
    }
  },

  getFollowers: async (userId) => {
    const result = await db.query(
      `SELECT u.id, u.username, u.profile_image
       FROM follows f
       JOIN users u ON u.id = f.follower_id
       WHERE f.following_id = :1`,
      [userId]
    );
    return result.rows;
  },

  getFollowing: async (userId) => {
    const result = await db.query(
      `SELECT u.id, u.username, u.profile_image
       FROM follows f
       JOIN users u ON u.id = f.following_id
       WHERE f.follower_id = :1`,
      [userId]
    );
    return result.rows;
  },
};

module.exports = FollowModel;