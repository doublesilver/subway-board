const { OPERATING_HOURS } = require('../config/constants');
const AppError = require('../utils/AppError');

const checkOperatingHours = (req, res, next) => {
    // 개발 환경(Local)이거나 테스트 모드가 켜져있으면 운영 시간 체크 패스
    if (process.env.NODE_ENV === 'development' || process.env.SKIP_HOURS_CHECK === 'true') {
        return next();
    }

    const now = new Date();

    // 한국 시간(KST) 기준 시간 계산
    // Railway 서버 시간이 UTC일 수 있으므로 9시간을 더해 KST로 변환
    const kstNow = new Date(now.getTime() + (9 * 60 * 60 * 1000));
    const currentHour = kstNow.getUTCHours(); // UTC 시간을 얻으면 위에서 더한 9시간이 적용된 셈

    // 로컬 테스트용 (서버가 이미 KST인 경우 등 환경에 따라 시간 보정 필요할 수 있음)
    // 가장 확실한 방법은 moment-timezone 등을 쓰는 것이지만, 
    // 여기서는 간단히 서버 시스템 시간이 UTC라고 가정하고 +9시간 처리

    // NOTE: node-cron은 서버 로컬 타임 기준이므로 scheduler.js와 시간 기준을 맞춰야 함.
    // Railway는 기본적으로 UTC.
    // 따라서 new Date().getHours()는 UTC 기준 시를 반환.
    // 한국 시간 07시 = UTC 22시 (전날)
    // 한국 시간 09시 = UTC 00시

    // 복잡성을 피하기 위해 Date 객체의 '시간'만 비교하는 간단한 로직 사용
    // process.env.TZ = 'Asia/Seoul' 설정이 되어있다면 new Date().getHours()가 한국시간.
    // Railway 설정에 TZ=Asia/Seoul 권장. 

    // 한국 시간(KST) 기준 시간 계산 (Manual Calculation)
    // UTC에 9시간을 더한 Date 객체 생성
    const kstNow = new Date(now.getTime() + (9 * 60 * 60 * 1000));
    // getUTCHours()를 호출하면, 위에서 더한 9시간이 반영된 "시간"부만 나옴
    const kstHour = kstNow.getUTCHours();

    if (kstHour < OPERATING_HOURS.START || kstHour >= OPERATING_HOURS.END) {
        return next(new AppError(`서비스 운영 시간(${OPERATING_HOURS.START}:00 ~ ${OPERATING_HOURS.END}:00)이 아닙니다.`, 403));
    }

    next();
};

module.exports = checkOperatingHours;
