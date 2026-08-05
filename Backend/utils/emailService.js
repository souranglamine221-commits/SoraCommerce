const nodemailer = require('nodemailer');

// Create email transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

// Send order confirmation email
const sendOrderConfirmation = async (order, userEmail) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `"SoraCommerce" <${process.env.EMAIL_USER}>`,
      to: userEmail,
      subject: `Confirmation de commande #${order._id}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: 'Inter', Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #D4AF37 0%, #c9a227 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .header h1 { color: white; margin: 0; font-size: 24px; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .order-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .total { font-size: 18px; font-weight: bold; color: #D4AF37; text-align: right; margin-top: 20px; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
            .btn { display: inline-block; padding: 12px 30px; background: #D4AF37; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🛍️ SoraCommerce</h1>
            </div>
            <div class="content">
              <h2>Confirmation de commande</h2>
              <p>Bonjour ${order.userId?.firstName || 'Client'},</p>
              <p>Merci pour votre commande ! Nous avons bien reçu votre commande #${order._id}.</p>
              
              <div class="order-details">
                <h3>Détails de la commande</h3>
                <p><strong>Date:</strong> ${new Date(order.createdAt).toLocaleDateString('fr-FR')}</p>
                <p><strong>Statut:</strong> ${order.orderStatus}</p>
                <p><strong>Méthode de paiement:</strong> ${order.paymentMethod}</p>
                <hr>
                ${order.items.map(item => `
                  <p>${item.name} x${item.quantity} - ${(item.price * item.quantity).toFixed(2)} ${order.currency}</p>
                `).join('')}
                <hr>
                <p>Sous-total: ${order.subtotal.toFixed(2)} ${order.currency}</p>
                <p>Livraison: ${order.shippingCost.toFixed(2)} ${order.currency}</p>
                <div class="total">Total: ${order.total.toFixed(2)} ${order.currency}</div>
              </div>
              
              <p>Vous pouvez suivre l'état de votre commande dans votre espace client.</p>
              <a href="${process.env.FRONTEND_URL}/orders/${order._id}" class="btn">Voir ma commande</a>
              
              <div class="footer">
                <p>© 2024 SoraCommerce. Tous droits réservés.</p>
                <p>Pour toute question, contactez-nous à support@soracommerce.com</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`Order confirmation email sent to ${userEmail}`);
  } catch (error) {
    console.error('Error sending order confirmation email:', error);
  }
};

// Send payment success email
const sendPaymentSuccess = async (payment, userEmail) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `"SoraCommerce" <${process.env.EMAIL_USER}>`,
      to: userEmail,
      subject: 'Paiement réussi',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: 'Inter', Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .header h1 { color: white; margin: 0; font-size: 24px; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .success-box { background: #d1fae5; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
            .success-icon { font-size: 48px; margin-bottom: 10px; }
            .amount { font-size: 24px; font-weight: bold; color: #10b981; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ Paiement réussi</h1>
            </div>
            <div class="content">
              <div class="success-box">
                <div class="success-icon">💳</div>
                <h2>Votre paiement a été traité avec succès</h2>
                <p class="amount">${payment.amount.toFixed(2)} ${payment.currency}</p>
                <p>Transaction ID: ${payment.transactionId}</p>
              </div>
              
              <p>Bonjour,</p>
              <p>Nous confirmons que votre paiement de ${payment.amount.toFixed(2)} ${payment.currency} a été traité avec succès.</p>
              <p>Vous recevrez bientôt un email de confirmation de commande avec les détails de livraison.</p>
              
              <div class="footer">
                <p>© 2024 SoraCommerce. Tous droits réservés.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`Payment success email sent to ${userEmail}`);
  } catch (error) {
    console.error('Error sending payment success email:', error);
  }
};

// Send shipping notification email
const sendShippingNotification = async (order, userEmail, trackingNumber) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `"SoraCommerce" <${process.env.EMAIL_USER}>`,
      to: userEmail,
      subject: `Votre commande #${order._id} a été expédiée`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: 'Inter', Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .header h1 { color: white; margin: 0; font-size: 24px; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .tracking-box { background: #dbeafe; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
            .tracking-number { font-size: 20px; font-weight: bold; color: #3b82f6; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
            .btn { display: inline-block; padding: 12px 30px; background: #3b82f6; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📦 Commande expédiée</h1>
            </div>
            <div class="content">
              <h2>Bonne nouvelle !</h2>
              <p>Votre commande #${order._id} a été expédiée et est en route vers vous.</p>
              
              <div class="tracking-box">
                <p>Numéro de suivi:</p>
                <p class="tracking-number">${trackingNumber}</p>
              </div>
              
              <p>Vous pouvez suivre votre livraison en utilisant le numéro de suivi ci-dessus.</p>
              <a href="${process.env.FRONTEND_URL}/orders/${order._id}" class="btn">Voir ma commande</a>
              
              <div class="footer">
                <p>© 2024 SoraCommerce. Tous droits réservés.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`Shipping notification email sent to ${userEmail}`);
  } catch (error) {
    console.error('Error sending shipping notification email:', error);
  }
};

// Send delivery confirmation email
const sendDeliveryConfirmation = async (order, userEmail) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `"SoraCommerce" <${process.env.EMAIL_USER}>`,
      to: userEmail,
      subject: `Votre commande #${order._id} a été livrée`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: 'Inter', Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .header h1 { color: white; margin: 0; font-size: 24px; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .delivery-box { background: #d1fae5; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
            .delivery-icon { font-size: 48px; margin-bottom: 10px; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
            .btn { display: inline-block; padding: 12px 30px; background: #10b981; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Livré effectuée</h1>
            </div>
            <div class="content">
              <div class="delivery-box">
                <div class="delivery-icon">✅</div>
                <h2>Votre commande a été livrée</h2>
                <p>Commande #${order._id}</p>
              </div>
              
              <p>Bonjour ${order.userId?.firstName || 'Client'},</p>
              <p>Nous sommes heureux de vous informer que votre commande a été livrée avec succès.</p>
              <p>Nous espérons que vous êtes satisfait de vos achats. N'hésitez pas à laisser un avis sur nos produits.</p>
              
              <a href="${process.env.FRONTEND_URL}/orders/${order._id}" class="btn">Voir ma commande</a>
              
              <div class="footer">
                <p>© 2024 SoraCommerce. Tous droits réservés.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`Delivery confirmation email sent to ${userEmail}`);
  } catch (error) {
    console.error('Error sending delivery confirmation email:', error);
  }
};

module.exports = {
  sendOrderConfirmation,
  sendPaymentSuccess,
  sendShippingNotification,
  sendDeliveryConfirmation
};
