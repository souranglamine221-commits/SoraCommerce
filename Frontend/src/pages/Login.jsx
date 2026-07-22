// Frontend/src/pages/Login.jsx
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { GoogleLogin } from '@react-oauth/google';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  // ✅ URL ABSOLUE POUR ÉVITER LES ERREURS DE ROUTAGE
  const AUTH_API_URL = 'http://localhost:5000/api/auth';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await axios.post(`${AUTH_API_URL}/login`, {
        email,
        password,
      });

      // Sauvegarde des données utilisateur et du token
      login(res.data);

      // Redirection basée sur le rôle
      navigate(res.data.user?.role === 'admin' ? '/admin' : '/');
    } catch (err) {
      console.error('Erreur connexion:', err);
      setError(
        err.response?.data?.message || 'Email ou mot de passe incorrect'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async (credentialResponse) => {
    if (!credentialResponse?.credential) return;
    
    setError('');
    setLoading(true);

    try {
      const res = await axios.post(`${AUTH_API_URL}/google`, {
        credential: credentialResponse.credential,
      });

      login(res.data);
      navigate(res.data.user?.role === 'admin' ? '/admin' : '/');
    } catch (err) {
      console.error('Erreur Google:', err);
      setError(err.response?.data?.message || 'Connexion Google impossible');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20 p-8 bg-white rounded-xl shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-center text-gray-900">
        Connexion SoraCommerce
      </h2>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm text-center">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="email"
          placeholder="Email"
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={loading}
        />

        <input
          type="password"
          placeholder="Mot de passe"
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={loading}
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition disabled:bg-blue-400 disabled:cursor-not-allowed"
        >
          {loading ? 'Connexion en cours...' : 'Se connecter'}
        </button>
      </form>

      <div className="my-6 flex items-center gap-3">
        <div className="h-px bg-gray-300 flex-1"></div>
        <span className="text-gray-500 text-sm">OU</span>
        <div className="h-px bg-gray-300 flex-1"></div>
      </div>

      <div className="flex justify-center">
        <GoogleLogin
          onSuccess={handleGoogleLogin}
          onError={() => setError('Connexion Google échouée')}
          useOneTap={false}
        />
      </div>

      <p className="mt-6 text-center text-sm text-gray-600">
        Pas encore de compte ?{' '}
        <Link to="/register" className="text-blue-600 font-semibold hover:underline">
          S'inscrire
        </Link>
      </p>
    </div>
  );
};

export default Login;