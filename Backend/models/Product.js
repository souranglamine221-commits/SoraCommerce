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
  image: {
    type: String,
    default: null // Permet d'utiliser le fallback SVG si vide
  },
  category: {
    type: String,
    required: true,
    enum: ['Accessoires', 'Bagages', 'Électronique', 'Vêtements', 'Maison', 'Autre']
  },
  is_new: {
    type: Boolean,
    default: false
  },
  stock: {
    type: Number,
    default: 0,
    min: 0
  }
}, {
  timestamps: true // Ajoute createdAt et updatedAt automatiquement
});

module.exports = mongoose.model('Product', productSchema);