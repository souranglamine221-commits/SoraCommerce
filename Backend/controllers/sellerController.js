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

// PHASE 13.16 — KPIs du vendeur connecté
// Indicateurs clés de performance centralisés
const getSellerKPIDashboard = catchAsync(async (req, res, next) => {
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

  // ✅ Récupérer toutes les commandes (y compris annulées pour le taux d'annulation)
  const allOrders = await Order.find({
    'items.productId': { $in: sellerProductIds }
  });

  // ✅ Commandes non annulées pour les revenus
  const validOrders = allOrders.filter(o => o.orderStatus !== 'cancelled');

  // ✅ Calcul des revenus
  const totalRevenue = validOrders.reduce((sum, order) => {
    const sellerItems = order.items.filter(item =>
      item.productId && sellerProductIdSet.has(item.productId.toString())
    );
    return sum + sellerItems.reduce((itemSum, item) => itemSum + (item.price * item.quantity), 0);
  }, 0);

  const totalOrders = validOrders.length;
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  // ✅ Métriques 30 derniers jours
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentOrders = validOrders.filter(o => o.createdAt >= thirtyDaysAgo);
  const recentRevenue = recentOrders.reduce((sum, order) => {
    const sellerItems = order.items.filter(item =>
      item.productId && sellerProductIdSet.has(item.productId.toString())
    );
    return sum + sellerItems.reduce((itemSum, item) => itemSum + (item.price * item.quantity), 0);
  }, 0);

  // ✅ Clients uniques
  const customerSet = new Set();
  validOrders.forEach(order => {
    if (order.userId) customerSet.add(order.userId.toString());
  });
  const totalCustomers = customerSet.size;

  // ✅ Taux de livraison et d'annulation (sur les commandes résolues)
  const completedOrders = allOrders.filter(o => o.orderStatus === 'delivered').length;
  const cancelledOrders = allOrders.filter(o => o.orderStatus === 'cancelled').length;
  const resolvedOrders = completedOrders + cancelledOrders;

  let deliveryRate = 0;
  let cancellationRate = 0;
  if (resolvedOrders > 0) {
    deliveryRate = (completedOrders / resolvedOrders) * 100;
    cancellationRate = (cancelledOrders / resolvedOrders) * 100;
  }

  // ✅ Produits (total, actifs, en attente, rupture)
  const totalProducts = sellerProducts.length;
  const activeProducts = sellerProducts.filter(p => p.stock > 0).length;
  const products = await Product.find({ sellerId: seller._id }).select('stock approvalStatus');
  const pendingProducts = products.filter(p => p.approvalStatus === 'pending').length;
  const outOfStockProducts = products.filter(p => p.stock === 0).length;

  res.status(200).json({
    success: true,
    kpis: {
      revenue: {
        total: Number(totalRevenue.toFixed(2)),
        last30Days: Number(recentRevenue.toFixed(2)),
        averageOrderValue: Number(averageOrderValue.toFixed(2))
      },
      orders: {
        total: totalOrders,
        last30Days: recentOrders.length,
        completed: completedOrders,
        cancelled: cancelledOrders
      },
      customers: {
        total: totalCustomers
      },
      products: {
        total: totalProducts,
        active: activeProducts,
        pending: pendingProducts,
        outOfStock: outOfStockProducts
      },
      rates: {
        deliveryRate: Number(deliveryRate.toFixed(2)),
        cancellationRate: Number(cancellationRate.toFixed(2))
      },
      rating: seller.rating,
      totalReviews: seller.totalReviews
    }
  });
});

// PHASE 13.16 — Prévision des ventes du vendeur connecté
// Projection sur 30 jours basée sur l'historique (moyennes mobiles et tendance)
const getSellerSalesForecast = catchAsync(async (req, res, next) => {
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

  // ✅ Récupérer les commandes non annulées des 90 derniers jours
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  const orders = await Order.find({
    'items.productId': { $in: sellerProductIds },
    orderStatus: { $ne: 'cancelled' },
    createdAt: { $gte: ninetyDaysAgo }
  }).select('items createdAt');

  // ✅ Fonction : revenu d'une liste de commandes
  const computeRevenue = (orderList) => {
    return orderList.reduce((sum, order) => {
      const sellerItems = order.items.filter(item =>
        item.productId && sellerProductIdSet.has(item.productId.toString())
      );
      return sum + sellerItems.reduce((itemSum, item) => itemSum + (item.price * item.quantity), 0);
    }, 0);
  };

  // ✅ Découpage par périodes de 30 jours (sur 90 jours d'historique)
  const now = new Date();

  // Période la plus récente (jours 60-90)
  const recentStart = new Date(now);
  recentStart.setDate(recentStart.getDate() - 90);
  const recentEnd = new Date(now);
  recentEnd.setDate(recentEnd.getDate() - 60);

  // Période intermédiaire (jours 30-60)
  const midStart = new Date(now);
  midStart.setDate(midStart.getDate() - 60);
  const midEnd = new Date(now);
  midEnd.setDate(midEnd.getDate() - 30);

  // Période la plus ancienne (jours 0-30)
  const oldStart = new Date(now);
  oldStart.setDate(oldStart.getDate() - 30);

  const oldPeriodOrders = orders.filter(o => o.createdAt >= midEnd && o.createdAt < oldStart);
  const midPeriodOrders = orders.filter(o => o.createdAt >= midStart && o.createdAt < midEnd);
  const recentPeriodOrders = orders.filter(o => o.createdAt >= recentStart && o.createdAt < recentEnd);

  const oldRevenue = computeRevenue(oldPeriodOrders);
  const midRevenue = computeRevenue(midPeriodOrders);
  const recentRevenue = computeRevenue(recentPeriodOrders);

  // ✅ Moyenne mobile pondérée (pondération plus forte sur les périodes récentes)
  const totalWeight = 1 + 2 + 3;
  const weightedDailyAverage = (oldRevenue * 1 + midRevenue * 2 + recentRevenue * 3) / totalWeight / 30;

  // ✅ Tendance de croissance entre les périodes
  let growthRate = 0;
  if (oldRevenue > 0) {
    growthRate = ((recentRevenue - oldRevenue) / oldRevenue) * 100;
  } else if (recentRevenue > 0) {
    growthRate = 100;
  }

  // ✅ Projection sur 30 jours (moyenne pondérée + tendance plafonnée à ±50%)
  const cappedGrowth = Math.max(-50, Math.min(50, growthRate));
  const forecastDaily = weightedDailyAverage * (1 + cappedGrowth / 100);
  const forecastRevenue = Math.max(0, forecastDaily * 30);

  // ✅ Projections mensuelles (3 prochains mois)
  const monthlyProjection = [];
  let runningRate = cappedGrowth;
  for (let i = 1; i <= 3; i++) {
    const projectedDaily = weightedDailyAverage * Math.pow(1 + runningRate / 100, i);
    const projectedRevenue = Math.max(0, projectedDaily * 30);
    const month = new Date(now);
    month.setDate(1);
    month.setMonth(month.getMonth() + i);
    monthlyProjection.push({
      month: month.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }),
      projectedRevenue: Number(projectedRevenue.toFixed(2))
    });
  }

  res.status(200).json({
    success: true,
    forecast: {
      basis: {
        old30Days: Number(oldRevenue.toFixed(2)),
        mid30Days: Number(midRevenue.toFixed(2)),
        recent30Days: Number(recentRevenue.toFixed(2))
      },
      growthRate: Number(cappedGrowth.toFixed(2)),
      dailyAverage: Number(weightedDailyAverage.toFixed(2)),
      next30Days: {
        projectedRevenue: Number(forecastRevenue.toFixed(2)),
        projectedOrders: Math.round(forecastRevenue / (averageOrderValue(recentPeriodOrders, sellerProductIdSet) || forecastRevenue)),
        projectedProductsSold: Math.round(forecastDaily * 30 / (averagePricePerItem(recentPeriodOrders, sellerProductIdSet) || 1))
      },
      monthlyProjection
    }
  });
});

// ✅ Helper : valeur moyenne de commande d'une liste de commandes
function averageOrderValue(orderList, sellerProductIdSet) {
  if (orderList.length === 0) return 0;
  const revenue = orderList.reduce((sum, order) => {
    const sellerItems = order.items.filter(item =>
      item.productId && sellerProductIdSet.has(item.productId.toString())
    );
    return sum + sellerItems.reduce((itemSum, item) => itemSum + (item.price * item.quantity), 0);
  }, 0);
  return revenue / orderList.length;
}

// ✅ Helper : prix moyen par article d'une liste de commandes
function averagePricePerItem(orderList, sellerProductIdSet) {
  if (orderList.length === 0) return 0;
  let totalItems = 0;
  let totalValue = 0;
  orderList.forEach(order => {
    order.items.forEach(item => {
      if (item.productId && sellerProductIdSet.has(item.productId.toString())) {
        totalItems += item.quantity;
        totalValue += item.price * item.quantity;
      }
    });
  });
  return totalItems > 0 ? totalValue / totalItems : 0;
}

