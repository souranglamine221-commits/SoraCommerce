// Backend/routes/paymentRoutes.js
const express = require('express');
const router = express.Router();
const stripe = require('../config/stripe');
const Order = require('../models/Order');
const Payment = require('../models/Payment');
const { protect } = require('../middleware/auth.middleware');
const { body } = require('express-validator');
const {
  createPaymentIntent,
  confirmPayment,
  getPayment,
  getUserPayments,
  refundPayment,
  createCashOnDeliveryPayment,
  handleWebhook
} = require('../controllers/paymentController');

// ==========================================
// ✅ POST /api/payment/create-payment-intent
// ==========================================
router.post('/create-payment-intent', 
  protect,
  [
    body('amount').isNumeric().isFloat({ min: 0.01 }),
    body('currency').isIn(['USD', 'EUR', 'GBP', 'XOF', 'XAF']),
    body('paymentMethod').isIn(['stripe', 'paypal', 'wave', 'orange_money', 'cash_on_delivery', 'apple_pay', 'google_pay'])
  ],
  createPaymentIntent
);

// ==========================================
// ✅ POST /api/payment/confirm
// ==========================================
router.post('/confirm', protect, confirmPayment);

// ==========================================
// ✅ GET /api/payment/:id
// ==========================================
router.get('/:id', protect, getPayment);

// ==========================================
// ✅ GET /api/payment
// ==========================================
router.get('/', protect, getUserPayments);

// ==========================================
// ✅ POST /api/payment/refund/:id
// ==========================================
router.post('/refund/:id', protect, refundPayment);

// ==========================================
// ✅ POST /api/payment/cash-on-delivery
// ==========================================
router.post('/cash-on-delivery', protect, createCashOnDeliveryPayment);

// ==========================================
// ✅ POST /api/payment/webhook
// ==========================================
router.post('/webhook', express.raw({ type: 'application/json' }), handleWebhook);

// ==========================================
// ✅ POST /api/payment/create-checkout-session
// ==========================================
router.post('/create-checkout-session', protect, async (req, res) => {
  try {
    // Vérifier si Stripe est configuré
    if (!stripe) {
      return res.status(500).json({ 
        success: false,
        message: 'Stripe non configuré. Veuillez définir STRIPE_SECRET_KEY dans .env' 
      });
    }

    const { items, shippingAddress, subtotal, shippingCost, total, currency } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ 
        success: false,
        message: 'Panier vide' 
      });
    }

    // Créer les line items pour Stripe
    const lineItems = items.map(item => ({
      price_data: {
        currency: currency?.toLowerCase() || 'cad',
        product_data: {
          name: item.name,
          images: item.image ? [item.image] : undefined,
        },
        unit_amount: Math.round(item.price * 100), // Stripe utilise les centimes
      },
      quantity: item.quantity,
    }));

    // Ajouter les frais de livraison comme line item
    if (shippingCost > 0) {
      lineItems.push({
        price_data: {
          currency: currency?.toLowerCase() || 'cad',
          product_data: {
            name: 'Frais de livraison',
          },
          unit_amount: Math.round(shippingCost * 100),
        },
        quantity: 1,
      });
    }

    // Créer la session Stripe Checkout
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL || 'http://localhost:5176'}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:5176'}/payment/cancel`,
      customer_email: req.user.email,
      metadata: {
        userId: req.user._id.toString(),
        shippingAddress: JSON.stringify(shippingAddress),
        subtotal: subtotal.toString(),
        shippingCost: shippingCost.toString(),
        total: total.toString(),
        currency: currency || 'CAD',
      },
    });

    res.json({ 
      success: true, 
      sessionId: session.id,
      url: session.url 
    });
  } catch (error) {
    console.error('❌ Erreur création session Stripe:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erreur lors de la création de la session de paiement',
      error: error.message 
    });
  }
});

// ==========================================
// ✅ POST /api/payment/webhook
// ==========================================
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  // Vérifier si Stripe est configuré
  if (!stripe) {
    console.error('Stripe non configuré - webhook non traité');
    return res.status(500).json({ error: 'Stripe not configured' });
  }

  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error('❌ Erreur webhook signature:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Gérer les événements Stripe
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;
      await handleCheckoutSessionCompleted(session);
      break;

    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      await handlePaymentSucceeded(paymentIntent);
      break;

    case 'payment_intent.payment_failed':
      const failedPayment = event.data.object;
      await handlePaymentFailed(failedPayment);
      break;

    default:
      console.log(`Événement non géré: ${event.type}`);
  }

  res.json({ received: true });
});

// ==========================================
// ✅ Handler: Checkout session completed
// ==========================================
async function handleCheckoutSessionCompleted(session) {
  try {
    const metadata = session.metadata;
    const shippingAddress = JSON.parse(metadata.shippingAddress);

    // Créer la commande
    const order = await Order.create({
      userId: metadata.userId,
      user: session.customer_details?.name || '',
      email: session.customer_details?.email || '',
      shippingAddress: {
        fullName: shippingAddress.fullName,
        phone: shippingAddress.phone,
        address: shippingAddress.address,
        city: shippingAddress.city,
        country: shippingAddress.country,
        postalCode: shippingAddress.postalCode || ''
      },
      items: [], // Sera rempli par les line items si nécessaire
      subtotal: parseFloat(metadata.subtotal),
      shippingCost: parseFloat(metadata.shippingCost),
      total: parseFloat(metadata.total),
      orderStatus: 'confirmed',
      paymentMethod: 'card',
      paymentStatus: 'paid',
      paymentProvider: 'stripe',
      stripePaymentId: session.payment_intent,
      transactionId: session.payment_intent,
      currency: metadata.currency,
      exchangeRate: 1
    });

    console.log('✅ Commande créée via webhook:', order._id);
  } catch (error) {
    console.error('❌ Erreur création commande webhook:', error);
  }
}

// ==========================================
// ✅ Handler: Payment succeeded
// ==========================================
async function handlePaymentSucceeded(paymentIntent) {
  try {
    // Mettre à jour la commande si elle existe
    await Order.findOneAndUpdate(
      { stripePaymentId: paymentIntent.id },
      {
        paymentStatus: 'paid',
        orderStatus: 'confirmed'
      }
    );
    console.log('✅ Paiement réussi:', paymentIntent.id);
  } catch (error) {
    console.error('❌ Erreur mise à jour paiement:', error);
  }
}

// ==========================================
// ✅ Handler: Payment failed
// ==========================================
async function handlePaymentFailed(paymentIntent) {
  try {
    // Mettre à jour la commande si elle existe
    await Order.findOneAndUpdate(
      { stripePaymentId: paymentIntent.id },
      {
        paymentStatus: 'failed',
        orderStatus: 'cancelled'
      }
    );
    console.log('❌ Paiement échoué:', paymentIntent.id);
  } catch (error) {
    console.error('❌ Erreur mise à jour paiement échoué:', error);
  }
}

module.exports = router;
