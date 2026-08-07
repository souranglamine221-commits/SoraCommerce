// Backend/controllers/sellerController.js
const mongoose = require('mongoose'); // ✅ Import nécessaire pour ObjectId validation
const Seller = require('../models/Seller');
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Review = require('../models/Review');

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

// Enregistrement vendeur
const registerSeller = catchAsync(async (req, res, next) => {
  const { storeName, description, phone, email, address, businessType, taxId, socialMedia } = req.body;
  const userId = req.user._id;

  // Vérifier si l'utilisateur n'est pas déjà vendeur
  const existingSeller = await Seller.findOne({ userId });
  if (existingSeller) {
    throw new AppError('Vous êtes déjà inscrit comme vendeur.', 400);
  }

  // Créer le vendeur
  const seller = await Seller.create({
    userId,
    storeName,
    description,
    phone,
    email,
    address,
    businessType,
    taxId,
    socialMedia
  });

  // Mettre à jour le rôle de l'utilisateur
  await User.findByIdAndUpdate(userId, { role: 'seller' });

  res.status(201).json({
    success: true,
    message: 'Demande de vendeur soumise avec succès',
    seller: {
      id: seller._id,
      storeName: seller.storeName,
      status: seller.status,
      createdAt: seller.createdAt
    }
  });
});

// Obtenir le profil vendeur
const getSellerProfile = catchAsync(async (req, res, next) => {
  const seller = await Seller.findOne({ userId: req.user._id })
    .populate('userId', 'name email avatar');

  if (!seller) {
    throw new AppError('Profil vendeur non trouvé', 404);
  }

  res.status(200).json({
    success: true,
    seller
  });
});

// Mettre à jour le profil vendeur
const updateSellerProfile = catchAsync(async (req, res, next) => {
  const { storeName, description, phone, email, address, logo, banner, socialMedia, shippingSettings } = req.body;
  
  const seller = await Seller.findOne({ userId: req.user._id });
  
  if (!seller) {
    throw new AppError('Profil vendeur non trouvé', 404);
  }

  // Mise à jour des champs autorisés
  const allowedUpdates = ['storeName', 'description', 'phone', 'email', 'address', 'logo', 'banner', 'socialMedia', 'shippingSettings'];
  allowedUpdates.forEach(field => {
    if (req.body[field] !== undefined) {
      seller[field] = req.body[field];
    }
  });

  await seller.save();

  res.status(200).json({
    success: true,
    message: 'Profil mis à jour avec succès',
    seller
  });
});

// Obtenir un vendeur par ID (public)
const getSellerById = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const seller = await Seller.findById(id)
    .populate('userId', 'name email avatar')
    .select('-adminNotes -rejectionReason -suspensionReason -taxId');

  if (!seller) {
    throw new AppError('Vendeur non trouvé', 404);
  }

  // Ne montrer que les vendeurs approuvés pour les utilisateurs non-admin
  if (seller.status !== 'approved' && req.user?.role !== 'admin') {
    throw new AppError('Vendeur non disponible', 404);
  }

  res.status(200).json({
    success: true,
    seller
  });
});

// PHASE 13.10 — Obtenir les produits publiés d'un vendeur (public, GET uniquement)
const getSellerPublishedProducts = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  // ✅ Validation ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError('ID de vendeur invalide.', 400);
  }

  // ✅ Récupérer le vendeur (public)
  const seller = await Seller.findById(id)
    .select('storeName logo banner description rating totalReviews status');

  if (!seller) {
    throw new AppError('Vendeur non trouvé', 404);
  }

  // ✅ Seuls les vendeurs approuvés sont exposés publiquement
  if (seller.status !== 'approved') {
    throw new AppError('Vendeur non disponible', 404);
  }

  // ✅ Uniquement les produits approuvés ET publiés
  const products = await Product.find({
    sellerId: seller._id,
    approvalStatus: 'approved',
    isPublished: true
  })
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    seller: {
      _id: seller._id,
      storeName: seller.storeName,
      logo: seller.logo,
      banner: seller.banner,
      description: seller.description,
      rating: seller.rating,
      totalReviews: seller.totalReviews
    },
    count: products.length,
    products
  });
});

// Obtenir les produits du vendeur
const getSellerProducts = catchAsync(async (req, res, next) => {
  const seller = await Seller.findOne({ userId: req.user._id });
  
  if (!seller) {
    throw new AppError('Profil vendeur non trouvé', 404);
  }

  const products = await Product.find({ sellerId: seller._id })
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: products.length,
    products
  });
});

// PHASE 13.10 — Obtenir les commandes du vendeur connecté (uniquement ses propres produits)
const getSellerOrders = catchAsync(async (req, res, next) => {
  const seller = req.seller; // ✅ Utilisation exclusive de req.seller._id

  // ✅ Refuser toute tentative d'utiliser sellerId provenant de req.body, req.params ou req.query
  if (
    req.body?.sellerId !== undefined ||
    req.query?.sellerId !== undefined ||
    (req.params && req.params.sellerId !== undefined)
  ) {
    throw new AppError('Le sellerId fourni par le client est interdit.', 400);
  }

  // ✅ Pagination
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
  const skip = (page - 1) * limit;

  // ✅ Filtre optionnel par statut
  const allowedStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
  let statusFilter = {};
  if (req.query.status !== undefined && req.query.status !== '') {
    if (!allowedStatuses.includes(req.query.status)) {
      throw new AppError(`Statut invalide. Statuts autorisés : ${allowedStatuses.join(', ')}.`, 400);
    }
    statusFilter = { orderStatus: req.query.status };
  }

  // ✅ Récupérer les IDs des produits du vendeur
  const sellerProducts = await Product.find({ sellerId: seller._id }).select('_id');
  const sellerProductIds = sellerProducts.map(p => p._id);

  // ✅ Construire le filtre combinant les produits du vendeur et le statut optionnel
  const baseFilter = {
    'items.productId': { $in: sellerProductIds }
  };
  const filter = { ...baseFilter, ...statusFilter };

  const total = await Order.countDocuments(filter);

  // ✅ Tri par date décroissante + pagination
  const orders = await Order.find(filter)
    .populate('userId', 'name email')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  res.status(200).json({
    success: true,
    count: orders.length,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    orders
  });
});

