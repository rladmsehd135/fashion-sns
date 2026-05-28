const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const db     = require('../config/db');
const { generateAccessToken, generateRefreshToken } = require('../utils/generateToken');
const { refreshSecret } = require('../config/jwt');

const AuthController = {

  register: async (req, res, next) => {
    try {
      const { username, email, password, preferred_style } = req.body;
      if (!username || !email || !password) {
        return res.status(400).json({ message: '모든 항목을 입력해주세요.' });
      }
      const existEmail = await db.query(`SELECT id FROM users WHERE email = :1`, [email]);
      if (existEmail.rows.length > 0) return res.status(409).json({ message: '이미 사용 중인 이메일입니다.' });
      const existUsername = await db.query(`SELECT id FROM users WHERE username = :1`, [username]);
      if (existUsername.rows.length > 0) return res.status(409).json({ message: '이미 사용 중인 닉네임입니다.' });

      const password_hash = await bcrypt.hash(password, 10);
      const result = await db.query(
        `INSERT INTO users (username, email, password_hash, preferred_style)
         VALUES (:1, :2, :3, :4) RETURNING id INTO :5`,
        [username, email, password_hash, preferred_style || null,
          { dir: require('oracledb').BIND_OUT, type: require('oracledb').NUMBER }]
      );
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
      const user   = result.rows[0];
      if (!user) {
        return res.status(401).json({ message: '이메일 또는 비밀번호가 틀렸습니다.' });
      }
      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) {
        return res.status(401).json({ message: '이메일 또는 비밀번호가 틀렸습니다.' });
      }
      const accessToken  = generateAccessToken(user.id);
      const refreshToken = generateRefreshToken(user.id);
      await db.query(`UPDATE users SET refresh_token = :1 WHERE id = :2`, [refreshToken, user.id]);
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure:   process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge:   7 * 24 * 60 * 60 * 1000,
      });
      res.json({
        accessToken,
        user: { id: user.id, username: user.username, email: user.email, profile_image: user.profile_image },
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
      const result  = await db.query(`SELECT refresh_token FROM users WHERE id = :1`, [decoded.id]);
      const user    = result.rows[0];
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
};

module.exports = AuthController;