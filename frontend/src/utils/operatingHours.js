// 운영 시간 체크 유틸리티

export const checkIsOperatingHours = () => {
    // 1. 개발 모드 강제 설정 확인 (DevControl에서 설정)
    const devMode = sessionStorage.getItem('app_mode');

    if (devMode === 'development') {
        return true; // 무조건 오픈
    }

    if (devMode === 'production') {
        // 강제 운영 모드 (시간 제한 적용)
        // 아래 로직으로 흐름
    } else {
        // 설정이 없으면 기본 환경변수 따름
        if (process.env.NODE_ENV === 'development') {
            return true;
        }
    }

    // 2. 실제 시간 체크 (07:00 ~ 09:00)
    const now = new Date();
    const hours = now.getHours();
    const isOpen = hours >= 7 && hours < 9;

    return isOpen;
};
