/**
 * 테스트 계정 일괄 생성 스크립트
 * 실행: node server/scripts/seedUsers.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const bcrypt   = require('bcryptjs');
const { init, query } = require('../config/db');

const START    = 40;
const END      = 60;
const PASSWORD = 'rladmsehd12@';
const DOMAIN   = 'naver.com';

(async () => {
  try {
    await init();
    console.log('DB 연결 성공\n');

    const hash = await bcrypt.hash(PASSWORD, 10);
    console.log(`비밀번호 해시 완료: ${hash}\n`);

    let created = 0, skipped = 0;

    for (let i = START; i <= END; i++) {
      const email    = `${i}@${DOMAIN}`;
      const username = String(i);

      // 이미 존재하는 이메일/유저네임 건너뜀
      const exists = await query(
        `SELECT id FROM users WHERE email = :1 OR username = :2`,
        [email, username]
      );

      if (exists.rows.length > 0) {
        console.log(`⚠️  SKIP — 이미 존재: ${email}`);
        skipped++;
        continue;
      }

      await query(
        `INSERT INTO users (username, email, password_hash, is_active)
         VALUES (:1, :2, :3, 1)`,
        [username, email, hash]
      );

      console.log(`✅ 생성 완료: ${email}  /  username: ${username}`);
      created++;
    }

    console.log(`\n완료 — 생성: ${created}개, 건너뜀: ${skipped}개`);
    process.exit(0);
  } catch (err) {
    console.error('오류:', err.message);
    process.exit(1);
  }
})();
