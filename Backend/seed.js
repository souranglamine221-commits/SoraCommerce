// backend/seed.js
require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./models/Product');

const products = [
  {
    name: 'Montre Chronographe Elite',
    price: 249,
    category: 'Accessoires',
    is_new: true,
    description: 'Design suisse, bracelet cuir véritable, étanche 50m.',
    stock: 15,
    image: null
  },
  {
    name: 'Sac à Dos Urbain Nomade',
    price: 89,
    category: 'Bagages',
    is_new: false,
    description: 'Compartiment laptop 15", tissu imperméable, port USB.',
    stock: 30,
    image: null
  },
  {
    name: 'Casque Audio Sans Fil Pro',
    price: 159,
    category: 'Électronique',
    is_new: true,
    description: 'Réduction de bruit active, autonomie 40h, son haute fidélité.',
    stock: 20,
    image: null
  }
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/soracommerce');
    await Product.deleteMany({}); // Vide la collection avant d'insérer
    await Product.insertMany(products);
    console.log('✅ Base de données peuplée avec 3 produits !');
    process.exit(0);
  } catch (err) {
    console.error('❌ Erreur seed:', err);
    process.exit(1);
  }
}

seed();