const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const {
  chat,
  search,
  recommendations,
  generateDescription,
  summarizeProductReviews,
  salesForecast,
  popularProducts,
  generateInsights,
} = require('../controllers/aiController');

// Chat with AI assistant (public)
router.post('/chat', chat);

// Intelligent search (public)
router.get('/search', search);

// Get product recommendations (public)
router.get('/recommendations/:productId', recommendations);

// Generate product description (admin only)
router.post('/generate-description/:productId', generateDescription);

// Summarize product reviews (public)
router.get('/summarize-reviews/:productId', summarizeProductReviews);

// Sales forecast (admin only)
router.get('/sales-forecast', salesForecast);

// Popular products (admin only)
router.get('/popular-products', popularProducts);

// Generate AI insights (admin only)
router.post('/insights', generateInsights);

module.exports = router;
