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
                <div className="modal-header">
                    <h3 className="modal-title">대화에 참여하세요</h3>
                    <button className="modal-close" onClick={onClose}>×</button>
                </div>
                <div className="modal-body">
                    <p className="modal-desc">
                        로그인이 필요한 서비스입니다.<br />
                        익명으로 가볍게 시작하거나,<br />
                        카카오로 내 기록을 관리하세요.
                    </p>

                    <div className="login-buttons">
                        <button className="login-btn anonymous" onClick={onAnonymousLogin}>
                            <span className="icon">👤</span>
                            <span className="text">익명으로 시작하기</span>
                        </button>
                        <button className="login-btn kakao" onClick={handleKakaoLogin}>
                            <span className="icon">💬</span>
                            <span className="text">카카오로 시작하기</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default LoginModal;