// PHASE 13.16 — Recommandations business du vendeur connecté
// Conseils basés sur les données de performance, stock et avis
const getSellerBusinessRecommendations = catchAsync(async (req, res, next) => {
  const seller = req.seller; // ✅ Utilisation exclusive de req.seller._id

  // ✅ Refuser toute tentative d'utiliser sellerId provenant de req.body, req.params ou req.query
  if (
    req.body?.sellerId !== undefined ||
    req.query?.sellerId !== undefined ||
    (req.params && req.params.sellerId !== undefined)
  ) {
    throw new AppError('Le sellerId fourni par le client est interdit.', 400);
  }

  // ✅ Récupérer les produits du vendeur (avec stock, approbation, avis)
  const products = await Product.find({ sellerId: seller._id })
    .select('name price stock approvalStatus isPublished rating numReviews images');

  const sellerProductIds = products.map(p => p._id);
  const sellerProductIdSet = new Set(sellerProductIds.map(id => id.toString()));

  // ✅ Récupérer les commandes non annulées
  const orders = await Order.find({
    'items.productId': { $in: sellerProductIds },
    orderStatus: { $ne: 'cancelled' }
  }).select('items createdAt');

  // ✅ Agréger les ventes par produit
  const salesMap = new Map();
  orders.forEach(order => {
    order.items.forEach(item => {
      if (!item.productId || !sellerProductIdSet.has(item.productId.toString())) return;
      const prodId = item.productId.toString();
      const current = salesMap.get(prodId) || { productId: item.productId, quantitySold: 0, revenue: 0 };
      current.quantitySold += item.quantity;
      current.revenue += item.price * item.quantity;
      salesMap.set(prodId, current);
    });
  });

  const productMap = new Map(products.map(p => [p._id.toString(), p]));
  const recommendations = [];

  // ✅ 1) Recommandations de stock
  const lowStockThreshold = 5;
  products.forEach(product => {
    const sale = salesMap.get(product._id.toString());
    const quantitySold = sale ? sale.quantitySold : 0;

    if (product.stock === 0) {
      recommendations.push({
        type: 'stock',
        priority: 'high',
        title: `Réapprovisionnez « ${product.name} »`,
        description: 'Ce produit est en rupture de stock. Réapprovisionnez-le pour éviter de perdre des ventes.',
        productId: product._id
      });
    } else if (product.stock <= lowStockThreshold && quantitySold > 0) {
      recommendations.push({
        type: 'stock',
        priority: 'medium',
        title: `Stock faible pour « ${product.name} »`,
        description: `Il reste ${product.stock} unités et ce produit se vend régulièrement. Pensez à vous réapprovisionner.`,
        productId: product._id
      });
    }
  });

  // ✅ 2) Recommandations produits non performants
  products.forEach(product => {
    const sale = salesMap.get(product._id.toString());
    const quantitySold = sale ? sale.quantitySold : 0;

    if (quantitySold === 0 && product.isPublished) {
      recommendations.push({
        type: 'product',
        priority: 'low',
        title: `« ${product.name} » n'a pas encore été vendu`,
        description: 'Améliorez la description, les images ou le prix de ce produit pour stimuler ses ventes.',
        productId: product._id
      });
    }
  });

  // ✅ 3) Recommandation produits en attente
  const pendingCount = products.filter(p => p.approvalStatus === 'pending').length;
  if (pendingCount > 0) {
    recommendations.push({
      type: 'approval',
      priority: 'medium',
      title: `${pendingCount} produit(s) en attente d'approbation`,
      description: 'Vos produits en attente seront publiés dès validation par l\'administrateur. Suivez leur statut régulièrement.'
    });
  }

  // ✅ 4) Recommandation basée sur les avis
  const lowRatedProducts = products.filter(p => p.numReviews > 0 && p.rating < 3.5);
  if (lowRatedProducts.length > 0) {
    recommendations.push({
      type: 'quality',
      priority: 'high',
      title: 'Améliorez la qualité de certains produits',
      description: `${lowRatedProducts.length} produit(s) ont une note inférieure à 3.5/5. Analysez les avis clients pour améliorer la qualité.`
    });
  }

  // ✅ 5) Recommandation générale de performance
  const totalRevenue = orders.reduce((sum, order) => {
    const sellerItems = order.items.filter(item =>
      item.productId && sellerProductIdSet.has(item.productId.toString())
    );
    return sum + sellerItems.reduce((itemSum, item) => itemSum + (item.price * item.quantity), 0);
  }, 0);

  if (totalRevenue > 0) {
    recommendations.push({
      type: 'growth',
      priority: 'low',
      title: 'Développez votre gamme de produits',
      description: 'Ajoutez de nouveaux produits dans vos catégories qui performent le mieux pour augmenter vos revenus.'
    });
  } else {
    recommendations.push({
      type: 'growth',
      priority: 'high',
      title: 'Générez votre première vente',
      description: 'Assurez-vous que vos produits sont approuvés et publiés, puis partagez votre boutique pour attirer vos premiers clients.'
    });
  }

  // ✅ Tri par priorité (high > medium > low)
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  res.status(200).json({
    success: true,
    count: recommendations.length,
    recommendations
  });
});

// PHASE 13.17 — Assistant intelligent du vendeur connecté
// Résumé intelligent du business : summary, healthScore et insights
const getSellerSmartInsights = catchAsync(async (req, res, next) => {
  const seller = req.seller; // ✅ Utilisation exclusive de req.seller._id

  // ✅ Refuser toute tentative d'utiliser sellerId provenant de req.body, req.params ou req.query
  if (
    req.body?.sellerId !== undefined ||
    req.query?.sellerId !== undefined ||
    (req.params && req.params.sellerId !== undefined)
  ) {
    throw new AppError('Le sellerId fourni par le client est interdit.', 400);
  }

  // ✅ Récupérer tous les produits du vendeur (uniquement les champs nécessaires)
  const products = await Product.find({ sellerId: seller._id }).select('name price stock images image category rating numReviews approvalStatus isPublished');

  const sellerProductIds = products.map(p => p._id);
  const sellerProductIdSet = new Set(sellerProductIds.map(id => id.toString()));

  // ✅ Récupérer toutes les commandes (y compris annulées pour les taux)
  const allOrders = await Order.find({
    'items.productId': { $in: sellerProductIds }
  }).select('userId items orderStatus createdAt');

  // ✅ Commandes non annulées pour revenus / clients
  const validOrders = allOrders.filter(o => o.orderStatus !== 'cancelled');

  // ✅ Revenus totaux et clients uniques
  const customerSet = new Set();
  let totalRevenue = 0;
  validOrders.forEach(order => {
    if (order.userId) customerSet.add(order.userId.toString());
    const sellerItems = order.items.filter(item =>
      item.productId && sellerProductIdSet.has(item.productId.toString())
    );
    sellerItems.forEach(item => {
      totalRevenue += item.price * item.quantity;
    });
  });

  // ✅ Métriques 30 derniers jours vs 30 jours précédents (croissance revenue)
  const now = new Date();
  const startCurrent = new Date(now);
  startCurrent.setHours(0, 0, 0, 0);
  startCurrent.setDate(startCurrent.getDate() - 29);
  const startPrevious = new Date(startCurrent);
  startPrevious.setDate(startPrevious.getDate() - 30);

  const currentOrders = validOrders.filter(o => o.createdAt >= startCurrent);
  const previousOrders = validOrders.filter(o => o.createdAt >= startPrevious && o.createdAt < startCurrent);

  const computeRevenue = (orderList) => {
    return orderList.reduce((sum, order) => {
      const sellerItems = order.items.filter(item =>
        item.productId && sellerProductIdSet.has(item.productId.toString())
      );
      return sum + sellerItems.reduce((itemSum, item) => itemSum + (item.price * item.quantity), 0);
    }, 0);
  };

  const currentRevenue = computeRevenue(currentOrders);
  const previousRevenue = computeRevenue(previousOrders);

  const growthRate = (current, previous) => {
    if (!previous || previous === 0) return current === 0 ? 0 : 100;
    return ((current - previous) / previous) * 100;
  };
  const revenueGrowth = growthRate(currentRevenue, previousRevenue);

  // ✅ Taux de livraison (commandes résolues)
  const deliveredOrders = allOrders.filter(o => o.orderStatus === 'delivered').length;
  const cancelledOrders = allOrders.filter(o => o.orderStatus === 'cancelled').length;
  const resolvedOrders = deliveredOrders + cancelledOrders;
  const deliveryRate = resolvedOrders > 0 ? (deliveredOrders / resolvedOrders) * 100 : 0;

  // ✅ Produits actifs / stock
  const activeProducts = products.filter(p => p.stock > 0).length;
  const outOfStock = products.filter(p => p.stock === 0).length;
  const lowStockThreshold = 5;
  const lowStock = products.filter(p => p.stock > 0 && p.stock <= lowStockThreshold).length;

  // ✅ summary
  const summary = {
    revenue: Number(totalRevenue.toFixed(2)),
    orders: validOrders.length,
    customers: customerSet.size,
    products: products.length
  };

  // ✅ healthScore (0-100) pondéré
  let healthScore = 50;

  // Score revenue (0-25)
  const revenueScore = Math.max(0, Math.min(25, 12.5 + (revenueGrowth / 100) * 12.5));

  // Score commandes (0-20)
  const orderScore = Math.min(20, validOrders.length * 2);

  // Score livraison (0-25)
  const deliveryScore = (deliveryRate / 100) * 25;

  // Score produits actifs (0-15)
  const activeRatio = products.length > 0 ? activeProducts / products.length : 0;
  const activeScore = activeRatio * 15;

  // Score stock (0-15)
  const stockIssueRatio = products.length > 0 ? (outOfStock + lowStock) / products.length : 0;
  const stockScore = (1 - stockIssueRatio) * 15;

healthScore = Math.max(0, Math.min(100, Math.round(
    revenueScore + orderScore + deliveryScore + activeScore + stockScore
  )));

  // ✅ insights
  const insights = [];

  // revenue_growth
  if (revenueGrowth > 0) {
    insights.push({
      type: 'revenue_growth',
      priority: 'high',
      title: 'Croissance du chiffre d\'affaires',
      message: `Vos revenus ont augmenté de ${revenueGrowth.toFixed(1)}% sur les 30 derniers jours.`
    });
  }

  // sales_drop
  if (revenueGrowth < -10) {
    insights.push({
      type: 'sales_drop',
      priority: 'high',
      title: 'Baisse des ventes',
      message: `Vos revenus ont chuté de ${Math.abs(revenueGrowth).toFixed(1)}% sur les 30 derniers jours. Analysez vos prix et votre catalogue.`
    });
  }

  // inventory_warning
  if (lowStock + outOfStock > 0) {
    insights.push({
      type: 'inventory_warning',
      priority: lowStock + outOfStock > 3 ? 'high' : 'medium',
      title: 'Attention au stock',
      message: `${outOfStock} produit(s) en rupture et ${lowStock} proche(s) de l'épuisement.`
    });
  }

  // customer_growth
  const currentCustomers = new Set();
  currentOrders.forEach(o => { if (o.userId) currentCustomers.add(o.userId.toString()); });
  const previousCustomers = new Set();
  previousOrders.forEach(o => { if (o.userId) previousCustomers.add(o.userId.toString()); });
  const customerGrowth = growthRate(currentCustomers.size, previousCustomers.size);
  if (customerGrowth > 0) {
    insights.push({
      type: 'customer_growth',
      priority: 'medium',
      title: 'Croissance des clients',
      message: `Votre clientèle a augmenté de ${customerGrowth.toFixed(1)}% récemment.`
    });
  }

  // product_success / product_failure
  const salesMap = new Map();
  validOrders.forEach(order => {
    order.items.forEach(item => {
      if (!item.productId || !sellerProductIdSet.has(item.productId.toString())) return;
      const prodId = item.productId.toString();
      const current = salesMap.get(prodId) || { productId: item.productId, quantitySold: 0 };
      current.quantitySold += item.quantity;
      salesMap.set(prodId, current);
    });
  });

  const productMap = new Map(products.map(p => [p._id.toString(), p]));
  let bestProduct = null;
  let bestQty = 0;
  salesMap.forEach((sale, prodId) => {
    if (sale.quantitySold > bestQty) {
      bestQty = sale.quantitySold;
      bestProduct = productMap.get(prodId);
    }
  });

  if (bestProduct) {
    insights.push({
      type: 'product_success',
      priority: 'low',
      title: `Succès : « ${bestProduct.name} »`,
      message: `${bestQty} unité(s) vendue(s). Envisagez d'augmenter le stock ou de promouvoir ce produit.`
    });
  }

  const failureProducts = products.filter(p => {
    const sale = salesMap.get(p._id.toString());
    return p.isPublished && (!sale || sale.quantitySold === 0);
  });
  if (failureProducts.length > 0) {
    insights.push({
      type: 'product_failure',
      priority: 'medium',
      title: `${failureProducts.length} produit(s) sans vente`,
      message: 'Améliorez la visibilité de vos produits publiés qui n\'ont pas encore été vendus.'
    });
  }

  // Tri des insights par priorité
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  insights.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  res.status(200).json({
    success: true,
    summary,
    healthScore,
    insights
  });
});

