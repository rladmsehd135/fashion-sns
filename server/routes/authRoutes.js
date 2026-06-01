const router         = require('express').Router();
const AuthController = require('../controllers/authController');
const passport       = require('../config/passport');
const { generateAccessToken } = require('../utils/generateToken');
const authMiddleware = require('../middlewares/authMiddleware');

router.post('/send-code-change',   authMiddleware, AuthController.sendCodeForChange);
router.post('/verify-code-change', authMiddleware, AuthController.verifyCodeForChange);
router.post('/change-password',    authMiddleware, AuthController.changePassword);
router.post('/change-username',    authMiddleware, AuthController.changeUsername);

router.post('/register', AuthController.register);
router.post('/login',    AuthController.login);
router.post('/refresh',  AuthController.refresh);
router.post('/logout',   AuthController.logout);
router.post('/send-code',   AuthController.sendCode);
router.post('/verify-code', AuthController.verifyCode);

// 카카오 로그인 — prompt=login 강제 적용
router.get('/kakao', (req, res) => {
  const kakaoAuthUrl =
    `https://kauth.kakao.com/oauth/authorize` +
    `?client_id=${process.env.KAKAO_CLIENT_ID}` +
    `&redirect_uri=${encodeURIComponent(process.env.KAKAO_CALLBACK_URL)}` +
    `&response_type=code` +
    `&prompt=login`;
  res.redirect(kakaoAuthUrl);
});

router.get('/kakao/callback',
  (req, res, next) => {
    passport.authenticate('kakao', { session: false }, (err, user) => {
      if (err || !user) {
        console.error('카카오 콜백 에러:', err);
        return res.redirect(`${process.env.CLIENT_URL}/login?error=kakao`);
      }
      const token = generateAccessToken(user.id);
      res.redirect(`${process.env.CLIENT_URL}/auth/callback?token=${token}`);
    })(req, res, next);
  }
);

module.exports = router;