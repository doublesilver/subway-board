import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function AuthButton() {
  const { user, loading, logout } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    if (window.confirm('로그아웃하시겠습니까? 새로운 익명 계정으로 전환됩니다.')) {
      logout();
      setShowMenu(false);
      // 로그아웃 후 AuthContext에서 자동으로 새 익명 사용자 생성
      // 홈으로 이동
      navigate('/');
      // 페이지 새로고침으로 새 익명 사용자 생성 트리거
      window.location.reload();
    }
  };

  if (loading) {
    return null;
  }

  // 자동 익명 로그인이 활성화되어 있으므로 user는 항상 존재
  if (!user) {
    return null;
  }

  return (
    <div className="auth-button-container">
      <div className="auth-user-menu">
        <button
          className="auth-user-button"
          onClick={() => setShowMenu(!showMenu)}
        >
          {user.nickname} {user.isAnonymous && '(익명)'}
        </button>
        {showMenu && (
          <div className="auth-dropdown">
            <div className="auth-dropdown-item auth-user-info">
              {user.nickname}님
              {user.isAnonymous && (
                <div style={{ fontSize: '0.75rem', color: '#999', marginTop: '0.25rem' }}>
                  익명 사용자
                </div>
              )}
            </div>
            <button
              className="auth-dropdown-item auth-logout-btn"
              onClick={handleLogout}
            >
              로그아웃
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default AuthButton;
