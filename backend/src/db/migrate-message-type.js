const fs = require('fs');
const path = require('path');
const pool = require('./connection');

async function migrate() {
  let client;
  try {
    console.log('Starting message type migration...');

    client = await pool.connect();

    const schemaPath = path.join(__dirname, 'migrations/add-message-type.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');

    await client.query(schema);

    console.log('Message type migration completed successfully!');
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
