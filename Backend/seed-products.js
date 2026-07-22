// Backend/seed-products.js
const mongoose = require('mongoose');
require('dotenv').config();
const Product = require('./models/Product');

const products = [
  {
    name: "Sac à Dos Urbain Nomade",
    description: "Compartiment laptop 15\", tissu imperméable, port USB intégré.",
    price: 89000, // Prix en FCFA
    image: "/images/sac-dos.jpg",
    category: "Bagages",
    is_new: false,
    stock: 30
  },
  {
    name: "Casque Audio Sans Fil Pro",
    description: "Réduction de bruit active, autonomie 40h, son haute fidélité.",
    price: 159000,
    image: "/images/casque-audio.jpg",
    category: "Électronique",
    is_new: true,
    stock: 20
  },
  {
    name: "Montre Chronographe Elite",
    description: "Design suisse, bracelet cuir véritable, étanche 50m.",
    price: 249000,
    image: "/images/montre-elite.jpg",
    category: "Accessoires",
    is_new: true,
    stock: 15
  }
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/soracommerce');
    console.log('✅ MongoDB connecté');
    
    // Supprime les anciens produits pour éviter les doublons
    await Product.deleteMany({});
    console.log('🗑️ Anciens produits supprimés');

    // Insère les nouveaux produits
    const createdProducts = await Product.insertMany(products);
    console.log(`✅ ${createdProducts.length} produits ajoutés avec succès !`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur lors du seeding:', error);
    process.exit(1);
  }
}

seed();