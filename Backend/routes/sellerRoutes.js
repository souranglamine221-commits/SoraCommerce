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
  getSellerAIReport,
  getSellerNotifications,
  markSellerNotificationsRead,
  getSellerBusinessAlerts,
getSellerAdvancedAnalytics,
  getSellerSalesTrends,
  getSellerCustomerAnalytics,
  getSellerAIRecommendationsV2,
getSellerGrowthEngine,
  getSellerSmartCampaigns,
  getSellerProductOptimizer,
  getSellerAutomationCenter,
  getSellerMarketplaceRanking,
  getSellerCompetitiveBenchmark,
  getSellerMarketShare,
  getSellerCompetitiveAdvantages,
  getSellerTopCompetitors
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

// PHASE 13.18 — Notifications du vendeur connecté
// Placées AVANT la route publique /:id pour éviter le shadowing
router.get(
  '/notifications',
  protect,
  restrictTo('seller'),
  isApprovedSeller,
  getSellerNotifications
);

// PHASE 13.18 — Marquer toutes les notifications comme lues
// Placée AVANT la route publique /:id pour éviter le shadowing
router.put(
  '/notifications/read',
  protect,
  restrictTo('seller'),
  isApprovedSeller,
  markSellerNotificationsRead
);

// PHASE 13.18 — Alertes business du vendeur connecté
// Placée AVANT la route publique /:id pour éviter le shadowing
router.get(
  '/business-alerts',
  protect,
  restrictTo('seller'),
  isApprovedSeller,
  getSellerBusinessAlerts
);

// PHASE 13.19 — Analytics avancés du vendeur connecté
// Placée AVANT la route publique /:id pour éviter le shadowing
router.get(
  '/advanced-analytics',
  protect,
  restrictTo('seller'),
  isApprovedSeller,
  getSellerAdvancedAnalytics
);

// PHASE 13.19 — Tendances des ventes du vendeur connecté
// Placée AVANT la route publique /:id pour éviter le shadowing
router.get(
  '/sales-trends',
  protect,
  restrictTo('seller'),
  isApprovedSeller,
  getSellerSalesTrends
);

// PHASE 13.19 — Analytics clients avancés du vendeur connecté
// Placée AVANT la route publique /:id pour éviter le shadowing
router.get(
  '/customer-analytics',
  protect,
  restrictTo('seller'),
  isApprovedSeller,
  getSellerCustomerAnalytics
);

// PHASE 13.19 — Recommandations IA avancées (V2) du vendeur connecté
// Placée AVANT la route publique /:id pour éviter le shadowing
router.get(
  '/ai-recommendations-v2',
  protect,
  restrictTo('seller'),
  isApprovedSeller,
  getSellerAIRecommendationsV2
);

// PHASE 13.20 — Moteur intelligent de croissance du vendeur connecté
// Placée AVANT la route publique /:id pour éviter le shadowing
router.get(
  '/growth-engine',
  protect,
  restrictTo('seller'),
  isApprovedSeller,
  getSellerGrowthEngine
);

// PHASE 13.20 — Campagnes marketing intelligentes du vendeur connecté
// Placée AVANT la route publique /:id pour éviter le shadowing
router.get(
  '/smart-campaigns',
  protect,
  restrictTo('seller'),
  isApprovedSeller,
  getSellerSmartCampaigns
);

// PHASE 13.20 — Optimiseur de produits du vendeur connecté
// Placée AVANT la route publique /:id pour éviter le shadowing
router.get(
  '/product-optimizer',
  protect,
  restrictTo('seller'),
  isApprovedSeller,
  getSellerProductOptimizer
);

// PHASE 13.20 — Centre d'automatisation du vendeur connecté
// Placée AVANT la route publique /:id pour éviter le shadowing
router.get(
  '/automation-center',
  protect,
  restrictTo('seller'),
  isApprovedSeller,
  getSellerAutomationCenter
);

// PHASE 13.21 — Classement du vendeur sur la marketplace
// Placée AVANT la route publique /:id pour éviter le shadowing
router.get(
  '/marketplace-ranking',
  protect,
  restrictTo('seller'),
  isApprovedSeller,
  getSellerMarketplaceRanking
);

// PHASE 13.21 — Benchmark concurrentiel des produits du vendeur
// Placée AVANT la route publique /:id pour éviter le shadowing
router.get(
  '/competitive-benchmark',
  protect,
  restrictTo('seller'),
  isApprovedSeller,
  getSellerCompetitiveBenchmark
);

// PHASE 13.21 — Part de marché du vendeur
// Placée AVANT la route publique /:id pour éviter le shadowing
router.get(
  '/market-share',
  protect,
  restrictTo('seller'),
  isApprovedSeller,
  getSellerMarketShare
);

// PHASE 13.21 — Avantages concurrentiels du vendeur
// Placée AVANT la route publique /:id pour éviter le shadowing
router.get(
  '/competitive-advantages',
  protect,
  restrictTo('seller'),
  isApprovedSeller,
  getSellerCompetitiveAdvantages
);

// PHASE 13.21 — Top vendeurs à surveiller
// Placée AVANT la route publique /:id pour éviter le shadowing
router.get(
  '/top-competitors',
  protect,
  restrictTo('seller'),
  isApprovedSeller,
  getSellerTopCompetitors
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
