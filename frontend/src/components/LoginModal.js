import React from 'react';
import { getKakaoAuthURL } from '../services/authAPI';

function LoginModal({ onClose, onAnonymousLogin }) {
    const handleKakaoLogin = async () => {
        try {
            const response = await getKakaoAuthURL();
            if (response && response.url) {
                window.location.href = response.url;
            } else if (typeof response === 'string') {
                window.location.href = response;
            } else {
                console.error('Invalid Kakao URL response', response);
                alert('카카오 로그인 URL을 불러오지 못했습니다.');
            }
        } catch (error) {
            console.error('Kakao login error:', error);
            alert('카카오 로그인 중 오류가 발생했습니다.');
        }
    };

    return (
        <div className="modal-overlay-purple" onClick={onClose}>
            <div className="modal-content-new" onClick={e => e.stopPropagation()}>
                <button className="modal-close" onClick={onClose}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                </button>

                {/* 아이콘 */}
                <div className="modal-icon-wrapper">
                    <div className="lock-icon-container">
                        <svg className="lock-icon" width="48" height="48" viewBox="0 0 24 24" fill="none">
                            <rect x="5" y="11" width="14" height="10" rx="2" fill="#A855F7"/>
                            <path d="M7 11V7a5 5 0 0110 0v4" stroke="#A855F7" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                        <div className="check-badge">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <circle cx="12" cy="12" r="10" fill="#10B981"/>
                                <path d="M8 12l2 2 4-4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                        </div>
                    </div>
                </div>

                <div className="modal-header">
                    <h3 className="modal-title-new">대화에 참여하세요</h3>
                    <p className="modal-desc-new">
                        익명으로 안전하게 지하철 친구들과<br />
                        소통해보세요. 기록은 남지 않습니다.
                    </p>
                </div>

                <div className="login-buttons-new">
                    <button className="login-btn-kakao" onClick={handleKakaoLogin}>
                        <span className="btn-icon-kakao">💬</span>
                        <span className="btn-text-kakao">카카오로 3초 만에 시작하기</span>
                    </button>
                    <button className="login-btn-anonymous" onClick={onAnonymousLogin}>
                        <span className="btn-icon-anonymous">👤</span>
                        <span className="btn-text-anonymous">익명으로 바로 입장</span>
                    </button>
                </div>

                <button className="modal-later-link" onClick={onClose}>
                    나중에 하기
                </button>
            </div>
        </div>
    );
}

export default LoginModal;
