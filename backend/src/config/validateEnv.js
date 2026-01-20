/**
 * 환경변수 검증 모듈
 * 서버 시작 시 필수 환경변수 존재 여부를 확인합니다.
 */

const logger = require('../utils/logger');

// 필수 환경변수 (없으면 서버 시작 불가)
const REQUIRED_ENV = [
  'DATABASE_URL',
  'JWT_SECRET',
  'ADMIN_KEY',
];

// 선택적 환경변수 (없어도 서버는 동작하지만 일부 기능 제한)
const OPTIONAL_ENV = [
  { key: 'SENTRY_DSN', description: '에러 모니터링 비활성화' },
  { key: 'OPENAI_API_KEY', description: 'AI 콘텐츠 필터링 비활성화 (로컬 필터만 사용)' },
  { key: 'REDIS_URL', description: 'Redis Adapter 비활성화 (인메모리 모드)' },
  { key: 'ADMIN_IP_WHITELIST', description: '관리자 IP 제한 비활성화' },
  { key: 'ADMIN_DASHBOARD_PASSWORD', description: 'ADMIN_KEY를 대시보드 비밀번호로 사용' },
];

/**
 * 환경변수 검증 실행
 * @throws {Error} 필수 환경변수가 없으면 에러 발생
 */
function validateEnv() {
  const missing = [];
  const warnings = [];

  // 필수 환경변수 체크
  for (const key of REQUIRED_ENV) {
    if (!process.env[key]) {
      missing.push(key);
    }
  }

  // 필수 환경변수가 없으면 서버 시작 중단
  if (missing.length > 0) {
    const errorMsg = `Missing required environment variables: ${missing.join(', ')}`;
    logger.error(errorMsg);
    throw new Error(errorMsg);
  }

  // 선택적 환경변수 경고
  for (const { key, description } of OPTIONAL_ENV) {
    if (!process.env[key]) {
      warnings.push(`${key} not set - ${description}`);
    }
  }

  // 경고 로그 출력
  if (warnings.length > 0) {
    logger.warn('Optional environment variables not configured:', {
      warnings,
    });
  }

  // 환경변수 값 유효성 검사
  validateEnvValues();

  logger.info('Environment validation passed', {
    required: REQUIRED_ENV.length,
    optional: OPTIONAL_ENV.length - warnings.length,
    warnings: warnings.length,
  });
}

/**
 * 환경변수 값 형식 검증
 */
function validateEnvValues() {
  // DATABASE_URL 형식 검증
  const dbUrl = process.env.DATABASE_URL;
  if (dbUrl && !dbUrl.startsWith('postgres://') && !dbUrl.startsWith('postgresql://')) {
    logger.warn('DATABASE_URL does not appear to be a valid PostgreSQL connection string');
  }

  // JWT_SECRET 최소 길이 검증
  const jwtSecret = process.env.JWT_SECRET;
  if (jwtSecret && jwtSecret.length < 32) {
    logger.warn('JWT_SECRET is shorter than recommended (32+ characters)');
  }

  // ADMIN_KEY 최소 길이 검증
  const adminKey = process.env.ADMIN_KEY;
  if (adminKey && adminKey.length < 16) {
    logger.warn('ADMIN_KEY is shorter than recommended (16+ characters)');
  }

  // PORT 유효성 검증
  const port = process.env.PORT;
  if (port) {
    const portNum = parseInt(port, 10);
    if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
      throw new Error(`Invalid PORT value: ${port}`);
    }
  }
}

module.exports = validateEnv;
