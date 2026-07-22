import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Si l'utilisateur n'est pas connecté, on le redirige vers la page de login
  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <div className="max-w-2xl mx-auto mt-10 p-8 bg-white rounded-xl shadow-lg">
      <h2 className="text-3xl font-bold mb-6 text-center text-gray-800">
        Mon Compte
      </h2>

      <div className="flex flex-col items-center space-y-4">
        {/* Avatar ou initiales */}
        <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center text-3xl font-bold text-blue-600">
          {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
        </div>

        {/* Informations */}
        <div className="text-center space-y-2">
          <p className="text-xl font-semibold">{user.name}</p>
          <p className="text-gray-500">{user.email}</p>
          <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
            Rôle : {user.role === 'admin' ? 'Administrateur' : 'Client'}
          </span>
        </div>

        {/* Bouton de déconnexion */}
        <button
          onClick={() => {
            logout();
            navigate('/');
          }}
          className="mt-6 w-full bg-red-500 text-white py-3 rounded-lg font-bold hover:bg-red-600 transition"
        >
          Se déconnecter
        </button>
      </div>
    </div>
  );
};

export default Profile;