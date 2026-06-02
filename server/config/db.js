const oracledb = require('oracledb');
require('dotenv').config();

oracledb.outFormat     = oracledb.OUT_FORMAT_OBJECT;
oracledb.autoCommit    = true;
oracledb.fetchAsString = [oracledb.CLOB];

let pool;

const init = async () => {
  pool = await oracledb.createPool({
    user:          process.env.DB_USER,
    password:      process.env.DB_PASSWORD,
    connectString: process.env.DB_CONNECT_STRING,
    poolMin:       2,
    poolMax:       10,
    poolIncrement: 1,
  });
  console.log('Oracle DB 연결 성공');
};

const query = async (sql, params = []) => {
  const connection = await pool.getConnection();
  try {
    const result = await connection.execute(sql, params, {
      outFormat:  oracledb.OUT_FORMAT_OBJECT,
      autoCommit: true,
    });

    // outBinds 정리 — RETURNING INTO 결과
    if (result.outBinds) {
      const keys = Object.keys(result.outBinds);
      if (keys.length > 0) {
        const first = result.outBinds[keys[0]];
        result.outBinds = Array.isArray(first) ? first[0] : first;
      }
    }

    // 컬럼명 소문자 변환
    if (result.rows) {
      result.rows = result.rows.map(row => {
        const lower = {};
        Object.keys(row).forEach(key => {
          lower[key.toLowerCase()] = row[key];
        });
        return lower;
      });
    }

    return result;
  } finally {
    await connection.close();
  }
};

const initGroupTables = async () => {
  const ddl = [
    `ALTER TABLE chat_rooms ADD room_type VARCHAR2(10) DEFAULT 'direct'`,
    `ALTER TABLE chat_rooms ADD room_name VARCHAR2(100)`,
    `ALTER TABLE chat_rooms ADD room_image VARCHAR2(500)`,
    `ALTER TABLE chat_rooms MODIFY request_id NULL`,
    `ALTER TABLE chat_rooms MODIFY user1_id NULL`,
    `ALTER TABLE chat_rooms MODIFY user2_id NULL`,
    `ALTER TABLE chat_messages MODIFY message_type VARCHAR2(20)`,
    `ALTER TABLE chat_messages DROP CONSTRAINT CHK_MSG_TYPE`,
    `ALTER TABLE chat_messages ADD CONSTRAINT CHK_MSG_TYPE CHECK (message_type IN ('text', 'image', 'story_reply'))`,
    // 게시물 사람 태그
    `CREATE TABLE post_tags (
       id         NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
       post_id    NUMBER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
       user_id    NUMBER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
       CONSTRAINT uq_post_tag UNIQUE (post_id, user_id)
     )`,
    // 스토리 사람 태그
    `CREATE TABLE story_tags (
       id         NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
       story_id   NUMBER NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
       user_id    NUMBER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
       CONSTRAINT uq_story_tag UNIQUE (story_id, user_id)
     )`,
    // 리포스트
    `ALTER TABLE posts ADD repost_count NUMBER DEFAULT 0`,
    `ALTER TABLE posts ADD repost_origin_id NUMBER`,
    `UPDATE chat_rooms SET room_type = 'direct' WHERE room_type IS NULL`,
    `CREATE TABLE group_members (
       id       NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
       room_id  NUMBER NOT NULL REFERENCES chat_rooms(id),
       user_id  NUMBER NOT NULL REFERENCES users(id),
       is_admin NUMBER(1) DEFAULT 0,
       joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
       CONSTRAINT uq_group_member UNIQUE (room_id, user_id)
     )`,
    `CREATE TABLE group_read_status (
       room_id     NUMBER NOT NULL REFERENCES chat_rooms(id),
       user_id     NUMBER NOT NULL REFERENCES users(id),
       last_read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
       CONSTRAINT pk_grs PRIMARY KEY (room_id, user_id)
     )`,
    `CREATE TABLE user_blocks (
       id         NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
       blocker_id NUMBER NOT NULL REFERENCES users(id),
       blocked_id NUMBER NOT NULL REFERENCES users(id),
       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
       CONSTRAINT uq_user_block UNIQUE (blocker_id, blocked_id)
     )`,
    `CREATE TABLE user_reports (
       id          NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
       reporter_id NUMBER NOT NULL REFERENCES users(id),
       reported_id NUMBER NOT NULL REFERENCES users(id),
       reason      VARCHAR2(200),
       created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
     )`,
  ];
  for (const sql of ddl) {
    try { await query(sql); } catch (_) { /* 이미 존재하면 무시 */ }
  }
};

module.exports = { init, query, initGroupTables };