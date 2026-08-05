// Backend/routes/reviewRoutes.js
const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const Product = require('../models/Product');
const { protect } = require('../middleware/auth.middleware');

// ==========================================
// ✅ POST /api/reviews - Créer un avis
// ==========================================
router.post('/', protect, async (req, res) => {
  try {
    const { productId, rating, comment, title } = req.body;

    if (!productId || !rating || !comment) {
      return res.status(400).json({ 
        success: false,
        message: 'productId, rating et comment sont requis' 
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ 
        success: false,
        message: 'La note doit être entre 1 et 5' 
      });
    }

    // Vérifier si l'utilisateur a déjà laissé un avis pour ce produit
    const existingReview = await Review.findOne({ 
      userId: req.user._id, 
      productId 
    });

    if (existingReview) {
      return res.status(400).json({ 
        success: false,
        message: 'Vous avez déjà laissé un avis pour ce produit' 
      });
    }

    const review = await Review.create({
      userId: req.user._id,
      productId,
      rating,
      comment,
      title
    });

    // Mettre à jour la note moyenne du produit
    await updateProductRating(productId);

    res.status(201).json({ 
      success: true,
      review 
    });
  } catch (error) {
    console.error('❌ Erreur création avis:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
});

// ==========================================
// ✅ GET /api/reviews/product/:productId - Avis d'un produit
// ==========================================
router.get('/product/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const reviews = await Review.find({ productId })
      .populate('userId', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Review.countDocuments({ productId });

    res.json({
      success: true,
      reviews,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
});

// ==========================================
// ✅ DELETE /api/reviews/:id - Supprimer un avis
// ==========================================
router.delete('/:id', protect, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ 
        success: false,
        message: 'Avis non trouvé' 
      });
    }

    // Vérifier que l'utilisateur est le propriétaire de l'avis ou un admin
    if (review.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false,
        message: 'Non autorisé à supprimer cet avis' 
      });
    }

    const productId = review.productId;
    await Review.findByIdAndDelete(req.params.id);

    // Mettre à jour la note moyenne du produit
    await updateProductRating(productId);

    res.json({ 
      success: true,
      message: 'Avis supprimé' 
    });
  } catch (error) {
    console.error('❌ Erreur suppression avis:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
});

// ==========================================
// ✅ Helper: Mettre à jour la note moyenne du produit
// ==========================================
async function updateProductRating(productId) {
  try {
    const reviews = await Review.find({ productId });
    
    if (reviews.length === 0) {
      await Product.findByIdAndUpdate(productId, {
        rating: 0,
        numReviews: 0
      });
      return;
    }

    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / reviews.length;

    await Product.findByIdAndUpdate(productId, {
      rating: averageRating,
      numReviews: reviews.length
    });
  } catch (error) {
    console.error('❌ Erreur mise à jour note produit:', error);
  }
}

module.exports = router;
