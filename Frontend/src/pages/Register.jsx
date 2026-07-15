// Frontend/src/pages/Register.jsx
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation simple
    if (password !== confirmPassword) {
      return setError('Les mots de passe ne correspondent pas.');
    }

    try {
      const res = await axios.post('http://localhost:5000/api/auth/register', { 
        name, 
        email, 
        password 
      });
      
      // Connexion automatique après inscription
      login(res.data);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de l\'inscription');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20 p-8 bg-white rounded-xl shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-center">Créer un compte</h2>
      {error && <p className="text-red-500 text-center mb-4">{error}</p>}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nom complet</label>
          <input type="text" placeholder="Mamadou Lamine Sourang" className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
            value={name} onChange={e => setName(e.target.value)} required />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Adresse Email</label>
          <input type="email" placeholder="souranglamine221@gmail.com" className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
            value={email} onChange={e => setEmail(e.target.value)} required />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
          <input type="password" placeholder="••••••••" className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
            value={password} onChange={e => setPassword(e.target.value)} required />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Confirmer le mot de passe</label>
          <input type="password" placeholder="••••••••" className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
            value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
        </div>

        <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors mt-4">
          S'inscrire
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-600">
        Déjà un compte ? <Link to="/login" className="text-blue-600 font-semibold hover:underline">Se connecter</Link>
      </p>
    </div>
  );
};

export default Register;