import React, { createContext, useState, useEffect, useContext } from 'react';
import { getCurrentUser } from '../services/authAPI';
import { v4 as uuidv4 } from 'uuid';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// 랜덤 닉네임 생성 (형용사 + 명사)
const adjectives = ['활기찬', '즐거운', '행복한', '평온한', '차분한', '용감한', '씩씩한', '당당한', '멋진', '훌륭한'];
const nouns = ['통근러', '출퇴근러', '직장인', '샐러리맨', '워커', '러너', '라이더', '여행자', '모험가', '탐험가'];

const generateRandomNickname = () => {
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const num = Math.floor(Math.random() * 1000);
  return `${adj} ${noun}${num}`;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 앱 시작 시 로그인 상태 확인
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      // 1. 익명 사용자 확인
      const anonymousId = localStorage.getItem('anonymous_id');
      if (anonymousId) {
        const nickname = localStorage.getItem('anonymous_nickname');
        setUser({
          id: anonymousId,
          nickname: nickname,
          isAnonymous: true,
        });
        setLoading(false);
        return;
      }

      // 2. 카카오 로그인 사용자 확인
      const token = localStorage.getItem('subway_token');
      if (token) {
        const userData = await getCurrentUser();
        if (userData) {
          setUser({
            ...userData,
            isAnonymous: false,
          });
        } else {
          localStorage.removeItem('subway_token');
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('subway_token');
    } finally {
      setLoading(false);
    }
  };

  // 익명 로그인
  const loginAnonymously = () => {
    const anonymousId = `anon_${uuidv4()}`;
    const nickname = generateRandomNickname();

    localStorage.setItem('anonymous_id', anonymousId);
    localStorage.setItem('anonymous_nickname', nickname);

    setUser({
      id: anonymousId,
      nickname: nickname,
      isAnonymous: true,
    });
  };

  // 카카오 로그인 (JWT 토큰 저장)
  const login = (token) => {
    // 익명 로그인 정보 제거
    localStorage.removeItem('anonymous_id');
    localStorage.removeItem('anonymous_nickname');

    localStorage.setItem('subway_token', token);
    checkAuthStatus();
  };

  const logout = () => {
    localStorage.removeItem('subway_token');
    localStorage.removeItem('anonymous_id');
    localStorage.removeItem('anonymous_nickname');
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    loginAnonymously,
    logout,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
