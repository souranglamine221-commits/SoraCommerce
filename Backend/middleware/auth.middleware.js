// Backend/middleware/auth.middleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Création locale de AppError pour éviter l'import manquant
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Création locale de catchAsync pour éviter l'import manquant
const catchAsync = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

const protect = catchAsync(async (req, res, next) => {
  let token;
  if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies?.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) throw new AppError('Vous n\'êtes pas connecté. Veuillez vous connecter.', 401);

  const decoded = await new Promise((resolve, reject) => {
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) reject(new AppError('Token invalide ou expiré.', 401));
      else resolve(decoded);
    });
  });

  const currentUser = await User.findById(decoded.id);
  if (!currentUser) throw new AppError('L\'utilisateur n\'existe plus.', 401);

  req.user = currentUser;
  next();
});

const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      throw new AppError('Vous n\'avez pas la permission d\'effectuer cette action.', 403);
    }
    next();
  };
};

// Middleware pour vérifier si l'utilisateur est un vendeur approuvé
const isApprovedSeller = catchAsync(async (req, res, next) => {
  const Seller = require('../models/Seller');
  const seller = await Seller.findOne({ userId: req.user._id });
  
  if (!seller) {
    throw new AppError('Vendeur non trouvé.', 404);
  }
  
  if (seller.status !== 'approved') {
    throw new AppError('Votre compte vendeur n\'est pas encore approuvé.', 403);
  }
  
  req.seller = seller;
  next();
});

// Middleware pour vérifier si l'utilisateur est le propriétaire de la ressource
const isResourceOwner = (resourceModel) => {
  return catchAsync(async (req, res, next) => {
    const Model = require(`../models/${resourceModel}`);
    const resource = await Model.findById(req.params.id);
    
    if (!resource) {
      throw new AppError('Ressource non trouvée.', 404);
    }
    
    // Pour les produits, vérifier si le vendeur est le propriétaire
    if (resourceModel === 'Product' && req.user.role === 'seller') {
      const Seller = require('../models/Seller');
      const seller = await Seller.findOne({ userId: req.user._id });
      
      if (!seller || resource.sellerId?.toString() !== seller._id.toString()) {
        throw new AppError('Vous n\'avez pas la permission de modifier cette ressource.', 403);
      }
    }
    
    // Pour les commandes, vérifier si l'utilisateur est le client
    if (resourceModel === 'Order' && req.user.role === 'customer') {
      if (resource.userId?.toString() !== req.user._id.toString()) {
        throw new AppError('Vous n\'avez pas la permission d\'accéder à cette ressource.', 403);
      }
    }
    
    next();
  });
};

// Middleware pour vérifier les permissions avancées
const hasPermission = (permission) => {
  return (req, res, next) => {
    const rolePermissions = {
      customer: ['read:products', 'read:orders', 'create:orders', 'update:profile'],
      seller: ['read:products', 'create:products', 'update:products', 'delete:products', 
               'read:orders', 'update:orders', 'read:analytics', 'update:profile'],
      admin: ['*'] // Admin a toutes les permissions
    };
    
    const userPermissions = rolePermissions[req.user.role] || [];
    
    if (!userPermissions.includes('*') && !userPermissions.includes(permission)) {
      throw new AppError('Permission insuffisante.', 403);
    }
    
    next();
  };
};

module.exports = { protect, restrictTo, isApprovedSeller, isResourceOwner, hasPermission };