// Obtenir les analytics du vendeur
const getSellerAnalytics = catchAsync(async (req, res, next) => {
  const seller = req.seller; // ✅ Utilisation exclusive de req.seller._id

  // ✅ Refuser toute tentative d'utiliser sellerId provenant de req.body, req.params ou req.query
  if (
    req.body?.sellerId !== undefined ||
    req.query?.sellerId !== undefined ||
    (req.params && req.params.sellerId !== undefined)
  ) {
    throw new AppError('Le sellerId fourni par le client est interdit.', 400);
  }

  const sellerProducts = await Product.find({ sellerId: seller._id }).select('_id');
  const sellerProductIds = sellerProducts.map(p => p._id);
  const sellerProductIdSet = new Set(sellerProductIds.map(id => id.toString()));

  // Statistiques des commandes
  const orders = await Order.find({
    'items.productId': { $in: sellerProductIds }
  });

  const totalRevenue = orders.reduce((sum, order) => {
    const sellerItems = order.items.filter(item => 
      item.productId && sellerProductIdSet.has(item.productId.toString())
    );
    const sellerTotal = sellerItems.reduce((itemSum, item) => itemSum + (item.price * item.quantity), 0);
    return sum + sellerTotal;
  }, 0);

  const totalOrders = orders.length;
  const pendingOrders = orders.filter(o => o.orderStatus === 'pending').length;
  const completedOrders = orders.filter(o => o.orderStatus === 'delivered').length;

  // Statistiques des produits
  const totalProducts = sellerProducts.length;
  const activeProducts = sellerProducts.filter(p => p.stock > 0).length;

  // Métriques temporelles (30 derniers jours)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentOrders = orders.filter(o => o.createdAt >= thirtyDaysAgo);
  const recentRevenue = recentOrders.reduce((sum, order) => {
    const sellerItems = order.items.filter(item => 
      item.productId && sellerProductIdSet.has(item.productId.toString())
    );
    const sellerTotal = sellerItems.reduce((itemSum, item) => itemSum + (item.price * item.quantity), 0);
    return sum + sellerTotal;
  }, 0);

  res.status(200).json({
    success: true,
    analytics: {
      overview: {
        totalRevenue,
        totalOrders,
        totalProducts,
        rating: seller.rating,
        totalReviews: seller.totalReviews
      },
      orders: {
        pending: pendingOrders,
        completed: completedOrders,
        recent: recentOrders.length
      },
      products: {
        total: totalProducts,
        active: activeProducts
      },
      revenue: {
        last30Days: recentRevenue,
        averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0
      }
    }
  });
});

// Supprimer le compte vendeur
const deleteSellerAccount = catchAsync(async (req, res, next) => {
  const seller = await Seller.findOne({ userId: req.user._id });
  
  if (!seller) {
    throw new AppError('Profil vendeur non trouvé', 404);
  }

  // Vérifier s'il y a des commandes en cours
  const sellerProducts = await Product.find({ sellerId: seller._id }).select('_id');
  const sellerProductIds = sellerProducts.map(p => p._id);

  const activeOrders = await Order.countDocuments({
    'items.productId': { $in: sellerProductIds },
    orderStatus: { $in: ['pending', 'processing', 'shipped'] }
  });

  if (activeOrders > 0) {
    throw new AppError('Impossible de supprimer le compte avec des commandes en cours', 400);
  }

  // Supprimer les produits du vendeur
  await Product.deleteMany({ sellerId: seller._id });

  // Supprimer le vendeur
  await Seller.findByIdAndDelete(seller._id);

  // Rétablir le rôle customer
  await User.findByIdAndUpdate(req.user._id, { role: 'customer' });

  res.status(200).json({
    success: true,
    message: 'Compte vendeur supprimé avec succès'
  });
});

// Créer un produit vendeur
const createSellerProduct = catchAsync(async (req, res, next) => {
  const seller = req.seller;
  const { name, description, price, currency, category, stock, images, brand, subcategory } = req.body;

  if (!name || !description || !price || !category) {
    throw new AppError('Les champs nom, description, prix et catégorie sont obligatoires.', 400);
  }

  const product = await Product.create({
    name,
    description,
    price,
    currency: currency || 'XOF',
    category,
    stock: stock || 0,
    images: images || [],
    brand,
    subcategory,
    sellerId: seller._id,
    approvalStatus: 'pending',
    isPublished: false
  });

  res.status(201).json({
    success: true,
    message: 'Produit créé avec succès. En attente d\'approbation.',
    product
  });
});

// Mettre à jour un produit vendeur
const updateSellerProduct = catchAsync(async (req, res, next) => {
  const seller = req.seller; // ✅ Utilisation exclusive de req.seller._id
  const { id } = req.params;

  // ✅ Refuser toute tentative d'utiliser sellerId provenant de req.body, req.params ou req.query
  if (
    req.body?.sellerId !== undefined ||
    req.query?.sellerId !== undefined ||
    (req.params && req.params.sellerId !== undefined)
  ) {
    throw new AppError('La modification du sellerId est interdite.', 400);
  }

  const product = await Product.findById(id);
  if (!product) {
    throw new AppError('Produit non trouvé.', 404);
  }

  // ✅ Vérifier que le produit appartient au vendeur connecté
  if (!product.sellerId || product.sellerId.toString() !== seller._id.toString()) {
    throw new AppError('Vous n\'êtes pas autorisé à modifier ce produit.', 403);
  }

  // ✅ Champs autorisés uniquement
  const allowedUpdates = ['name', 'description', 'price', 'category', 'stock', 'images'];
  allowedUpdates.forEach(field => {
    if (req.body[field] !== undefined) {
      product[field] = req.body[field];
    }
  });

  // Reset approval et publication après modification
  product.approvalStatus = 'pending';
  product.isPublished = false;

  await product.save();

  res.status(200).json({
    success: true,
    message: 'Produit mis à jour avec succès. En attente de ré-approbation.',
    product
  });
});

// Supprimer un produit vendeur
const deleteSellerProduct = catchAsync(async (req, res, next) => {
  const seller = req.seller; // ✅ Utilisation exclusive de req.seller._id
  const { id } = req.params;

  // ✅ Refuser toute tentative d'utiliser sellerId provenant de req.body, req.params ou req.query
  if (
    req.body?.sellerId !== undefined ||
    req.query?.sellerId !== undefined ||
    (req.params && req.params.sellerId !== undefined)
  ) {
    throw new AppError('La modification du sellerId est interdite.', 400);
  }

  const product = await Product.findById(id);
  if (!product) {
    throw new AppError('Produit non trouvé.', 404);
  }

  // ✅ Vérifier que le produit appartient au vendeur connecté
  if (!product.sellerId || product.sellerId.toString() !== seller._id.toString()) {
    throw new AppError('Vous n\'êtes pas autorisé à supprimer ce produit.', 403);
  }

  await Product.findByIdAndDelete(id);

  res.status(200).json({
    success: true,
    message: 'Produit supprimé avec succès.'
  });
});

