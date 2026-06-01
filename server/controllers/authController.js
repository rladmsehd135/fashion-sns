const { sendVerificationCode } = require('../utils/mailer');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { generateAccessToken, generateRefreshToken } = require('../utils/generateToken');
const { refreshSecret } = require('../config/jwt');
const verificationCodes = new Map();
const changeVerificationCodes = new Map(); // 변경용 인증코드 별도 관리

const AuthController = {

  // 인증코드 발송
  sendCode: async (req, res, next) => {
    try {
      const { email } = req.body;
      if (!email) return res.status(400).json({ message: '이메일을 입력해주세요.' });

      // 이미 가입된 이메일 확인
      const existing = await db.query(
        `SELECT id FROM users WHERE email = :1`, [email]
      );
      if (existing.rows.length > 0) {
        return res.status(409).json({ message: '이미 사용 중인 이메일이에요.' });
      }

      // 6자리 랜덤 코드 생성
      const code = String(Math.floor(100000 + Math.random() * 900000));

      // 5분 후 만료
      verificationCodes.set(email, {
        code,
        expiresAt: Date.now() + 5 * 60 * 1000,
      });

      await sendVerificationCode(email, code);
      res.json({ message: '인증코드가 발송되었어요.' });
    } catch (err) { next(err); }
  },

  // 인증코드 확인
  verifyCode: async (req, res, next) => {
    try {
      const { email, code } = req.body;
      if (!email || !code) {
        return res.status(400).json({ message: '이메일과 인증코드를 입력해주세요.' });
      }

      const stored = verificationCodes.get(email);

      if (!stored) {
        return res.status(400).json({ message: '인증코드를 먼저 발송해주세요.' });
      }
      if (Date.now() > stored.expiresAt) {
        verificationCodes.delete(email);
        return res.status(400).json({ message: '인증코드가 만료되었어요. 다시 발송해주세요.' });
      }
      if (stored.code !== code) {
        return res.status(400).json({ message: '인증코드가 올바르지 않아요.' });
      }

      // 인증 성공 — verified 표시
      verificationCodes.set(email, { ...stored, verified: true });
      res.json({ message: '이메일 인증이 완료되었어요.' });
    } catch (err) { next(err); }
  },
  register: async (req, res, next) => {
    try {
      const { username, email, password, preferred_style, style_1, style_2 } = req.body;
      if (!username || !email || !password) {
        return res.status(400).json({ message: '모든 항목을 입력해주세요.' });
      }

      // ← 이메일 인증 확인 추가
      const stored = verificationCodes.get(email);
      if (!stored || !stored.verified) {
        return res.status(400).json({ message: '이메일 인증이 필요해요.' });
      }

      // 기존 중복 확인 로직...
      const existEmail = await db.query(
        `SELECT id FROM users WHERE email = :1`, [email]
      );
      if (existEmail.rows.length > 0) {
        return res.status(409).json({ message: '이미 사용 중인 이메일입니다.' });
      }
      const existUsername = await db.query(
        `SELECT id FROM users WHERE username = :1`, [username]
      );
      if (existUsername.rows.length > 0) {
        return res.status(409).json({ message: '이미 사용 중인 닉네임입니다.' });
      }

      const password_hash = await bcrypt.hash(password, 10);
      const result = await db.query(
        `INSERT INTO users (username, email, password_hash, preferred_style, style_1, style_2)
       VALUES (:1, :2, :3, :4, :5, :6) RETURNING id INTO :7`,
        [username, email, password_hash,
          preferred_style || null, style_1 || null, style_2 || null,
          { dir: require('oracledb').BIND_OUT, type: require('oracledb').NUMBER }]
      );

      // 인증코드 삭제
      verificationCodes.delete(email);

      res.status(201).json({ message: '회원가입이 완료되었습니다.', userId: result.outBinds });
    } catch (err) { next(err); }
  },

  login: async (req, res, next) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ message: '이메일과 비밀번호를 입력해주세요.' });
      }
      const result = await db.query(`SELECT * FROM users WHERE email = :1 AND is_active = 1`, [email]);
      const user = result.rows[0];
      if (!user) {
        return res.status(401).json({ message: '이메일 또는 비밀번호가 틀렸습니다.' });
      }
      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) {
        return res.status(401).json({ message: '이메일 또는 비밀번호가 틀렸습니다.' });
      }
      const accessToken = generateAccessToken(user.id);
      const refreshToken = generateRefreshToken(user.id);
      await db.query(`UPDATE users SET refresh_token = :1 WHERE id = :2`, [refreshToken, user.id]);
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
      res.json({
        accessToken,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          profile_image: user.profile_image,
          bio: user.bio,
          height: user.height,
          weight: user.weight,
          preferred_style: user.preferred_style,
          style_1: user.style_1,
          style_2: user.style_2,
        },
      });
    } catch (err) {
      next(err);
    }
  },

  refresh: async (req, res, next) => {
    try {
      const token = req.cookies.refreshToken;
      if (!token) return res.status(401).json({ message: '리프레시 토큰이 없습니다.' });
      const decoded = jwt.verify(token, refreshSecret);
      const result = await db.query(`SELECT refresh_token FROM users WHERE id = :1`, [decoded.id]);
      const user = result.rows[0];
      if (!user || user.refresh_token !== token) {
        return res.status(401).json({ message: '유효하지 않은 리프레시 토큰입니다.' });
      }
      const accessToken = generateAccessToken(decoded.id);
      res.json({ accessToken });
    } catch (err) {
      next(err);
    }
  },

  logout: async (req, res, next) => {
    try {
      const token = req.cookies.refreshToken;
      if (token) {
        const decoded = jwt.verify(token, refreshSecret);
        await db.query(`UPDATE users SET refresh_token = NULL WHERE id = :1`, [decoded.id]);
      }
      res.clearCookie('refreshToken');
      res.json({ message: '로그아웃 되었습니다.' });
    } catch (err) {
      res.clearCookie('refreshToken');
      res.json({ message: '로그아웃 되었습니다.' });
    }
  },
  // 변경용 인증코드 발송 (로그인된 유저)
  sendCodeForChange: async (req, res, next) => {
    try {
      const user = await db.query(
        `SELECT email FROM users WHERE id = :1`, [req.userId]
      );
      if (!user.rows[0]) return res.status(404).json({ message: '유저를 찾을 수 없어요.' });

      const email = user.rows[0].email;
      if (email.startsWith('kakao_')) {
        return res.status(400).json({ message: '소셜 로그인 계정은 비밀번호를 변경할 수 없어요.' });
      }

      const code = String(Math.floor(100000 + Math.random() * 900000));
      changeVerificationCodes.set(req.userId, {
        code,
        expiresAt: Date.now() + 5 * 60 * 1000,
      });

      await sendVerificationCode(email, code);
      res.json({ message: '인증코드가 발송되었어요.', email });
    } catch (err) { next(err); }
  },

  // 변경용 인증코드 확인
  verifyCodeForChange: async (req, res, next) => {
    try {
      const { code } = req.body;
      const stored = changeVerificationCodes.get(req.userId);

      if (!stored) return res.status(400).json({ message: '인증코드를 먼저 발송해주세요.' });
      if (Date.now() > stored.expiresAt) {
        changeVerificationCodes.delete(req.userId);
        return res.status(400).json({ message: '인증코드가 만료되었어요.' });
      }
      if (stored.code !== code) {
        return res.status(400).json({ message: '인증코드가 올바르지 않아요.' });
      }

      changeVerificationCodes.set(req.userId, { ...stored, verified: true });
      res.json({ message: '인증이 완료되었어요.' });
    } catch (err) { next(err); }
  },

  // 비밀번호 변경
  changePassword: async (req, res, next) => {
    try {
      const { newPassword } = req.body;
      const stored = changeVerificationCodes.get(req.userId);

      if (!stored?.verified) {
        return res.status(400).json({ message: '이메일 인증이 필요해요.' });
      }
      if (!newPassword || newPassword.length < 8) {
        return res.status(400).json({ message: '비밀번호는 8자 이상이어야 해요.' });
      }

      const hash = await bcrypt.hash(newPassword, 10);
      await db.query(`UPDATE users SET password_hash = :1 WHERE id = :2`, [hash, req.userId]);
      changeVerificationCodes.delete(req.userId);
      res.json({ message: '비밀번호가 변경되었어요.' });
    } catch (err) { next(err); }
  },

  // 닉네임 변경
  changeUsername: async (req, res, next) => {
    try {
      const { newUsername } = req.body;
      const stored = changeVerificationCodes.get(req.userId);

      if (!stored?.verified) {
        return res.status(400).json({ message: '이메일 인증이 필요해요.' });
      }
      if (!newUsername || newUsername.trim().length < 2) {
        return res.status(400).json({ message: '닉네임은 2자 이상이어야 해요.' });
      }

      const existing = await db.query(
        `SELECT id FROM users WHERE username = :1 AND id != :2`,
        [newUsername.trim(), req.userId]
      );
      if (existing.rows.length > 0) {
        return res.status(409).json({ message: '이미 사용 중인 닉네임이에요.' });
      }

      await db.query(
        `UPDATE users SET username = :1 WHERE id = :2`,
        [newUsername.trim(), req.userId]
      );
      changeVerificationCodes.delete(req.userId);
      res.json({ message: '닉네임이 변경되었어요.', username: newUsername.trim() });
    } catch (err) { next(err); }
  },
};

module.exports = AuthController;