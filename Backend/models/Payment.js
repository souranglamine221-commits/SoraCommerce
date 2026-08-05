const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'USD',
    enum: ['USD', 'EUR', 'GBP', 'XOF', 'XAF']
  },
  paymentMethod: {
    type: String,
    required: true,
    enum: ['stripe', 'paypal', 'wave', 'orange_money', 'cash_on_delivery', 'apple_pay', 'google_pay']
  },
  paymentMethodDetails: {
    cardType: String,
    last4: String,
    brand: String,
    country: String
  },
  status: {
    type: String,
    required: true,
    enum: ['pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled'],
    default: 'pending'
  },
  stripePaymentIntentId: {
    type: String,
    sparse: true
  },
  stripeCustomerId: {
    type: String,
    sparse: true
  },
  transactionId: {
    type: String,
    sparse: true
  },
  failureReason: {
    type: String
  },
  metadata: {
    type: Map,
    of: String
  },
  paidAt: {
    type: Date
  },
  refundedAt: {
    type: Date
  },
  refundAmount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for faster queries
paymentSchema.index({ user: 1, createdAt: -1 });
paymentSchema.index({ order: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ stripePaymentIntentId: 1 });

// Method to mark payment as completed
paymentSchema.methods.markAsCompleted = function(transactionId, metadata = {}) {
  this.status = 'completed';
  this.transactionId = transactionId;
  this.paidAt = new Date();
  if (metadata) {
    this.metadata = new Map(Object.entries(metadata));
  }
  return this.save();
};

// Method to mark payment as failed
paymentSchema.methods.markAsFailed = function(reason) {
  this.status = 'failed';
  this.failureReason = reason;
  return this.save();
};

// Method to refund payment
paymentSchema.methods.refund = function(amount) {
  this.status = 'refunded';
  this.refundAmount = amount;
  this.refundedAt = new Date();
  return this.save();
};

const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment;
