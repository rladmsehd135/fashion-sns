const UserModel = require('../models/userModel');
const { formatLastSeen } = require('../utils/formatTime');

const UserController = {

  // 프로필 조회
  getProfile: async (req, res, next) => {
    try {
      const { username } = req.params;
      const targetUser   = await UserModel.findByUsername(username);

      if (!targetUser) {
        return res.status(404).json({ message: '유저를 찾을 수 없습니다.' });
      }

      const profile = await UserModel.getProfile(targetUser.id, req.userId);

      profile.last_seen_text = formatLastSeen(profile.last_seen_at);

      res.json(profile);
    } catch (err) {
      next(err);
    }
  },

  // 내 정보 수정
  updateProfile: async (req, res, next) => {
    try {
      const { username, bio, height, weight } = req.body;
      const profile_image = req.file
        ? `/uploads/${req.file.filename}`
        : undefined;

      const updateData = {
        username,
        bio,
        height: height ? parseInt(height) : null,
        weight: weight ? parseInt(weight) : null,
        profile_image,
      };

      await UserModel.updateProfile(req.userId, updateData);

      const updated = await UserModel.findById(req.userId);
      res.json({ message: '프로필이 수정되었습니다.', user: updated });
    } catch (err) {
      next(err);
    }
  },

  // 팔로워 목록
  getFollowers: async (req, res, next) => {
    try {
      const { id } = req.params;
      const FollowModel = require('../models/followModel');
      const followers = await FollowModel.getFollowers(id);
      res.json(followers);
    } catch (err) {
      next(err);
    }
  },

  // 팔로잉 목록
  getFollowing: async (req, res, next) => {
    try {
      const { id } = req.params;
      const FollowModel = require('../models/followModel');
      const following = await FollowModel.getFollowing(id);
      res.json(following);
    } catch (err) {
      next(err);
    }
  },
};

module.exports = UserController;