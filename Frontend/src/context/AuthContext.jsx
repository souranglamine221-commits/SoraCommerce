// src/context/AuthContext.js
import { createContext, useContext } from 'react';

// 1. Création et export du contexte (pas de JSX ici)
export const AuthContext = createContext(null);

// 2. Export du hook personnalisé
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth doit être utilisé à l'intérieur d'un AuthProvider");
  }
  return context;
};