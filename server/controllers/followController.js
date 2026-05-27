const FollowModel = require('../models/followModel');

const FollowController = {

  toggle: async (req, res, next) => {
    try {
      const followingId = parseInt(req.params.userId);

      if (followingId === req.userId) {
        return res.status(400).json({ message: '자기 자신을 팔로우할 수 없습니다.' });
      }

      const result = await FollowModel.toggle(req.userId, followingId);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },
};

module.exports = FollowController;