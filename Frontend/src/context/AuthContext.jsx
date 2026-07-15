// Frontend/src/context/AuthContext.jsx
import React, { useState, useCallback } from 'react';
import AuthContext from './AuthContext';
import API_URL from '../utils/api';

export const AuthProvider = ({ children }) => {
  const getStoredUser = () => {
    try {
      const storedUser = localStorage.getItem('user');
      return storedUser ? JSON.parse(storedUser) : null;
    } catch {
      return null;
    }
  };

  const [user, setUser] = useState(getStoredUser);

  const login = useCallback(async (userData) => {
    // Ici tu peux ajouter un appel API si besoin, sinon on stocke juste les données reçues du login
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('user');
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};