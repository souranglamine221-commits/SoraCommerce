// Backend/models/Order.js
const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  // Référence à l'utilisateur
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User'
  },
  
  // Informations client (pour commandes invité)
  user: { 
    type: String, 
    required: false 
  },
  email: { 
    type: String, 
    required: false,
    lowercase: true,
    trim: true
  },
  
  // Adresse de livraison complète
  shippingAddress: {
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    country: { type: String, required: true },
    postalCode: { type: String, required: false }
  },
  
  // Ancien champ address pour compatibilité (deprecated)
  address: { 
    type: String, 
    required: false 
  },
  
  // Produits de la commande
  items: [{
    productId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Product',
      required: true 
    },
    name: { type: String, required: true },
    image: { type: String, required: false },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 }
  }],
  
  // Prix
  subtotal: { 
    type: Number, 
    required: true,
    min: 0,
    default: 0
  },
  shippingCost: { 
    type: Number, 
    required: true,
    min: 0,
    default: 0
  },
  total: { 
    type: Number, 
    required: [true, 'Le montant total est requis'],
    min: 0 
  },
  
  // Statut de la commande
  orderStatus: { 
    type: String, 
    enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending' 
  },
  
  // Ancien champ status pour compatibilité (deprecated)
  status: { 
    type: String, 
    enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending' 
  },
  
  // Référence au paiement
  payment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment'
  },
  
  // Paiement
  paymentMethod: {
    type: String,
    enum: ['card', 'paypal', 'wave', 'orange_money', 'cash_on_delivery', 'other'],
    default: 'card'
  },
  paymentStatus: {
    type: String,
    enum: ['unpaid', 'paid', 'refunded', 'partial'],
    default: 'unpaid'
  },
  
  // Livraison
  trackingNumber: {
    type: String,
    required: false
  },
  
  // Notes
  notes: {
    type: String,
    required: false
  },
  
  // Devise
  currency: {
    type: String,
    enum: ['CAD', 'XOF', 'USD', 'EUR'],
    default: 'CAD'
  },
  exchangeRate: {
    type: Number,
    required: false,
    default: 1
  },
  
  // Informations de paiement
  transactionId: {
    type: String,
    required: false
  },
  stripePaymentId: {
    type: String,
    required: false
  },
  paymentProvider: {
    type: String,
    enum: ['stripe', 'paypal', 'wave', 'orange_money', 'cash', 'other'],
    required: false
  },
  paymentDate: {
    type: Date,
    required: false
  }
}, { 
  timestamps: true // Ajoute createdAt et updatedAt automatiquement
});

// Index pour améliorer les performances
orderSchema.index({ userId: 1 });
orderSchema.index({ orderStatus: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ payment: 1 });

// Method to update order status
orderSchema.methods.updateStatus = function(newStatus) {
  this.orderStatus = newStatus;
  this.status = newStatus;
  return this.save();
};

// Method to add payment reference
orderSchema.methods.setPayment = function(paymentId) {
  this.payment = paymentId;
  this.paymentStatus = 'paid';
  this.paymentDate = new Date();
  return this.save();
};

module.exports = mongoose.model('Order', orderSchema);