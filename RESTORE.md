# 테스트 기간 → 정식 운영 원복 가이드

> **작성일**: 2026-01-14
> **목적**: 테스트 기간(24시간 개방) 종료 후 정식 운영(평일 07:00~09:00)으로 원복하기 위한 가이드

---

## 변경된 파일 목록

| 파일 경로 | 변경 내용 | 원복 방법 |
|-----------|----------|----------|
| `frontend/src/utils/operatingHours.js` | 테스트 모드 플래그 체크 추가 | 해당 로직 제거 |
| `frontend/src/components/ClosedAlertModal.jsx` | 입장하기 버튼 추가 | 기존 코드로 복원 |
| `frontend/src/App.css` | 입장하기 버튼 스타일 추가 | 추가된 스타일 제거 |
| `backend/src/middleware/checkOperatingHours.js` | TEST_MODE 환경변수 체크 추가 | 해당 로직 제거 |
| `backend/src/utils/scheduler.js` | 초기화 시간 0시로 변경, 캐시 초기화 포함 | 9시로 원복 |
| `backend/src/controllers/visitController.js` | 방문자 중복 체크 캐시 추가 | 변경 없음 (유지) |
| `backend/.env` | TEST_MODE=true 추가 | 해당 변수 제거 |

---

## 1. 프론트엔드 원복

### 1-1. `frontend/src/utils/operatingHours.js`

**현재 (테스트 기간):**
```javascript
export const checkIsOperatingHours = () => {
    // 1. 개발 모드 강제 설정 확인 (DevControl에서 설정)
    const devMode = sessionStorage.getItem('app_mode');

    // 개발 모드면 무조건 오픈 (테스트 용도)
    if (devMode === 'development') {
        return true;
    }

    // 2. 테스트 기간 입장 허용 체크 (테스트 기간용)
    const testModeAccepted = sessionStorage.getItem('test_mode_accepted');
    if (testModeAccepted === 'true') {
        return true;
    }

    // 3. 실제 시간 체크 (평일 07:00 ~ 09:00)
    const now = new Date();
    const day = now.getDay();
    const hours = now.getHours();

    if (day === 0 || day === 6) {
        return false;
    }

    const isOpen = hours >= 7 && hours < 9;
    return isOpen;
};
```

**원복 후:**
```javascript
export const checkIsOperatingHours = () => {
    // 1. 개발 모드 강제 설정 확인 (DevControl에서 설정)
    const devMode = sessionStorage.getItem('app_mode');

    // 개발 모드면 무조건 오픈 (테스트 용도)
    if (devMode === 'development') {
        return true;
    }

    // 2. 실제 시간 체크 (평일 07:00 ~ 09:00)
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
```

---

### 1-2. `frontend/src/components/ClosedAlertModal.jsx`

**현재 (테스트 기간):**
```jsx
import React, { useEffect } from 'react';

const ClosedAlertModal = () => {
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

    const handleEnterTestMode = () => {
        sessionStorage.setItem('test_mode_accepted', 'true');
        window.location.reload();
    };

    return (
        <div className="closed-modal-overlay">
            <div className="closed-modal">
                <div className="modal-icon">🎉</div>
                <h2 className="modal-title">서비스를 선보이는 기간이에요</h2>
                <p className="modal-desc">
                    입장하기 버튼을 통해서 이용해 보세요!<br /><br />
                    <span className="operating-hours-info">
                        21일(수) 이후에는 07시~09시에만 운영됩니다.
                    </span>
                </p>
                <button className="enter-test-button" onClick={handleEnterTestMode}>
                    입장하기
                </button>
            </div>
        </div>
    );
};

export default ClosedAlertModal;
```

**원복 후:**
```jsx
import React, { useEffect } from 'react';

const ClosedAlertModal = () => {
    // 모달이 열릴 때 body 스크롤 막기
    useEffect(() => {
        document.body.style.overflow = 'hidden';

        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

    return (
        <div className="closed-modal-overlay">
            <div className="closed-modal">
                <div className="modal-icon">⏰</div>
                <h2 className="modal-title">운영 시간이 아니에요</h2>
                <p className="modal-desc">
                    지하철 채팅은 출근 시간인<br />
                    <strong>평일 오전 07:00 ~ 09:00</strong>에만 운영됩니다.
                </p>
            </div>
        </div>
    );
};

export default ClosedAlertModal;
```

---

### 1-3. `frontend/src/App.css`

**제거할 스타일 (테스트 기간용):**
```css
/* ===== 테스트 기간 입장 버튼 스타일 (원복 시 삭제) ===== */
.enter-test-button {
  width: 100%;
  padding: 16px 24px;
  font-size: 16px;
  font-weight: 700;
  color: white;
  background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.enter-test-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(99, 102, 241, 0.4);
}

.enter-test-button:active {
  transform: translateY(0);
}

.operating-hours-info {
  font-size: 13px;
  color: #9ca3af;
}
/* ===== 테스트 기간 입장 버튼 스타일 끝 ===== */
```

