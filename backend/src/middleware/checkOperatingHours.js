const { ErrorCodes } = require('../utils/errorCodes');
const AppError = require('../utils/AppError');

const checkOperatingHours = (req, res, next) => {
    // 테스트 모드: 24시간 개방 (테스트 기간용 - 원복 시 삭제)
    if (process.env.TEST_MODE === 'true') {
        return next();
    }

    // 개발 환경이나 관리자 모드인 경우 건너뛰기 가능
    if (process.env.NODE_ENV === 'development' && process.env.IGNORE_OPERATING_HOURS === 'true') {
        return next();
    }

    // 현재 시간 (KST 기준)
    const now = new Date();
    const kstTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));

    const day = kstTime.getDay(); // 0: 일요일, 6: 토요일
    const hours = kstTime.getHours();

    // 주말(토, 일) 체크
    if (day === 0 || day === 6) {
        return next(AppError.fromErrorCode(ErrorCodes.SERVICE_CLOSED, 403));
    }

    // 운영 시간 체크 (07:00 ~ 09:00)
    // 9시 정각이 되면 닫힘
    if (hours >= 7 && hours < 9) {
        return next();
    }

    // 운영 시간 아님
    return next(AppError.fromErrorCode(ErrorCodes.SERVICE_CLOSED, 403));
};

module.exports = checkOperatingHours;
