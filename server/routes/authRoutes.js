const router         = require('express').Router();
const AuthController = require('../controllers/authController');
const passport       = require('../config/passport');
const { generateAccessToken } = require('../utils/generateToken');

router.post('/register', AuthController.register);
router.post('/login',    AuthController.login);
router.post('/refresh',  AuthController.refresh);
router.post('/logout',   AuthController.logout);

router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'], session: false })
);
router.get('/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/login' }),
  (req, res) => {
    const token = generateAccessToken(req.user.id);
    res.redirect(`${process.env.CLIENT_URL}/auth/callback?token=${token}`);
  }
);

router.get('/kakao',
  passport.authenticate('kakao', { session: false })
);
router.get('/kakao/callback',
  passport.authenticate('kakao', { session: false, failureRedirect: '/login' }),
  (req, res) => {
    const token = generateAccessToken(req.user.id);
    res.redirect(`${process.env.CLIENT_URL}/auth/callback?token=${token}`);
  }
);

module.exports = router;