const { OPERATING_HOURS } = require('../config/constants');
const AppError = require('../utils/AppError');

const checkOperatingHours = (req, res, next) => {
    // 개발 환경(Local)이거나 테스트 모드가 켜져있으면 운영 시간 체크 패스
    if (process.env.NODE_ENV === 'development' || process.env.SKIP_HOURS_CHECK === 'true') {
        return next();
    }

    const now = new Date();

    // 한국 시간(KST) 기준 시간 계산 (Manual Calculation)
    // 대부분의 클라우드 서버(Railway 등)는 UTC 기준이므로 9시간을 더해 KST로 변환
    const kstNow = new Date(now.getTime() + (9 * 60 * 60 * 1000));
    const kstHour = kstNow.getUTCHours(); // UTC 시간을 얻으면 위에서 더한 9시간이 적용된 셈

    if (kstHour < OPERATING_HOURS.START || kstHour >= OPERATING_HOURS.END) {
        return next(new AppError(`서비스 운영 시간(${OPERATING_HOURS.START}:00 ~ ${OPERATING_HOURS.END}:00)이 아닙니다.`, 403));
    }

    next();
};

module.exports = checkOperatingHours;
