const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
dotenv.config();

const appDB = mysql.createPool({
  host: process.env.APP_DB_HOST || 'localhost',
  user: process.env.APP_DB_USER || 'root',
  password: process.env.APP_DB_PASS || '',
  database: process.env.DB_NAME || 'emailscale_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function query(pool, sql, params = []) {
  const [rows] = await pool.execute(sql, params);
  return rows;
}

const queryApp = (sql, params) => query(appDB, sql, params);

module.exports = { appDB, query, queryApp };
