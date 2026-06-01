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
  ];
  for (const sql of ddl) {
    try { await query(sql); } catch (_) { /* 이미 존재하면 무시 */ }
  }
};

module.exports = { init, query, initGroupTables };