const fs = require('fs');
const path = require('path');
const pool = require('./connection');

async function migrate() {
  let client;
  try {
    console.log('Starting user schema update...');

    client = await pool.connect();

    const schemaPath = path.join(__dirname, 'migrations/update-user-schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');

    await client.query(schema);

    console.log('User schema updated successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    if (client) {
      client.release();
    }
    await pool.end();
  }
}

migrate();
