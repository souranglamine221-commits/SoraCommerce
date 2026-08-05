const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;

    if (!mongoUri) {
      throw new Error(
        'MongoDB URI non définie dans le fichier .env'
      );
    }

    const conn = await mongoose.connect(mongoUri);

    console.log(
      `✅ MongoDB Atlas connecté: ${conn.connection.host}`
    );

    mongoose.connection.on('error', (err) => {
      console.error(
        '❌ Erreur MongoDB:',
        err.message
      );
    });

    mongoose.connection.on('disconnected', () => {
      console.log('⚠️ MongoDB déconnecté');
    });

  } catch (error) {
    console.error(
      '❌ Erreur connexion MongoDB:',
      error.message
    );

    process.exit(1);
  }
};

module.exports = connectDB;