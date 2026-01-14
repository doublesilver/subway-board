const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const compression = require('compression');
const { createServer } = require('http');
const { Server } = require('socket.io');
const globalErrorHandler = require('./middleware/errorMiddleware');
const AppError = require('./utils/AppError');
const logger = require('./utils/logger');
require('dotenv').config();

const routes = require('./routes');
const { startScheduler } = require('./utils/scheduler');
const { RATE_LIMIT, SECURITY } = require('./config/constants');

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 5000;

// Trust proxy (Railway, Heroku 등 클라우드 플랫폼용)
app.set('trust proxy', 1);

// 응답 압축 (성능 최적화)
app.use(compression());

// 보안 헤더 강화
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", process.env.FRONTEND_URL || "http://localhost:3000"],
      fontSrc: ["'self'", "https:", "data:"],
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
console.log('[DEBUG] CORS origins set, continuing...');

// 토스 미니앱 도메인 패턴 (https://<appName>.apps.tossmini.com 등)
const isTossDomain = (origin) => {
  return /^https:\/\/[a-z0-9-]+\.(apps|private-apps)\.tossmini\.com$/.test(origin);
};

app.use(cors({
  origin: function (origin, callback) {
    logger.http('CORS request from origin:', { origin });

    // allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1 || isTossDomain(origin)) {
      callback(null, true);
    } else {
      logger.warn('CORS blocked for origin:', { origin });
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Socket.io 설정
const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Socket.io를 activeUsers에서 사용할 수 있도록 글로벌로 설정
global.io = io;
console.log('[DEBUG] Socket.io initialized');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// HTTP 요청 로깅
app.use(morgan('combined', { stream: logger.stream }));

// POST/DELETE 요청 Rate Limit
const writeLimiter = rateLimit({
  windowMs: RATE_LIMIT.WRITE.WINDOW_MS,
  max: RATE_LIMIT.WRITE.MAX,
  message: '너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해주세요.',
  skip: (req) => req.method === 'GET',
});

// GET 요청 Rate Limit (DDoS 방어)
const readLimiter = rateLimit({
  windowMs: RATE_LIMIT.READ.WINDOW_MS,
  max: RATE_LIMIT.READ.MAX,
  message: '너무 많은 조회 요청이 발생했습니다. 잠시 후 다시 시도해주세요.',
  skip: (req) => req.method !== 'GET',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api', writeLimiter);
app.use('/api', readLimiter);
console.log('[DEBUG] Rate limiters set');

app.use('/api', routes);
console.log('[DEBUG] Routes loaded');

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
console.log('[DEBUG] Root route defined');

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
    const result = await pool.query('SELECT NOW()');
    const queryTime = Date.now() - startTime;

    health.database = 'connected';
    health.dbResponseTime = `${queryTime}ms`;
  } catch (error) {
    health.status = 'DEGRADED';
    health.database = 'disconnected';
    health.dbError = error.message;
    logger.error('Health check database error:', { error: error.message, stack: error.stack });
  }

  const statusCode = health.status === 'OK' ? 200 : 503;
  res.status(statusCode).json(health);
});
console.log('[DEBUG] Health route defined');

// 404 Handler
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global Error Handler
app.use(globalErrorHandler);
console.log('[DEBUG] Error handler set');

// Socket.io 이벤트 핸들러
const { handleSocketConnection } = require('./utils/activeUsers');
io.on('connection', handleSocketConnection);
console.log('[DEBUG] Socket connection handler set');

// 서버 시작
console.log(`Attempting to start server on port ${PORT}...`);
httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  logger.info(`Server is running on port ${PORT}`);
  logger.info('WebSocket server is ready');
  try {
    startScheduler();
  } catch (err) {
    logger.error('Failed to start scheduler:', err);
  }
});

httpServer.on('error', (err) => {
  console.error('Server error:', err);
  logger.error('Server error:', err);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
  process.exit(1);
});

module.exports = app;
