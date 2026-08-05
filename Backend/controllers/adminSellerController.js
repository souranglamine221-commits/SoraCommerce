// Backend/controllers/adminSellerController.js
const Seller = require('../models/Seller');
const Product = require('../models/Product');
const User = require('../models/User');

// Création locale de catchAsync
const catchAsync = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Création locale de AppError
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Obtenir tous les vendeurs (avec filtres)
const getAllSellers = catchAsync(async (req, res, next) => {
  const { status, search, page = 1, limit = 20 } = req.query;

  const query = {};
  
  // Filtrer par statut
  if (status) {
    query.status = status;
  }

  // Recherche par nom de boutique
  if (search) {
    query.$or = [
      { storeName: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];
  }

  const skip = (page - 1) * limit;

  const sellers = await Seller.find(query)
    .populate('userId', 'name email avatar')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Seller.countDocuments(query);

  res.status(200).json({
    success: true,
    count: sellers.length,
    total,
    page: parseInt(page),
    pages: Math.ceil(total / limit),
    sellers
  });
});

// Approuver un vendeur
const approveSeller = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { adminNotes } = req.body;

  const seller = await Seller.findById(id);
  
  if (!seller) {
    throw new AppError('Vendeur non trouvé', 404);
  }

  if (seller.status !== 'pending') {
    throw new AppError('Ce vendeur a déjà été traité', 400);
  }

  seller.status = 'approved';
  seller.approvedAt = new Date();
  seller.adminNotes = adminNotes || '';
  seller.rejectionReason = undefined;

  await seller.save();

  res.status(200).json({
    success: true,
    message: 'Vendeur approuvé avec succès',
    seller
  });
});

// Refuser un vendeur
const rejectSeller = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { rejectionReason } = req.body;

  if (!rejectionReason) {
    throw new AppError('La raison du refus est obligatoire', 400);
  }

  const seller = await Seller.findById(id);
  
  if (!seller) {
    throw new AppError('Vendeur non trouvé', 404);
  }

  if (seller.status !== 'pending') {
    throw new AppError('Ce vendeur a déjà été traité', 400);
  }

  seller.status = 'rejected';
  seller.rejectedAt = new Date();
  seller.rejectionReason = rejectionReason;

  await seller.save();

  // Rétablir le rôle customer
  await User.findByIdAndUpdate(seller.userId, { role: 'customer' });

  res.status(200).json({
    success: true,
    message: 'Vendeur refusé',
    seller
  });
});

// Suspendre un vendeur
const suspendSeller = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { suspensionReason } = req.body;

  if (!suspensionReason) {
    throw new AppError('La raison de la suspension est obligatoire', 400);
  }

  const seller = await Seller.findById(id);
  
  if (!seller) {
    throw new AppError('Vendeur non trouvé', 404);
  }

  if (seller.status !== 'approved') {
    throw new AppError('Seuls les vendeurs approuvés peuvent être suspendus', 400);
  }

  seller.status = 'suspended';
  seller.suspendedAt = new Date();
  seller.suspensionReason = suspensionReason;

  await seller.save();

  res.status(200).json({
    success: true,
    message: 'Vendeur suspendu',
    seller
  });
});

// Réactiver un vendeur suspendu
const reactivateSeller = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const seller = await Seller.findById(id);
  
  if (!seller) {
    throw new AppError('Vendeur non trouvé', 404);
  }

  if (seller.status !== 'suspended') {
    throw new AppError('Seuls les vendeurs suspendus peuvent être réactivés', 400);
  }

  seller.status = 'approved';
  seller.suspendedAt = undefined;
  seller.suspensionReason = undefined;

  await seller.save();

  res.status(200).json({
    success: true,
    message: 'Vendeur réactivé',
    seller
  });
});

// Obtenir les statistiques des vendeurs
const getSellerStats = catchAsync(async (req, res, next) => {
  const stats = await Seller.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  const statusStats = {
    pending: 0,
    approved: 0,
    rejected: 0,
    suspended: 0
  };

  stats.forEach(stat => {
    statusStats[stat._id] = stat.count;
  });

  const totalSellers = await Seller.countDocuments();
  const activeSellers = statusStats.approved;
  const pendingRequests = statusStats.pending;

  // Métriques de performance
  const topSellers = await Seller.find({ status: 'approved' })
    .sort({ totalRevenue: -1 })
    .limit(10)
    .populate('userId', 'name email')
    .select('storeName totalRevenue totalSales rating totalReviews');

  res.status(200).json({
    success: true,
    stats: {
      total: totalSellers,
      active: activeSellers,
      pending: pendingRequests,
      byStatus: statusStats
    },
    topSellers
  });
});

// Supprimer un vendeur (admin uniquement)
const deleteSeller = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const seller = await Seller.findById(id);
  
  if (!seller) {
    throw new AppError('Vendeur non trouvé', 404);
  }

  // Vérifier s'il y a des commandes actives
  const Product = require('../models/Product');
  const Order = require('../models/Order');
  
  const sellerProducts = await Product.find({ sellerId: seller._id }).select('_id');
  const sellerProductIds = sellerProducts.map(p => p._id);

  const activeOrders = await Order.countDocuments({
    'items.productId': { $in: sellerProductIds },
    orderStatus: { $in: ['pending', 'processing', 'shipped'] }
  });

  if (activeOrders > 0) {
    throw new AppError('Impossible de supprimer un vendeur avec des commandes actives', 400);
  }

  // Supprimer les produits du vendeur
  await Product.deleteMany({ sellerId: seller._id });

  // Supprimer le vendeur
  await Seller.findByIdAndDelete(id);

  // Rétablir le rôle customer
  await User.findByIdAndUpdate(seller.userId, { role: 'customer' });

  res.status(200).json({
    success: true,
    message: 'Vendeur supprimé avec succès'
  });
});

// Obtenir les produits en attente d'approbation
const getPendingProducts = catchAsync(async (req, res, next) => {
  const products = await Product.find({ approvalStatus: 'pending' })
    .populate('sellerId')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: products.length,
    products
  });
});

// Approuver un produit
const approveProduct = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const product = await Product.findById(id);

  if (!product) {
    throw new AppError('Produit non trouvé', 404);
  }

  product.approvalStatus = 'approved';
  product.isPublished = true;

  await product.save();

  res.status(200).json({
    success: true,
    message: 'Produit approuvé avec succès',
    product
  });
});

// Refuser un produit
const rejectProduct = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const product = await Product.findById(id);

  if (!product) {
    throw new AppError('Produit non trouvé', 404);
  }

  product.approvalStatus = 'rejected';
  product.isPublished = false;

  await product.save();

  res.status(200).json({
    success: true,
    message: 'Produit refusé',
    product
  });
});

module.exports = {
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
};
