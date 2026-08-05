// Frontend/src/pages/Checkout.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import API_URL from '../utils/api';
import CheckoutSteps from '../components/checkout/CheckoutSteps';
import ShippingForm from '../components/checkout/ShippingForm';
import PaymentMethodSelector from '../components/checkout/PaymentMethodSelector';
import OrderSummary from '../components/checkout/OrderSummary';
import { ArrowRight, CheckCircle } from 'lucide-react';
import { formatPrice } from '../utils/formatPrice';

const Checkout = () => {
  const navigate = useNavigate();
  const { cartItems, clearCart } = useCart();
  const { user } = useAuth();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  
  const [shippingData, setShippingData] = useState({
    fullName: user?.name || '',
    email: user?.email || '',
    phone: '',
    address: '',
    city: '',
    country: '',
    postalCode: ''
  });
  
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [shippingErrors, setShippingErrors] = useState({});

  const steps = ['Livraison', 'Paiement', 'Confirmation'];

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shippingCost = subtotal > 50000 ? 0 : 5000;
  const total = subtotal + shippingCost;
  const currency = 'FCFA';

  const validateShipping = () => {
    const errors = {};
    if (!shippingData.fullName) errors.fullName = 'Nom complet requis';
    if (!shippingData.email) errors.email = 'Email requis';
    if (!shippingData.phone) errors.phone = 'Téléphone requis';
    if (!shippingData.address) errors.address = 'Adresse requise';
    if (!shippingData.city) errors.city = 'Ville requise';
    if (!shippingData.country) errors.country = 'Pays requis';
    
    setShippingErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNextStep = () => {
    if (currentStep === 0 && !validateShipping()) return;
    setCurrentStep(prev => prev + 1);
  };

  const handlePreviousStep = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handlePayment = async () => {
    if (cartItems.length === 0) return;
    
    setIsProcessing(true);
    setError(null);

    try {
      const orderData = {
        shippingAddress: shippingData,
        items: cartItems.map(item => ({
          productId: item._id,
          name: item.name,
          image: item.image || '',
          quantity: item.quantity,
          price: item.price
        })),
        subtotal,
        shippingCost,
        total,
        paymentMethod,
        notes: '',
        currency,
        exchangeRate: 1
      };

      // Utiliser la nouvelle route /api/orders/create si connecté, sinon l'ancienne
      const endpoint = user ? `${API_URL}/orders/create` : `${API_URL}/orders`;
      const headers = user ? { Authorization: `Bearer ${localStorage.getItem('sora_token')}` } : {};
      
      await axios.post(endpoint, orderData, { headers });
      
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
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Finaliser la commande</h1>

      <CheckoutSteps currentStep={currentStep} steps={steps} />

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {currentStep === 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <ShippingForm
                formData={shippingData}
                onChange={setShippingData}
                errors={shippingErrors}
              />
            </div>
          )}

          {currentStep === 1 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <PaymentMethodSelector
                selectedMethod={paymentMethod}
                onChange={setPaymentMethod}
                country={shippingData.country}
              />
            </div>
          )}

          {currentStep === 2 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="text-center py-8">
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Prêt à payer
                </h2>
                <p className="text-gray-600 mb-6">
                  Vérifiez vos informations avant de confirmer le paiement
                </p>
                
                <div className="bg-gray-50 rounded-lg p-4 text-left mb-6">
                  <h3 className="font-semibold text-gray-900 mb-2">Adresse de livraison</h3>
                  <p className="text-gray-600">{shippingData.fullName}</p>
                  <p className="text-gray-600">{shippingData.phone}</p>
                  <p className="text-gray-600">{shippingData.address}</p>
                  <p className="text-gray-600">{shippingData.city}, {shippingData.country}</p>
                </div>

                <div className="bg-blue-50 rounded-lg p-4 text-left mb-6">
                  <h3 className="font-semibold text-gray-900 mb-2">Mode de paiement</h3>
                  <p className="text-gray-600 capitalize">{paymentMethod.replace('_', ' ')}</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between mt-6">
            {currentStep > 0 && (
              <button
                onClick={handlePreviousStep}
                className="px-6 py-3 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition"
              >
                Retour
              </button>
            )}

            {currentStep < 2 ? (
              <button
                onClick={handleNextStep}
                className="ml-auto px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition flex items-center gap-2"
              >
                Continuer
                <ArrowRight className="h-5 w-5" />
              </button>
            ) : (
              <button
                onClick={handlePayment}
                disabled={isProcessing}
                className="ml-auto px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
              >
{isProcessing ? 'Traitement...' : `Payer ${formatPrice(total)}`}
                <CheckCircle className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>

        <div className="lg:col-span-1">
          <OrderSummary
            cartItems={cartItems}
            subtotal={subtotal}
            shippingCost={shippingCost}
            total={total}
            currency={currency}
          />
        </div>
      </div>
    </div>
  );
};

export default Checkout;