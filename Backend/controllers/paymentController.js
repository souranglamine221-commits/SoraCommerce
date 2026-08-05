const stripe = require('../config/stripe');
const Payment = require('../models/Payment');
const Order = require('../models/Order');
const { validationResult } = require('express-validator');

// Create Payment Intent
const createPaymentIntent = async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { amount, currency = 'USD', paymentMethod, orderId, metadata = {} } = req.body;
    const userId = req.user?.id;

    // Validate amount
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    // Validate currency
    const validCurrencies = ['USD', 'EUR', 'GBP', 'XOF', 'XAF'];
    if (!validCurrencies.includes(currency)) {
      return res.status(400).json({ error: 'Invalid currency' });
    }

    // Create Stripe Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: currency.toLowerCase(),
      payment_method_types: getPaymentMethodTypes(paymentMethod),
      metadata: {
        orderId: orderId || '',
        userId: userId || '',
        ...metadata
      },
      description: `Payment for order ${orderId || 'N/A'}`,
      shipping: {
        name: req.body.shippingAddress?.fullName || '',
        address: {
          line1: req.body.shippingAddress?.address || '',
          city: req.body.shippingAddress?.city || '',
          country: req.body.shippingAddress?.country || '',
          postal_code: req.body.shippingAddress?.postalCode || ''
        }
      }
    });

    // Create Payment record in database
    const payment = new Payment({
      user: userId,
      order: orderId,
      amount: amount,
      currency: currency.toUpperCase(),
      paymentMethod: paymentMethod || 'stripe',
      status: 'pending',
      stripePaymentIntentId: paymentIntent.id,
      metadata: new Map(Object.entries(metadata))
    });

    await payment.save();

    // Log payment creation
    console.log(`Payment Intent created: ${paymentIntent.id} for order ${orderId}`);

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: amount,
      currency: currency
    });

  } catch (error) {
    console.error('Payment Intent creation error:', error);
    res.status(500).json({ 
      error: 'Failed to create payment intent',
      details: error.message 
    });
  }
};

// Get payment method types based on payment method
const getPaymentMethodTypes = (paymentMethod) => {
  const types = ['card'];
  
  if (paymentMethod === 'apple_pay') {
    types.push('apple_pay');
  }
  if (paymentMethod === 'google_pay') {
    types.push('google_pay');
  }
  
  return types;
};

// Confirm Payment
const confirmPayment = async (req, res) => {
  try {
    const { paymentIntentId, paymentMethodId } = req.body;

    const paymentIntent = await stripe.paymentIntents.confirm(paymentIntentId, {
      payment_method: paymentMethodId
    });

    // Update payment status in database
    const payment = await Payment.findOne({ stripePaymentIntentId: paymentIntentId });
    if (payment) {
      if (paymentIntent.status === 'succeeded') {
        await payment.markAsCompleted(paymentIntent.id, {
          stripeStatus: paymentIntent.status
        });

        // Update order status
        if (payment.order) {
          const order = await Order.findById(payment.order);
          if (order) {
            await order.setPayment(payment._id);
            await order.updateStatus('processing');
          }
        }
      } else {
        await payment.markAsFailed(paymentIntent.last_payment_error?.message || 'Payment failed');
      }
    }

    res.json({ 
      status: paymentIntent.status,
      paymentIntentId: paymentIntent.id 
    });

  } catch (error) {
    console.error('Payment confirmation error:', error);
    res.status(500).json({ 
      error: 'Failed to confirm payment',
      details: error.message 
    });
  }
};

// Get Payment by ID
const getPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const payment = await Payment.findById(id)
      .populate('order')
      .populate('user', 'email name');

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    // Check if user owns this payment
    if (payment.user._id.toString() !== userId && !req.user?.isAdmin) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    res.json(payment);

  } catch (error) {
    console.error('Get payment error:', error);
    res.status(500).json({ 
      error: 'Failed to get payment',
      details: error.message 
    });
  }
};

