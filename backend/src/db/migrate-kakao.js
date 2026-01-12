const pool = require('./connection');
const fs = require('fs');
const path = require('path');

async function migrateKakaoLogin() {
  let client;
  const maxRetries = 3;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Starting Kakao login migration... (Attempt ${attempt}/${maxRetries})`);

      client = await pool.connect();

      const sqlPath = path.join(__dirname, 'migrations', 'add-kakao-login.sql');
      const sql = fs.readFileSync(sqlPath, 'utf-8');

      await client.query(sql);

      console.log('Kakao login migration completed successfully!');
      process.exit(0);
    } catch (error) {
      console.error(`Kakao migration failed (Attempt ${attempt}/${maxRetries}):`, error.message);

      if (client) {
        client.release();
        client = null;
      }

      // If this was the last attempt, exit with error
      if (attempt === maxRetries) {
        console.error('All Kakao migration attempts failed');
        process.exit(1);
      }

      // Wait before retrying (exponential backoff)
      const delay = 2000 * Math.pow(2, attempt - 1); // 2s, 4s, 8s
      console.log(`Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    } finally {
      if (attempt === maxRetries) {
        await pool.end();
      }
    }
  }
}

migrateKakaoLogin();
