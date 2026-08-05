// Backend/routes/orderRoutes.js
const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const { protect, restrictTo } = require('../middleware/auth.middleware');

// ==========================================
// ✅ POST /api/orders/create - Créer une commande client
// ==========================================
router.post('/create', protect, async (req, res) => {
  try {
    const { 
      shippingAddress, 
      items, 
      subtotal, 
      shippingCost, 
      total, 
      paymentMethod,
      notes,
      currency,
      exchangeRate
    } = req.body;

    // Validation des données requises
    if (!items || items.length === 0) {
      return res.status(400).json({ 
        success: false,
        message: 'Le panier est vide' 
      });
    }

    if (!shippingAddress || !shippingAddress.fullName || !shippingAddress.phone || !shippingAddress.address) {
      return res.status(400).json({ 
        success: false,
        message: 'Adresse de livraison incomplète' 
      });
    }

    if (!total || total <= 0) {
      return res.status(400).json({ 
        success: false,
        message: 'Le montant total est invalide' 
      });
    }

    // Création de la commande avec le nouveau modèle
    const newOrder = new Order({
      userId: req.user._id,
      user: req.user.name,
      email: req.user.email,
      shippingAddress: {
        fullName: shippingAddress.fullName,
        phone: shippingAddress.phone,
        address: shippingAddress.address,
        city: shippingAddress.city,
        country: shippingAddress.country,
        postalCode: shippingAddress.postalCode || ''
      },
      items: items.map(item => ({
        productId: item.productId,
        name: item.name,
        image: item.image || '',
        quantity: item.quantity,
        price: item.price
      })),
      subtotal: subtotal || 0,
      shippingCost: shippingCost || 0,
      total,
      orderStatus: 'pending',
      paymentMethod: paymentMethod || 'card',
      paymentStatus: 'unpaid',
      notes: notes || '',
      currency: currency || 'CAD',
      exchangeRate: exchangeRate || 1
    });

    await newOrder.save();
    
    console.log('✅ Commande créée avec succès:', newOrder._id);
    
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

// ==========================================
// ✅ GET /api/orders/my-orders - Commandes du client connecté
// ==========================================
router.get('/my-orders', protect, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .populate('items.productId', 'name image price');
    
    res.json({ 
      success: true, 
      count: orders.length, 
      orders 
    });
  } catch (error) {
    console.error('❌ Erreur récupération commandes client:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erreur serveur lors de la récupération des commandes' 
    });
  }
});

// ==========================================
// ✅ GET /api/orders - Récupérer toutes les commandes (Admin uniquement)
// ==========================================
router.get('/', protect, restrictTo('admin'), async (req, res) => {
  try {
    const orders = await Order.find()
      .sort({ createdAt: -1 })
      .populate('items.productId', 'name image price')
      .populate('userId', 'name email');
    
    res.json({ success: true, count: orders.length, orders });
  } catch (error) {
    console.error('❌ Erreur récupération commandes:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erreur serveur lors de la récupération des commandes' 
    });
  }
});

// ==========================================
// ✅ GET /api/orders/:id - Récupérer une commande spécifique par ID
// ==========================================
router.get('/:id', protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('items.productId', 'name image price')
      .populate('userId', 'name email');
      
    if (!order) {
      return res.status(404).json({ 
        success: false,
        message: 'Commande non trouvée' 
      });
    }

    // Vérifier que l'utilisateur a le droit de voir cette commande
    // (soit c'est sa commande, soit c'est un admin)
    if (order.userId && order.userId._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false,
        message: 'Accès non autorisé à cette commande' 
      });
    }
    
    res.json({ success: true, order });
  } catch (error) {
    console.error('❌ Erreur récupération commande:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erreur serveur' 
    });
  }
});

// ✅ PATCH - Mettre à jour le statut d'une commande (Admin uniquement)
router.patch('/:id/status', protect, restrictTo('admin'), async (req, res) => {
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