require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./models/Product');

const products = [
  {
    name: 'iPhone 15 Pro Max',
    description: 'Le smartphone le plus puissant d\'Apple avec puce A17 Pro et appareil photo professionnel.',
price: 1299,
    currency: "XOF",
    category: 'Électronique',
    stock: 15,
    isFeatured: true,
    rating: 4.8,
    numReviews: 245
  },
  {
    name: 'MacBook Air M3',
    description: 'Le MacBook Air M3 offre des performances exceptionnelles dans un design ultra-fin.',
price: 1099,
    currency: "XOF",
    category: 'Électronique',
    stock: 20,
    isFeatured: true,
    rating: 4.9,
    numReviews: 189
  },
  {
    name: 'Nike Air Max 270',
    description: 'Chaussures de sport confortables avec amorti Max Air.',
price: 150,
    currency: "XOF",
    category: 'Vêtements',
    stock: 30,
    isFeatured: true,
    rating: 4.6,
    numReviews: 312
  },
  {
    name: 'Sony WH-1000XM5',
    description: 'Casque à réduction de bruit active premium.',
price: 349,
    currency: "XOF",
    category: 'Électronique',
    stock: 25,
    isFeatured: true,
    rating: 4.7,
    numReviews: 156
  },
  {
    name: 'PlayStation 5',
    description: 'Console de jeu nouvelle génération Sony.',
price: 499,
    currency: "XOF",
    category: 'Électronique',
    stock: 10,
    isFeatured: true,
    rating: 4.9,
    numReviews: 423
  },
  {
    name: 'Smart Watch Pro',
    description: 'Montre connectée avec suivi fitness avancé.',
price: 299,
    currency: "XOF",
    category: 'Accessoires',
    stock: 35,
    isFeatured: false,
    rating: 4.5,
    numReviews: 98
  },
  {
    name: 'Luxury Skincare Set',
    description: 'Ensemble de soins de luxe pour la peau.',
price: 89,
    currency: "XOF",
    category: 'Autre',
    stock: 40,
    isFeatured: false,
    rating: 4.4,
    numReviews: 67
  },
  {
    name: 'Modern Table Lamp',
    description: 'Lampe de table moderne avec LED.',
price: 79,
    currency: "XOF",
    category: 'Maison',
    stock: 50,
    isFeatured: false,
    rating: 4.3,
    numReviews: 45
  }
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB connecté');
    
    await Product.deleteMany({});
    console.log('🗑️ Anciens produits supprimés');

    const inserted = await Product.insertMany(products);
    console.log(`✅ ${inserted.length} produits insérés avec succès !`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur lors du seeding:', error);
    process.exit(1);
  }
}

seed();
