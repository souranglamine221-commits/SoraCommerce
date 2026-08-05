// Backend/routes/sellerRoutes.js

const express = require('express');
const router = express.Router();

const { protect, restrictTo, isApprovedSeller } = require('../middleware/auth.middleware');

const {
  registerSeller,
  getSellerProfile,
  updateSellerProfile,
  getSellerById,
  getSellerPublishedProducts,
  getSellerProducts,
  getSellerOrders,
  getSellerAnalytics,
  deleteSellerAccount,
  createSellerProduct,
  updateSellerProduct,
  deleteSellerProduct,
  updateSellerOrderStatus,
  updateSellerProductStock,
  getSellerOrderDetails,
  updateSellerOrderStatusEnhanced,
  getSellerReviews,
  sellerReviewSummary
} = require('../controllers/sellerController');


// PHASE 13.9 — Avis et résumé des notes du vendeur (protégées)
// Placées AVANT la route publique /:id pour éviter le shadowing
router.get(
  '/reviews',
  protect,
  restrictTo('seller'),
  isApprovedSeller,
  getSellerReviews
);

router.get(
  '/reviews/summary',
  protect,
  restrictTo('seller'),
  isApprovedSeller,
  sellerReviewSummary
);


// Routes publiques
// PHASE 13.10 — Produits publiés d'un vendeur (public, GET uniquement)
// Placée AVANT la route /:id pour éviter le shadowing
router.get('/:id/products', getSellerPublishedProducts);

router.get('/:id', getSellerById);


// Routes protégées (authentification obligatoire)
router.use(protect);


// Routes vendeur
router.post('/register', restrictTo('customer'), registerSeller);

router.get('/profile', restrictTo('seller'), getSellerProfile);

router.put('/profile', restrictTo('seller'), updateSellerProfile);

router.get('/products', restrictTo('seller'), getSellerProducts);

router.get('/orders', protect, restrictTo('seller'), isApprovedSeller, getSellerOrders);

router.get('/analytics', restrictTo('seller'), getSellerAnalytics);

router.delete('/account', restrictTo('seller'), deleteSellerAccount);


// Gestion statut commande vendeur
// PHASE 13.10 — PATCH /api/sellers/orders/:orderId/status
router.patch(
  '/orders/:orderId/status',
  protect,
  restrictTo('seller'),
  isApprovedSeller,
  updateSellerOrderStatus
);


// Gestion produits vendeur
router.post(
  '/products',
  protect,
  restrictTo('seller'),
  isApprovedSeller,
  createSellerProduct
);

router.put(
  '/products/:id',
  protect,
  restrictTo('seller'),
  isApprovedSeller,
  updateSellerProduct
);

router.delete(
  '/products/:id',
  protect,
  restrictTo('seller'),
  isApprovedSeller,
  deleteSellerProduct
);


// PHASE 13.8 — Gestion du stock vendeur
router.patch(
  '/products/:id/stock',
  protect,
  restrictTo('seller'),
  isApprovedSeller,
  updateSellerProductStock
);


// PHASE 13.11 — Détails d'une commande (vendeur connecté uniquement)
router.get(
  '/orders/:id/details',
  protect,
  restrictTo('seller'),
  isApprovedSeller,
  getSellerOrderDetails
);

// PHASE 13.11 — Mise à jour améliorée du statut d'une commande
router.patch(
  '/orders/:id/status-enhanced',
  protect,
  restrictTo('seller'),
  isApprovedSeller,
  updateSellerOrderStatusEnhanced
);


module.exports = router;
