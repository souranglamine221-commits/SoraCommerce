// Frontend/src/pages/Checkout.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import API_URL from '../utils/api';

const Checkout = () => {
  const navigate = useNavigate();
  const { cartItems, clearCart } = useCart();
  const { user } = useAuth();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  
  // ✅ Génération d'un ID stable pour les invités sans violer la règle de pureté
  const [guestId] = useState(() => crypto.randomUUID ? crypto.randomUUID().slice(0, 8) : Math.floor(Math.random() * 10000).toString());

  const totalPrice = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const handlePayment = async () => {
    if (cartItems.length === 0) return;
    
    setIsProcessing(true);
    setError(null);

    try {
      const orderData = {
        user: user?.name || 'Client anonyme',
        email: user?.email || `invite-${guestId}@soracommerce.sn`, 
        address: 'Thiès, Sénégal',
        items: cartItems.map(item => ({
          productId: item._id,
          name: item.name,
          quantity: item.quantity,
          price: item.price
        })),
        total: totalPrice,
        status: 'pending',
        paymentStatus: 'paid'
      };

      // 1. Envoi de la commande au backend
      await axios.post(`${API_URL}/orders`, orderData);
      
      // 2. Notification WhatsApp
      const message = `🛍️ Nouvelle commande SoraCommerce !\n👤 Client: ${orderData.user}\n💰 Total: ${orderData.total} FCFA\n📍 Adresse: ${orderData.address}`;
      const whatsappUrl = `https://api.callmebot.com/whatsapp/?phone=221773521208&text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');

      // 3. Nettoyage et redirection
      clearCart();
      navigate('/confirmation');
    } catch (err) {
      console.error('Erreur commande:', err);
      setError(err.response?.data?.message || 'Échec du paiement. Veuillez réessayer.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="max-w-4xl mx-auto mt-20 text-center p-8">
        <h2 className="text-2xl font-bold text-gray-700 mb-4">Votre panier est vide</h2>
        <button 
          onClick={() => navigate('/')}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700 transition"
        >
          Voir les produits
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Finaliser la commande</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      <div className="bg-white p-6 rounded-xl shadow-sm border mb-6">
        <h2 className="text-xl font-bold mb-4">Votre commande</h2>
        {cartItems.map((item) => (
          <div key={item._id} className="flex justify-between items-center py-3 border-b last:border-0">
            <div className="flex items-center gap-4">
              <img src={item.image || '/placeholder.jpg'} alt={item.name} className="w-16 h-16 object-cover rounded" />
              <div>
                <p className="font-medium text-gray-900">{item.name}</p>
                <p className="text-sm text-gray-500">Qté: {item.quantity}</p>
              </div>
            </div>
            <p className="font-bold text-gray-900">{(item.price * item.quantity).toLocaleString()} FCFA</p>
          </div>
        ))}
        <div className="flex justify-between items-center mt-6 pt-4 border-t text-xl font-bold">
          <span>Total à payer</span>
          <span className="text-blue-600">{totalPrice.toLocaleString()} FCFA</span>
        </div>
      </div>

      <button
        onClick={handlePayment}
        disabled={isProcessing}
        className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed shadow-lg"
      >
        {isProcessing ? 'Traitement en cours...' : `Payer ${totalPrice.toLocaleString()} FCFA`}
      </button>
      
      <p className="text-center text-gray-500 text-sm mt-4">
        Paiement sécurisé par SoraCommerce
      </p>
    </div>
  );
};

export default Checkout;