// PHASE 13.17 — Plan d'action automatique du vendeur connecté
const getSellerActionPlan = catchAsync(async (req, res, next) => {
  const seller = req.seller; // ✅ Utilisation exclusive de req.seller._id

  // ✅ Refuser toute tentative d'utiliser sellerId provenant de req.body, req.params ou req.query
  if (
    req.body?.sellerId !== undefined ||
    req.query?.sellerId !== undefined ||
    (req.params && req.params.sellerId !== undefined)
  ) {
    throw new AppError('Le sellerId fourni par le client est interdit.', 400);
  }

  // ✅ Récupérer les produits du vendeur (stock + infos)
  const products = await Product.find({ sellerId: seller._id })
    .select('name price stock approvalStatus isPublished');

  const sellerProductIds = products.map(p => p._id);
  const sellerProductIdSet = new Set(sellerProductIds.map(id => id.toString()));

  // ✅ Récupérer les commandes non annulées
  const orders = await Order.find({
    'items.productId': { $in: sellerProductIds },
    orderStatus: { $ne: 'cancelled' }
  }).select('items orderStatus createdAt');

  // ✅ Agréger les ventes par produit
  const salesMap = new Map();
  orders.forEach(order => {
    order.items.forEach(item => {
      if (!item.productId || !sellerProductIdSet.has(item.productId.toString())) return;
      const prodId = item.productId.toString();
      const current = salesMap.get(prodId) || { productId: item.productId, quantitySold: 0, revenue: 0 };
      current.quantitySold += item.quantity;
      current.revenue += item.price * item.quantity;
      salesMap.set(prodId, current);
    });
  });

  // ✅ Revenus totaux / commandes
  const totalRevenue = orders.reduce((sum, order) => {
    const sellerItems = order.items.filter(item =>
      item.productId && sellerProductIdSet.has(item.productId.toString())
    );
    return sum + sellerItems.reduce((itemSum, item) => itemSum + (item.price * item.quantity), 0);
  }, 0);

  const productMap = new Map(products.map(p => [p._id.toString(), p]));
  const lowStockThreshold = 5;

  // ✅ Actions "aujourd'hui" (urgences stock + rupture)
  const today = [];
  products.forEach(product => {
    const sale = salesMap.get(product._id.toString());
    const quantitySold = sale ? sale.quantitySold : 0;

    if (product.stock === 0) {
      today.push({
        action: `Réapprovisionner « ${product.name} »`,
        priority: 'high',
        reason: 'Produit en rupture de stock et ventes en cours.'
      });
    } else if (product.stock <= lowStockThreshold && quantitySold > 0) {
      today.push({
        action: `Réapprovisionner « ${product.name} »`,
        priority: 'high',
        reason: `Stock faible (${product.stock} un.) et ventes élevées.`
      });
    }
  });

  // ✅ Actions "cette semaine" (produits non performants + approbation en attente)
  const thisWeek = [];
  products.forEach(product => {
    const sale = salesMap.get(product._id.toString());
    const quantitySold = sale ? sale.quantitySold : 0;

    if (product.isPublished && quantitySold === 0) {
      thisWeek.push({
        action: `Optimiser la fiche de « ${product.name} »`,
        priority: 'medium',
        reason: 'Produit publié mais aucune vente enregistrée.'
      });
    }
  });

  const pendingCount = products.filter(p => p.approvalStatus === 'pending').length;
  if (pendingCount > 0) {
    thisWeek.push({
      action: `Suivre l'approbation de ${pendingCount} produit(s)`,
      priority: 'medium',
      reason: `${pendingCount} produit(s) en attente de validation administrateur.`
    });
  }

  // ✅ Actions "ce mois-ci" (croissance / développement)
  const thisMonth = [];
  if (totalRevenue > 0) {
    thisMonth.push({
      action: 'Développer votre gamme de produits',
      priority: 'low',
      reason: 'Ajoutez de nouveaux produits dans les catégories qui performent le mieux.'
    });
  } else {
    thisMonth.push({
      action: 'Générer les premières ventes',
      priority: 'high',
      reason: 'Aucune vente enregistrée. Publiez vos produits et partagez votre boutique.'
    });
  }

  // ✅ Trier chaque liste par priorité
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  const sortByPriority = (list) => list.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  res.status(200).json({
    success: true,
    actionPlan: {
      today: sortByPriority(today),
      thisWeek: sortByPriority(thisWeek),
      thisMonth: sortByPriority(thisMonth)
    }
  });
});

