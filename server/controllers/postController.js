const PostModel = require('../models/postModel');

const PostController = {

  // 게시물 작성
  create: async (req, res, next) => {
    try {
      const { title, content, style, tags, items } = req.body;

      if (!content || !style) {
        return res.status(400).json({ message: '내용과 스타일은 필수입니다.' });
      }

      const parsedTags  = tags  ? JSON.parse(tags)  : [];
      const parsedItems = items ? JSON.parse(items) : [];

      const postId = await PostModel.create({
        user_id: req.userId,
        title,
        content,
        style,
        tags: parsedTags,
      });

      // 이미지 저장
      if (req.files && req.files.length > 0) {
        const imageUrls = req.files.map(f => `/uploads/${f.filename}`);
        await PostModel.addImages(postId, imageUrls);
      }

      // 아이템 태그 저장
      if (parsedItems.length > 0) {
        await PostModel.addItems(postId, parsedItems);
      }

      res.status(201).json({ message: '게시물이 작성되었습니다.', postId });
    } catch (err) {
      next(err);
    }
  },

  // 게시물 상세
  getOne: async (req, res, next) => {
    try {
      const { id } = req.params;
      const post   = await PostModel.findById(id, req.userId);

      if (!post) {
        return res.status(404).json({ message: '게시물을 찾을 수 없습니다.' });
      }

      const images = await PostModel.getImages(id);
      const items  = await PostModel.getItems(id);

      res.json({ ...post, images, items });
    } catch (err) {
      next(err);
    }
  },

  // 팔로잉 피드
  getFeed: async (req, res, next) => {
    try {
      const page  = parseInt(req.query.page)  || 1;
      const limit = parseInt(req.query.limit) || 10;
      const posts = await PostModel.getFeed(req.userId, page, limit);
      res.json(posts);
    } catch (err) {
      next(err);
    }
  },

  // 탐색 (스타일 필터)
  getExplore: async (req, res, next) => {
    try {
      const { style } = req.query;
      const page      = parseInt(req.query.page)  || 1;
      const limit     = parseInt(req.query.limit) || 10;
      const posts     = await PostModel.getExplore(style, page, limit);
      res.json(posts);
    } catch (err) {
      next(err);
    }
  },

  // 유저 게시물
  getByUser: async (req, res, next) => {
    try {
      const { id } = req.params;
      const posts  = await PostModel.getByUser(id);
      res.json(posts);
    } catch (err) {
      next(err);
    }
  },

  // 게시물 수정
  update: async (req, res, next) => {
    try {
      const { id }                      = req.params;
      const { title, content, style, tags } = req.body;

      const post = await PostModel.findById(id, req.userId);
      if (!post) {
        return res.status(404).json({ message: '게시물을 찾을 수 없습니다.' });
      }
      if (post.user_id !== req.userId) {
        return res.status(403).json({ message: '수정 권한이 없습니다.' });
      }

      await PostModel.update(id, {
        title,
        content,
        style,
        tags: tags ? JSON.parse(tags) : [],
      });

      res.json({ message: '게시물이 수정되었습니다.' });
    } catch (err) {
      next(err);
    }
  },

  // 게시물 삭제
  delete: async (req, res, next) => {
    try {
      const { id } = req.params;
      const post   = await PostModel.findById(id, req.userId);

      if (!post) {
        return res.status(404).json({ message: '게시물을 찾을 수 없습니다.' });
      }
      if (post.user_id !== req.userId) {
        return res.status(403).json({ message: '삭제 권한이 없습니다.' });
      }

      await PostModel.delete(id);
      res.json({ message: '게시물이 삭제되었습니다.' });
    } catch (err) {
      next(err);
    }
  },

  // 좋아요 토글
  toggleLike: async (req, res, next) => {
    try {
      const { id } = req.params;
      const result = await PostModel.toggleLike(req.userId, id);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },
};

module.exports = PostController;