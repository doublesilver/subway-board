const winston = require('winston');

// 로그 레벨 정의
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// 환경별 로그 레벨
const level = () => {
  const env = process.env.NODE_ENV || 'development';
  const isDevelopment = env === 'development';
  return isDevelopment ? 'debug' : 'info';
};

// 로그 색상 정의
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
};

winston.addColors(colors);

// 로그 포맷 정의
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json(),
  winston.format.printf((info) => {
    const { timestamp, level, message, ...meta } = info;

    // 메타데이터가 있으면 포함
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';

    return `${timestamp} [${level.toUpperCase()}]: ${message} ${metaStr}`;
  })
);

// 콘솔용 컬러 포맷
const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf((info) => {
    const { timestamp, level, message, ...meta } = info;
    const metaStr = Object.keys(meta).length && meta.stack
      ? `\n${meta.stack}`
      : Object.keys(meta).length
      ? ` ${JSON.stringify(meta)}`
      : '';

    return `${timestamp} [${level}]: ${message}${metaStr}`;
  })
);

// Transport 설정
const transports = [
  // 콘솔 출력 (개발 환경)
  new winston.transports.Console({
    format: consoleFormat,
  }),
];

// 프로덕션 환경에서는 파일 로깅 추가
if (process.env.NODE_ENV === 'production') {
  transports.push(
    // 모든 로그
    new winston.transports.File({
      filename: 'logs/combined.log',
      format,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // 에러 로그만
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format,
      maxsize: 5242880,
      maxFiles: 5,
    })
  );
}

// Logger 인스턴스 생성
const logger = winston.createLogger({
  level: level(),
  levels,
  transports,
  // 처리되지 않은 예외 캐치
  exceptionHandlers: [
    new winston.transports.File({ filename: 'logs/exceptions.log' }),
  ],
  // 처리되지 않은 Promise rejection 캐치
  rejectionHandlers: [
    new winston.transports.File({ filename: 'logs/rejections.log' }),
  ],
});

// HTTP 요청 로깅을 위한 morgan 스트림
logger.stream = {
  write: (message) => {
    logger.http(message.trim());
  },
};

module.exports = logger;
