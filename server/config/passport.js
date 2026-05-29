const passport      = require('passport');
const KakaoStrategy = require('passport-kakao').Strategy;
const db            = require('./db');
const oracledb      = require('oracledb');
require('dotenv').config();

passport.use(new KakaoStrategy({
  clientID:     process.env.KAKAO_CLIENT_ID,
  clientSecret: process.env.KAKAO_CLIENT_SECRET || '',
  callbackURL:  process.env.KAKAO_CALLBACK_URL,
}, async (accessToken, refreshToken, profile, done) => {
  try {
    console.log('카카오 프로필:', JSON.stringify(profile, null, 2));

    const socialId = String(profile.id);

    // 기존 소셜 계정 확인
    const existing = await db.query(
      `SELECT * FROM users WHERE social_provider = 'kakao' AND social_id = :1`,
      [socialId]
    );
    if (existing.rows.length > 0) {
      return done(null, existing.rows[0]);
    }

    // 카카오 프로필에서 정보 추출
    const kakaoAccount = profile._json?.kakao_account;
    const email        = kakaoAccount?.email || `kakao_${socialId}@fitlog.social`;
    const nickname     = profile._json?.properties?.nickname || `kakao_${socialId}`;
    const profileImg   = profile._json?.properties?.profile_image || null;

    // 닉네임 중복 체크
    const dupCheck = await db.query(
      `SELECT id FROM users WHERE username = :1`, [nickname]
    );
    const finalUsername = dupCheck.rows.length > 0
      ? `${nickname}_${socialId.slice(-4)}`
      : nickname;

    // 신규 유저 생성
    const result = await db.query(
      `INSERT INTO users (username, email, password_hash, profile_image, social_provider, social_id)
       VALUES (:1, :2, 'SOCIAL_LOGIN', :3, 'kakao', :4) RETURNING id INTO :5`,
      [finalUsername, email, profileImg, socialId,
        { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }]
    );

    const newUser = await db.query(
      `SELECT * FROM users WHERE id = :1`, [result.outBinds]
    );

    return done(null, newUser.rows[0]);
  } catch (err) {
    console.error('카카오 로그인 에러:', err);
    return done(err, null);
  }
}));

module.exports = passport;