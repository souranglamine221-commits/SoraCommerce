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
  sellerReviewSummary,
  getSellerTopProducts,
  getSellerPerformance,
  getSellerInventoryStats,
  getSellerRevenueAnalytics,
  getSellerSalesOverview,
  getSellerCustomerInsights,
  getSellerOrderInsights,
  getSellerGrowthAnalytics,
  getSellerProductPerformance,
  getSellerDashboardSummary,
  getSellerSalesForecast,
  getSellerBusinessRecommendations,
  getSellerKPIDashboard,
  getSellerSmartInsights,
  getSellerActionPlan,
  getSellerAIReport
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

// PHASE 13.11 — Produits les plus vendus du vendeur connecté
// Placée AVANT la route publique /:id pour éviter le shadowing
router.get(
  '/top-products',
  protect,
  restrictTo('seller'),
  isApprovedSeller,
  getSellerTopProducts
);

// PHASE 13.13 — Analytics de revenus du vendeur connecté
// Placée AVANT la route publique /:id pour éviter le shadowing
router.get(
  '/revenue-analytics',
  protect,
  restrictTo('seller'),
  isApprovedSeller,
  getSellerRevenueAnalytics
);

// PHASE 13.13 — Aperçu des ventes du vendeur connecté
// Placée AVANT la route publique /:id pour éviter le shadowing
router.get(
  '/sales-overview',
  protect,
  restrictTo('seller'),
  isApprovedSeller,
  getSellerSalesOverview
);

// PHASE 13.14 — Insights clients du vendeur connecté
// Placée AVANT la route publique /:id pour éviter le shadowing
router.get(
  '/customer-insights',
  protect,
  restrictTo('seller'),
  isApprovedSeller,
  getSellerCustomerInsights
);

// PHASE 13.14 — Insights commandes du vendeur connecté
// Placée AVANT la route publique /:id pour éviter le shadowing
router.get(
  '/order-insights',
  protect,
  restrictTo('seller'),
  isApprovedSeller,
  getSellerOrderInsights
);

// PHASE 13.15 — Analytics de croissance du vendeur connecté
// Placée AVANT la route publique /:id pour éviter le shadowing
router.get(
  '/growth-analytics',
  protect,
  restrictTo('seller'),
  isApprovedSeller,
  getSellerGrowthAnalytics
);

// PHASE 13.15 — Performance des produits du vendeur connecté
// Placée AVANT la route publique /:id pour éviter le shadowing
router.get(
  '/product-performance',
  protect,
  restrictTo('seller'),
  isApprovedSeller,
  getSellerProductPerformance
);

// PHASE 13.15 — Résumé du dashboard du vendeur connecté
// Placée AVANT la route publique /:id pour éviter le shadowing
router.get(
  '/dashboard-summary',
  protect,
  restrictTo('seller'),
  isApprovedSeller,
  getSellerDashboardSummary
);

// PHASE 13.16 — Prévision des ventes du vendeur connecté
// Placée AVANT la route publique /:id pour éviter le shadowing
router.get(
  '/sales-forecast',
  protect,
  restrictTo('seller'),
  isApprovedSeller,
  getSellerSalesForecast
);

// PHASE 13.16 — Recommandations business du vendeur connecté
// Placée AVANT la route publique /:id pour éviter le shadowing
router.get(
  '/business-recommendations',
  protect,
  restrictTo('seller'),
  isApprovedSeller,
  getSellerBusinessRecommendations
);

// PHASE 13.16 — KPIs du vendeur connecté
// Placée AVANT la route publique /:id pour éviter le shadowing
router.get(
  '/kpis',
  protect,
  restrictTo('seller'),
  isApprovedSeller,
  getSellerKPIDashboard
);

// PHASE 13.17 — Insights intelligents du vendeur connecté
// Placée AVANT la route publique /:id pour éviter le shadowing
router.get(
  '/smart-insights',
  protect,
  restrictTo('seller'),
  isApprovedSeller,
  getSellerSmartInsights
);

// PHASE 13.17 — Plan d'action automatique du vendeur connecté
// Placée AVANT la route publique /:id pour éviter le shadowing
router.get(
  '/action-plan',
  protect,
  restrictTo('seller'),
  isApprovedSeller,
  getSellerActionPlan
);

// PHASE 13.17 — Rapport IA complet du vendeur connecté
// Placée AVANT la route publique /:id pour éviter le shadowing
router.get(
  '/ai-report',
  protect,
  restrictTo('seller'),
  isApprovedSeller,
  getSellerAIReport
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

router.get(
  '/analytics',
  protect,
  restrictTo('seller'),
  isApprovedSeller,
  getSellerAnalytics
);

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


// PHASE 13.12 — Performances du vendeur connecté
router.get(
  '/performance',
  protect,
  restrictTo('seller'),
  isApprovedSeller,
  getSellerPerformance
);

// PHASE 13.12 — Statistiques d'inventaire du vendeur connecté
router.get(
  '/inventory-stats',
  protect,
  restrictTo('seller'),
  isApprovedSeller,
  getSellerInventoryStats
);


module.exports = router;
