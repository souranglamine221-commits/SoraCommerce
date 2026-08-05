import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true, // Important pour les cookies httpOnly
});

// Intercepteur pour ajouter le token Bearer si présent dans le localStorage (fallback)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('sora_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;