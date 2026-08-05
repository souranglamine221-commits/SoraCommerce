// Frontend/src/pages/PaymentSuccess.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, Package, ArrowRight } from 'lucide-react';
import axios from 'axios';
import API_URL from '../utils/api';
import { formatPrice } from '../utils/formatPrice';

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [loading, setLoading] = useState(true);
  const [orderData, setOrderData] = useState(null);

  useEffect(() => {
    if (!sessionId) {
      navigate('/checkout');
      return;
    }

    // Récupérer les détails de la commande via le session ID
    fetchOrderDetails();
  }, [sessionId, navigate]);

  const fetchOrderDetails = async () => {
    try {
      const res = await axios.get(`${API_URL}/orders/my-orders`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('sora_token')}` }
      });
      
      // Récupérer la commande la plus récente (celle qui vient d'être créée)
      const orders = res.data.orders || [];
      if (orders.length > 0) {
        setOrderData(orders[0]);
      }
    } catch (error) {
      console.error('Erreur récupération commande:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <div className="bg-white rounded-xl shadow-lg border border-green-200 p-8 text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="h-12 w-12 text-green-600" />
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Paiement réussi !
        </h1>

        <p className="text-gray-600 mb-8">
          Votre commande a été confirmée avec succès. Vous recevrez un email de confirmation sous peu.
        </p>

        {orderData && (
          <div className="bg-gray-50 rounded-lg p-6 mb-8 text-left">
            <div className="flex items-center gap-2 mb-4">
              <Package className="h-5 w-5 text-blue-600" />
              <h2 className="font-semibold text-gray-900">Détails de la commande</h2>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Numéro de commande:</span>
                <span className="font-medium">#{orderData._id.slice(-8)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Date:</span>
                <span className="font-medium">
                  {new Date(orderData.createdAt).toLocaleDateString('fr-FR')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total:</span>
                <span className="font-bold text-blue-600">
                  {formatPrice(orderData.total, orderData.currency || 'FCFA')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Statut:</span>
                <span className="font-medium text-green-600">Confirmée</span>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => navigate('/orders')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition flex items-center justify-center gap-2"
          >
            <Package className="h-5 w-5" />
            Voir mes commandes
          </button>
          
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition flex items-center justify-center gap-2"
          >
            Continuer mes achats
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-semibold text-blue-900 mb-2">Prochaines étapes</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Vous recevrez un email de confirmation avec les détails de votre commande</li>
          <li>• Nous vous informerons dès que votre commande sera expédiée</li>
          <li>• Vous pouvez suivre l'état de votre commande dans votre espace client</li>
        </ul>
      </div>
    </div>
  );
};

export default PaymentSuccess;
