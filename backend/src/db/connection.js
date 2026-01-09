const { Pool } = require('pg');
const { DATABASE } = require('../config/constants');
const logger = require('../utils/logger');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: DATABASE.POOL_MAX,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 30000, // Increased from 2s to 30s for cloud databases
  statement_timeout: 30000, // Query timeout
  query_timeout: 30000, // Additional query timeout
});

pool.on('error', (err) => {
  logger.error('Unexpected error on idle database client', {
    error: err.message,
    stack: err.stack,
    code: err.code
  });
  process.exit(-1);
});

// Helper function to retry database queries with exponential backoff
const queryWithRetry = async (text, params, maxRetries = 3) => {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await pool.query(text, params);

      // Log success on retry
      if (attempt > 1) {
        logger.info('Database query succeeded after retry', { attempt });
      }

      return result;
    } catch (error) {
      lastError = error;

      // Check if error is retryable
      const isRetryable =
        error.message.includes('timeout') ||
        error.message.includes('connection') ||
        error.code === 'ECONNREFUSED' ||
        error.code === 'ETIMEDOUT' ||
        error.code === '57P03'; // cannot_connect_now

      if (!isRetryable || attempt === maxRetries) {
        throw error;
      }

      // Exponential backoff: 100ms, 200ms, 400ms
      const delay = 100 * Math.pow(2, attempt - 1);
      logger.warn(`Database query retry`, {
        attempt,
        maxRetries,
        delayMs: delay,
        error: error.message,
        code: error.code
      });
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
};

module.exports = pool;
module.exports.queryWithRetry = queryWithRetry;
