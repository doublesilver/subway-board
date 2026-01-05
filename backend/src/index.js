const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const rateLimit = require('express-rate-limit');
const globalErrorHandler = require('./middleware/errorMiddleware');
const AppError = require('./utils/AppError');
require('dotenv').config();

const routes = require('./routes');
const { startScheduler } = require('./utils/scheduler');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(helmet());

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

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// POST/DELETE 요청에만 Rate Limit 적용 (GET 조회는 제외)
const writeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15분
  max: 50, // 15분에 50개 쓰기 요청
  message: '너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해주세요.',
  skip: (req) => req.method === 'GET', // GET 요청은 제한 제외
});

app.use('/api', writeLimiter);

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

app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// 404 Handler
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global Error Handler
app.use(globalErrorHandler);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  startScheduler();
});
