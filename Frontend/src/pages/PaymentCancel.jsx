// Frontend/src/pages/PaymentCancel.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { XCircle, ArrowLeft, RefreshCw } from 'lucide-react';

const PaymentCancel = () => {
  const navigate = useNavigate();

  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <div className="bg-white rounded-xl shadow-lg border border-red-200 p-8 text-center">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <XCircle className="h-12 w-12 text-red-600" />
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Paiement annulé
        </h1>

        <p className="text-gray-600 mb-8">
          Votre paiement a été annulé. Aucune commande n'a été créée. 
          Vous pouvez réessayer ou modifier votre panier.
        </p>

        <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8 text-left">
          <h3 className="font-semibold text-red-900 mb-2">Pourquoi le paiement a-t-il été annulé ?</h3>
          <ul className="text-sm text-red-800 space-y-1">
            <li>• Vous avez annulé le processus de paiement</li>
            <li>• Une erreur est survenue lors du paiement</li>
            <li>• Le délai de paiement a expiré</li>
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => navigate('/checkout')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition flex items-center justify-center gap-2"
          >
            <RefreshCw className="h-5 w-5" />
            Réessayer le paiement
          </button>
          
          <button
            onClick={() => navigate('/cart')}
            className="px-6 py-3 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition flex items-center justify-center gap-2"
          >
            <ArrowLeft className="h-5 w-5" />
            Retour au panier
          </button>
        </div>
      </div>

      <div className="mt-8 bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h3 className="font-semibold text-gray-900 mb-2">Besoin d'aide ?</h3>
        <p className="text-sm text-gray-600 mb-4">
          Si vous rencontrez des problèmes lors du paiement, n'hésitez pas à nous contacter.
        </p>
        <button
          onClick={() => navigate('/contact')}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          Contacter le support →
        </button>
      </div>
    </div>
  );
};

export default PaymentCancel;
