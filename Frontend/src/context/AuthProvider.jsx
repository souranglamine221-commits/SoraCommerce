import { useState } from 'react';
import { AuthContext } from './AuthContext';

export const AuthProvider = ({ children }) => {
  // Initialisation paresseuse (lazy initialization) pour éviter les warnings ESLint
  const [user, setUser] = useState(() => {
    try {
      const storedUser = localStorage.getItem('sora_user');
      const storedToken = localStorage.getItem('sora_token');
      if (storedUser && storedToken) {
        return JSON.parse(storedUser);
      }
    } catch (error) {
      console.error('Erreur de lecture du localStorage:', error);
    }
    return null;
  });

  // Fonction appelée par Login.jsx après une réponse réussie du backend
  const login = (data) => {
    const userData = data.user || data; // Sécurité si la structure varie
    
    setUser(userData);
    localStorage.setItem('sora_user', JSON.stringify(userData));
    
    if (data.token) {
      localStorage.setItem('sora_token', data.token);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('sora_user');
    localStorage.removeItem('sora_token');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};