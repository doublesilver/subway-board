// 운영 시간 체크 유틸리티 (평일 07:00 ~ 09:00)

export const checkIsOperatingHours = () => {
    // 1. 관리자 모드 체크 (24시간 접속 가능)
    const adminMode = sessionStorage.getItem('admin_mode');
    if (adminMode === 'true') {
        return true;
    }

    // 2. 개발 모드 강제 설정 확인 (DevControl에서 설정)
    const devMode = sessionStorage.getItem('app_mode');
    if (devMode === 'development') {
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

// 관리자 모드 활성화
export const enableAdminMode = () => {
    sessionStorage.setItem('admin_mode', 'true');
};

// 관리자 모드 비활성화
export const disableAdminMode = () => {
    sessionStorage.removeItem('admin_mode');
};
