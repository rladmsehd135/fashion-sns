const oracledb = require('oracledb');
require('dotenv').config();

oracledb.outFormat    = oracledb.OUT_FORMAT_OBJECT;
oracledb.autoCommit   = true;
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

// 쿼리 실행 헬퍼 — 컬럼명 소문자 변환 포함
const query = async (sql, params = []) => {
  const connection = await pool.getConnection();
  try {
    const result = await connection.execute(sql, params, {
      outFormat: oracledb.OUT_FORMAT_OBJECT,
    });

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

module.exports = { init, query };