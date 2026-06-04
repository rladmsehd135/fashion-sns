// 아이템 핀 좌표 컬럼 추가 마이그레이션
// 실행: node server/scripts/migrateItemPins.js
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const db = require('../config/db');

(async () => {
  await db.init ? db.init() : null;
  // db가 pool 기반이므로 직접 init 호출
  const { init, query } = require('../config/db');
  try { await init(); } catch (e) { console.error('DB init error', e); process.exit(1); }

  const migrations = [
    `ALTER TABLE post_items ADD x_pct    NUMBER`,
    `ALTER TABLE post_items ADD y_pct    NUMBER`,
    `ALTER TABLE post_items ADD image_index NUMBER DEFAULT 0`,
  ];

  for (const sql of migrations) {
    try {
      await query(sql);
      console.log('OK:', sql);
    } catch (e) {
      if (e.message?.includes('ORA-01430') || e.message?.includes('already exists')) {
        console.log('SKIP (already exists):', sql);
      } else {
        console.error('ERROR:', e.message);
      }
    }
  }

  console.log('마이그레이션 완료');
  process.exit(0);
})();