// PHASE 13.10 — Mettre à jour le statut d'une commande du vendeur connecté (uniquement ses propres produits)
const updateSellerOrderStatus = catchAsync(async (req, res, next) => {
  const seller = req.seller; // ✅ Utilisation exclusive de req.seller._id

  // ✅ Refuser toute tentative d'utiliser sellerId provenant de req.body, req.params ou req.query
  if (
    req.body?.sellerId !== undefined ||
    req.query?.sellerId !== undefined ||
    (req.params && req.params.sellerId !== undefined)
  ) {
    throw new AppError('Le sellerId fourni par le client est interdit.', 400);
  }

  const { orderId } = req.params;
  const { status } = req.body;

  // ✅ Statuts autorisés pour le vendeur
  const allowedStatuses = ['processing', 'shipped', 'delivered'];

  // ✅ statut obligatoire
  if (status === undefined || status === null || status === '') {
    throw new AppError('Le statut est obligatoire.', 400);
  }

  // ✅ Refuser toute valeur non autorisée
  if (!allowedStatuses.includes(status)) {
    throw new AppError(`Statut non autorisé. Utilisez : ${allowedStatuses.join(', ')}.`, 400);
  }

  // ✅ Vérifier que la commande existe
  const order = await Order.findById(orderId);
  if (!order) {
    throw new AppError('Commande non trouvée.', 404);
  }

  // ✅ Récupérer les IDs des produits du vendeur
  const sellerProducts = await Product.find({ sellerId: seller._id }).select('_id');
  const sellerProductIdSet = new Set(sellerProducts.map(p => p._id.toString()));

  // ✅ Vérifier que la commande contient au moins un produit du vendeur
  const hasSellerProduct = order.items.some(item =>
    item.productId && sellerProductIdSet.has(item.productId.toString())
  );

  if (!hasSellerProduct) {
    throw new AppError('Cette commande ne contient aucun produit de votre boutique.', 403);
  }

  // ✅ Modifier UNIQUEMENT le statut (jamais le paiement, le prix, ni les infos client)
  order.orderStatus = status;
  order.status = status;

  await order.save();

  res.status(200).json({
    success: true,
    message: 'Statut de la commande mis à jour avec succès.',
    order: {
      _id: order._id,
      orderStatus: order.orderStatus,
      status: order.status
    }
  });
});

// PHASE 13.11 — Obtenir les détails d'une commande (vendeur connecté uniquement)
const getSellerOrderDetails = catchAsync(async (req, res, next) => {
  const seller = req.seller; // ✅ Utilisation exclusive de req.seller._id

  // ✅ Refuser toute tentative d'utiliser sellerId provenant de req.body, req.params ou req.query
  if (
    req.body?.sellerId !== undefined ||
    req.query?.sellerId !== undefined ||
    (req.params && req.params.sellerId !== undefined)
  ) {
    throw new AppError('Le sellerId fourni par le client est interdit.', 400);
  }

  const { id } = req.params;

  // Récupérer la commande
  const order = await Order.findById(id);
  if (!order) {
    throw new AppError('Commande non trouvée.', 404);
  }

  // Récupérer les IDs des produits du vendeur
  const sellerProducts = await Product.find({ sellerId: seller._id }).select('_id');
  const sellerProductIds = sellerProducts.map(p => p._id.toString());

  // Filtrer les articles appartenant au vendeur connecté
  const sellerItems = order.items.filter(item =>
    item.productId && sellerProductIds.includes(item.productId.toString())
  );

  // Vérifier que la commande contient au moins un produit du vendeur
  if (sellerItems.length === 0) {
    throw new AppError('Cette commande ne contient aucun produit de votre boutique.', 403);
  }

  // Calculer le sous-total vendeur
  const sellerSubtotal = sellerItems.reduce(
    (sum, item) => sum + (item.price * item.quantity),
    0
  );

  res.status(200).json({
    success: true,
    order: {
      _id: order._id,
      orderStatus: order.orderStatus,
      status: order.status,
      createdAt: order.createdAt,
      sellerSubtotal,
      items: sellerItems.map(item => ({
        productId: item.productId,
        name: item.name,
        image: item.image,
        quantity: item.quantity,
        price: item.price
      }))
    }
  });
});

// PHASE 13.11 — Mettre à jour le statut d'une commande (version améliorée)
const updateSellerOrderStatusEnhanced = catchAsync(async (req, res, next) => {
  const seller = req.seller; // ✅ Utilisation exclusive de req.seller._id

  // ✅ Refuser toute tentative d'utiliser sellerId provenant de req.body, req.params ou req.query
  if (
    req.body?.sellerId !== undefined ||
    req.query?.sellerId !== undefined ||
    (req.params && req.params.sellerId !== undefined)
  ) {
    throw new AppError('Le sellerId fourni par le client est interdit.', 400);
  }

  const { id } = req.params;
  const { status } = req.body;

  // ✅ Statuts autorisés
  const allowedStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

  // ✅ status obligatoire
  if (status === undefined || status === null || status === '') {
    throw new AppError('Le statut est obligatoire.', 400);
  }

  // ✅ Refuser toute valeur inconnue
  if (!allowedStatuses.includes(status)) {
    throw new AppError(`Statut invalide. Statuts autorisés : ${allowedStatuses.join(', ')}.`, 400);
  }

  // Récupérer la commande
  const order = await Order.findById(id);
  if (!order) {
    throw new AppError('Commande non trouvée.', 404);
  }

  // Récupérer les IDs des produits du vendeur
  const sellerProducts = await Product.find({ sellerId: seller._id }).select('_id');
  const sellerProductIds = sellerProducts.map(p => p._id.toString());

  // Vérifier que la commande contient au moins un produit du vendeur
  const hasSellerProduct = order.items.some(item =>
    item.productId && sellerProductIds.includes(item.productId.toString())
  );

  if (!hasSellerProduct) {
    throw new AppError('Cette commande ne contient aucun produit de votre boutique.', 403);
  }

  // ✅ Mettre à jour orderStatus + champ legacy status (synchronisés)
  order.orderStatus = status;
  order.status = status;

  await order.save();

  res.status(200).json({
    success: true,
    message: 'Statut de la commande mis à jour avec succès.',
    order: {
      _id: order._id,
      orderStatus: order.orderStatus,
      status: order.status
    }
  });
});

// PHASE 13.8 — Mettre à jour le stock d'un produit vendeur
const updateSellerProductStock = catchAsync(async (req, res, next) => {
  const seller = req.seller; // ✅ Utilisation exclusive de req.seller._id
  const { id } = req.params;
  const { stock } = req.body;

  // ✅ Refuser toute tentative d'utiliser sellerId provenant de req.body, req.params ou req.query
  if (
    req.body?.sellerId !== undefined ||
    req.query?.sellerId !== undefined ||
    (req.params && req.params.sellerId !== undefined)
  ) {
    throw new AppError('Le sellerId fourni par le client est interdit.', 400);
  }

  // ✅ stock obligatoire
  if (stock === undefined || stock === null || typeof stock !== 'number' || stock < 0) {
    throw new AppError('Un stock valide (nombre ≥ 0) est obligatoire.', 400);
  }

  const product = await Product.findById(id);
  if (!product) {
    throw new AppError('Produit non trouvé.', 404);
  }

  // ✅ Vérifier que le produit appartient au vendeur connecté
  if (!product.sellerId || product.sellerId.toString() !== seller._id.toString()) {
    throw new AppError('Vous n\'êtes pas autorisé à modifier ce produit.', 403);
  }

  product.stock = stock;

  await product.save();

  res.status(200).json({
    success: true,
    message: 'Stock mis à jour avec succès.',
    product: {
      _id: product._id,
      name: product.name,
      stock: product.stock
    }
  });
});

