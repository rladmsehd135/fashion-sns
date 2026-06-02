/**
 * 랭킹 테스트용 시드 데이터 스크립트
 * 실행: node server/scripts/seedRanking.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const db = require('../config/db');

// ── 브랜드 풀 ──
const BRANDS = [
  '나이키', '아디다스', '뉴발란스', '반스', '컨버스',
  '노스페이스', '파타고니아', '아크테릭스', '살로몬', '스투시',
  '무신사스탠다드', '마르디메크르디', '드파운드', '아크아크', '노이지아',
  '아미', '메종마르지엘라', '아크네스튜디오스', '오프화이트', '꼼데가르송',
  '리복', '푸마', '아식스', '호카', '온러닝',
];

// ── 카테고리별 아이템 ──
const ITEMS = {
  top: [
    '오버핏 반팔 티셔츠', '기본 로고 티', '스트라이프 롱슬리브', '피그먼트 후드티',
    '크루넥 니트', '터틀넥 스웨터', '헨리넥 티', '세미오버 셔츠', '린넨 반팔',
  ],
  bottom: [
    '와이드 데님 팬츠', '슬림 슬랙스', '카고 트라우저', '코듀로이 팬츠',
    '트레이닝 조거', '린넨 와이드 팬츠', '스트레이트 진', '숏 데님',
  ],
  outer: [
    '구스다운 패딩', '코치 재킷', '트렌치코트', '레더 라이더 재킷',
    '울 블레이저', '후리스 집업', '아노락 바람막이', '롱 울코트',
  ],
  shoes: [
    '러닝화', '에어맥스', '로우 스니커즈', '하이탑 스니커즈',
    '첼시 부츠', '로퍼', '사이드 고어 부츠', '슬립온', '샌들',
  ],
  bag: [
    '캔버스 토트백', '나일론 백팩', '미니 숄더백', '웨이스트 파우치',
    '클러치백', '트롤리 캐리어', '메신저백', '버킷백',
  ],
  acc: [
    '볼캡', '버킷햇', '비니', '울 스카프', '선글라스',
    '레더 벨트', '링 체인 목걸이', '슬리브 양말',
  ],
};

const FIT_REVIEWS = ['small', 'true', 'large'];
const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

async function seed() {
  console.log('🌱 DB 연결 중...');
  await db.init();

  // 1. 기존 포스트 조회
  const postsRes = await db.query(
    `SELECT id FROM posts WHERE is_deleted = 0 ORDER BY id`
  );
  const postIds = postsRes.rows.map(r => r.id);
  console.log(`📋 기존 게시물 ${postIds.length}개 발견`);

  if (postIds.length === 0) {
    console.log('❌ 게시물이 없습니다. 먼저 게시물을 작성해주세요.');
    process.exit(1);
  }

  // 2. 기존 post_items 삭제 (재시드 가능하도록)
  await db.query(`DELETE FROM post_items WHERE 1=1`);
  console.log('🗑️  기존 post_items 삭제 완료');

  // 3. post_items 삽입
  let inserted = 0;
  for (const postId of postIds) {
    const numItems = randInt(1, 4);
    for (let i = 0; i < numItems; i++) {
      const brand  = rand(BRANDS);
      const catKeys = Object.keys(ITEMS);
      const cat    = rand(catKeys);
      const item   = rand(ITEMS[cat]);
      const price  = randInt(2, 30) * 10000;  // 2만 ~ 30만원

      await db.query(
        `INSERT INTO post_items
         (post_id, brand_name, item_name, category, price, currency, fit_review)
         VALUES (:1, :2, :3, :4, :5, :6, :7)`,
        [postId, brand, item, cat, price, 'KRW', rand(FIT_REVIEWS)]
      );
      inserted++;
    }

    // 좋아요 수 다양화 (랭킹 점수용)
    const likes = randInt(0, 250);
    await db.query(
      `UPDATE posts SET likes_count = :1 WHERE id = :2`,
      [likes, postId]
    );
  }

  console.log(`✅ post_items ${inserted}개 삽입 완료`);

  // 4. 결과 미리보기
  const brandSummary = await db.query(
    `SELECT pi.brand_name, COUNT(*) AS cnt
     FROM post_items pi
     GROUP BY pi.brand_name
     ORDER BY cnt DESC
     FETCH FIRST 5 ROWS ONLY`
  );
  console.log('\n📊 상위 5개 브랜드:');
  brandSummary.rows.forEach((r, i) => {
    console.log(`  ${i + 1}. ${r.brand_name} — ${r.cnt}개 아이템`);
  });

  console.log('\n🎉 시드 완료! 서버를 재시작하면 랭킹 페이지에 데이터가 표시됩니다.');
  process.exit(0);
}

seed().catch(err => {
  console.error('❌ 시드 오류:', err.message);
  process.exit(1);
});
