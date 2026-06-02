const router           = require('express').Router();
const RankingController = require('../controllers/rankingController');
const authMiddleware   = require('../middlewares/authMiddleware');

router.get('/brands', authMiddleware, RankingController.getBrandRanking);
router.get('/items',  authMiddleware, RankingController.getItemRanking);
router.get('/styles', authMiddleware, RankingController.getStyleRanking);

module.exports = router;