// PHASE 13.17 — Rapport IA complet du vendeur connecté
const getSellerAIReport = catchAsync(async (req, res, next) => {
  const seller = req.seller; // ✅ Utilisation exclusive de req.seller._id

  // ✅ Refuser toute tentative d'utiliser sellerId provenant de req.body, req.params ou req.query
  if (
    req.body?.sellerId !== undefined ||
    req.query?.sellerId !== undefined ||
    (req.params && req.params.sellerId !== undefined)
  ) {
    throw new AppError('Le sellerId fourni par le client est interdit.', 400);
  }

  // ✅ Récupérer les produits du vendeur
  const products = await Product.find({ sellerId: seller._id })
    .select('name price stock approvalStatus isPublished rating numReviews');

  const sellerProductIds = products.map(p => p._id);
  const sellerProductIdSet = new Set(sellerProductIds.map(id => id.toString()));

  // ✅ Récupérer toutes les commandes (y compris annulées pour les taux)
  const allOrders = await Order.find({
    'items.productId': { $in: sellerProductIds }
  }).select('userId items orderStatus createdAt');

  const validOrders = allOrders.filter(o => o.orderStatus !== 'cancelled');

  // ✅ Revenus totaux et clients uniques
  const customerSet = new Set();
  let totalRevenue = 0;
  validOrders.forEach(order => {
    if (order.userId) customerSet.add(order.userId.toString());
    const sellerItems = order.items.filter(item =>
      item.productId && sellerProductIdSet.has(item.productId.toString())
    );
    sellerItems.forEach(item => {
      totalRevenue += item.price * item.quantity;
    });
  });

  // ✅ Comparaison 30 jours vs 30 jours précédents (tendances)
  const now = new Date();
  const startCurrent = new Date(now);
  startCurrent.setHours(0, 0, 0, 0);
  startCurrent.setDate(startCurrent.getDate() - 29);
  const startPrevious = new Date(startCurrent);
  startPrevious.setDate(startPrevious.getDate() - 30);

  const currentOrders = validOrders.filter(o => o.createdAt >= startCurrent);
  const previousOrders = validOrders.filter(o => o.createdAt >= startPrevious && o.createdAt < startCurrent);

  const computeRevenue = (orderList) => orderList.reduce((sum, order) => {
    const sellerItems = order.items.filter(item =>
      item.productId && sellerProductIdSet.has(item.productId.toString())
    );
    return sum + sellerItems.reduce((itemSum, item) => itemSum + (item.price * item.quantity), 0);
  }, 0);

  const computeCustomers = (orderList) => {
    const set = new Set();
    orderList.forEach(o => { if (o.userId) set.add(o.userId.toString()); });
    return set.size;
  };

  const currentRevenue = computeRevenue(currentOrders);
  const previousRevenue = computeRevenue(previousOrders);
  const currentCustomers = computeCustomers(currentOrders);
  const previousCustomers = computeCustomers(previousOrders);

  const growthRate = (current, previous) => {
    if (!previous || previous === 0) return current === 0 ? 0 : 100;
    return ((current - previous) / previous) * 100;
  };

  const revenueTrend = growthRate(currentRevenue, previousRevenue);
  const salesTrend = growthRate(currentOrders.length, previousOrders.length);
  const customerTrend = growthRate(currentCustomers, previousCustomers);

  // ✅ Taux de livraison
  const deliveredOrders = allOrders.filter(o => o.orderStatus === 'delivered').length;
  const cancelledOrders = allOrders.filter(o => o.orderStatus === 'cancelled').length;
  const resolvedOrders = deliveredOrders + cancelledOrders;
  const deliveryRate = resolvedOrders > 0 ? (deliveredOrders / resolvedOrders) * 100 : 0;

  // ✅ Agréger les ventes par produit
  const salesMap = new Map();
  validOrders.forEach(order => {
    order.items.forEach(item => {
      if (!item.productId || !sellerProductIdSet.has(item.productId.toString())) return;
      const prodId = item.productId.toString();
      const current = salesMap.get(prodId) || { productId: item.productId, quantitySold: 0, revenue: 0 };
      current.quantitySold += item.quantity;
      current.revenue += item.price * item.quantity;
      salesMap.set(prodId, current);
    });
  });

  const productMap = new Map(products.map(p => [p._id.toString(), p]));

  // ✅ performance
  const performance = {
    revenueTrend: Number(revenueTrend.toFixed(2)),
    salesTrend: Number(salesTrend.toFixed(2)),
    customerTrend: Number(customerTrend.toFixed(2))
  };

  // ✅ opportunities
  const opportunities = [];
  if (revenueTrend > 0) {
    opportunities.push({
      title: 'Croissance des revenus',
      impact: 'high'
    });
  }
  if (customerTrend > 0) {
    opportunities.push({
      title: 'Élargir la clientèle existante',
      impact: 'medium'
    });
  }
  const bestSelling = Array.from(salesMap.values()).sort((a, b) => b.quantitySold - a.quantitySold)[0];
  if (bestSelling) {
    const product = productMap.get(bestSelling.productId.toString());
    if (product) {
      opportunities.push({
        title: `Promouvoir « ${product.name} » (best-seller)`,
        impact: 'high'
      });
    }
  }
  if (opportunities.length === 0) {
    opportunities.push({
      title: 'Lancer de nouveaux produits',
      impact: 'medium'
    });
  }

  // ✅ risks
  const risks = [];
  if (revenueTrend < -10) {
    risks.push({
      title: 'Baisse significative des revenus',
      severity: 'high'
    });
  }
  const lowStockThreshold = 5;
  const outOfStock = products.filter(p => p.stock === 0).length;
  const lowStock = products.filter(p => p.stock > 0 && p.stock <= lowStockThreshold).length;
  if (outOfStock + lowStock > 0) {
    risks.push({
      title: `${outOfStock + lowStock} produit(s) avec risque de stock`,
      severity: outOfStock + lowStock > 3 ? 'high' : 'medium'
    });
  }
  if (deliveryRate < 70) {
    risks.push({
      title: 'Taux de livraison faible',
      severity: deliveryRate < 50 ? 'high' : 'medium'
    });
  }
  const lowRated = products.filter(p => p.numReviews > 0 && p.rating < 3.5).length;
  if (lowRated > 0) {
    risks.push({
      title: `${lowRated} produit(s) avec de faibles avis`,
      severity: 'medium'
    });
  }
  if (risks.length === 0) {
    risks.push({
      title: 'Aucun risque majeur détecté',
      severity: 'low'
    });
  }

  // ✅ recommendations
  const recommendations = [];
  products.forEach(product => {
    const sale = salesMap.get(product._id.toString());
    const quantitySold = sale ? sale.quantitySold : 0;
    if (product.stock === 0) {
      recommendations.push({
        title: `Réapprovisionnez « ${product.name} »`,
        action: 'Commander de nouvelles unités pour éviter la rupture.'
      });
    } else if (product.stock <= lowStockThreshold && quantitySold > 0) {
      recommendations.push({
        title: `Augmentez le stock de « ${product.name} »`,
        action: `Il reste ${product.stock} unités pour un produit qui se vend.`
      });
    }
  });

  if (revenueTrend < 0) {
    recommendations.push({
      title: 'Relancez vos ventes',
      action: 'Proposez des promotions ou améliorez la visibilité de vos produits.'
    });
  } else {
    recommendations.push({
      title: 'Capitalisez sur votre dynamique',
      action: 'Ajoutez des produits complémentaires aux plus vendus.'
    });
  }

  if (deliveryRate < 70) {
    recommendations.push({
      title: 'Améliorez vos délais de livraison',
      action: 'Optimisez votre traitement des commandes et votre logistique.'
    });
  }

  res.status(200).json({
    success: true,
    report: {
      generatedAt: new Date().toISOString(),
      performance,
      opportunities,
      risks,
      recommendations
    }
  });
});

