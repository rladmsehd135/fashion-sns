const bcrypt = require('bcryptjs');
const UserModel = require('../models/userModel');
const { generateAccessToken, generateRefreshToken } = require('../utils/generateToken');
const jwt = require('jsonwebtoken');
const { refreshSecret } = require('../config/jwt');

const AuthController = {

  // 회원가입
  register: async (req, res, next) => {
    try {
      const { username, email, password } = req.body;

      if (!username || !email || !password) {
        return res.status(400).json({ message: '모든 항목을 입력해주세요.' });
      }

      // 중복 확인
      const existingEmail = await UserModel.findByEmail(email);
      if (existingEmail) {
        return res.status(409).json({ message: '이미 사용 중인 이메일입니다.' });
      }

      const existingUsername = await UserModel.findByUsername(username);
      if (existingUsername) {
        return res.status(409).json({ message: '이미 사용 중인 닉네임입니다.' });
      }

      const password_hash = await bcrypt.hash(password, 10);
      const userId = await UserModel.create({ username, email, password_hash });

      res.status(201).json({ message: '회원가입이 완료되었습니다.', userId });
    } catch (err) {
      next(err);
    }
  },

  // 로그인
  login: async (req, res, next) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: '이메일과 비밀번호를 입력해주세요.' });
      }

      const user = await UserModel.findByEmail(email);
      if (!user) {
        return res.status(401).json({ message: '이메일 또는 비밀번호가 틀렸습니다.' });
      }

      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) {
        return res.status(401).json({ message: '이메일 또는 비밀번호가 틀렸습니다.' });
      }

      const accessToken  = generateAccessToken(user.id);
      const refreshToken = generateRefreshToken(user.id);

      // refresh token DB 저장
      await UserModel.updateRefreshToken(user.id, refreshToken);

      // refresh token httpOnly 쿠키로 전송
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure:   process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge:   7 * 24 * 60 * 60 * 1000, // 7일
      });

      res.json({
        accessToken,
        user: {
          id:            user.id,
          username:      user.username,
          email:         user.email,
          profile_image: user.profile_image,
        },
      });
    } catch (err) {
      next(err);
    }
  },

  // 토큰 재발급
  refresh: async (req, res, next) => {
    try {
      const token = req.cookies.refreshToken;
      if (!token) {
        return res.status(401).json({ message: '리프레시 토큰이 없습니다.' });
      }

      const decoded = jwt.verify(token, refreshSecret);
      const user    = await UserModel.findById(decoded.id);

      if (!user || user.refresh_token !== token) {
        return res.status(401).json({ message: '유효하지 않은 토큰입니다.' });
      }

      const accessToken = generateAccessToken(user.id);
      res.json({ accessToken });
    } catch (err) {
      return res.status(401).json({ message: '토큰 재발급에 실패했습니다.' });
    }
  },

  // 로그아웃
  logout: async (req, res, next) => {
    try {
      const token = req.cookies.refreshToken;
      if (token) {
        const decoded = jwt.verify(token, refreshSecret);
        await UserModel.updateRefreshToken(decoded.id, null);
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