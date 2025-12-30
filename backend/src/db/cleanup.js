const pool = require('./connection');
const fs = require('fs');
const path = require('path');

async function cleanup() {
  let client;
  try {
    console.log('Starting cleanup: removing special subway lines...');
    client = await pool.connect();

    const sqlPath = path.join(__dirname, 'cleanup-lines.sql');
    const sql = fs.readFileSync(sqlPath, 'utf-8');

    const result = await client.query(sql);
    console.log('Cleanup completed successfully!');
    console.log(`Deleted ${result.rowCount} special subway lines and their related posts/comments.`);

    process.exit(0);
  } catch (error) {
    console.error('Cleanup failed:', error);
    console.error('Error details:', error.message);
    process.exit(1);
  } finally {
    if (client) client.release();
    await pool.end();
  }
}

cleanup();