// PHASE 13.18 — Notifications du vendeur connecté
// Générées dynamiquement à partir des données existantes (Produit, Commande, Avis)
const getSellerNotifications = catchAsync(async (req, res, next) => {
  const seller = req.seller; // ✅ Utilisation exclusive de req.seller._id

  // ✅ Refuser toute tentative d'utiliser sellerId provenant de req.body, req.params ou req.query
  if (
    req.body?.sellerId !== undefined ||
    req.query?.sellerId !== undefined ||
    (req.params && req.params.sellerId !== undefined)
  ) {
    throw new AppError('Le sellerId fourni par le client est interdit.', 400);
  }

  // ✅ Récupérer les produits du vendeur
  const products = await Product.find({ sellerId: seller._id })
    .select('name stock approvalStatus isPublished rating numReviews createdAt');

  const sellerProductIds = products.map(p => p._id);
  const sellerProductIdSet = new Set(sellerProductIds.map(id => id.toString()));

  // ✅ Récupérer les commandes (non annulées) contenant les produits du vendeur
  const orders = await Order.find({
    'items.productId': { $in: sellerProductIds },
    orderStatus: { $ne: 'cancelled' }
  }).select('userId items orderStatus createdAt');

  // ✅ Récupérer les avis liés aux produits du vendeur
  const reviews = await Review.find({ productId: { $in: sellerProductIds } })
    .select('userId productId rating createdAt')
    .sort({ createdAt: -1 });

  const notifications = [];
  const lowStockThreshold = 5;

  // ✅ 1) Nouvelle commande
  orders.forEach(order => {
    const sellerItems = order.items.filter(item =>
      item.productId && sellerProductIdSet.has(item.productId.toString())
    );
    if (sellerItems.length === 0) return;
    const quantity = sellerItems.reduce((sum, item) => sum + item.quantity, 0);
    notifications.push({
      type: 'new_order',
      priority: 'high',
      title: 'Nouvelle commande',
      message: `Vous avez reçu une nouvelle commande (${quantity} article(s)).`,
      createdAt: order.createdAt,
      read: false
    });
  });

  // ✅ 2) Produit approuvé
  products.forEach(product => {
    if (product.approvalStatus === 'approved' && product.isPublished === false) {
      notifications.push({
        type: 'product_approved',
        priority: 'medium',
        title: 'Produit approuvé',
        message: `Votre produit « ${product.name} » a été approuvé.`,
        createdAt: product.createdAt,
        read: false
      });
    }
  });

  // ✅ 3) Produit rejeté
  products.forEach(product => {
    if (product.approvalStatus === 'rejected') {
      notifications.push({
        type: 'product_rejected',
        priority: 'high',
        title: 'Produit rejeté',
        message: `Votre produit « ${product.name} » a été rejeté.`,
        createdAt: product.createdAt,
        read: false
      });
    }
  });

  // ✅ 4) Produit dépublié
  products.forEach(product => {
    if (product.isPublished === false && product.approvalStatus === 'approved') {
      notifications.push({
        type: 'product_unpublished',
        priority: 'medium',
        title: 'Produit dépublié',
        message: `Votre produit « ${product.name} » est actuellement dépublié.`,
        createdAt: product.createdAt,
        read: false
      });
    }
  });

  // ✅ 5) Stock faible
  products.forEach(product => {
    if (product.stock > 0 && product.stock <= lowStockThreshold) {
      notifications.push({
        type: 'low_stock',
        priority: 'medium',
        title: 'Stock faible',
        message: `Il ne reste que ${product.stock} unité(s) de « ${product.name} ».`,
        createdAt: product.createdAt,
        read: false
      });
    }
  });

  // ✅ 6) Rupture de stock
  products.forEach(product => {
    if (product.stock === 0) {
      notifications.push({
        type: 'out_of_stock',
        priority: 'high',
        title: 'Rupture de stock',
        message: `Le produit « ${product.name} » est en rupture de stock.`,
        createdAt: product.createdAt,
        read: false
      });
    }
  });

  // ✅ 7) Nouveau client
  const seenCustomers = new Set();
  orders.forEach(order => {
    if (!order.userId) return;
    const userId = order.userId.toString();
    if (seenCustomers.has(userId)) return;
    seenCustomers.add(userId);
    notifications.push({
      type: 'new_customer',
      priority: 'low',
      title: 'Nouveau client',
      message: 'Un nouveau client a passé commande dans votre boutique.',
      createdAt: order.createdAt,
      read: false
    });
  });

  // ✅ 8) Nouvel avis
  reviews.forEach(review => {
    notifications.push({
      type: 'new_review',
      priority: 'low',
      title: 'Nouvel avis',
      message: `Un client a laissé un avis de ${review.rating}/5 sur un de vos produits.`,
      createdAt: review.createdAt,
      read: false
    });
  });

  // ✅ 9) Meilleur produit vendu
  const salesMap = new Map();
  orders.forEach(order => {
    order.items.forEach(item => {
      if (!item.productId || !sellerProductIdSet.has(item.productId.toString())) return;
      const prodId = item.productId.toString();
      const current = salesMap.get(prodId) || { productId: item.productId, quantitySold: 0 };
      current.quantitySold += item.quantity;
      salesMap.set(prodId, current);
    });
  });

  const productMap = new Map(products.map(p => [p._id.toString(), p]));
  let bestProduct = null;
  let bestQty = 0;
  salesMap.forEach((sale, prodId) => {
    if (sale.quantitySold > bestQty) {
      bestQty = sale.quantitySold;
      bestProduct = productMap.get(prodId);
    }
  });

  if (bestProduct) {
    notifications.push({
      type: 'best_selling',
      priority: 'low',
      title: 'Meilleure vente',
      message: `« ${bestProduct.name} » est votre produit le plus vendu (${bestQty} unité(s)).`,
      createdAt: new Date(),
      read: false
    });
  }

  // ✅ 10) Produit jamais vendu
  products.forEach(product => {
    const sale = salesMap.get(product._id.toString());
    if ((!sale || sale.quantitySold === 0) && product.isPublished) {
      notifications.push({
        type: 'product_never_sold',
        priority: 'low',
        title: 'Produit sans vente',
        message: `« ${product.name} » est publié mais n'a pas encore été vendu.`,
        createdAt: product.createdAt,
        read: false
      });
    }
  });

  // ✅ Tri par date décroissante
  notifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  res.status(200).json({
    success: true,
    count: notifications.length,
    notifications
  });
});

// PHASE 13.18 — Marquer toutes les notifications comme lues
// Aucun modèle Notification n'existe : on renvoie simplement une confirmation
const markSellerNotificationsRead = catchAsync(async (req, res, next) => {
  const seller = req.seller; // ✅ Utilisation exclusive de req.seller._id

  // ✅ Refuser toute tentative d'utiliser sellerId provenant de req.body, req.params ou req.query
  if (
    req.body?.sellerId !== undefined ||
    req.query?.sellerId !== undefined ||
    (req.params && req.params.sellerId !== undefined)
  ) {
    throw new AppError('Le sellerId fourni par le client est interdit.', 400);
  }

  res.status(200).json({
    success: true,
    message: 'All notifications marked as read.'
  });
});

// PHASE 13.18 — Alertes business du vendeur connecté
// Alertes intelligentes générées à partir des Produits et Commandes
const getSellerBusinessAlerts = catchAsync(async (req, res, next) => {
  const seller = req.seller; // ✅ Utilisation exclusive de req.seller._id

  // ✅ Refuser toute tentative d'utiliser sellerId provenant de req.body, req.params ou req.query
  if (
    req.body?.sellerId !== undefined ||
    req.query?.sellerId !== undefined ||
    (req.params && req.params.sellerId !== undefined)
  ) {
    throw new AppError('Le sellerId fourni par le client est interdit.', 400);
  }

  // ✅ Récupérer les produits du vendeur
  const products = await Product.find({ sellerId: seller._id })
    .select('name stock approvalStatus isPublished rating numReviews createdAt');

  const sellerProductIds = products.map(p => p._id);
  const sellerProductIdSet = new Set(sellerProductIds.map(id => id.toString()));

  // ✅ Récupérer toutes les commandes (y compris annulées pour les taux)
  const allOrders = await Order.find({
    'items.productId': { $in: sellerProductIds }
  }).select('userId items orderStatus createdAt');

  const validOrders = allOrders.filter(o => o.orderStatus !== 'cancelled');

  const alerts = [];
  const lowStockThreshold = 5;

  // ✅ Helpers
  const computeRevenue = (orderList) => orderList.reduce((sum, order) => {
    const sellerItems = order.items.filter(item =>
      item.productId && sellerProductIdSet.has(item.productId.toString())
    );
    return sum + sellerItems.reduce((itemSum, item) => itemSum + (item.price * item.quantity), 0);
  }, 0);

  const computeCustomers = (orderList) => {
    const set = new Set();
    orderList.forEach(o => { if (o.userId) set.add(o.userId.toString()); });
    return set.size;
  };

  const growthRate = (current, previous) => {
    if (!previous || previous === 0) return current === 0 ? 0 : 100;
    return ((current - previous) / previous) * 100;
  };

  // ✅ 1) Inventory — out_of_stock
  const outOfStockCount = products.filter(p => p.stock === 0).length;
  if (outOfStockCount > 0) {
    alerts.push({
      category: 'Inventory',
      severity: outOfStockCount > 3 ? 'high' : 'medium',
      title: `${outOfStockCount} produit(s) en rupture de stock`,
      description: 'Réapprovisionnez rapidement pour éviter de perdre des ventes.'
    });
  }

  // ✅ 2) Inventory — low_stock
  const lowStockCount = products.filter(p => p.stock > 0 && p.stock <= lowStockThreshold).length;
  if (lowStockCount > 0) {
    alerts.push({
      category: 'Inventory',
      severity: 'low',
      title: `${lowStockCount} produit(s) avec un stock faible`,
      description: 'Certains produits approchent de l\'épuisement. Prévoyez un réapprovisionnement.'
    });
  }

  // ✅ 3) Sales — comparaison 30 jours vs 30 jours précédents
  const now = new Date();
  const startCurrent = new Date(now);
  startCurrent.setHours(0, 0, 0, 0);
  startCurrent.setDate(startCurrent.getDate() - 29);
  const startPrevious = new Date(startCurrent);
  startPrevious.setDate(startPrevious.getDate() - 30);

  const currentOrders = validOrders.filter(o => o.createdAt >= startCurrent);
  const previousOrders = validOrders.filter(o => o.createdAt >= startPrevious && o.createdAt < startCurrent);

  const currentRevenue = computeRevenue(currentOrders);
  const previousRevenue = computeRevenue(previousOrders);
  const revenueChange = growthRate(currentRevenue, previousRevenue);

  if (revenueChange < -10) {
    alerts.push({
      category: 'Sales',
      severity: 'high',
      title: 'Baisse du chiffre d\'affaires',
      description: `Vos revenus ont diminué de ${Math.abs(revenueChange).toFixed(1)}% sur les 30 derniers jours.`
    });
  } else if (revenueChange > 10) {
    alerts.push({
      category: 'Sales',
      severity: 'low',
      title: 'Croissance du chiffre d\'affaires',
      description: `Vos revenus ont augmenté de ${revenueChange.toFixed(1)}% sur les 30 derniers jours.`
    });
  }

  // ✅ 4) Products — never_sold
  const salesMap = new Map();
  validOrders.forEach(order => {
    order.items.forEach(item => {
      if (!item.productId || !sellerProductIdSet.has(item.productId.toString())) return;
      const prodId = item.productId.toString();
      const current = salesMap.get(prodId) || { productId: item.productId, quantitySold: 0 };
      current.quantitySold += item.quantity;
      salesMap.set(prodId, current);
    });
  });

  const neverSold = products.filter(p => {
    const sale = salesMap.get(p._id.toString());
    return p.isPublished && (!sale || sale.quantitySold === 0);
  });
  if (neverSold.length > 0) {
    alerts.push({
      category: 'Products',
      severity: 'medium',
      title: `${neverSold.length} produit(s) sans vente`,
      description: 'Améliorez la visibilité ou le prix des produits publiés qui n\'ont pas encore été vendus.'
    });
  }

  // ✅ 5) Products — rejected
  const rejectedCount = products.filter(p => p.approvalStatus === 'rejected').length;
  if (rejectedCount > 0) {
    alerts.push({
      category: 'Products',
      severity: 'high',
      title: `${rejectedCount} produit(s) rejeté(s)`,
      description: 'Certains de vos produits ont été rejetés. Vérifiez les motifs et corrigez-les.'
    });
  }

  // ✅ 6) Products — unpublished
  const unpublishedCount = products.filter(p => p.isPublished === false && p.approvalStatus === 'approved').length;
  if (unpublishedCount > 0) {
    alerts.push({
      category: 'Products',
      severity: 'low',
      title: `${unpublishedCount} produit(s) dépublié(s)`,
      description: 'Des produits approuvés ne sont pas publiés. Publiez-les pour les rendre visibles.'
    });
  }

  // ✅ 7) Reviews — low_rating
  const lowRated = products.filter(p => p.numReviews > 0 && p.rating < 3.5);
  if (lowRated.length > 0) {
    alerts.push({
      category: 'Reviews',
      severity: 'medium',
      title: `${lowRated.length} produit(s) avec de faibles avis`,
      description: 'Analyser les avis clients pour améliorer la qualité de vos produits.'
    });
  }

  // ✅ 8) Reviews — excellent_rating
  const excellentRated = products.filter(p => p.numReviews > 0 && p.rating >= 4.5);
  if (excellentRated.length > 0) {
    alerts.push({
      category: 'Reviews',
      severity: 'low',
      title: `${excellentRated.length} produit(s) très bien noté(s)`,
      description: 'Vos clients apprécient ces produits. Mettez-les en avant pour doper les ventes.'
    });
  }

  // ✅ 9) Customers — comparison 30 jours vs 30 jours précédents
  const currentCustomers = computeCustomers(currentOrders);
  const previousCustomers = computeCustomers(previousOrders);
  const customerChange = growthRate(currentCustomers, previousCustomers);

  if (customerChange > 10) {
    alerts.push({
      category: 'Customers',
      severity: 'low',
      title: 'Croissance de la clientèle',
      description: `Votre clientèle a augmenté de ${customerChange.toFixed(1)}% sur les 30 derniers jours.`
    });
  } else if (customerChange < -10 && currentCustomers > 0) {
    alerts.push({
      category: 'Customers',
      severity: 'medium',
      title: 'Baisse de la clientèle',
      description: `Votre clientèle a diminué de ${Math.abs(customerChange).toFixed(1)}% récemment.`
    });
  }

  res.status(200).json({
    success: true,
    alerts
  });
});

