const CommentModel = require('../models/commentModel');

const CommentController = {

  create: async (req, res, next) => {
    try {
      const { id: postId } = req.params;
      const { content }    = req.body;

      if (!content) {
        return res.status(400).json({ message: '댓글 내용을 입력해주세요.' });
      }

      const commentId = await CommentModel.create(postId, req.userId, content);
      res.status(201).json({ message: '댓글이 작성되었습니다.', commentId });
    } catch (err) {
      next(err);
    }
  },

  getByPost: async (req, res, next) => {
    try {
      const { id: postId } = req.params;
      const comments       = await CommentModel.getByPost(postId);
      res.json(comments);
    } catch (err) {
      next(err);
    }
  },

  update: async (req, res, next) => {
    try {
      const { id }      = req.params;
      const { content } = req.body;

      const comment = await CommentModel.findById(id);
      if (!comment) {
        return res.status(404).json({ message: '댓글을 찾을 수 없습니다.' });
      }
      if (comment.user_id !== req.userId) {
        return res.status(403).json({ message: '수정 권한이 없습니다.' });
      }

      await CommentModel.update(id, content);
      res.json({ message: '댓글이 수정되었습니다.' });
    } catch (err) {
      next(err);
    }
  },

  delete: async (req, res, next) => {
    try {
      const { id } = req.params;

      const comment = await CommentModel.findById(id);
      if (!comment) {
        return res.status(404).json({ message: '댓글을 찾을 수 없습니다.' });
      }
      if (comment.user_id !== req.userId) {
        return res.status(403).json({ message: '삭제 권한이 없습니다.' });
      }

      await CommentModel.delete(id, comment.post_id);
      res.json({ message: '댓글이 삭제되었습니다.' });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = CommentController;