// Get User Payments
const getUserPayments = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { page = 1, limit = 10, status } = req.query;

    const query = { user: userId };
    if (status) {
      query.status = status;
    }

    const payments = await Payment.find(query)
      .populate('order')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Payment.countDocuments(query);

    res.json({
      payments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get user payments error:', error);
    res.status(500).json({ 
      error: 'Failed to get payments',
      details: error.message 
    });
  }
};

// Refund Payment
const refundPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, reason } = req.body;

    const payment = await Payment.findById(id);
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    if (payment.status !== 'completed') {
      return res.status(400).json({ error: 'Payment cannot be refunded' });
    }

    // Create Stripe refund
    const refund = await stripe.refunds.create({
      payment_intent: payment.stripePaymentIntentId,
      amount: amount ? Math.round(amount * 100) : undefined,
      reason: reason || 'requested_by_customer'
    });

    // Update payment status
    await payment.refund(refund.amount / 100);

    // Log refund
    console.log(`Payment refunded: ${payment._id}, amount: ${refund.amount / 100}`);

    res.json({
      refundId: refund.id,
      amount: refund.amount / 100,
      status: refund.status
    });

  } catch (error) {
    console.error('Refund payment error:', error);
    res.status(500).json({ 
      error: 'Failed to refund payment',
      details: error.message 
    });
  }
};

// Handle Cash on Delivery
const createCashOnDeliveryPayment = async (req, res) => {
  try {
    const { orderId, amount, currency = 'USD' } = req.body;
    const userId = req.user?.id;

    // Validate amount
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    // Create Payment record
    const payment = new Payment({
      user: userId,
      order: orderId,
      amount: amount,
      currency: currency.toUpperCase(),
      paymentMethod: 'cash_on_delivery',
      status: 'pending',
      metadata: new Map(Object.entries({
        type: 'cash_on_delivery',
        note: 'Payment to be made on delivery'
      }))
    });

    await payment.save();

    // Update order
    const order = await Order.findById(orderId);
    if (order) {
      await order.setPayment(payment._id);
      await order.updateStatus('pending');
    }

    res.json({
      paymentId: payment._id,
      status: 'pending',
      message: 'Cash on delivery payment created'
    });

  } catch (error) {
    console.error('Cash on delivery error:', error);
    res.status(500).json({ 
      error: 'Failed to create cash on delivery payment',
      details: error.message 
    });
  }
};

// Webhook handler (for Stripe events)
const handleWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).json({ error: 'Invalid signature' });
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object);
        break;
      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;
      case 'payment_intent.canceled':
        await handlePaymentCanceled(event.data.object);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });

  } catch (error) {
    console.error('Webhook handling error:', error);
    res.status(500).json({ error: 'Webhook handling failed' });
  }
};

// Handle payment succeeded event
const handlePaymentSucceeded = async (paymentIntent) => {
  const payment = await Payment.findOne({ 
    stripePaymentIntentId: paymentIntent.id 
  });

  if (payment) {
    await payment.markAsCompleted(paymentIntent.id, {
      stripeStatus: 'succeeded'
    });

    // Update order
    if (payment.order) {
      const order = await Order.findById(payment.order);
      if (order) {
        await order.setPayment(payment._id);
        await order.updateStatus('processing');
      }
    }

    console.log(`Payment succeeded: ${paymentIntent.id}`);
  }
};

// Handle payment failed event
const handlePaymentFailed = async (paymentIntent) => {
  const payment = await Payment.findOne({ 
    stripePaymentIntentId: paymentIntent.id 
  });

  if (payment) {
    await payment.markAsFailed(
      paymentIntent.last_payment_error?.message || 'Payment failed'
    );
    console.log(`Payment failed: ${paymentIntent.id}`);
  }
};

// Handle payment canceled event
const handlePaymentCanceled = async (paymentIntent) => {
  const payment = await Payment.findOne({ 
    stripePaymentIntentId: paymentIntent.id 
  });

  if (payment) {
    payment.status = 'cancelled';
    await payment.save();
    console.log(`Payment canceled: ${paymentIntent.id}`);
  }
};

module.exports = {
  createPaymentIntent,
  confirmPayment,
  getPayment,
  getUserPayments,
  refundPayment,
  createCashOnDeliveryPayment,
  handleWebhook
};
