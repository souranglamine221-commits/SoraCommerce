// Backend/routes/orderRoutes.js
const express = require('express');
const router = express.Router();
const Order = require('../models/Order');

// ✅ POST - Créer une nouvelle commande
router.post('/', async (req, res) => {
  try {
    const { user, email, address, items, total } = req.body;

    console.log('📦 Données reçues pour la commande:', req.body); // Pour le debug

    // Validation basique
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Le panier est vide' });
    }

    // Préparation des données pour éviter les erreurs de validation MongoDB
    const orderData = {
      user: user || 'Client anonyme',
      email: email || 'client@soracommerce.sn', // Valeur par défaut si vide
      address: address || 'Adresse non spécifiée',
      total: total || 0,
      status: 'pending',
      paymentStatus: 'paid',
      items: items.map(item => ({
        // On s'assure d'avoir un ObjectId valide ou on ignore l'item problématique
        productId: item.productId || item._id, 
        name: item.name || 'Produit inconnu',
        quantity: item.quantity || 1,
        price: item.price || 0
      }))
    };

    // Création en base de données
    const newOrder = new Order(orderData);
    await newOrder.save();
    
    console.log('✅ Commande enregistrée avec succès:', newOrder._id);
    
    res.status(201).json({ 
      success: true,
      message: 'Commande créée avec succès',
      orderId: newOrder._id
    });
  } catch (error) {
    console.error('❌ ERREUR DÉTAILLÉE BACKEND (Commande):', error);
    res.status(500).json({ 
      success: false,
      message: 'Erreur serveur lors de la création de la commande',
      error: error.message // Renvoie le détail au frontend
    });
  }
});

// ✅ GET - Récupérer toutes les commandes
router.get('/', async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;