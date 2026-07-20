import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import API_URL from '../utils/api';
import { GoogleLogin } from '@react-oauth/google';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const res = await axios.post(
        `${API_URL}/auth/login`,
        {
          email,
          password,
        }
      );

      login(res.data);

      navigate(
        res.data.role === 'admin'
          ? '/admin'
          : '/'
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Erreur de connexion'
      );
    }
  };

  const handleGoogleLogin = async (credentialResponse) => {
    try {
      setError('');

      const res = await axios.post(
        `${API_URL}/auth/google`,
        {
          credential: credentialResponse.credential,
        }
      );

      login(res.data);

      navigate(
        res.data.role === 'admin'
          ? '/admin'
          : '/'
      );
    } catch (err) {
      console.error('Erreur Google:', err);

      setError(
        err.response?.data?.message ||
          'Connexion Google impossible'
      );
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20 p-8 bg-white rounded-xl shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-center">
        Connexion SoraCommerce
      </h2>

      {error && (
        <p className="text-red-500 text-center mb-4">
          {error}
        </p>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-4"
      >
        <input
          type="email"
          placeholder="Email"
          className="w-full p-3 border rounded-lg"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Mot de passe"
          className="w-full p-3 border rounded-lg"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700"
        >
          Se connecter
        </button>
      </form>

      <div className="my-6 flex items-center gap-3">
        <div className="h-px bg-gray-300 flex-1"></div>

        <span className="text-gray-500 text-sm">
          OU
        </span>

        <div className="h-px bg-gray-300 flex-1"></div>
      </div>

      <div className="flex justify-center">
        <GoogleLogin
          onSuccess={handleGoogleLogin}
          onError={() => {
            setError('Connexion Google échouée');
          }}
        />
      </div>

      <p className="mt-4 text-center text-sm">
        Pas encore de compte ?{' '}

        <Link
          to="/register"
          className="text-blue-600"
        >
          S'inscrire
        </Link>
      </p>
    </div>
  );
};

export default Login;