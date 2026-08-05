const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const addressSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  street: {
    type: String,
    required: true
  },
  city: {
    type: String,
    required: true
  },
  state: {
    type: String,
    required: true
  },
  country: {
    type: String,
    required: true
  },
  postalCode: {
    type: String,
    required: true
  },
  isDefault: {
    type: Boolean,
    default: false
  }
}, { _id: true });

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },

  email: {
    type: String,
    required: true,
    unique: true
  },

  password: {
    type: String,
    required: false
  },

  googleId: {
    type: String,
    unique: true,
    sparse: true
  },

  phone: {
    type: String,
    default: ''
  },

  avatar: {
    type: String,
    default: ''
  },

  role: {
    type: String,
    enum: ['customer', 'seller', 'admin'],
    default: 'customer'
  },

  addresses: [addressSchema],

  favorites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],

  preferences: {
    language: {
      type: String,
      enum: ['fr', 'en'],
      default: 'fr'
    },
    currency: {
      type: String,
      enum: ['CAD', 'XOF', 'USD', 'EUR'],
      default: 'CAD'
    }
  },

  lastLogin: {
    type: Date
  }
}, {
  timestamps: true
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password') || !this.password) {
    return next();
  }

  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Méthode pour vérifier le mot de passe
userSchema.methods.correctPassword = async function(candidatePassword, userPassword) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

// Index pour améliorer les performances
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });

module.exports = mongoose.model('User', userSchema);