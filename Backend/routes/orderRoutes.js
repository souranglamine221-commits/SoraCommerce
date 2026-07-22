// Backend/routes/orderRoutes.js
const express = require('express');
const router = express.Router();
const Order = require('../models/Order');

// ✅ POST - Créer une nouvelle commande
router.post('/', async (req, res) => {
  try {
    const { user, email, address, items, total } = req.body;

    // Validation des données requises
    if (!items || items.length === 0) {
      return res.status(400).json({ 
        success: false,
        message: 'Le panier est vide' 
      });
    }

    if (!total || total <= 0) {
      return res.status(400).json({ 
        success: false,
        message: 'Le montant total est invalide' 
      });
    }

    // Création de la commande en base de données
    const newOrder = new Order({
      user: user || 'Client anonyme',
      email: email || '',
      address: address || 'Adresse non spécifiée',
      items: items.map(item => ({
        productId: item.productId,
        name: item.name,
        quantity: item.quantity,
        price: item.price
      })),
      total,
      status: 'pending' // Statut initial par défaut
    });

    await newOrder.save();
    
    console.log('✅ Commande enregistrée avec succès:', newOrder._id);
    
    res.status(201).json({ 
      success: true,
      message: 'Commande créée avec succès',
      orderId: newOrder._id,
      order: newOrder
    });
  } catch (error) {
    console.error('❌ Erreur création commande:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erreur serveur lors de la création de la commande',
      error: error.message 
    });
  }
});

// ✅ GET - Récupérer toutes les commandes (pour AdminDashboard)
router.get('/', async (req, res) => {
  try {
    const orders = await Order.find()
      .sort({ createdAt: -1 })
      .populate('items.productId', 'name image price'); // Peuple les détails produits
    
    res.json({ success: true, count: orders.length, data: orders });
  } catch (error) {
    console.error('❌ Erreur récupération commandes:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erreur serveur lors de la récupération des commandes' 
    });
  }
});

// ✅ GET - Récupérer une commande spécifique par ID
router.get('/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('items.productId', 'name image price');
      
    if (!order) {
      return res.status(404).json({ 
        success: false,
        message: 'Commande non trouvée' 
      });
    }
    
    res.json({ success: true, data: order });
  } catch (error) {
    console.error('❌ Erreur récupération commande:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erreur serveur' 
    });
  }
});

// ✅ PATCH - Mettre à jour le statut d'une commande (ex: pending -> shipped)
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        success: false,
        message: `Statut invalide. Valeurs acceptées: ${validStatuses.join(', ')}` 
      });
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!updatedOrder) {
      return res.status(404).json({ 
        success: false,
        message: 'Commande non trouvée' 
      });
    }

    console.log(`📦 Statut commande ${req.params.id} mis à jour: ${status}`);
    res.json({ success: true, data: updatedOrder });
  } catch (error) {
    console.error('❌ Erreur mise à jour statut:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erreur serveur lors de la mise à jour du statut' 
    });
  }
});

module.exports = router;