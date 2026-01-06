import React, { createContext, useState, useEffect, useContext } from 'react';
import { getCurrentUser } from '../services/authAPI';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [lineUsers, setLineUsers] = useState({}); // 호선별 사용자 정보 { lineId: { sessionId, nickname } }
  const [loading, setLoading] = useState(false);

  // 호선별 임시 사용자 설정
  const setLineUser = (lineId, userData) => {
    setLineUsers(prev => ({
      ...prev,
      [lineId]: userData
    }));
  };

  // 호선별 임시 사용자 제거
  const removeLineUser = (lineId) => {
    setLineUsers(prev => {
      const newUsers = { ...prev };
      delete newUsers[lineId];
      return newUsers;
    });
  };

  // 특정 호선의 사용자 정보 가져오기
  const getLineUser = (lineId) => {
    return lineUsers[lineId] || null;
  };

  const value = {
    lineUsers,
    setLineUser,
    removeLineUser,
    getLineUser,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
