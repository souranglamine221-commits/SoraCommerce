// Backend/server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

// ✅ Import des routes
const productRoutes = require('./routes/productRoutes'); // 👈 NOUVEAU
const orderRoutes = require('./routes/orderRoutes');
const authRoutes = require('./routes/authRoutes');

const app = express();

// ✅ Middleware essentiels
app.use(cors({ 
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5177'],
  credentials: true 
}));
app.use(express.json());

// ✅ Connexion MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/soracommerce')
  .then(() => console.log('✅ MongoDB connecté'))
  .catch(err => console.error('❌ Erreur MongoDB:', err));

// ==========================================
// ✅ MONTAGE DES ROUTES
// ==========================================
app.use('/api/products', productRoutes); // 👈 Utilise maintenant le fichier avec l'upload
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);

// ==========================================
// ✅ Démarrage du serveur
// ==========================================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Serveur SoraCommerce Global démarré sur http://localhost:${PORT}`);
  console.log(`📡 API Produits : http://localhost:${PORT}/api/products`);
  console.log(`🔐 API Auth : http://localhost:${PORT}/api/auth`);
  console.log(`📦 API Commandes : http://localhost:${PORT}/api/orders`);
});