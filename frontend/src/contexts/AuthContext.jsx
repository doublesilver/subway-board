import React, { createContext, useState, useContext } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [lineUsers, setLineUsers] = useState({});
  const [loading, setLoading] = useState(false);

  const setLineUser = (lineId, userData) => {
    setLineUsers(prev => ({
      ...prev,
      [lineId]: userData
    }));
  };

  const removeLineUser = (lineId) => {
    setLineUsers(prev => {
      const newUsers = { ...prev };
      delete newUsers[lineId];
      return newUsers;
    });
  };

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
