// Backend/routes/adminSellerRoutes.js
const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/auth.middleware');
const {
  getAllSellers,
  approveSeller,
  rejectSeller,
  suspendSeller,
  reactivateSeller,
  getSellerStats,
  deleteSeller,
  getPendingProducts,
  approveProduct,
  rejectProduct
} = require('../controllers/adminSellerController');

// Toutes les routes nécessitent authentification et rôle admin
router.use(protect, restrictTo('admin'));

// Statistiques vendeurs
router.get('/stats', getSellerStats);

// Gestion des vendeurs
router.get('/', getAllSellers);
router.put('/:id/approve', approveSeller);
router.put('/:id/reject', rejectSeller);
router.put('/:id/suspend', suspendSeller);
router.put('/:id/reactivate', reactivateSeller);
router.delete('/:id', deleteSeller);

// Gestion des produits en attente
router.get('/products/pending', getPendingProducts);
router.put('/products/:id/approve', approveProduct);
router.put('/products/:id/reject', rejectProduct);

module.exports = router;