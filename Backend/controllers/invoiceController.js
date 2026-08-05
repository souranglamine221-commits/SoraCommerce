const PDFDocument = require('pdfkit');
const Order = require('../models/Order');
const Payment = require('../models/Payment');

// Generate PDF Invoice
const generateInvoice = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user?.id;

    // Get order with payment details
    const order = await Order.findById(orderId)
      .populate('payment')
      .populate('userId', 'firstName lastName email');

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Check if user owns this order
    if (order.userId._id.toString() !== userId && !req.user?.isAdmin) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Create PDF document
    const doc = new PDFDocument({ margin: 50 });
    
    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${order._id}.pdf`);
    
    // Pipe PDF to response
    doc.pipe(res);

    // Add company header
    doc.fontSize(24).fillColor('#D4AF37').text('SoraCommerce', 50, 50);
    doc.fontSize(10).fillColor('#666666').text('Plateforme e-commerce premium', 50, 80);
    doc.text('https://soracommerce.com', 50, 95);
    
    // Add invoice details
    doc.fontSize(16).fillColor('#333333').text('FACTURE', 400, 50);
    doc.fontSize(10).fillColor('#666666').text(`N°: ${order._id}`, 400, 80);
    doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString('fr-FR')}`, 400, 95);

    // Add customer details
    doc.moveDown();
    doc.fontSize(12).fillColor('#333333').text('Facturé à:', 50, 130);
    doc.fontSize(10).fillColor('#666666').text(`${order.userId.firstName} ${order.userId.lastName}`, 50, 150);
    doc.text(order.userId.email, 50, 165);
    if (order.shippingAddress) {
      doc.text(order.shippingAddress.fullName, 50, 180);
      doc.text(order.shippingAddress.address, 50, 195);
      doc.text(`${order.shippingAddress.city}, ${order.shippingAddress.country}`, 50, 210);
      doc.text(order.shippingAddress.phone, 50, 225);
    }

    // Add order details
    doc.moveDown();
    doc.fontSize(12).fillColor('#333333').text('Détails de la commande:', 50, 260);

    // Table header
    doc.fontSize(10).fillColor('#D4AF37').text('Produit', 50, 290);
    doc.text('Quantité', 250, 290);
    doc.text('Prix unitaire', 350, 290);
    doc.text('Total', 450, 290);

    // Table line
    doc.moveTo(50, 300).lineTo(550, 300).strokeColor('#e5e7eb').stroke();

    // Order items
    let y = 320;
    order.items.forEach((item) => {
      doc.fillColor('#333333').text(item.name, 50, y);
      doc.fillColor('#666666').text(item.quantity.toString(), 250, y);
      doc.text(`${item.price.toFixed(2)} ${order.currency}`, 350, y);
      doc.fillColor('#333333').text(`${(item.price * item.quantity).toFixed(2)} ${order.currency}`, 450, y);
      y += 25;
    });

    // Totals
    doc.moveTo(50, y + 10).lineTo(550, y + 10).strokeColor('#e5e7eb').stroke();
    y += 30;

    doc.fillColor('#666666').text('Sous-total:', 350, y);
    doc.fillColor('#333333').text(`${order.subtotal.toFixed(2)} ${order.currency}`, 450, y);
    y += 20;

    doc.fillColor('#666666').text('Livraison:', 350, y);
    doc.fillColor('#333333').text(`${order.shippingCost.toFixed(2)} ${order.currency}`, 450, y);
    y += 20;

    doc.fillColor('#D4AF37').fontSize(12).text('TOTAL:', 350, y);
    doc.fillColor('#333333').text(`${order.total.toFixed(2)} ${order.currency}`, 450, y);

    // Payment details
    if (order.payment) {
      y += 40;
      doc.fontSize(12).fillColor('#333333').text('Informations de paiement:', 50, y);
      y += 20;
      doc.fontSize(10).fillColor('#666666').text(`Méthode: ${order.payment.paymentMethod}`, 50, y);
      y += 15;
      doc.text(`Statut: ${order.payment.status}`, 50, y);
      y += 15;
      if (order.payment.transactionId) {
        doc.text(`Transaction ID: ${order.payment.transactionId}`, 50, y);
      }
    }

    // Footer
    doc.fontSize(8).fillColor('#999999').text(
      `Merci de votre confiance ! Pour toute question, contactez-nous à support@soracommerce.com`,
      50,
      doc.page.height - 50,
      { align: 'center' }
    );

    // Finalize PDF
    doc.end();

  } catch (error) {
    console.error('Invoice generation error:', error);
    res.status(500).json({ 
      error: 'Failed to generate invoice',
      details: error.message 
    });
  }
};

module.exports = {
  generateInvoice
};
