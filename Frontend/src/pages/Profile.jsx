import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_URL from '../utils/api';

const Profile = () => {
  const { user, login, logout } = useAuth();
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', email: '' });
  const [passwordForm, setPasswordForm] = useState({ 
    currentPassword: '', 
    newPassword: '', 
    confirmPassword: '' 
  });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Si l'utilisateur n'est pas connecté, on le redirige vers la page de login
  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  if (!user) {
    return null;
  }

  const handleEditProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const res = await axios.put(`${API_URL}/auth/profile`, editForm, {
        headers: { Authorization: `Bearer ${localStorage.getItem('sora_token')}` }
      });
      
      // Mettre à jour le user dans le contexte
      login({ user: res.data.user, token: localStorage.getItem('sora_token') });
      setIsEditing(false);
      setMessage('Profil mis à jour avec succès');
    } catch (err) {
      setMessage(err.response?.data?.message || 'Erreur lors de la mise à jour');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setMessage('Les mots de passe ne correspondent pas');
      setLoading(false);
      return;
    }

    try {
      await axios.put(`${API_URL}/auth/password`, {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('sora_token')}` }
      });
      
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setIsChangingPassword(false);
      setMessage('Mot de passe changé avec succès');
    } catch (err) {
      setMessage(err.response?.data?.message || 'Erreur lors du changement de mot de passe');
    } finally {
      setLoading(false);
    }
  };

  const startEdit = () => {
    setEditForm({ name: user.name, email: user.email });
    setIsEditing(true);
    setMessage('');
  };

  return (
    <div className="max-w-2xl mx-auto mt-10 p-8 bg-white rounded-xl shadow-lg">
      <h2 className="text-3xl font-bold mb-6 text-center text-gray-800">
        Mon Compte
      </h2>

      {message && (
        <div className={`mb-4 p-3 rounded-lg text-center ${
          message.includes('succès') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {message}
        </div>
      )}

      <div className="flex flex-col items-center space-y-4">
        {/* Avatar ou initiales */}
        <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center text-3xl font-bold text-blue-600">
          {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
        </div>

        {/* Informations */}
        {!isEditing ? (
          <div className="text-center space-y-2 w-full">
            <p className="text-xl font-semibold">{user?.name || 'Utilisateur'}</p>
            <p className="text-gray-500">{user?.email || ''}</p>
            <span className={`inline-block text-xs px-2 py-1 rounded-full ${
              user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'
            }`}>
              Rôle : {user.role === 'admin' ? 'Administrateur' : 'Client'}
            </span>
            
            <button
              onClick={startEdit}
              className="mt-4 w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              Modifier mon profil
            </button>
            
            <button
              onClick={() => navigate('/orders')}
              className="w-full bg-purple-600 text-white py-2 rounded-lg font-semibold hover:bg-purple-700 transition"
            >
              Voir mes commandes
            </button>
          </div>
        ) : (
          <form onSubmit={handleEditProfile} className="w-full space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
              <input
                type="text"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                className="w-full p-2 border rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                className="w-full p-2 border rounded-lg"
                required
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700 transition disabled:bg-gray-400"
              >
                {loading ? 'Sauvegarde...' : 'Sauvegarder'}
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-400 transition"
              >
                Annuler
              </button>
            </div>
          </form>
        )}

        {/* Changement de mot de passe */}
        {!isChangingPassword ? (
          <button
            onClick={() => {
              setIsChangingPassword(true);
              setMessage('');
            }}
            className="w-full bg-gray-200 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-300 transition"
          >
            Changer mon mot de passe
          </button>
        ) : (
          <form onSubmit={handleChangePassword} className="w-full space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe actuel</label>
              <input
                type="password"
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                className="w-full p-2 border rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nouveau mot de passe</label>
              <input
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                className="w-full p-2 border rounded-lg"
                required
                minLength="6"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirmer le nouveau mot de passe</label>
              <input
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                className="w-full p-2 border rounded-lg"
                required
                minLength="6"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700 transition disabled:bg-gray-400"
              >
                {loading ? 'Changement...' : 'Changer'}
              </button>
              <button
                type="button"
                onClick={() => setIsChangingPassword(false)}
                className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-400 transition"
              >
                Annuler
              </button>
            </div>
          </form>
        )}

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