// PHASE 13.9 — Obtenir les avis du vendeur connecté
const getSellerReviews = catchAsync(async (req, res, next) => {
  const seller = req.seller; // ✅ Utilisation exclusive de req.seller._id

  // ✅ Refuser toute tentative d'utiliser sellerId provenant de req.body, req.params ou req.query
  if (
    req.body?.sellerId !== undefined ||
    req.query?.sellerId !== undefined ||
    (req.params && req.params.sellerId !== undefined)
  ) {
    throw new AppError('Le sellerId fourni par le client est interdit.', 400);
  }

  // Récupérer les IDs des produits du vendeur
  const sellerProducts = await Product.find({ sellerId: seller._id }).select('_id');
  const sellerProductIds = sellerProducts.map(p => p._id);

  // Récupérer uniquement les avis liés aux produits du vendeur connecté
  const reviews = await Review.find({ productId: { $in: sellerProductIds } })
    .populate('userId', 'name avatar')
    .populate('productId', 'name image')
    .sort({ createdAt: -1 });

  // Note moyenne
  const totalReviews = reviews.length;
  const averageRating = totalReviews > 0
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews
    : 0;

  res.status(200).json({
    success: true,
    reviews,
    averageRating: Number(averageRating.toFixed(2)),
    totalReviews
  });
});

// PHASE 13.9 — Résumé des notes du vendeur connecté
const sellerReviewSummary = catchAsync(async (req, res, next) => {
  const seller = req.seller; // ✅ Utilisation exclusive de req.seller._id

  // ✅ Refuser toute tentative d'utiliser sellerId provenant de req.body, req.params ou req.query
  if (
    req.body?.sellerId !== undefined ||
    req.query?.sellerId !== undefined ||
    (req.params && req.params.sellerId !== undefined)
  ) {
    throw new AppError('Le sellerId fourni par le client est interdit.', 400);
  }

  // Récupérer les IDs des produits du vendeur
  const sellerProducts = await Product.find({ sellerId: seller._id }).select('_id');
  const sellerProductIds = sellerProducts.map(p => p._id);

  // Agrégation des avis du vendeur connecté
  const aggregation = await Review.aggregate([
    {
      $match: { productId: { $in: sellerProductIds } }
    },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 },
        star1: { $sum: { $cond: [{ $eq: ['$rating', 1] }, 1, 0] } },
        star2: { $sum: { $cond: [{ $eq: ['$rating', 2] }, 1, 0] } },
        star3: { $sum: { $cond: [{ $eq: ['$rating', 3] }, 1, 0] } },
        star4: { $sum: { $cond: [{ $eq: ['$rating', 4] }, 1, 0] } },
        star5: { $sum: { $cond: [{ $eq: ['$rating', 5] }, 1, 0] } }
      }
    }
  ]);

  const stats = aggregation[0] || {
    averageRating: 0,
    totalReviews: 0,
    star1: 0,
    star2: 0,
    star3: 0,
    star4: 0,
    star5: 0
  };

res.status(200).json({
    success: true,
    summary: {
      averageRating: Number((stats.averageRating || 0).toFixed(2)),
      totalReviews: stats.totalReviews || 0,
      distribution: {
        1: stats.star1 || 0,
        2: stats.star2 || 0,
        3: stats.star3 || 0,
        4: stats.star4 || 0,
        5: stats.star5 || 0
      }
    }
  });
});

// PHASE 13.11 — Obtenir les produits les plus vendus du vendeur connecté
const getSellerTopProducts = catchAsync(async (req, res, next) => {
  const seller = req.seller; // ✅ Utilisation exclusive de req.seller._id

  // ✅ Refuser toute tentative d'utiliser sellerId provenant de req.body, req.params ou req.query
  if (
    req.body?.sellerId !== undefined ||
    req.query?.sellerId !== undefined ||
    (req.params && req.params.sellerId !== undefined)
  ) {
    throw new AppError('Le sellerId fourni par le client est interdit.', 400);
  }

  // ✅ Paramètre optionnel de limite (défaut 5, max 20)
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 5, 1), 20);

  // ✅ Récupérer les IDs des produits du vendeur
  const sellerProducts = await Product.find({ sellerId: seller._id }).select('_id');
  const sellerProductIds = sellerProducts.map(p => p._id);
  const sellerProductIdSet = new Set(sellerProductIds.map(id => id.toString()));

  // ✅ Récupérer les commandes (non annulées) contenant les produits du vendeur
  const orders = await Order.find({
    'items.productId': { $in: sellerProductIds },
    orderStatus: { $ne: 'cancelled' }
  });

  // ✅ Agréger les quantités vendues et revenus par produit du vendeur
  const salesMap = new Map();

  orders.forEach(order => {
    order.items.forEach(item => {
      if (!item.productId || !sellerProductIdSet.has(item.productId.toString())) {
        return;
      }
      const prodId = item.productId.toString();
      const current = salesMap.get(prodId) || { productId: item.productId, quantitySold: 0, revenue: 0 };
      current.quantitySold += item.quantity;
      current.revenue += item.price * item.quantity;
      salesMap.set(prodId, current);
    });
  });

  const salesList = Array.from(salesMap.values());

  // ✅ Récupérer les détails des produits vendus
  const soldProductIds = salesList.map(s => s.productId);
  const products = await Product.find({ _id: { $in: soldProductIds } })
    .select('name image price stock category rating numReviews');

  // ✅ Construire la réponse, triée par quantité vendue décroissante
  const productMap = new Map(products.map(p => [p._id.toString(), p]));
  const topProducts = salesList
    .map(sale => {
      const product = productMap.get(sale.productId.toString());
      if (!product) return null;
      return {
        productId: product._id,
        name: product.name,
        image: product.image || (product.images && product.images[0]) || null,
        price: product.price,
        stock: product.stock,
        category: product.category,
        rating: product.rating,
        totalReviews: product.numReviews,
        quantitySold: sale.quantitySold,
        revenue: sale.revenue
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.quantitySold - a.quantitySold)
    .slice(0, limit);

  res.status(200).json({
    success: true,
    count: topProducts.length,
    topProducts
  });
});

