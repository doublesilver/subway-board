const pool = require('./connection');
const logger = require('../utils/logger');

async function createIndexes() {
    try {
        logger.info('Starting database index optimization...');

        // Create composite index for posts filtering by subway_line_id and sorting by created_at
        const query = `
      CREATE INDEX IF NOT EXISTS idx_posts_line_created 
      ON posts(subway_line_id, created_at);
    `;

        await pool.query(query);
        logger.info('Successfully created index: idx_posts_line_created');

        // Verify indexes
        const verifyQuery = `
      SELECT indexname, indexdef 
      FROM pg_indexes 
      WHERE tablename = 'posts';
    `;

        const result = await pool.query(verifyQuery);
        console.table(result.rows);

        logger.info('Database optimization completed.');
    } catch (error) {
        logger.error('Failed to create indexes', { error: error.message });
    } finally {
        pool.end();
    }
}

createIndexes();
