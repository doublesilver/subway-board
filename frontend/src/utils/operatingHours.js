// ========================================
// TEMPORARY: 운영 시간 제한 기능 비활성화
// ========================================
// 현재 코어 기능 개발에 집중하기 위해 운영 시간 제한을 임시로 비활성화합니다.
// 런칭 전 이 기능을 재활성화하여 운영 시간(평일 07:00~09:00)을 적용할 예정입니다.
//
// 재활성화 시 필요한 작업:
// 1. 이 파일의 주석 해제
// 2. HomePage.js에서 운영 시간 체크 로직 주석 해제
// 3. backend/src/middleware/checkOperatingHours.js 미들웨어 재적용
// 4. backend/src/routes/index.js에 checkOperatingHours 미들웨어 추가
// ========================================

// 운영 시간 체크 유틸리티

export const checkIsOperatingHours = () => {
    // 1. 개발 모드 강제 설정 확인 (DevControl에서 설정)
    const devMode = sessionStorage.getItem('app_mode');

    // 개발 모드면 무조건 오픈 (테스트 용도)
    if (devMode === 'development') {
        return true;
    }

    // 2. 테스트 기간 입장 허용 체크 (테스트 기간용 - 원복 시 삭제)
    const testModeAccepted = sessionStorage.getItem('test_mode_accepted');
    if (testModeAccepted === 'true') {
        return true;
    }

    // 3. 실제 시간 체크 (평일 07:00 ~ 09:00)
    const now = new Date();
    const day = now.getDay(); // 0: 일요일, 6: 토요일
    const hours = now.getHours();

    // 주말(토, 일)은 운영 안 함 (평일 출근길 컨셉)
    if (day === 0 || day === 6) {
        return false;
    }

    // 07:00 ~ 09:00 (9시 정각에 닫힘)
    const isOpen = hours >= 7 && hours < 9;

    return isOpen;
};