// PHASE 13.19 — Analytics avancés du vendeur connecté
// Dashboard complet : revenus, commandes, clients, produits
const getSellerAdvancedAnalytics = catchAsync(async (req, res, next) => {
  const seller = req.seller; // ✅ Utilisation exclusive de req.seller._id

  // ✅ Refuser toute tentative d'utiliser sellerId provenant de req.body, req.params ou req.query
  if (
    req.body?.sellerId !== undefined ||
    req.query?.sellerId !== undefined ||
    (req.params && req.params.sellerId !== undefined)
  ) {
    throw new AppError('Le sellerId fourni par le client est interdit.', 400);
  }

  // ✅ Récupérer les produits du vendeur
  const products = await Product.find({ sellerId: seller._id })
    .select('name price stock approvalStatus isPublished rating numReviews');
  const sellerProductIds = products.map(p => p._id);
  const sellerProductIdSet = new Set(sellerProductIds.map(id => id.toString()));

  // ✅ Récupérer toutes les commandes (y compris annulées pour les taux)
  const allOrders = await Order.find({
    'items.productId': { $in: sellerProductIds }
  }).select('userId items orderStatus createdAt');

  // ✅ Commandes non annulées pour revenus / clients / commandes
  const validOrders = allOrders.filter(o => o.orderStatus !== 'cancelled');

  // ✅ Fonction utilitaire : revenu vendeur d'une liste de commandes
  const computeRevenue = (orderList) => {
    return orderList.reduce((sum, order) => {
      const sellerItems = order.items.filter(item =>
        item.productId && sellerProductIdSet.has(item.productId.toString())
      );
      return sum + sellerItems.reduce((itemSum, item) => itemSum + (item.price * item.quantity), 0);
    }, 0);
  };

  // ✅ Fonction utilitaire : clients uniques d'une liste de commandes
  const computeCustomers = (orderList) => {
    const set = new Set();
    orderList.forEach(o => { if (o.userId) set.add(o.userId.toString()); });
    return set.size;
  };

  // ✅ Fonction utilitaire : taux de croissance
  const growthRate = (current, previous) => {
    if (!previous || previous === 0) return current === 0 ? 0 : 100;
    return ((current - previous) / previous) * 100;
  };

  // ✅ Périodes
  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  const startOfLast7Days = new Date(now);
  startOfLast7Days.setDate(startOfLast7Days.getDate() - 6);
  startOfLast7Days.setHours(0, 0, 0, 0);

  const startOfLast30Days = new Date(now);
  startOfLast30Days.setDate(startOfLast30Days.getDate() - 29);
  startOfLast30Days.setHours(0, 0, 0, 0);

  const startOfLast90Days = new Date(now);
  startOfLast90Days.setDate(startOfLast90Days.getDate() - 89);
  startOfLast90Days.setHours(0, 0, 0, 0);

  // ✅ Commandes par période
  const todayOrders = validOrders.filter(o => o.createdAt >= startOfToday);
  const last7Orders = validOrders.filter(o => o.createdAt >= startOfLast7Days);
  const last30Orders = validOrders.filter(o => o.createdAt >= startOfLast30Days);
  const last90Orders = validOrders.filter(o => o.createdAt >= startOfLast90Days);

  // ✅ Revenus par période
  const todayRevenue = computeRevenue(todayOrders);
  const last7Revenue = computeRevenue(last7Orders);
  const last30Revenue = computeRevenue(last30Orders);
  const last90Revenue = computeRevenue(last90Orders);

  // ✅ Croissance des revenus (30 derniers jours vs 30 jours précédents)
  const startPrevious30Days = new Date(startOfLast30Days);
  startPrevious30Days.setDate(startPrevious30Days.getDate() - 30);
  const previous30Orders = validOrders.filter(o => o.createdAt >= startPrevious30Days && o.createdAt < startOfLast30Days);
  const previous30Revenue = computeRevenue(previous30Orders);
  const revenueGrowthRate = growthRate(last30Revenue, previous30Revenue);

  // ✅ Commandes
  const totalOrders = validOrders.length;
  const todayOrderCount = todayOrders.length;
  const last7OrderCount = last7Orders.length;
  const last30OrderCount = last30Orders.length;

  // ✅ Conversion trend (30 jours vs 30 jours précédents)
  const conversionTrend = Number(growthRate(last30OrderCount, previous30Orders.length).toFixed(2));

  // ✅ Clients
  const customerSet = new Set();
  validOrders.forEach(o => { if (o.userId) customerSet.add(o.userId.toString()); });
  const totalCustomers = customerSet.size;

  // ✅ Nouveaux clients : première commande dans les 30 derniers jours
  const customerFirstOrderMap = new Map();
  [...validOrders]
    .sort((a, b) => a.createdAt - b.createdAt)
    .forEach(o => {
      if (!o.userId) return;
      const userId = o.userId.toString();
      if (!customerFirstOrderMap.has(userId)) {
        customerFirstOrderMap.set(userId, o.createdAt);
      }
    });

  const newCustomers = Array.from(customerFirstOrderMap.values()).filter(d => d >= startOfLast30Days).length;
  const returningCustomers = totalCustomers - newCustomers;

  // ✅ Customer growth rate (30 derniers jours vs 30 jours précédents)
  const currentPeriodCustomers = computeCustomers(last30Orders);
  const previousPeriodCustomers = computeCustomers(previous30Orders);
  const customerGrowthRate = growthRate(currentPeriodCustomers, previousPeriodCustomers);

  // ✅ Produits
  const totalProducts = products.length;
  const activeProducts = products.filter(p => p.stock > 0).length;
  const lowStockThreshold = 5;
  const lowStock = products.filter(p => p.stock > 0 && p.stock <= lowStockThreshold).length;
  const outOfStock = products.filter(p => p.stock === 0).length;

  // ✅ Best seller
  const salesMap = new Map();
  validOrders.forEach(order => {
    order.items.forEach(item => {
      if (!item.productId || !sellerProductIdSet.has(item.productId.toString())) return;
      const prodId = item.productId.toString();
      const current = salesMap.get(prodId) || { productId: item.productId, quantitySold: 0, revenue: 0 };
      current.quantitySold += item.quantity;
      current.revenue += item.price * item.quantity;
      salesMap.set(prodId, current);
    });
  });

  const productMap = new Map(products.map(p => [p._id.toString(), p]));
  let bestSeller = null;
  let bestQty = 0;
  salesMap.forEach((sale, prodId) => {
    if (sale.quantitySold > bestQty) {
      bestQty = sale.quantitySold;
      const product = productMap.get(prodId);
      if (product) {
        bestSeller = {
          productId: product._id,
          name: product.name,
          quantitySold: sale.quantitySold,
          revenue: Number(sale.revenue.toFixed(2))
        };
      }
    }
  });

  res.status(200).json({
    success: true,
    analytics: {
      revenue: {
        today: Number(todayRevenue.toFixed(2)),
        last7Days: Number(last7Revenue.toFixed(2)),
        last30Days: Number(last30Revenue.toFixed(2)),
        last90Days: Number(last90Revenue.toFixed(2)),
        growthRate: Number(revenueGrowthRate.toFixed(2))
      },
      orders: {
        total: totalOrders,
        today: todayOrderCount,
        last7Days: last7OrderCount,
        last30Days: last30OrderCount,
        conversionTrend
      },
      customers: {
        total: totalCustomers,
        newCustomers,
        returningCustomers,
        customerGrowthRate: Number(customerGrowthRate.toFixed(2))
      },
      products: {
        total: totalProducts,
        active: activeProducts,
        lowStock,
        outOfStock,
        bestSeller
      }
    }
  });
});

