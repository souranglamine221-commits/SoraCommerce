// Backend/routes/productRoutes.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose'); // ✅ Import nécessaire pour ObjectId
const Product = require('../models/Product');
const { upload, uploadToCloudinary } = require('../middleware/upload'); // ✅ Import du middleware

// ✅ GET - Obtenir tous les produits
router.get('/', async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
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
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Produit non trouvé' });
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ✅ POST - Créer un produit (avec Upload Image)
router.post('/', upload.single('image'), async (req, res) => {
  try {
    let imageUrl = req.body.image; // Conserve l'URL manuelle si fournie
    
    // Si un fichier a été envoyé, on l'upload sur Cloudinary
    if (req.file) {
      imageUrl = await uploadToCloudinary(req.file.buffer);
    }

    const product = new Product({
      name: req.body.name,
      description: req.body.description,
      price: Number(req.body.price),
      category: req.body.category,
      stock: Number(req.body.stock),
      is_new: req.body.is_new === 'true',
      image: imageUrl
    });
    
    await product.save();
    res.status(201).json(product);
  } catch (error) {
    console.error('❌ Erreur création produit:', error);
    res.status(500).json({ message: error.message });
  }
});

// ✅ DELETE - Supprimer un produit
router.delete('/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ message: 'ID invalide' });
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