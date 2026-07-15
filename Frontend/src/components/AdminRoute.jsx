// Frontend/src/components/AdminRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AdminRoute = ({ children }) => {
  const { user } = useAuth();
  
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 bg-white rounded-xl shadow-lg">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Accès Refusé</h2>
          <p className="text-gray-600">Zone réservée aux administrateurs.</p>
          <a href="/" className="text-blue-600 mt-4 block">Retour à l'accueil</a>
        </div>
      </div>
    );
  }
  return children;
};

export default AdminRoute;