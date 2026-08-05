// Backend/routes/adminRoutes.js
// Routes pour le dashboard administrateur

const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/auth.middleware');
const {
  getStats,
  getAllOrders,
  updateOrderStatus,
  getAllUsers,
  updateUserRole
} = require('../controllers/admin.controller');

// ==========================================
// ✅ Toutes les routes admin sont protégées
// Nécessite: Authentification JWT + Rôle admin
// ==========================================

// GET /api/admin/stats - Statistiques globales
router.get('/stats', protect, restrictTo('admin'), getStats);

// GET /api ADMIN/orders - Toutes les commandes
router.get('/orders', protect, restrictTo('admin'), getAllOrders);

// PUT /api/admin/orders/:id/status - Modifier statut commande
router.put('/orders/:id/status', protect, restrictTo('admin'), updateOrderStatus);

// GET /api/admin/users - Tous les utilisateurs
router.get('/users', protect, restrictTo('admin'), getAllUsers);

// PUT /api/admin/users/:id/role - Modifier rôle utilisateur
router.put('/users/:id/role', protect, restrictTo('admin'), updateUserRole);

module.exports = router;
