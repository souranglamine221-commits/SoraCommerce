// Backend/update-product-images.js
const mongoose = require('mongoose');
require('dotenv').config();

const Product = require('./models/Product');

const imageUrls = {
  '6a609ebc2cfe24763999f5db': 'images/sac-dos.jpg', // Sac à Dos
  '6a609ebc2cfe24763999f5dc': 'images/casque-audio.jpg', // Casque Audio
  '6a609ebc2cfe24763999f5da': 'images/montre-elite.jpg'  // Montre Elite
};

async function updateImages() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/soracommerce');
    console.log('✅ MongoDB connecté');

    for (const [id, imageUrl] of Object.entries(imageUrls)) {
      const updated = await Product.findByIdAndUpdate(
        id,
        { image: imageUrl },
        { new: true }
      );
      if (updated) {
        console.log(`✅ Image mise à jour pour ${updated.name}: ${imageUrl}`);
      } else {
        console.warn(`⚠️ Produit non trouvé: ${id}`);
      }
    }

    console.log('🎉 Mise à jour terminée !');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

updateImages();