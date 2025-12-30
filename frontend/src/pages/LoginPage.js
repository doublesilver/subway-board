import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getKakaoAuthURL } from '../services/authAPI';

function LoginPage() {
  const navigate = useNavigate();
  const { loginAnonymously } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleAnonymousLogin = () => {
    setLoading(true);
    loginAnonymously();
    navigate('/');
  };

  const handleKakaoLogin = async () => {
    try {
      setLoading(true);
      const kakaoURL = await getKakaoAuthURL();
      window.location.href = kakaoURL;
    } catch (error) {
      console.error('Kakao login failed:', error);
      alert('카카오 로그인에 실패했습니다. 다시 시도해주세요.');
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <h1 className="login-title">출퇴근길 익명 채팅</h1>
          <p className="login-subtitle">
            🔒 익명 · ⏰ 매일 오전 9시 초기화
          </p>
        </div>

        <div className="login-description">
          <p>출퇴근하는 노선의 채팅방에 참여하세요</p>
          <p>모든 메시지는 매일 오전 9시에 자동 삭제됩니다</p>
        </div>

        <div className="login-buttons">
          <button
            className="login-btn login-btn-anonymous"
            onClick={handleAnonymousLogin}
            disabled={loading}
          >
            <span className="login-btn-icon">👤</span>
            <div className="login-btn-text">
              <div className="login-btn-title">익명으로 시작하기</div>
              <div className="login-btn-desc">랜덤 ID로 자유롭게 대화</div>
            </div>
          </button>

          <button
            className="login-btn login-btn-kakao"
            onClick={handleKakaoLogin}
            disabled={loading}
          >
            <span className="login-btn-icon">💬</span>
            <div className="login-btn-text">
              <div className="login-btn-title">카카오로 시작하기</div>
              <div className="login-btn-desc">내 메시지 관리 가능</div>
            </div>
          </button>
        </div>

        <div className="login-footer">
          <p>💡 익명 사용자는 본인 메시지 삭제가 불가능합니다</p>
          <p>🎯 카카오 로그인 시에도 메시지는 익명으로 표시됩니다</p>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