// PHASE 13.19 — Tendances des ventes du vendeur connecté
// Évolution quotidienne (30 jours), hebdomadaire (12 semaines), mensuelle (12 mois)
const getSellerSalesTrends = catchAsync(async (req, res, next) => {
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

  // ✅ Récupérer les commandes non annulées des 12 derniers mois
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

  const orders = await Order.find({
    'items.productId': { $in: sellerProductIds },
    orderStatus: { $ne: 'cancelled' },
    createdAt: { $gte: twelveMonthsAgo }
  }).select('items createdAt');

  // ✅ Fonction utilitaire : revenu vendeur d'une liste de commandes
  const computeRevenue = (orderList) => {
    return orderList.reduce((sum, order) => {
      const sellerItems = order.items.filter(item =>
        item.productId && sellerProductIdSet.has(item.productId.toString())
      );
      return sum + sellerItems.reduce((itemSum, item) => itemSum + (item.price * item.quantity), 0);
    }, 0);
  };

  // ✅ 1) Tendance quotidienne (30 derniers jours)
  const daily = [];
  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  for (let i = 29; i >= 0; i--) {
    const dayStart = new Date(startOfToday);
    dayStart.setDate(startOfToday.getDate() - i);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayStart.getDate() + 1);

    const dayOrders = orders.filter(o => o.createdAt >= dayStart && o.createdAt < dayEnd);
    daily.push({
      date: dayStart.toISOString().split('T')[0],
      orders: dayOrders.length,
      revenue: Number(computeRevenue(dayOrders).toFixed(2))
    });
  }

  // ✅ 2) Tendance hebdomadaire (12 dernières semaines, début lundi)
  const weekly = [];
  const startOfThisWeek = new Date(now);
  const day = startOfThisWeek.getDay();
  const diff = startOfThisWeek.getDate() - day + (day === 0 ? -6 : 1); // Lundi = début
  startOfThisWeek.setDate(diff);
  startOfThisWeek.setHours(0, 0, 0, 0);

  for (let i = 11; i >= 0; i--) {
    const weekStart = new Date(startOfThisWeek);
    weekStart.setDate(startOfThisWeek.getDate() - (i * 7));
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);

    const weekOrders = orders.filter(o => o.createdAt >= weekStart && o.createdAt < weekEnd);
    weekly.push({
      date: weekStart.toISOString().split('T')[0],
      orders: weekOrders.length,
      revenue: Number(computeRevenue(weekOrders).toFixed(2))
    });
  }

  // ✅ 3) Tendance mensuelle (12 derniers mois)
  const monthly = [];
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  for (let i = 11; i >= 0; i--) {
    const monthIndex = (currentMonth - i + 48) % 12;
    const yearOffset = Math.floor((currentMonth - i + 48) / 12) - 4;
    const year = currentYear + yearOffset;

    const monthStart = new Date(year, monthIndex, 1);
    const monthEnd = new Date(year, monthIndex + 1, 1);

    const monthOrders = orders.filter(o => o.createdAt >= monthStart && o.createdAt < monthEnd);
    monthly.push({
      date: `${year}-${String(monthIndex + 1).padStart(2, '0')}`,
      orders: monthOrders.length,
      revenue: Number(computeRevenue(monthOrders).toFixed(2))
    });
  }

  res.status(200).json({
    success: true,
    trends: {
      daily,
      weekly,
      monthly
    }
  });
});

// PHASE 13.19 — Analytics clients avancés du vendeur connecté
// Intelligence client : valeur moyenne, nouveaux, récurrents, top clients
const getSellerCustomerAnalytics = catchAsync(async (req, res, next) => {
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

  // ✅ Récupérer les commandes non annulées des clients connectés
  const orders = await Order.find({
    'items.productId': { $in: sellerProductIds },
    orderStatus: { $ne: 'cancelled' },
    userId: { $ne: null }
  }).select('userId items createdAt');

  // ✅ Agréger les clients uniques
  const customerMap = new Map();

  orders.forEach(order => {
    if (!order.userId) return;
    const userId = order.userId.toString();

    const sellerItems = order.items.filter(item =>
      item.productId && sellerProductIdSet.has(item.productId.toString())
    );
    if (sellerItems.length === 0) return;

    const orderSpent = sellerItems.reduce(
      (sum, item) => sum + (item.price * item.quantity),
      0
    );

    const existing = customerMap.get(userId) || {
      userId: order.userId,
      orders: 0,
      totalSpent: 0,
      firstOrderDate: order.createdAt
    };

    existing.orders += 1;
    existing.totalSpent += orderSpent;
    if (order.createdAt < existing.firstOrderDate) {
      existing.firstOrderDate = order.createdAt;
    }

    customerMap.set(userId, existing);
  });

  const customers = Array.from(customerMap.values());

  // ✅ totalCustomers : nombre total de clients uniques
  const totalCustomers = customers.length;

  // ✅ newCustomers : première commande dans les 30 derniers jours
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const newCustomers = customers.filter(c => c.firstOrderDate >= thirtyDaysAgo).length;

  // ✅ returningCustomers : au moins 2 commandes
  const returningCustomers = customers.filter(c => c.orders >= 2).length;

  // ✅ averageCustomerValue : dépense moyenne par client
  const totalSpentAll = customers.reduce((sum, c) => sum + c.totalSpent, 0);
  const averageCustomerValue = totalCustomers > 0 ? totalSpentAll / totalCustomers : 0;

  // ✅ topCustomers : triés par dépense décroissante (max 10)
  const topCustomers = [...customers]
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .slice(0, 10);

  // ✅ Récupérer name et email des clients
  const topUserIds = topCustomers.map(c => c.userId);
  const users = await User.find({ _id: { $in: topUserIds } }).select('name email');
  const userMap = new Map(users.map(u => [u._id.toString(), u]));

  const topCustomersList = topCustomers.map(customer => {
    const user = userMap.get(customer.userId.toString());
    return {
      userId: customer.userId,
      name: user ? user.name : 'Compte supprimé',
      email: user ? user.email : null,
      orders: customer.orders,
      totalSpent: Number(customer.totalSpent.toFixed(2))
    };
  });

  res.status(200).json({
    success: true,
    customers: {
      totalCustomers,
      newCustomers,
      returningCustomers,
      averageCustomerValue: Number(averageCustomerValue.toFixed(2)),
      topCustomers: topCustomersList
    }
  });
});

