// backend/models/Product.js
const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Le nom du produit est obligatoire'],
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    required: [true, 'La description est obligatoire'],
    maxlength: 2000
  },
  price: {
    type: Number,
    required: [true, 'Le prix est obligatoire'],
    min: [0, 'Le prix ne peut pas être négatif']
  },
  currency: {
    type: String,
    enum: ['XOF', 'CAD', 'USD', 'EUR'],
    default: 'XOF'
  },
  discountPrice: {
    type: Number,
    min: [0, 'Le prix de réduction ne peut pas être négatif']
  },
  images: [{
    type: String,
    default: null
  }],
  image: {
    type: String,
    default: null // Maintenu pour compatibilité avec l'ancien système
  },
  sku: {
    type: String,
    unique: true,
    sparse: true,
    trim: true
  },
  brand: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: ['Accessoires', 'Bagages', 'Électronique', 'Vêtements', 'Maison', 'Autre']
  },
  subcategory: {
    type: String,
    trim: true
  },
  stock: {
    type: Number,
    default: 0,
    min: 0
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  numReviews: {
    type: Number,
    default: 0,
    min: 0
  },
  weight: {
    type: Number,
    min: 0
  },
  dimensions: {
    length: { type: Number, min: 0 },
    width: { type: Number, min: 0 },
    height: { type: Number, min: 0 }
  },
  countryOrigin: {
    type: String,
    trim: true
  },
  is_new: {
    type: Boolean,
    default: false
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  
  // Association vendeur (marketplace)
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Seller',
    required: false // Pour compatibilité avec produits existants
  },
  approvalStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  isPublished: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true // Ajoute createdAt et updatedAt automatiquement
});

// Index pour améliorer les performances de recherche
productSchema.index({ name: 'text', description: 'text', brand: 'text' });
productSchema.index({ category: 1 });
productSchema.index({ brand: 1 });
productSchema.index({ price: 1 });
productSchema.index({ rating: -1 });
productSchema.index({ isFeatured: 1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ sellerId: 1 });

module.exports = mongoose.model('Product', productSchema);