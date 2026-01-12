const pool = require('./connection');

async function testConnection() {
  console.log('Testing database connection...');
  console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set (hidden)' : 'NOT SET');

  try {
    const client = await pool.connect();
    console.log('✅ Database connection successful!');

    const result = await client.query('SELECT NOW()');
    console.log('Current time from DB:', result.rows[0].now);

    // Check if feedback table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'feedback'
      );
    `);

    console.log('Feedback table exists:', tableCheck.rows[0].exists);

    client.release();
    process.exit(0);
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('Error code:', error.code);
    process.exit(1);
  }
}

testConnection();
