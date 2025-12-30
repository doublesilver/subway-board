const pool = require('./connection');
const fs = require('fs');
const path = require('path');

async function migrateKakaoLogin() {
  let client;
  try {
    console.log('Starting Kakao login migration...');
    client = await pool.connect();

    const sqlPath = path.join(__dirname, 'migrations', 'add-kakao-login.sql');
    const sql = fs.readFileSync(sqlPath, 'utf-8');

    await client.query(sql);
    console.log('Kakao login migration completed successfully!');

    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    console.error('Error details:', error.message);
    process.exit(1);
  } finally {
    if (client) client.release();
    await pool.end();
  }
}

migrateKakaoLogin();
