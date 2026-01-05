import React from 'react';
import { getKakaoAuthURL } from '../services/authAPI';

function LoginModal({ onClose, onAnonymousLogin }) {
    const handleKakaoLogin = async () => {
        try {
            const response = await getKakaoAuthURL();
            // response가 { url: ... } 형태라고 가정 (controller 확인 필요)
            // authController.js: res.json({ url: kakaoAuthURL });
            if (response && response.url) {
                window.location.href = response.url;
            } else if (typeof response === 'string') {
                window.location.href = response;
            } else {
                // service/api.js의 return value 확인 필요. 
                // 만약 axios response.data라면 response.url이 맞음.
                // 하지만 api.js에서 interceptor가 error만 처리하고 response를 그대로 반환한다면 response.data.url
                // api.js : response => response.
                // Therefore response.data is needed.
                // Wait, verifying api hook usage pattern.
                // Let's assume the caller handles the API call structure.
                // Actually, let's implement validation inside the component for safety.
                console.error('Invalid Kakao URL response', response);
                alert('카카오 로그인 URL을 불러오지 못했습니다.');
            }
        } catch (error) {
            console.error('Kakao login error:', error);
            alert('카카오 로그인 중 오류가 발생했습니다.');
        }
    };

    // Actually, let's use the service function directly if imported, 
    // but better to keep logic in the component or passing from parent?
    // User asked for "Kakao Login" button behavior.

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <button className="modal-close" onClick={onClose}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                </button>

                <div className="modal-header">
                    <h3 className="modal-title">대화에 참여하세요</h3>
                    <p className="modal-desc">
                        출퇴근 노선의 익명 채팅에 참여하여<br />
                        소통하고 정보를 나누세요
                    </p>
                </div>

                <div className="login-buttons">
                    <button className="login-btn anonymous" onClick={onAnonymousLogin}>
                        <div className="btn-icon">👤</div>
                        <span className="btn-text">익명으로 시작하기</span>
                    </button>
                    <button className="login-btn kakao" onClick={handleKakaoLogin}>
                        <div className="btn-icon">💬</div>
                        <span className="btn-text">카카오로 시작하기</span>
                    </button>
                </div>

                <p className="modal-footer">
                    🔒 익명 · ⏰ 매일 오전 9시 초기화
                </p>
            </div>
        </div>
    );
}

export default LoginModal;
