// src/utils/api.js

/**
 * URL de base de l'API SoraCommerce Global
 * Utilise la variable d'environnement en production, 
 * sinon fallback sur localhost:5000 en développement.
 * ⚠️ Le préfixe /api est inclus ici.
 */
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
   
export default API_URL;