const passport       = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const KakaoStrategy  = require('passport-kakao').Strategy;
const db             = require('./db');
require('dotenv').config();

passport.use(new GoogleStrategy({
  clientID:     process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL:  process.env.GOOGLE_CALLBACK_URL,
}, async (accessToken, refreshToken, profile, done) => {
  try {
    const existing = await db.query(
      `SELECT * FROM users WHERE social_provider = 'google' AND social_id = :1`,
      [profile.id]
    );
    if (existing.rows.length > 0) {
      return done(null, existing.rows[0]);
    }
    const email    = profile.emails[0].value;
    const username = `google_${profile.id}`;
    const result   = await db.query(
      `INSERT INTO users (username, email, password_hash, profile_image, social_provider, social_id)
       VALUES (:1, :2, :3, :4, 'google', :5) RETURNING id INTO :6`,
      [username, email, 'SOCIAL_LOGIN', profile.photos[0]?.value || null, profile.id,
        { dir: require('oracledb').BIND_OUT, type: require('oracledb').NUMBER }]
    );
    const newUser = await db.query(
      `SELECT * FROM users WHERE id = :1`, [result.outBinds[0]]
    );
    return done(null, newUser.rows[0]);
  } catch (err) {
    return done(err, null);
  }
}));

passport.use(new KakaoStrategy({
  clientID:    process.env.KAKAO_CLIENT_ID,
  callbackURL: process.env.KAKAO_CALLBACK_URL,
}, async (accessToken, refreshToken, profile, done) => {
  try {
    const existing = await db.query(
      `SELECT * FROM users WHERE social_provider = 'kakao' AND social_id = :1`,
      [String(profile.id)]
    );
    if (existing.rows.length > 0) {
      return done(null, existing.rows[0]);
    }
    const email    = profile._json?.kakao_account?.email || null;
    const username = `kakao_${profile.id}`;
    const result   = await db.query(
      `INSERT INTO users (username, email, password_hash, profile_image, social_provider, social_id)
       VALUES (:1, :2, :3, :4, 'kakao', :5) RETURNING id INTO :6`,
      [username, email, 'SOCIAL_LOGIN',
       profile._json?.properties?.profile_image || null,
       String(profile.id),
       { dir: require('oracledb').BIND_OUT, type: require('oracledb').NUMBER }]
    );
    const newUser = await db.query(
      `SELECT * FROM users WHERE id = :1`, [result.outBinds[0]]
    );
    return done(null, newUser.rows[0]);
  } catch (err) {
    return done(err, null);
  }
}));

module.exports = passport;