// PHASE 13.19 — Recommandations IA avancées (V2) du vendeur connecté
// Recommandations catégorisées : SALES, INVENTORY, PRODUCTS, CUSTOMERS, MARKETING
const getSellerAIRecommendationsV2 = catchAsync(async (req, res, next) => {
  const seller = req.seller; // ✅ Utilisation exclusive de req.seller._id

  // ✅ Refuser toute tentative d'utiliser sellerId provenant de req.body, req.params ou req.query
  if (
    req.body?.sellerId !== undefined ||
    req.query?.sellerId !== undefined ||
    (req.params && req.params.sellerId !== undefined)
  ) {
    throw new AppError('Le sellerId fourni par le client est interdit.', 400);
  }

  // ✅ Récupérer les produits du vendeur
  const products = await Product.find({ sellerId: seller._id })
    .select('name price stock approvalStatus isPublished rating numReviews');

  const sellerProductIds = products.map(p => p._id);
  const sellerProductIdSet = new Set(sellerProductIds.map(id => id.toString()));

  // ✅ Récupérer toutes les commandes (y compris annulées pour les taux)
  const allOrders = await Order.find({
    'items.productId': { $in: sellerProductIds }
  }).select('userId items orderStatus createdAt');

  const validOrders = allOrders.filter(o => o.orderStatus !== 'cancelled');

  // ✅ Helpers
  const computeRevenue = (orderList) => orderList.reduce((sum, order) => {
    const sellerItems = order.items.filter(item =>
      item.productId && sellerProductIdSet.has(item.productId.toString())
    );
    return sum + sellerItems.reduce((itemSum, item) => itemSum + (item.price * item.quantity), 0);
  }, 0);

  const computeCustomers = (orderList) => {
    const set = new Set();
    orderList.forEach(o => { if (o.userId) set.add(o.userId.toString()); });
    return set.size;
  };

  const growthRate = (current, previous) => {
    if (!previous || previous === 0) return current === 0 ? 0 : 100;
    return ((current - previous) / previous) * 100;
  };

  // ✅ Agréger les ventes par produit
  const salesMap = new Map();
  validOrders.forEach(order => {
    order.items.forEach(item => {
      if (!item.productId || !sellerProductIdSet.has(item.productId.toString())) return;
      const prodId = item.productId.toString();
      const current = salesMap.get(prodId) || { productId: item.productId, quantitySold: 0, revenue: 0 };
      current.quantitySold += item.quantity;
      current.revenue += item.price * item.quantity;
      salesMap.set(prodId, current);
    });
  });

  const productMap = new Map(products.map(p => [p._id.toString(), p]));

  // ✅ Comparaison 30 jours vs 30 jours précédents
  const now = new Date();
  const startCurrent = new Date(now);
  startCurrent.setHours(0, 0, 0, 0);
  startCurrent.setDate(startCurrent.getDate() - 29);
  const startPrevious = new Date(startCurrent);
  startPrevious.setDate(startPrevious.getDate() - 30);

  const currentOrders = validOrders.filter(o => o.createdAt >= startCurrent);
  const previousOrders = validOrders.filter(o => o.createdAt >= startPrevious && o.createdAt < startCurrent);

  const currentRevenue = computeRevenue(currentOrders);
  const previousRevenue = computeRevenue(previousOrders);
  const revenueGrowth = growthRate(currentRevenue, previousRevenue);

  const currentCustomers = computeCustomers(currentOrders);
  const previousCustomers = computeCustomers(previousOrders);
  const customerGrowth = growthRate(currentCustomers, previousCustomers);

  const recommendations = [];
  const lowStockThreshold = 5;

  // ✅ 1) SALES — Baisse / croissance des ventes
  if (revenueGrowth < -10) {
    recommendations.push({
      category: 'SALES',
      priority: 'HIGH',
      title: 'Sales slowdown detected',
      action: 'Create promotion',
      expectedImpact: 'Increase conversion'
    });
  } else if (revenueGrowth > 15) {
    recommendations.push({
      category: 'SALES',
      priority: 'MEDIUM',
      title: 'Strong sales momentum',
      action: 'Scale up best-selling categories',
      expectedImpact: 'Maximize revenue growth'
    });
  } else if (validOrders.length === 0) {
    recommendations.push({
      category: 'SALES',
      priority: 'HIGH',
      title: 'No sales yet',
      action: 'Launch your first promotion and share your store',
      expectedImpact: 'Generate first orders'
    });
  }

  // ✅ 2) INVENTORY — Risque de stock
  const outOfStockProducts = products.filter(p => p.stock === 0);
  const lowStockProducts = products.filter(p => p.stock > 0 && p.stock <= lowStockThreshold);

  outOfStockProducts.forEach(product => {
    recommendations.push({
      category: 'INVENTORY',
      priority: 'HIGH',
      title: 'Stock risk detected',
      action: `Restock ${product.name}`,
      expectedImpact: 'Avoid lost sales'
    });
  });

  lowStockProducts.forEach(product => {
    const sale = salesMap.get(product._id.toString());
    const quantitySold = sale ? sale.quantitySold : 0;
    if (quantitySold > 0) {
      recommendations.push({
        category: 'INVENTORY',
        priority: 'MEDIUM',
        title: 'Low stock warning',
        action: `Restock ${product.name}`,
        expectedImpact: 'Avoid stockout for a fast-moving item'
      });
    }
  });

  if (outOfStockProducts.length === 0 && lowStockProducts.length === 0) {
    recommendations.push({
      category: 'INVENTORY',
      priority: 'LOW',
      title: 'Healthy inventory',
      action: 'Maintain current stock levels',
      expectedImpact: 'Stable fulfillment'
    });
  }

  // ✅ 3) PRODUCTS — Produits sans vente / faibles avis / en attente
  const neverSoldPublished = products.filter(p => {
    const sale = salesMap.get(p._id.toString());
    return p.isPublished && (!sale || sale.quantitySold === 0);
  });

  if (neverSoldPublished.length > 0) {
    recommendations.push({
      category: 'PRODUCTS',
      priority: 'MEDIUM',
      title: `${neverSoldPublished.length} product(s) without sales`,
      action: 'Improve descriptions, images or pricing',
      expectedImpact: 'Boost product conversion'
    });
  }

  const lowRatedProducts = products.filter(p => p.numReviews > 0 && p.rating < 3.5);
  if (lowRatedProducts.length > 0) {
    recommendations.push({
      category: 'PRODUCTS',
      priority: 'HIGH',
      title: 'Quality improvement needed',
      action: `Address feedback on ${lowRatedProducts.length} low-rated product(s)`,
      expectedImpact: 'Improve ratings and trust'
    });
  }

  const pendingCount = products.filter(p => p.approvalStatus === 'pending').length;
  if (pendingCount > 0) {
    recommendations.push({
      category: 'PRODUCTS',
      priority: 'MEDIUM',
      title: `${pendingCount} product(s) pending approval`,
      action: 'Follow up on admin approval',
      expectedImpact: 'Increase available catalog'
    });
  }

  // ✅ 4) CUSTOMERS — Croissance / baisse / récurrence
  if (customerGrowth > 15) {
    recommendations.push({
      category: 'CUSTOMERS',
      priority: 'MEDIUM',
      title: 'Customer acquisition rising',
      action: 'Launch a loyalty program',
      expectedImpact: 'Convert new buyers into repeat customers'
    });
  } else if (customerGrowth < -10 && currentCustomers > 0) {
    recommendations.push({
      category: 'CUSTOMERS',
      priority: 'HIGH',
      title: 'Customer base shrinking',
      action: 'Re-engage past customers with email offers',
      expectedImpact: 'Reverse customer decline'
    });
  }

  const repeatCustomers = new Set();
  const firstOrders = new Map();
  validOrders.forEach(o => {
    if (!o.userId) return;
    const uid = o.userId.toString();
    if (firstOrders.has(uid)) {
      repeatCustomers.add(uid);
    } else {
      firstOrders.set(uid, true);
    }
  });

  if (repeatCustomers.size === 0 && validOrders.length > 0) {
    recommendations.push({
      category: 'CUSTOMERS',
      priority: 'MEDIUM',
      title: 'No repeat customers yet',
      action: 'Offer discounts on second purchases',
      expectedImpact: 'Build customer loyalty'
    });
  }

  // ✅ 5) MARKETING — Meilleur produit / avis positifs
  let bestSeller = null;
  let bestQty = 0;
  salesMap.forEach((sale, prodId) => {
    if (sale.quantitySold > bestQty) {
      bestQty = sale.quantitySold;
      bestSeller = productMap.get(prodId);
    }
  });

  if (bestSeller) {
    recommendations.push({
      category: 'MARKETING',
      priority: 'HIGH',
      title: `Promote best-seller: ${bestSeller.name}`,
      action: 'Feature it in storefront banners and ads',
      expectedImpact: 'Multiply sales of a proven product'
    });
  }

  const excellentRated = products.filter(p => p.numReviews > 0 && p.rating >= 4.5);
  if (excellentRated.length > 0) {
    recommendations.push({
      category: 'MARKETING',
      priority: 'MEDIUM',
      title: 'Leverage social proof',
      action: 'Highlight top-rated products in campaigns',
      expectedImpact: 'Increase conversion through trust'
    });
  }

  // ✅ Trier par priorité (HIGH > MEDIUM > LOW), puis par catégorie
  const priorityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
  recommendations.sort((a, b) => {
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (priorityDiff !== 0) return priorityDiff;
    return a.category.localeCompare(b.category);
  });

  res.status(200).json({
    success: true,
    count: recommendations.length,
    recommendations
  });
});

module.exports = {
  getSellerAdvancedAnalytics,
  getSellerSalesTrends,
  getSellerCustomerAnalytics,
  getSellerAIRecommendationsV2,
  getSellerNotifications,
  markSellerNotificationsRead,
  getSellerBusinessAlerts,
  getSellerSmartInsights,
  getSellerActionPlan,
  getSellerAIReport,
  getSellerSalesForecast,
  getSellerBusinessRecommendations,
  getSellerKPIDashboard,
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


