// Backend/server.js

const passport = require('passport');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const connectDB = require('./config/mongodb');
const Sentry = require('./config/sentry');
require('dotenv').config();

// ✅ Import des routes
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const webhookRoutes = require('./routes/webhookRoutes');
const invoiceRoutes = require('./routes/invoiceRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const userRoutes = require('./routes/userRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const aiRoutes = require('./routes/aiRoutes');
const sellerRoutes = require('./routes/sellerRoutes');
const adminSellerRoutes = require('./routes/adminSellerRoutes');

const app = express();

// ==========================================
// ✅ SENTRY INTEGRATION
// ==========================================

// Sentry handlers uniquement en production
if (process.env.NODE_ENV === 'production') {
  // The request handler must be the first middleware
  app.use(Sentry.Handlers.requestHandler());

  // The error handler must be before any other error middleware
  app.use(Sentry.Handlers.errorHandler());
} else {
  console.log('🔧 Sentry handlers désactivés en mode développement');
}

// ==========================================
// ✅ SECURITY CONFIGURATION
// ==========================================

// Helmet pour les en-têtes HTTP sécurisés
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https:"],
    },
  },
}));

// Validation middleware
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Rate limiting pour protéger contre les attaques brute force
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limite chaque IP à 100 requêtes par windowMs
  message: 'Trop de requêtes depuis cette IP, veuillez réessayer plus tard.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Appliquer le rate limiting à toutes les routes
app.use('/api/', limiter);

// Rate limiting plus strict pour les routes d'authentification
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limite à 5 tentatives de connexion par IP
  message: 'Trop de tentatives de connexion, veuillez réessayer plus tard.',
  skipSuccessfulRequests: true,
});

app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// ==========================================
// ✅ CORS CONFIGURATION
// ==========================================

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:5176',
  'http://localhost:5177',
  process.env.FRONTEND_URL || 'https://soracommerce.com'
];

app.use(cors({
  origin: function (origin, callback) {

    // Autorise les requêtes sans origin (Postman, Render health check...)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error('Non autorisé par CORS'));
  },
  credentials: true
}));


// ==========================================
// ✅ MIDDLEWARES
// ==========================================

app.use(passport.initialize());
app.use(express.json());


// ==========================================
// ✅ CONNEXION MONGODB ATLAS
// ==========================================

console.log("MONGODB_URI chargé :", process.env.MONGODB_URI);

connectDB();

// ==========================================
// ✅ ROUTES API
// ==========================================

app.use('/api/products', productRoutes);

app.use('/api/auth', authRoutes);

app.use('/api/orders', orderRoutes);

app.use('/api/payment', paymentRoutes);

app.use('/api/webhooks', webhookRoutes);

app.use('/api/invoices', invoiceRoutes);

app.use('/api/reviews', reviewRoutes);

app.use('/api/users', userRoutes);

app.use('/api/upload', uploadRoutes);

app.use('/api/ai', aiRoutes);

app.use('/api/sellers', sellerRoutes);

app.use('/api/admin/sellers', adminSellerRoutes);

app.use('/api/admin', adminRoutes);


// ==========================================
// ✅ ROUTE TEST API
// ==========================================

app.get('/api', (req, res) => {
  res.json({
    message: '🚀 SoraCommerce API fonctionne correctement'
  });
});


// ==========================================
// ✅ ERROR HANDLER
// ==========================================

app.use((err, req, res, next) => {

  console.error(err.stack);

  res.status(500).json({
    message: 'Erreur serveur',
    error: err.message
  });

});


// ==========================================
// ✅ START SERVER
// ==========================================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {

  console.log(
    `🚀 Serveur SoraCommerce démarré sur le port ${PORT}`
  );

  console.log(
    `📡 Products: http://localhost:${PORT}/api/products`
  );

  console.log(
    `🔐 Auth: http://localhost:${PORT}/api/auth`
  );

  console.log(
    `📦 Orders: http://localhost:${PORT}/api/orders`
  );

  console.log(
    `👨‍💼 Admin: http://localhost:${PORT}/api/admin`
  );

});