// Backend/scripts/createAdmin.js
// Script pour créer un compte administrateur

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require(path.join(__dirname, '../models/User'));

const createAdmin = async () => {
  try {
    // Connexion à MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connecté à MongoDB');

    // Vérifier si un admin existe déjà
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      console.log('⚠️ Un administrateur existe déjà:', existingAdmin.email);
      process.exit(0);
    }

    // Créer l'admin
    const admin = await User.create({
      name: 'Administrateur SoraCommerce',
      email: 'admin@soracommerce.sn',
      password: 'Admin123456',
      role: 'admin'
    });

    console.log('✅ Administrateur créé avec succès:');
    console.log('   Email:', admin.email);
    console.log('   Mot de passe: Admin123456');
    console.log('   Rôle:', admin.role);
    console.log('\n⚠️ Changez le mot de passe après la première connexion!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur lors de la création de l\'admin:', error);
    process.exit(1);
  }
};

createAdmin();
