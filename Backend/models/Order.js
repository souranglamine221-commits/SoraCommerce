// Backend/models/Order.js
const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  user: { 
    type: String, 
    required: [true, 'Le nom du client est requis'] 
  },
  email: { 
    type: String, 
    required: [true, "L'email est requis"],
    lowercase: true,
    trim: true
  },
  address: { 
    type: String, 
    required: [true, "L'adresse de livraison est requise"] 
  },
  items: [{
    productId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Product',
      required: true 
    },
    name: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 }
  }],
  total: { 
    type: Number, 
    required: [true, 'Le montant total est requis'],
    min: 0 
  },
  status: { 
    type: String, 
    enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'],
    default: 'pending' 
  },
  paymentStatus: {
    type: String,
    enum: ['unpaid', 'paid', 'refunded'],
    default: 'unpaid'
  }
}, { 
  timestamps: true // Ajoute createdAt et updatedAt automatiquement
});

module.exports = mongoose.model('Order', orderSchema);