// PHASE 13.12 — Obtenir les performances du vendeur connecté
const getSellerPerformance = catchAsync(async (req, res, next) => {
  const seller = req.seller; // ✅ Utilisation exclusive de req.seller._id

  // ✅ Refuser toute tentative d'utiliser sellerId provenant de req.body, req.params ou req.query
  if (
    req.body?.sellerId !== undefined ||
    req.query?.sellerId !== undefined ||
    (req.params && req.params.sellerId !== undefined)
  ) {
    throw new AppError('Le sellerId fourni par le client est interdit.', 400);
  }

  // ✅ Récupérer les IDs des produits du vendeur
  const sellerProducts = await Product.find({ sellerId: seller._id }).select('_id');
  const sellerProductIds = sellerProducts.map(p => p._id);
  const sellerProductIdSet = new Set(sellerProductIds.map(id => id.toString()));

  // ✅ Récupérer les commandes (non annulées) contenant les produits du vendeur
  const orders = await Order.find({
    'items.productId': { $in: sellerProductIds },
    orderStatus: { $ne: 'cancelled' }
  });

  // ✅ Calcul du chiffre d'affaires total (uniquement les produits du vendeur)
  const totalRevenue = orders.reduce((sum, order) => {
    const sellerItems = order.items.filter(item =>
      item.productId && sellerProductIdSet.has(item.productId.toString())
    );
    const sellerTotal = sellerItems.reduce((itemSum, item) => itemSum + (item.price * item.quantity), 0);
    return sum + sellerTotal;
  }, 0);

  const totalOrders = orders.length;

  // ✅ Métriques temporelles (30 derniers jours)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentOrders = orders.filter(o => o.createdAt >= thirtyDaysAgo);
  const recentRevenue = recentOrders.reduce((sum, order) => {
    const sellerItems = order.items.filter(item =>
      item.productId && sellerProductIdSet.has(item.productId.toString())
    );
    const sellerTotal = sellerItems.reduce((itemSum, item) => itemSum + (item.price * item.quantity), 0);
    return sum + sellerTotal;
  }, 0);

  // ✅ Nombre de produits en attente d'approbation
  const pendingProducts = await Product.countDocuments({
    sellerId: seller._id,
    approvalStatus: 'pending'
  });

  // ✅ Nombre total de produits
  const totalProducts = sellerProducts.length;

  res.status(200).json({
    success: true,
    performance: {
      revenue: {
        total: totalRevenue,
        last30Days: recentRevenue
      },
      orders: {
        total: totalOrders,
        last30Days: recentOrders.length
      },
      products: {
        total: totalProducts,
        pending: pendingProducts
      },
      averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
      rating: seller.rating,
      totalReviews: seller.totalReviews
    }
  });
});

// PHASE 13.13 — Obtenir les analytics de revenus du vendeur connecté
const getSellerRevenueAnalytics = catchAsync(async (req, res, next) => {
  const seller = req.seller; // ✅ Utilisation exclusive de req.seller._id

  // ✅ Refuser toute tentative d'utiliser sellerId provenant de req.body, req.params ou req.query
  if (
    req.body?.sellerId !== undefined ||
    req.query?.sellerId !== undefined ||
    (req.params && req.params.sellerId !== undefined)
  ) {
    throw new AppError('Le sellerId fourni par le client est interdit.', 400);
  }

  // ✅ Récupérer les IDs des produits du vendeur
  const sellerProducts = await Product.find({ sellerId: seller._id }).select('_id');
  const sellerProductIds = sellerProducts.map(p => p._id);
  const sellerProductIdSet = new Set(sellerProductIds.map(id => id.toString()));

  // ✅ Récupérer les commandes (non annulées) contenant les produits du vendeur
  const orders = await Order.find({
    'items.productId': { $in: sellerProductIds },
    orderStatus: { $ne: 'cancelled' }
  });

  // ✅ Fonction utilitaire : somme des revenus vendeur pour une liste de commandes
  const computeSellerTotals = (orderList) => {
    return orderList.reduce(
      ({ revenue, orders, productsSold }, order) => {
        let orderRevenue = 0;
        const sellerItems = order.items.filter(item =>
          item.productId && sellerProductIdSet.has(item.productId.toString())
        );
        sellerItems.forEach(item => {
          orderRevenue += item.price * item.quantity;
        });
        return {
          revenue: revenue + orderRevenue,
          orders: orders + (orderRevenue > 0 ? 1 : 0),
          productsSold: productsSold + sellerItems.reduce((sum, item) => sum + item.quantity, 0)
        };
      },
      { revenue: 0, orders: 0, productsSold: 0 }
    );
  };

  // ✅ 1) Revenue global
  const globalTotals = orders.reduce((sum, order) => {
    const sellerItems = order.items.filter(item =>
      item.productId && sellerProductIdSet.has(item.productId.toString())
    );
    const sellerTotal = sellerItems.reduce((itemSum, item) => itemSum + (item.price * item.quantity), 0);
    return sum + sellerTotal;
  }, 0);

  const totalRevenue = globalTotals;
  const totalOrders = orders.length;
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  // ✅ 2) Revenue par période
  const now = new Date();

  // Début de la journée (aujourd'hui)
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  // Début de la période des 7 derniers jours (inclus aujourd'hui)
  const startOfLast7Days = new Date(now);
  startOfLast7Days.setDate(startOfLast7Days.getDate() - 6);
  startOfLast7Days.setHours(0, 0, 0, 0);

  // Début de la période des 30 derniers jours (inclus aujourd'hui)
  const startOfLast30Days = new Date(now);
  startOfLast30Days.setDate(startOfLast30Days.getDate() - 29);
  startOfLast30Days.setHours(0, 0, 0, 0);

  // Début de l'année en cours
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  const periodTotals = (ordersList) => {
    const totals = computeSellerTotals(ordersList);
    return {
      revenue: totals.revenue,
      orders: totals.orders,
      productsSold: totals.productsSold
    };
  };

  const today = periodTotals(orders.filter(o => o.createdAt >= startOfToday));
  const last7Days = periodTotals(orders.filter(o => o.createdAt >= startOfLast7Days));
  const last30Days = periodTotals(orders.filter(o => o.createdAt >= startOfLast30Days));
  const thisYear = periodTotals(orders.filter(o => o.createdAt >= startOfYear));

  // ✅ 3) Évolution mensuelle (12 derniers mois)
  const monthNames = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  const monthlyEvolution = [];
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  for (let i = 11; i >= 0; i--) {
    const monthIndex = (currentMonth - i + 48) % 12;
    const yearOffset = Math.floor((currentMonth - i + 48) / 12) - 4;
    const year = currentYear + yearOffset;
    const monthStart = new Date(year, monthIndex, 1);
    const monthEnd = new Date(year, monthIndex + 1, 1);

    const monthOrders = orders.filter(o => o.createdAt >= monthStart && o.createdAt < monthEnd);
    const monthTotals = computeSellerTotals(monthOrders);

    monthlyEvolution.push({
      month: `${monthNames[monthIndex]} ${year}`,
      revenue: monthTotals.revenue,
      orders: monthTotals.orders
    });
  }

  res.status(200).json({
    success: true,
    analytics: {
      global: {
        totalRevenue,
        totalOrders,
        averageOrderValue
      },
      periods: {
        today,
        last7Days,
        last30Days,
        thisYear
      },
      monthlyEvolution
    }
  });
});

