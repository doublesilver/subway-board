import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function KakaoCallback() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // URL에서 token 파라미터 추출
        const params = new URLSearchParams(location.search);
        const token = params.get('token');

        if (!token) {
          setError('로그인에 실패했습니다. 토큰이 없습니다.');
          setTimeout(() => navigate('/'), 2000);
          return;
        }

        // 토큰 저장 및 로그인 처리
        login(token);

        // 홈으로 리다이렉트
        navigate('/');
      } catch (err) {
        console.error('Kakao callback error:', err);
        setError('로그인 처리 중 오류가 발생했습니다.');
        setTimeout(() => navigate('/'), 2000);
      }
    };

    handleCallback();
  }, [location, login, navigate]);

  return (
    <div style={styles.container}>
      {error ? (
        <div>
          <h2 style={styles.errorTitle}>❌ 오류</h2>
          <p style={styles.errorMessage}>{error}</p>
          <p style={styles.redirectMessage}>잠시 후 홈으로 이동합니다...</p>
        </div>
      ) : (
        <div>
          <h2 style={styles.title}>🔐 로그인 중...</h2>
          <p style={styles.message}>잠시만 기다려주세요</p>
          <div style={styles.spinner}></div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    textAlign: 'center',
    padding: '2rem',
  },
  title: {
    fontSize: '1.5rem',
    marginBottom: '1rem',
    color: '#333',
  },
  message: {
    fontSize: '1rem',
    color: '#666',
    marginBottom: '2rem',
  },
  errorTitle: {
    fontSize: '1.5rem',
    marginBottom: '1rem',
    color: '#e53e3e',
  },
  errorMessage: {
    fontSize: '1rem',
    color: '#e53e3e',
    marginBottom: '1rem',
  },
  redirectMessage: {
    fontSize: '0.9rem',
    color: '#666',
  },
  spinner: {
    border: '4px solid #f3f3f3',
    borderTop: '4px solid #0052a4',
    borderRadius: '50%',
    width: '40px',
    height: '40px',
    animation: 'spin 1s linear infinite',
    margin: '0 auto',
  },
};

export default KakaoCallback;
