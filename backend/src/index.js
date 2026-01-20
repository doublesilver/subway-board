const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const compression = require('compression');
const { createServer } = require('http');
const Sentry = require('@sentry/node');
require('dotenv').config();

// Sentry 초기화 (가장 먼저 실행)
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    integrations: [
      Sentry.httpIntegration(),
      Sentry.expressIntegration(),
    ],
  });
}

const socketService = require('./utils/socket');

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 5000;
const isMain = require.main === module;

// Start server only when running directly (avoid listen during tests)
if (isMain) {
  httpServer.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);

    // Start scheduler after server boot
    try {
      const { startScheduler } = require('./utils/scheduler');
      startScheduler();
    } catch (err) {
      console.error('Failed to start scheduler:', err);
    }
  });
}

httpServer.on('error', (err) => {
  console.error('Server error:', err);
  Sentry.captureException(err);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
  Sentry.captureException(err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  Sentry.captureException(reason);
});

// Basic health check
app.get('/health', async (req, res) => {
  const health = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: 'unknown'
  };

  try {
    const pool = require('./db/connection');
    const startTime = Date.now();
    await pool.query('SELECT NOW()');
    const queryTime = Date.now() - startTime;

    health.database = 'connected';
    health.dbResponseTime = `${queryTime}ms`;
  } catch (error) {
    health.status = 'DEGRADED';
    health.database = 'disconnected';
    health.dbError = error.message;
  }

  const statusCode = health.status === 'OK' ? 200 : 503;
  res.status(statusCode).json(health);
});

// Middleware and routes
const globalErrorHandler = require('./middleware/errorMiddleware');
const AppError = require('./utils/AppError');
const logger = require('./utils/logger');
const routes = require('./routes');
const { RATE_LIMIT, SECURITY } = require('./config/constants');

// Trust proxy (Railway, Heroku, etc.)
app.set('trust proxy', 1);

// Response compression
app.use(compression());

// Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", process.env.FRONTEND_URL || 'http://localhost:3000'],
      fontSrc: ["'self'", 'https:', 'data:'],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  hsts: {
    maxAge: SECURITY.HSTS_MAX_AGE,
    includeSubDomains: true,
    preload: true
  },
  referrerPolicy: { policy: 'same-origin' },
  noSniff: true,
  xssFilter: true,
  hidePoweredBy: true
}));

const allowedOrigins = [
  'http://localhost:3000',
  'https://subway-board.vercel.app',
  'https://gagisiro.com',
  'https://www.gagisiro.com',
  process.env.FRONTEND_URL,
].filter(Boolean);

logger.info('Allowed CORS origins:', { origins: allowedOrigins });

// Toss mini domain pattern (https://<appName>.apps.tossmini.com)
const isTossDomain = (origin) => {
  return /^https:\/\/[a-z0-9-]+\.(apps|private-apps)\.tossmini\.com$/.test(origin);
};

// CORS configuration with strict origin validation
app.use(cors({
  origin: function (origin, callback) {
    logger.http('CORS request from origin:', { origin });

    // Block requests with no origin in production (prevents CORS bypass)
    // Allow in development for tools like Postman/curl
    if (!origin) {
      if (process.env.NODE_ENV === 'production') {
        logger.warn('CORS blocked: no origin header in production');
        return callback(new Error('Origin header required'));
      }
      return callback(null, true);
    }

    if (allowedOrigins.indexOf(origin) !== -1 || isTossDomain(origin)) {
      callback(null, true);
    } else {
      logger.warn('CORS blocked for origin:', { origin });
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Socket.io setup (socket.js module)
if (isMain) {
  (async () => {
    await socketService.init(httpServer, {
      cors: {
        origin: (origin, callback) => {
          // Block requests with no origin in production
          if (!origin) {
            if (process.env.NODE_ENV === 'production') {
              return callback(new Error('Origin header required'));
            }
            return callback(null, true);
          }

          if (allowedOrigins.indexOf(origin) !== -1 || isTossDomain(origin)) {
            callback(null, true);
          } else {
            logger.warn('Socket.IO CORS blocked for origin:', { origin });
            callback(new Error('Not allowed by CORS'));
          }
        },
        methods: ['GET', 'POST'],
        credentials: true
      }
    });

    // Socket.io event handler (Redis 연결 후 실행)
    const { handleSocketConnection } = require('./utils/activeUsers');
    const io = socketService.getIO();
    io.on('connection', handleSocketConnection);
  })();
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// HTTP logging
app.use(morgan('combined', { stream: logger.stream }));

const rateLimitKey = (req) => {
  const anonymousId = req.headers['x-anonymous-id'];
  if (anonymousId) return `anon:${anonymousId}`;
  return req.ip;
};

// POST/DELETE rate limit
const writeLimiter = rateLimit({
  windowMs: RATE_LIMIT.WRITE.WINDOW_MS,
  max: RATE_LIMIT.WRITE.MAX,
  message: '너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해주세요.',
  skip: (req) => req.method === 'GET',
  keyGenerator: rateLimitKey,
});

// GET rate limit (DDoS mitigation)
const readLimiter = rateLimit({
  windowMs: RATE_LIMIT.READ.WINDOW_MS,
  max: RATE_LIMIT.READ.MAX,
  message: '너무 많은 조회 요청이 발생했습니다. 잠시 후 다시 시도해주세요.',
  skip: (req) => req.method !== 'GET',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: rateLimitKey,
});

app.use('/api', writeLimiter);
app.use('/api', readLimiter);

app.use('/api', routes);
app.use('/api-docs', require('./routes/docs'));

app.get('/', (req, res) => {
  res.json({
    message: '출퇴근길 익명 게시판 API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      subwayLines: '/api/subway-lines',
      posts: '/api/posts/line/:lineId',
      comments: '/api/posts/:postId/comments'
    }
  });
});

// 404 handler
app.all('/{*path}', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global error handler
app.use(globalErrorHandler);

module.exports = app;
