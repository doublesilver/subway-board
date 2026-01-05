import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function AuthButton() {
  const { user, loading, logout } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    if (window.confirm('로그아웃하시겠습니까?')) {
      logout();
      setShowMenu(false);
      navigate('/login');
    }
  };

  if (loading) {
    return null;
  }

  if (!user) {
    return (
      <button className="auth-login-btn" onClick={() => navigate('/login')}>
        로그인
      </button>
    );
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
