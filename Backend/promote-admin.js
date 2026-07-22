// Backend/promote-admin.js
const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');

async function promoteAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/soracommerce');
    
    // Remplacez par l'email de votre compte admin
    const email = 'souranglamine221@gmail.com'; 
    
    const updated = await User.findOneAndUpdate(
      { email },
      { role: 'admin' },
      { new: true }
    );

    if (updated) {
      console.log(`✅ ${updated.name} est maintenant administrateur !`);
    } else {
      console.log('❌ Utilisateur non trouvé. Créez d\'abord un compte via /register');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

promoteAdmin();