---

## 2. 백엔드 원복

### 2-1. `backend/src/middleware/checkOperatingHours.js`

**현재 (테스트 기간):**
```javascript
const { ErrorCodes } = require('../utils/errorCodes');
const AppError = require('../utils/AppError');

const checkOperatingHours = (req, res, next) => {
    // 테스트 모드: 24시간 개방 (테스트 기간용)
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

    const day = kstTime.getDay();
    const hours = kstTime.getHours();

    if (day === 0 || day === 6) {
        return next(AppError.fromErrorCode(ErrorCodes.SERVICE_CLOSED, 403));
    }

    if (hours >= 7 && hours < 9) {
        return next();
    }

    return next(AppError.fromErrorCode(ErrorCodes.SERVICE_CLOSED, 403));
};

module.exports = checkOperatingHours;
```

**원복 후:**
```javascript
const { ErrorCodes } = require('../utils/errorCodes');
const AppError = require('../utils/AppError');

const checkOperatingHours = (req, res, next) => {
    // 개발 환경이나 관리자 모드인 경우 건너뛰기 가능 (필요시 구현)
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
```

---

### 2-2. `backend/src/utils/scheduler.js`

**현재 (테스트 기간 - 0시 초기화):**
```javascript
const cron = require('node-cron');
const pool = require('../db/connection');
const { clearVisitCache } = require('../controllers/visitController');

const deleteOldData = async () => {
  try {
    console.log('Starting daily cleanup (Full Wipe)...');
    const commentsResult = await pool.query('DELETE FROM comments');
    const postsResult = await pool.query('DELETE FROM posts');

    // 방문자 중복 체크 캐시 초기화
    clearVisitCache();

    console.log(`Cleanup completed: ${postsResult.rowCount} posts and ${commentsResult.rowCount} comments deleted`);
  } catch (error) {
    console.error('Error during cleanup:', error);
  }
};

const startScheduler = () => {
  // 테스트 기간: 매일 자정 (00:00)에 실행
  cron.schedule('0 0 * * *', deleteOldData, {
    scheduled: true,
    timezone: "Asia/Seoul"
  });
  console.log('Daily cleanup scheduler started (runs at 00:00 KST - TEST MODE)');
};
```

**원복 후 (9시 초기화):**
```javascript
const startScheduler = () => {
  // 매일 오전 9시 (Asia/Seoul 기준)에 실행
  cron.schedule('0 9 * * *', deleteOldData, {
    scheduled: true,
    timezone: "Asia/Seoul"
  });
  console.log('Daily cleanup scheduler started (runs at 09:00 KST)');
};
```

> **Note**: `clearVisitCache()` 호출은 유지합니다. 방문자 중복 체크 캐시는 매일 초기화되어야 합니다.

---

### 2-3. `backend/.env`

**제거할 환경 변수:**
```
TEST_MODE=true
```

---

## 3. 원복 체크리스트

원복 작업 시 아래 순서대로 진행:

- [ ] `frontend/src/utils/operatingHours.js` - 테스트 모드 플래그 체크 제거
- [ ] `frontend/src/components/ClosedAlertModal.jsx` - 기존 코드로 복원
- [ ] `frontend/src/App.css` - 테스트 기간용 버튼 스타일 제거
- [ ] `backend/src/middleware/checkOperatingHours.js` - TEST_MODE 체크 제거
- [ ] `backend/src/utils/scheduler.js` - cron 스케줄 `0 0 * * *` → `0 9 * * *`
- [ ] `backend/.env` - TEST_MODE 환경변수 제거
- [ ] **Railway 환경변수에서 TEST_MODE 제거** (현재 설정되어 있음)
- [ ] 프론트엔드 재배포 (Vercel)
- [ ] 백엔드 재배포 (Railway)

---

## 4. 테스트 기간 변경 내용 요약

| 항목 | 테스트 기간 | 정식 운영 |
|------|------------|----------|
| **서비스 접속** | 24시간 가능 (입장하기 버튼) | 평일 07:00~09:00만 |
| **비운영시간 팝업** | "서비스를 선보이는 기간" + 입장 버튼 | "운영 시간이 아니에요" |
| **메시지 초기화** | 매일 자정 (00:00) | 매일 오전 9시 |
| **방문 캐시 초기화** | 매일 자정 (00:00) | 매일 오전 9시 |
| **백엔드 검증** | 항상 통과 (TEST_MODE) | 시간 검증 활성화 |

---

## 5. 빠른 원복 명령어

Claude에게 아래 메시지를 전달하면 원복 작업이 진행됩니다:

```
실제 운영을 시작할거니깐 RESTORE.md 원복문서를 참고해서 원복 진행해줘
```
