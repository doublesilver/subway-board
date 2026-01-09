const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const { Server } = require('socket.io');
const globalErrorHandler = require('./middleware/errorMiddleware');
const AppError = require('./utils/AppError');
require('dotenv').config();

const routes = require('./routes');
const { startScheduler } = require('./utils/scheduler');
const { RATE_LIMIT, SECURITY } = require('./config/constants');

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 5000;

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
  process.env.FRONTEND_URL,
].filter(Boolean);

console.log('Allowed CORS origins:', allowedOrigins);

app.use(cors({
  origin: function (origin, callback) {
    console.log('CORS request from origin:', origin);
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('CORS blocked for origin:', origin);
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

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

app.use('/api', routes);

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
    console.error('Health check database error:', error);
  }

  const statusCode = health.status === 'OK' ? 200 : 503;
  res.status(statusCode).json(health);
});

// 404 Handler
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global Error Handler
app.use(globalErrorHandler);

// Socket.io 이벤트 핸들러
const { handleSocketConnection } = require('./utils/activeUsers');
io.on('connection', handleSocketConnection);

httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`WebSocket server is ready`);
  startScheduler();
});
