import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

/**
 * Hook personnalisé pour accéder au contexte d'authentification.
 * 
 * @returns {Object} Contient user, token, loading, login, register, logout, loginWithGoogle.
 * @throws {Error} Si le hook est utilisé en dehors du AuthProvider.
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  // Sécurité : s'assurer que le hook est bien utilisé à l'intérieur du Provider
  if (context === null) {
    throw new Error('useAuth doit être utilisé à l\'intérieur d\'un AuthProvider');
  }
  
  return context;
};