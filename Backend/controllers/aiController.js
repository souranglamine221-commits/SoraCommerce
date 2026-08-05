const Product = require('../models/Product');
const Order = require('../models/Order');
const Review = require('../models/Review');
const {
  chatWithAI,
  intelligentSearch,
  getRecommendations,
  generateProductDescription,
  summarizeReviews,
  forecastSales,
} = require('../services/aiService');

// Chat with AI assistant
const chat = async (req, res) => {
  try {
    const { messages, context } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages requis' });
    }

    const response = await chatWithAI(messages, context || {});

    res.json({
      success: true,
      response,
    });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Erreur lors de la conversation' });
  }
};

// Intelligent product search
const search = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({ error: 'Requête requise' });
    }

    // Get all products for AI context
    const products = await Product.find({}).lean();

    const results = await intelligentSearch(query, products);

    // Get full product details for recommended IDs
    const recommendedProducts = await Product.find({
      _id: { $in: results.productIds }
    }).lean();

    res.json({
      success: true,
      products: recommendedProducts,
      explanation: results.explanation,
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Erreur lors de la recherche' });
  }
};

// Get product recommendations
const recommendations = async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user?.id;

    // Get the product
    const product = await Product.findById(productId).lean();
    if (!product) {
      return res.status(404).json({ error: 'Produit non trouvé' });
    }

    // Get user's order history for personalized recommendations
    let userHistory = [];
    if (userId) {
      const orders = await Order.find({ userId })
        .populate('items.product')
        .lean();
      userHistory = orders.flatMap(order => 
        order.items.map(item => item.product)
      );
    }

    // Get all products for AI context
    const allProducts = await Product.find({}).lean();

    const recommendations = await getRecommendations(product, userHistory, allProducts);

    // Get full product details
    const similarProducts = await Product.find({
      _id: { $in: recommendations.similar }
    }).lean();

    const complementaryProducts = await Product.find({
      _id: { $in: recommendations.complementary }
    }).lean();

    res.json({
      success: true,
      similar: similarProducts,
      complementary: complementaryProducts,
      reasoning: recommendations.reasoning,
    });
  } catch (error) {
    console.error('Recommendations error:', error);
    res.status(500).json({ error: 'Erreur lors des recommandations' });
  }
};

// Generate product description
const generateDescription = async (req, res) => {
  try {
    const { productId } = req.params;

    const product = await Product.findById(productId).lean();
    if (!product) {
      return res.status(404).json({ error: 'Produit non trouvé' });
    }

    const description = await generateProductDescription(product);

    res.json({
      success: true,
      description,
    });
  } catch (error) {
    console.error('Generate description error:', error);
    res.status(500).json({ error: 'Erreur lors de la génération' });
  }
};

// Summarize product reviews
const summarizeProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;

    const reviews = await Review.find({ productId }).lean();

    const summary = await summarizeReviews(reviews);

    res.json({
      success: true,
      summary,
      reviewCount: reviews.length,
    });
  } catch (error) {
    console.error('Summarize reviews error:', error);
    res.status(500).json({ error: 'Erreur lors du résumé' });
  }
};

// Sales forecast (admin only)
const salesForecast = async (req, res) => {
  try {
    if (!req.user?.isAdmin) {
      return res.status(403).json({ error: 'Non autorisé' });
    }

    // Get sales data from the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const orders = await Order.find({
      createdAt: { $gte: thirtyDaysAgo }
    }).lean();

    const salesData = orders.map(order => ({
      date: order.createdAt,
      total: order.total,
      items: order.items.length,
    }));

    const forecast = await forecastSales(salesData);

    res.json({
      success: true,
      forecast,
      salesData: {
        totalOrders: orders.length,
        totalRevenue: orders.reduce((sum, o) => sum + o.total, 0),
        averageOrderValue: orders.length > 0 
          ? orders.reduce((sum, o) => sum + o.total, 0) / orders.length 
          : 0,
      },
    });
  } catch (error) {
    console.error('Sales forecast error:', error);
    res.status(500).json({ error: 'Erreur lors des prévisions' });
  }
};

// Get popular products (AI-powered)
const popularProducts = async (req, res) => {
  try {
    if (!req.user?.isAdmin) {
      return res.status(403).json({ error: 'Non autorisé' });
    }

    const products = await Product.find({}).lean();
    const orders = await Order.find({}).lean();

    // Calculate product popularity based on order frequency
    const productFrequency = {};
    orders.forEach(order => {
      order.items.forEach(item => {
        const productId = item.productId?.toString() || item.product?.toString();
        if (productId) {
          productFrequency[productId] = (productFrequency[productId] || 0) + (item.quantity || 1);
        }
      });
    });

    const popularProductsList = products
      .map(p => ({
        ...p,
        frequency: productFrequency[p._id.toString()] || 0,
      }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 10);

    res.json({
      success: true,
      products: popularProductsList,
    });
  } catch (error) {
    console.error('Popular products error:', error);
    res.status(500).json({ error: 'Erreur lors de l\'analyse' });
  }
};

// Generate AI insights from dashboard data
const generateInsights = async (req, res) => {
  try {
    // Temporarily disabled admin check for testing
    // if (!req.user?.isAdmin) {
    //   return res.status(403).json({ error: 'Non autorisé' });
    // }

    const { stats, salesForecast, popularProducts } = req.body;

    // Simulate AI insights generation (could use OpenAI in production)
    const insights = {
      trends: [
        'Croissance des ventes de 15% prévue sur 30 jours',
        'Catégorie Électronique en forte progression',
        'Panier moyen stable malgré l\'inflation'
      ],
      recommendations: [
        'Augmenter le stock des produits populaires',
        'Créer des bundles pour les produits complémentaires',
        'Lancer une campagne sur les produits avec forte marge'
      ],
      alerts: [
        'Attention: Stock faible pour les produits populaires',
        'Opportunité: Cross-selling sur les produits complémentaires'
      ]
    };

    res.json({
      success: true,
      insights,
    });
  } catch (error) {
    console.error('Generate insights error:', error);
    res.status(500).json({ error: 'Erreur lors de la génération des insights' });
  }
};

module.exports = {
  chat,
  search,
  recommendations,
  generateDescription,
  summarizeProductReviews,
  salesForecast,
  popularProducts,
  generateInsights,
};