// PHASE 13.13 — Obtenir l'aperçu des ventes du vendeur connecté
const getSellerSalesOverview = catchAsync(async (req, res, next) => {
  const seller = req.seller; // ✅ Utilisation exclusive de req.seller._id

  // ✅ Refuser toute tentative d'utiliser sellerId provenant de req.body, req.params ou req.query
  if (
    req.body?.sellerId !== undefined ||
    req.query?.sellerId !== undefined ||
    (req.params && req.params.sellerId !== undefined)
  ) {
    throw new AppError('Le sellerId fourni par le client est interdit.', 400);
  }

  // ✅ Récupérer les IDs des produits du vendeur
  const sellerProducts = await Product.find({ sellerId: seller._id }).select('_id');
  const sellerProductIds = sellerProducts.map(p => p._id);
  const sellerProductIdSet = new Set(sellerProductIds.map(id => id.toString()));

  // ✅ Récupérer toutes les commandes (y compris annulées pour les stats de statut)
  const orders = await Order.find({
    'items.productId': { $in: sellerProductIds }
  });

  // ✅ Récupérer les commandes non annulées pour les revenus / quantités
  const validOrders = orders.filter(o => o.orderStatus !== 'cancelled');

  // ✅ 1) Produits les plus rentables (Top 5, triés par revenu décroissant)
  const salesMap = new Map();

  validOrders.forEach(order => {
    order.items.forEach(item => {
      if (!item.productId || !sellerProductIdSet.has(item.productId.toString())) {
        return;
      }
      const prodId = item.productId.toString();
      const current = salesMap.get(prodId) || { productId: item.productId, revenue: 0, quantitySold: 0 };
      current.revenue += item.price * item.quantity;
      current.quantitySold += item.quantity;
      salesMap.set(prodId, current);
    });
  });

  const salesList = Array.from(salesMap.values());

  // Récupérer les noms des produits vendus
  const soldProductIds = salesList.map(s => s.productId);
  const products = await Product.find({ _id: { $in: soldProductIds } }).select('name');
  const productNameMap = new Map(products.map(p => [p._id.toString(), p.name]));

  const topProducts = salesList
    .map(sale => ({
      productId: sale.productId,
      name: productNameMap.get(sale.productId.toString()) || 'Produit supprimé',
      revenue: sale.revenue,
      quantitySold: sale.quantitySold
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  // ✅ 2) Statistiques commandes
  const orderStats = {
    pending: orders.filter(o => o.orderStatus === 'pending').length,
    processing: orders.filter(o => o.orderStatus === 'processing').length,
    shipped: orders.filter(o => o.orderStatus === 'shipped').length,
    delivered: orders.filter(o => o.orderStatus === 'delivered').length,
    cancelled: orders.filter(o => o.orderStatus === 'cancelled').length
  };

  res.status(200).json({
    success: true,
    salesOverview: {
      topProducts,
      orderStats
    }
  });
});

// PHASE 13.12 — Obtenir les statistiques d'inventaire du vendeur connecté
const getSellerInventoryStats = catchAsync(async (req, res, next) => {
  const seller = req.seller; // ✅ Utilisation exclusive de req.seller._id

  // ✅ Refuser toute tentative d'utiliser sellerId provenant de req.body, req.params ou req.query
  if (
    req.body?.sellerId !== undefined ||
    req.query?.sellerId !== undefined ||
    (req.params && req.params.sellerId !== undefined)
  ) {
    throw new AppError('Le sellerId fourni par le client est interdit.', 400);
  }

  // ✅ Récupérer tous les produits du vendeur
  const products = await Product.find({ sellerId: seller._id });

  const totalProducts = products.length;
  const inStock = products.filter(p => p.stock > 0).length;
  const outOfStock = products.filter(p => p.stock === 0).length;
  const lowStockThreshold = 5;
  const lowStock = products.filter(p => p.stock > 0 && p.stock <= lowStockThreshold).length;

  // ✅ Agrégation par approbation / publication
  const approved = products.filter(p => p.approvalStatus === 'approved').length;
  const pending = products.filter(p => p.approvalStatus === 'pending').length;
  const rejected = products.filter(p => p.approvalStatus === 'rejected').length;
  const published = products.filter(p => p.isPublished === true).length;

  // ✅ Valeur totale du stock (prix × quantité)
  const totalStockValue = products.reduce((sum, p) => sum + (p.price * (p.stock || 0)), 0);

  res.status(200).json({
    success: true,
    inventory: {
      totalProducts,
      inStock,
      outOfStock,
      lowStock,
      lowStockThreshold,
      status: {
        approved,
        pending,
        rejected,
        published
      },
      totalStockValue
    }
  });
});

// PHASE 13.14 — Obtenir les insights clients du vendeur connecté
// (uniquement les clients ayant acheté les produits du vendeur)
const getSellerCustomerInsights = catchAsync(async (req, res, next) => {
  const seller = req.seller; // ✅ Utilisation exclusive de req.seller._id

  // ✅ Refuser toute tentative d'utiliser sellerId provenant de req.body, req.params ou req.query
  if (
    req.body?.sellerId !== undefined ||
    req.query?.sellerId !== undefined ||
    (req.params && req.params.sellerId !== undefined)
  ) {
    throw new AppError('Le sellerId fourni par le client est interdit.', 400);
  }

  // ✅ Récupérer les IDs des produits du vendeur
  const sellerProducts = await Product.find({ sellerId: seller._id }).select('_id');
  const sellerProductIds = sellerProducts.map(p => p._id);
  const sellerProductIdSet = new Set(sellerProductIds.map(id => id.toString()));

  // ✅ Récupérer les commandes non annulées contenant les produits du vendeur
  // (uniquement les champs nécessaires, tri ascendant pour calculer la première commande)
  const orders = await Order.find({
    'items.productId': { $in: sellerProductIds },
    orderStatus: { $ne: 'cancelled' },
    userId: { $ne: null }
  })
    .select('userId items productId quantity price createdAt')
    .sort({ createdAt: 1 });

  // ✅ Agréger les clients uniques
  const customerMap = new Map();

  orders.forEach(order => {
    if (!order.userId) return;
    const userId = order.userId.toString();

    const sellerItems = order.items.filter(item =>
      item.productId && sellerProductIdSet.has(item.productId.toString())
    );

    // ✅ Ignorer les commandes sans produit du vendeur
    if (sellerItems.length === 0) return;

    const orderSpent = sellerItems.reduce(
      (sum, item) => sum + (item.price * item.quantity),
      0
    );

    const existing = customerMap.get(userId) || {
      userId: order.userId,
      totalOrders: 0,
      totalSpent: 0,
      firstOrderDate: order.createdAt
    };

    existing.totalOrders += 1;
    existing.totalSpent += orderSpent;
    if (order.createdAt < existing.firstOrderDate) {
      existing.firstOrderDate = order.createdAt;
    }

    customerMap.set(userId, existing);
  });

  const customers = Array.from(customerMap.values());

  // ✅ totalCustomers : nombre total de clients uniques
  const totalCustomers = customers.length;

  // ✅ newCustomersLast30Days : clients dont la première commande date des 30 derniers jours
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const newCustomersLast30Days = customers.filter(
    c => c.firstOrderDate >= thirtyDaysAgo
  ).length;

  // ✅ returningCustomers : clients ayant effectué au moins 2 commandes
  const returningCustomers = customers.filter(c => c.totalOrders >= 2).length;

  // ✅ Top 10 clients triés par totalSpent décroissant
  const topCustomers = [...customers]
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .slice(0, 10);

  // ✅ Récupérer name et email des clients (User uniquement)
  const topUserIds = topCustomers.map(c => c.userId);
  const users = await User.find({ _id: { $in: topUserIds } }).select('name email');
  const userMap = new Map(users.map(u => [u._id.toString(), u]));

  const topClients = topCustomers.map(customer => {
    const user = userMap.get(customer.userId.toString());
    return {
      userId: customer.userId,
      name: user ? user.name : 'Compte supprimé',
      email: user ? user.email : null,
      totalOrders: customer.totalOrders,
      totalSpent: Number(customer.totalSpent.toFixed(2)),
      firstOrderDate: customer.firstOrderDate
    };
  });

  res.status(200).json({
    success: true,
    customerInsights: {
      totalCustomers,
      newCustomersLast30Days,
      returningCustomers
    },
    topClients
  });
});

// PHASE 13.14 — Obtenir les insights commandes du vendeur connecté
const getSellerOrderInsights = catchAsync(async (req, res, next) => {
  const seller = req.seller; // ✅ Utilisation exclusive de req.seller._id

  // ✅ Refuser toute tentative d'utiliser sellerId provenant de req.body, req.params ou req.query
  if (
    req.body?.sellerId !== undefined ||
    req.query?.sellerId !== undefined ||
    (req.params && req.params.sellerId !== undefined)
  ) {
    throw new AppError('Le sellerId fourni par le client est interdit.', 400);
  }

  // ✅ Récupérer les IDs des produits du vendeur
  const sellerProducts = await Product.find({ sellerId: seller._id }).select('_id');
  const sellerProductIds = sellerProducts.map(p => p._id);
  const sellerProductIdSet = new Set(sellerProductIds.map(id => id.toString()));

  // ✅ Récupérer toutes les commandes (y compris annulées pour les stats de statuts)
  // contenant les produits du vendeur
  const orders = await Order.find({
    'items.productId': { $in: sellerProductIds }
  }).select('userId items orderStatus createdAt');

  // ✅ 1) Statistiques commandes
  const totalOrders = orders.length;
  const completedOrders = orders.filter(o => o.orderStatus === 'delivered').length;
  const cancelledOrders = orders.filter(o => o.orderStatus === 'cancelled').length;
  const pendingOrders = orders.filter(o => o.orderStatus === 'pending').length;

  // ✅ 2) Taux (éviter division par zéro)
  const resolvedOrders = completedOrders + cancelledOrders;
  let deliveryRate = 0;
  let cancellationRate = 0;

  if (resolvedOrders > 0) {
    deliveryRate = (completedOrders / resolvedOrders) * 100;
    cancellationRate = (cancelledOrders / resolvedOrders) * 100;
  }

  // ✅ 3) Évolution hebdomadaire (8 dernières semaines)
  const weekLabels = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
  const now = new Date();

  // Début de la semaine actuelle (lundi)
  const startOfThisWeek = new Date(now);
  const day = startOfThisWeek.getDay();
  const diff = startOfThisWeek.getDate() - day + (day === 0 ? -6 : 1); // Lundi = début
  startOfThisWeek.setDate(diff);
  startOfThisWeek.setHours(0, 0, 0, 0);

  const weeklyEvolution = [];

  for (let i = 7; i >= 0; i--) {
    const weekStart = new Date(startOfThisWeek);
    weekStart.setDate(startOfThisWeek.getDate() - (i * 7));
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);

    let weekOrders = 0;
    let weekRevenue = 0;

    orders.forEach(order => {
      if (order.orderStatus === 'cancelled') return; // ✅ Ignorer les annulées
      if (order.createdAt >= weekStart && order.createdAt < weekEnd) {
        const sellerItems = order.items.filter(item =>
          item.productId && sellerProductIdSet.has(item.productId.toString())
        );
        if (sellerItems.length > 0) {
          weekOrders += 1;
          weekRevenue += sellerItems.reduce(
            (sum, item) => sum + (item.price * item.quantity),
            0
          );
        }
      }
    });

    weeklyEvolution.push({
      week: `${weekLabels[weekStart.getDay()]} ${weekStart.getDate()}`,
      orders: weekOrders,
      revenue: Number(weekRevenue.toFixed(2))
    });
  }

  res.status(200).json({
    success: true,
    orderInsights: {
      stats: {
        totalOrders,
        completedOrders,
        cancelledOrders,
        pendingOrders
      },
      rates: {
        deliveryRate: Number(deliveryRate.toFixed(2)),
        cancellationRate: Number(cancellationRate.toFixed(2))
      },
      weeklyEvolution
    }
  });
});

// PHASE 13.15 — Analytics de croissance du vendeur connecté
// Comparaison des 30 derniers jours vs les 30 jours précédents
const getSellerGrowthAnalytics = catchAsync(async (req, res, next) => {
  const seller = req.seller; // ✅ Utilisation exclusive de req.seller._id

  // ✅ Refuser toute tentative d'utiliser sellerId provenant de req.body, req.params ou req.query
  if (
    req.body?.sellerId !== undefined ||
    req.query?.sellerId !== undefined ||
    (req.params && req.params.sellerId !== undefined)
  ) {
    throw new AppError('Le sellerId fourni par le client est interdit.', 400);
  }

  // ✅ Récupérer les IDs des produits du vendeur
  const sellerProducts = await Product.find({ sellerId: seller._id }).select('_id');
  const sellerProductIds = sellerProducts.map(p => p._id);
  const sellerProductIdSet = new Set(sellerProductIds.map(id => id.toString()));

  // ✅ Définition des périodes de comparaison
  const now = new Date();
  const startOfCurrentPeriod = new Date(now);
  startOfCurrentPeriod.setHours(0, 0, 0, 0);
  startOfCurrentPeriod.setDate(startOfCurrentPeriod.getDate() - 29);

  const startOfPreviousPeriod = new Date(startOfCurrentPeriod);
  startOfPreviousPeriod.setDate(startOfPreviousPeriod.getDate() - 30);

  // ✅ Récupérer les commandes non annulées des 60 derniers jours contenant les produits du vendeur
  const orders = await Order.find({
    'items.productId': { $in: sellerProductIds },
    orderStatus: { $ne: 'cancelled' },
    createdAt: { $gte: startOfPreviousPeriod }
  }).select('userId items createdAt');

  // ✅ Fonction utilitaire : calculer revenu, commandes et clients d'une liste de commandes
  const computeMetrics = (orderList) => {
    const customerSet = new Set();
    let revenue = 0;

    orderList.forEach(order => {
      if (order.userId) customerSet.add(order.userId.toString());
      const sellerItems = order.items.filter(item =>
        item.productId && sellerProductIdSet.has(item.productId.toString())
      );
      sellerItems.forEach(item => {
        revenue += item.price * item.quantity;
      });
    });

    return {
      revenue,
      orders: orderList.length,
      customers: customerSet.size
    };
  };

  const currentOrders = orders.filter(o => o.createdAt >= startOfCurrentPeriod);
  const previousOrders = orders.filter(o => o.createdAt < startOfCurrentPeriod);

  const currentPeriod = computeMetrics(currentOrders);
  const previousPeriod = computeMetrics(previousOrders);

  // ✅ Pourcentages de croissance avec protection contre la division par zéro
  const growthRate = (current, previous) => {
    if (!previous || previous === 0) {
      return current === 0 ? 0 : 100;
    }
    return ((current - previous) / previous) * 100;
  };

  res.status(200).json({
    success: true,
    growthAnalytics: {
      revenueGrowth: Number(growthRate(currentPeriod.revenue, previousPeriod.revenue).toFixed(2)),
      orderGrowth: Number(growthRate(currentPeriod.orders, previousPeriod.orders).toFixed(2)),
      customerGrowth: Number(growthRate(currentPeriod.customers, previousPeriod.customers).toFixed(2)),
      currentPeriod,
      previousPeriod
    }
  });
});

// PHASE 13.15 — Performance des produits du vendeur connecté
const getSellerProductPerformance = catchAsync(async (req, res, next) => {
  const seller = req.seller; // ✅ Utilisation exclusive de req.seller._id

  // ✅ Refuser toute tentative d'utiliser sellerId provenant de req.body, req.params ou req.query
  if (
    req.body?.sellerId !== undefined ||
    req.query?.sellerId !== undefined ||
    (req.params && req.params.sellerId !== undefined)
  ) {
    throw new AppError('Le sellerId fourni par le client est interdit.', 400);
  }

  // ✅ Récupérer tous les produits du vendeur
  const products = await Product.find({ sellerId: seller._id })
    .select('name image price stock category');
  const productIdSet = new Set(products.map(p => p._id.toString()));

  // ✅ Récupérer les commandes non annulées contenant les produits du vendeur
  const orders = await Order.find({
    'items.productId': { $in: products.map(p => p._id) },
    orderStatus: { $ne: 'cancelled' }
  });

  // ✅ Agréger les ventes par produit
  const salesMap = new Map();
  orders.forEach(order => {
    order.items.forEach(item => {
      if (!item.productId || !productIdSet.has(item.productId.toString())) return;
      const prodId = item.productId.toString();
      const current = salesMap.get(prodId) || { productId: item.productId, quantitySold: 0, revenue: 0 };
      current.quantitySold += item.quantity;
      current.revenue += item.price * item.quantity;
      salesMap.set(prodId, current);
    });
  });

  const productMap = new Map(products.map(p => [p._id.toString(), p]));

  // ✅ Top 10 produits les plus vendus
  const bestSellingProducts = Array.from(salesMap.values())
    .map(sale => {
      const product = productMap.get(sale.productId.toString());
      if (!product) return null;
      return {
        productId: product._id,
        name: product.name,
        image: product.image || (product.images && product.images[0]) || null,
        price: product.price,
        category: product.category,
        quantitySold: sale.quantitySold,
        revenue: sale.revenue
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.quantitySold - a.quantitySold)
    .slice(0, 10);

  // ✅ Produits peu performants (n'ont jamais été vendus)
  const lowPerformingProducts = products
    .map(product => {
      const sale = salesMap.get(product._id.toString());
      return {
        productId: product._id,
        name: product.name,
        image: product.image || (product.images && product.images[0]) || null,
        price: product.price,
        category: product.category,
        quantitySold: sale ? sale.quantitySold : 0,
        revenue: sale ? sale.revenue : 0
      };
    })
    .filter(p => p.quantitySold === 0)
    .slice(0, 10);

  // ✅ Produits à risque (stock faible ou nul)
  const lowStockThreshold = 5;
  const inventoryRisks = products
    .filter(p => p.stock === 0 || p.stock <= lowStockThreshold)
    .map(product => ({
      productId: product._id,
      name: product.name,
      image: product.image || (product.images && product.images[0]) || null,
      price: product.price,
      stock: product.stock,
      status: product.stock === 0 ? 'out_of_stock' : 'low_stock'
    }))
    .sort((a, b) => a.stock - b.stock);

  res.status(200).json({
    success: true,
    productPerformance: {
      bestSellingProducts,
      lowPerformingProducts,
      inventoryRisks
    }
  });
});

// PHASE 13.15 — Résumé du dashboard du vendeur connecté
const getSellerDashboardSummary = catchAsync(async (req, res, next) => {
  const seller = req.seller; // ✅ Utilisation exclusive de req.seller._id

  // ✅ Refuser toute tentative d'utiliser sellerId provenant de req.body, req.params ou req.query
  if (
    req.body?.sellerId !== undefined ||
    req.query?.sellerId !== undefined ||
    (req.params && req.params.sellerId !== undefined)
  ) {
    throw new AppError('Le sellerId fourni par le client est interdit.', 400);
  }

  // ✅ Récupérer tous les produits du vendeur
  const sellerProducts = await Product.find({ sellerId: seller._id })
    .select('name image price stock');
  const sellerProductIds = sellerProducts.map(p => p._id);
  const sellerProductIdSet = new Set(sellerProductIds.map(id => id.toString()));

  // ✅ Récupérer les commandes non annulées contenant les produits du vendeur
  const orders = await Order.find({
    'items.productId': { $in: sellerProductIds },
    orderStatus: { $ne: 'cancelled' }
  }).select('userId items createdAt');

  // ✅ Revenus totaux, clients uniques et agrégation des ventes
  const customerSet = new Set();
  let totalRevenue = 0;
  const salesMap = new Map();

  orders.forEach(order => {
    if (order.userId) customerSet.add(order.userId.toString());
    const sellerItems = order.items.filter(item =>
      item.productId && sellerProductIdSet.has(item.productId.toString())
    );
    sellerItems.forEach(item => {
      totalRevenue += item.price * item.quantity;
      const prodId = item.productId.toString();
      const current = salesMap.get(prodId) || { productId: item.productId, quantitySold: 0, revenue: 0 };
      current.quantitySold += item.quantity;
      current.revenue += item.price * item.quantity;
      salesMap.set(prodId, current);
    });
  });

  // ✅ Dernière commande
  const sortedOrders = [...orders].sort((a, b) => b.createdAt - a.createdAt);
  const lastOrderDate = sortedOrders.length > 0 ? sortedOrders[0].createdAt : null;

  // ✅ Produit le plus vendu
  const productMap = new Map(sellerProducts.map(p => [p._id.toString(), p]));
  let topProduct = null;
  const bestSale = Array.from(salesMap.values()).sort((a, b) => b.quantitySold - a.quantitySold)[0];
  if (bestSale) {
    const product = productMap.get(bestSale.productId.toString());
    if (product) {
      topProduct = {
        productId: product._id,
        name: product.name,
        quantitySold: bestSale.quantitySold,
        revenue: Number(bestSale.revenue.toFixed(2))
      };
    }
  }

  res.status(200).json({
    success: true,
    summary: {
      revenue: Number(totalRevenue.toFixed(2)),
      orders: orders.length,
      products: sellerProducts.length,
      customers: customerSet.size,
      topProduct,
      lastOrderDate
    }
  });
});

module.exports = {
  getSellerGrowthAnalytics,
  getSellerProductPerformance,
  getSellerDashboardSummary,
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
  getSellerOrderDetails,
  updateSellerOrderStatusEnhanced,
  updateSellerProductStock,
  getSellerReviews,
  sellerReviewSummary,
  getSellerTopProducts,
  getSellerPerformance,
  getSellerInventoryStats,
  getSellerRevenueAnalytics,
  getSellerSalesOverview,
  getSellerCustomerInsights,
  getSellerOrderInsights
};


