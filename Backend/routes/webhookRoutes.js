const express = require('express');
const router = express.Router();
const stripe = require('../config/stripe');
const Payment = require('../models/Payment');
const Order = require('../models/Order');

// Stripe Webhook Handler
router.post('/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  // Vérifier si Stripe est configuré
  if (!stripe) {
    console.error('Stripe non configuré - webhook non traité');
    return res.status(500).json({ error: 'Stripe not configured' });
  }

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
    // Log the event for debugging
    console.log(`Webhook received: ${event.type}`);

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
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object);
        break;
      case 'charge.refunded':
        await handleChargeRefunded(event.data.object);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });

  } catch (error) {
    console.error('Webhook handling error:', error);
    res.status(500).json({ error: 'Webhook handling failed' });
  }
});

// Handle payment succeeded
async function handlePaymentSucceeded(paymentIntent) {
  try {
    const payment = await Payment.findOne({ 
      stripePaymentIntentId: paymentIntent.id 
    });

    if (payment) {
      await payment.markAsCompleted(paymentIntent.id, {
        stripeStatus: 'succeeded',
        receiptUrl: paymentIntent.charges?.data[0]?.receipt_url
      });

      // Update order status
      if (payment.order) {
        const order = await Order.findById(payment.order);
        if (order) {
          await order.setPayment(payment._id);
          await order.updateStatus('processing');
          
          // Send confirmation email (to be implemented)
          // await sendOrderConfirmationEmail(order, payment);
        }
      }

      console.log(`✅ Payment succeeded: ${paymentIntent.id}`);
    }
  } catch (error) {
    console.error('Error handling payment succeeded:', error);
  }
}

// Handle payment failed
async function handlePaymentFailed(paymentIntent) {
  try {
    const payment = await Payment.findOne({ 
      stripePaymentIntentId: paymentIntent.id 
    });

    if (payment) {
      await payment.markAsFailed(
        paymentIntent.last_payment_error?.message || 'Payment failed'
      );

      // Update order status
      if (payment.order) {
        const order = await Order.findById(payment.order);
        if (order) {
          await order.updateStatus('cancelled');
        }
      }

      console.log(`❌ Payment failed: ${paymentIntent.id}`);
    }
  } catch (error) {
    console.error('Error handling payment failed:', error);
  }
}

// Handle payment canceled
async function handlePaymentCanceled(paymentIntent) {
  try {
    const payment = await Payment.findOne({ 
      stripePaymentIntentId: paymentIntent.id 
    });

    if (payment) {
      payment.status = 'cancelled';
      await payment.save();

      // Update order status
      if (payment.order) {
        const order = await Order.findById(payment.order);
        if (order) {
          await order.updateStatus('cancelled');
        }
      }

      console.log(`⚠️ Payment canceled: ${paymentIntent.id}`);
    }
  } catch (error) {
    console.error('Error handling payment canceled:', error);
  }
}

// Handle checkout session completed
async function handleCheckoutSessionCompleted(session) {
  try {
    const metadata = session.metadata;
    
    // Create or update order based on session metadata
    if (metadata.orderId) {
      const order = await Order.findById(metadata.orderId);
      if (order) {
        order.paymentStatus = 'paid';
        order.orderStatus = 'processing';
        order.transactionId = session.payment_intent;
        order.stripePaymentId = session.payment_intent;
        order.paymentDate = new Date();
        await order.save();
        console.log(`✅ Order updated from checkout session: ${order._id}`);
      }
    }
  } catch (error) {
    console.error('Error handling checkout session completed:', error);
  }
}

// Handle charge refunded
async function handleChargeRefunded(charge) {
  try {
    const payment = await Payment.findOne({ 
      stripePaymentIntentId: charge.payment_intent 
    });

    if (payment) {
      await payment.refund(charge.amount_refunded / 100);
      console.log(`💰 Payment refunded: ${charge.payment_intent}`);
    }
  } catch (error) {
    console.error('Error handling charge refunded:', error);
  }
}

module.exports = router;
