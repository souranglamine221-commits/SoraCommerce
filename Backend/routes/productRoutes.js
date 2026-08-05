// Backend/routes/productRoutes.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose'); // ✅ Import nécessaire pour ObjectId
const Product = require('../models/Product');
const { upload, uploadToCloudinary } = require('../middleware/upload'); // ✅ Import du middleware
const { protect, restrictTo } = require('../middleware/auth.middleware'); // ✅ Import auth middlewares

// ✅ GET - Obtenir tous les produits avec pagination
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const products = await Product.find()
      .populate('sellerId', 'storeName logo rating')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Product.countDocuments();

    res.json({
      products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==========================================
// ✅ GET /api/products/search - Recherche produits
// ==========================================
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q) {
      return res.status(400).json({ message: 'Terme de recherche requis' });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const products = await Product.find(
      { $text: { $search: q } },
      { score: { $meta: 'textScore' } }
    )
      .sort({ score: { $meta: 'textScore' } })
      .skip(skip)
      .limit(limit);

    const total = await Product.countDocuments({ $text: { $search: q } });

    res.json({
      products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==========================================
// ✅ GET /api/products/filter - Filtrer produits
// ==========================================
router.get('/filter', async (req, res) => {
  try {
    const {
      minPrice,
      maxPrice,
      category,
      brand,
      inStock,
      minRating,
      page = 1,
      limit = 20
    } = req.query;

    const filter = {};

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }

    if (category) filter.category = category;
    if (brand) filter.brand = new RegExp(brand, 'i');
    if (inStock === 'true') filter.stock = { $gt: 0 };
    if (minRating) filter.rating = { $gte: parseFloat(minRating) };

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const products = await Product.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Product.countDocuments(filter);

    res.json({
      products,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==========================================
// ✅ GET /api/products/category/:category - Produits par catégorie
// ==========================================
router.get('/category/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const products = await Product.find({ category })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Product.countDocuments({ category });

    res.json({
      products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==========================================
// ✅ GET /api/products/featured - Produits en vedette
// ==========================================
router.get('/featured', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    const products = await Product.find({ isFeatured: true })
      .sort({ rating: -1, createdAt: -1 })
      .limit(limit);

    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ✅ GET - Obtenir un produit par ID
router.get('/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ message: 'ID invalide' });
    }
    const product = await Product.findById(req.params.id)
      .populate('sellerId', 'storeName logo rating totalReviews');
    if (!product) return res.status(404).json({ message: 'Produit non trouvé' });
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ✅ POST - Créer un produit (avec Upload Image) - PROTÉGÉ ADMIN ET SELLER
router.post('/', protect, upload.single('image'), async (req, res) => {
  try {
    // Vérifier les permissions
    if (req.user.role !== 'admin' && req.user.role !== 'seller') {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    // Pour les vendeurs, vérifier qu'ils sont approuvés
    if (req.user.role === 'seller') {
      const Seller = require('../models/Seller');
      const seller = await Seller.findOne({ userId: req.user._id });
      
      if (!seller || seller.status !== 'approved') {
        return res.status(403).json({ message: 'Compte vendeur non approuvé' });
      }
      
      req.body.sellerId = seller._id;
    }

    let imageUrl = req.body.image; // Conserve l'URL manuelle si fournie
    
    // Si un fichier a été envoyé, on l'upload sur Cloudinary
    if (req.file) {
      imageUrl = await uploadToCloudinary(req.file.buffer);
    }

    const product = new Product({
      name: req.body.name,
      description: req.body.description,
      price: Number(req.body.price),
      discountPrice: req.body.discountPrice ? Number(req.body.discountPrice) : undefined,
      category: req.body.category,
      subcategory: req.body.subcategory,
      brand: req.body.brand,
      sku: req.body.sku,
      stock: Number(req.body.stock),
      is_new: req.body.is_new === 'true',
      isFeatured: req.body.isFeatured === 'true',
      weight: req.body.weight ? Number(req.body.weight) : undefined,
      countryOrigin: req.body.countryOrigin,
      image: imageUrl,
      sellerId: req.body.sellerId
    });
    
    await product.save();
    
    // Mettre à jour le compteur de produits du vendeur
    if (req.body.sellerId) {
      const Seller = require('../models/Seller');
      await Seller.findByIdAndUpdate(req.body.sellerId, {
        $inc: { totalProducts: 1 }
      });
    }
    
    res.status(201).json(product);
  } catch (error) {
    console.error('❌ Erreur création produit:', error);
    res.status(500).json({ message: error.message });
  }
});

// ==========================================
// ✅ PUT - Modifier un produit - PROTÉGÉ ADMIN ET SELLER
// ==========================================
router.put('/:id', protect, upload.single('image'), async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ message: 'ID invalide' });
    }

    // Vérifier les permissions
    if (req.user.role !== 'admin' && req.user.role !== 'seller') {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: 'Produit non trouvé' });
    }

    // Pour les vendeurs, vérifier que le produit leur appartient
    if (req.user.role === 'seller') {
      const Seller = require('../models/Seller');
      const seller = await Seller.findOne({ userId: req.user._id });
      
      if (!seller || product.sellerId?.toString() !== seller._id.toString()) {
        return res.status(403).json({ message: 'Non autorisé à modifier ce produit' });
      }
    }

    let imageUrl = req.body.image;
    
    // Si un fichier a été envoyé, on l'upload sur Cloudinary
    if (req.file) {
      imageUrl = await uploadToCloudinary(req.file.buffer);
    }

    const updateData = {
      name: req.body.name,
      description: req.body.description,
      price: Number(req.body.price),
      discountPrice: req.body.discountPrice ? Number(req.body.discountPrice) : undefined,
      category: req.body.category,
      subcategory: req.body.subcategory,
      brand: req.body.brand,
      sku: req.body.sku,
      stock: Number(req.body.stock),
      is_new: req.body.is_new === 'true',
      isFeatured: req.body.isFeatured === 'true',
      weight: req.body.weight ? Number(req.body.weight) : undefined,
      countryOrigin: req.body.countryOrigin
    };

    if (imageUrl) {
      updateData.image = imageUrl;
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    res.json(updatedProduct);
  } catch (error) {
    console.error('❌ Erreur modification produit:', error);
    res.status(500).json({ message: error.message });
  }
});

// ✅ DELETE - Supprimer un produit - PROTÉGÉ ADMIN ET SELLER
router.delete('/:id', protect, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ message: 'ID invalide' });
    }

    // Vérifier les permissions
    if (req.user.role !== 'admin' && req.user.role !== 'seller') {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: 'Produit non trouvé' });
    }

    // Pour les vendeurs, vérifier que le produit leur appartient
    if (req.user.role === 'seller') {
      const Seller = require('../models/Seller');
      const seller = await Seller.findOne({ userId: req.user._id });
      
      if (!seller || product.sellerId?.toString() !== seller._id.toString()) {
        return res.status(403).json({ message: 'Non autorisé à supprimer ce produit' });
      }
      
      // Mettre à jour le compteur de produits du vendeur
      await Seller.findByIdAndUpdate(seller._id, {
        $inc: { totalProducts: -1 }
      });
    }

    const deleted = await Product.findByIdAndDelete(req.params.id);
    
    if (!deleted) return res.status(404).json({ message: 'Produit non trouvé' });
    
    console.log(`🗑️ Produit supprimé: ${deleted.name}`);
    res.json({ success: true, message: 'Produit supprimé' });
  } catch (error) {
    console.error('❌ Erreur suppression:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;