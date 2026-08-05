// Backend/models/Seller.js
const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
  street: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  country: { type: String, required: true },
  postalCode: { type: String, required: true }
}, { _id: true });

const sellerSchema = new mongoose.Schema({
  // Référence à l'utilisateur
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  
  // Informations de la boutique
  storeName: {
    type: String,
    required: [true, 'Le nom de la boutique est obligatoire'],
    trim: true,
    maxlength: 100,
    minlength: [3, 'Le nom de la boutique doit contenir au moins 3 caractères']
  },
  
  description: {
    type: String,
    required: [true, 'La description de la boutique est obligatoire'],
    maxlength: 500,
    trim: true
  },
  
  // Branding
  logo: {
    type: String,
    default: null
  },
  
  banner: {
    type: String,
    default: null
  },
  
  // Contact
  phone: {
    type: String,
    required: [true, 'Le numéro de téléphone est obligatoire'],
    trim: true
  },
  
  email: {
    type: String,
    required: [true, 'L\'email de contact est obligatoire'],
    trim: true,
    lowercase: true
  },
  
  address: {
    type: addressSchema,
    required: [true, 'L\'adresse est obligatoire']
  },
  
  // Statut du vendeur
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'suspended'],
    default: 'pending'
  },
  
  // Métriques
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  
  totalReviews: {
    type: Number,
    default: 0,
    min: 0
  },
  
  totalSales: {
    type: Number,
    default: 0,
    min: 0
  },
  
  totalRevenue: {
    type: Number,
    default: 0,
    min: 0
  },
  
  totalProducts: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Configuration vendeur
  businessType: {
    type: String,
    enum: ['individual', 'company'],
    default: 'individual'
  },
  
  taxId: {
    type: String,
    trim: true
  },
  
  // Social media
  socialMedia: {
    website: { type: String, trim: true },
    facebook: { type: String, trim: true },
    instagram: { type: String, trim: true },
    twitter: { type: String, trim: true }
  },
  
  // Shipping settings
  shippingSettings: {
    freeShippingThreshold: { type: Number, default: 0 },
    processingTime: { type: Number, default: 2 }, // en jours
    shippingRegions: [{
      region: String,
      cost: Number,
      estimatedDays: Number
    }]
  },
  
  // Admin notes
  adminNotes: {
    type: String,
    trim: true
  },
  
  rejectionReason: {
    type: String,
    trim: true
  },
  
  suspensionReason: {
    type: String,
    trim: true
  },
  
  // Dates importantes
  approvedAt: {
    type: Date
  },
  
  rejectedAt: {
    type: Date
  },
  
  suspendedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Index pour améliorer les performances
sellerSchema.index({ userId: 1 });
sellerSchema.index({ status: 1 });
sellerSchema.index({ storeName: 'text', description: 'text' });
sellerSchema.index({ rating: -1 });
sellerSchema.index({ totalSales: -1 });
sellerSchema.index({ createdAt: -1 });

// Méthode pour mettre à jour les métriques du vendeur
sellerSchema.methods.updateMetrics = async function(salesData) {
  if (salesData.sales) {
    this.totalSales += salesData.sales;
  }
  if (salesData.revenue) {
    this.totalRevenue += salesData.revenue;
  }
  if (salesData.products) {
    this.totalProducts = salesData.products;
  }
  return this.save();
};

// Méthode pour mettre à jour la note du vendeur
sellerSchema.methods.updateRating = async function(newRating) {
  const totalRating = this.rating * this.totalReviews;
  this.totalReviews += 1;
  this.rating = (totalRating + newRating) / this.totalReviews;
  return this.save();
};

// Méthode virtuelle pour vérifier si le vendeur est actif
sellerSchema.virtual('isActive').get(function() {
  return this.status === 'approved';
});

// Méthode virtuelle pour vérifier si le vendeur peut vendre
sellerSchema.virtual('canSell').get(function() {
  return this.status === 'approved' && !this.suspendedAt;
});

module.exports = mongoose.model('Seller', sellerSchema);