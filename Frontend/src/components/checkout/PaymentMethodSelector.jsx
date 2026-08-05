// Frontend/src/components/checkout/PaymentMethodSelector.jsx
import React from 'react';
import { CreditCard, Globe, Smartphone, Wallet, DollarSign } from 'lucide-react';

const PaymentMethodSelector = ({ selectedMethod, onChange, country }) => {
  const paymentMethods = [
    {
      id: 'card',
      name: 'Carte bancaire',
      icon: CreditCard,
      description: 'Visa, Mastercard, American Express',
      available: true,
      recommended: true
    },
    {
      id: 'paypal',
      name: 'PayPal',
      icon: Globe,
      description: 'Paiement sécurisé PayPal',
      available: true,
      recommended: false
    },
    {
      id: 'wave',
      name: 'Wave',
      icon: Smartphone,
      description: 'Paiement mobile Sénégal',
      available: country === 'Sénégal',
      recommended: country === 'Sénégal'
    },
    {
      id: 'orange_money',
      name: 'Orange Money',
      icon: Wallet,
      description: 'Paiement mobile Sénégal',
      available: country === 'Sénégal',
      recommended: false
    },
    {
      id: 'cash_on_delivery',
      name: 'Paiement à la livraison',
      icon: DollarSign,
      description: 'Payer à la réception',
      available: true,
      recommended: false
    }
  ];

  const availableMethods = paymentMethods.filter(method => method.available);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
        <CreditCard className="h-6 w-6" />
        Mode de paiement
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {availableMethods.map((method) => {
          const Icon = method.icon;
          const isSelected = selectedMethod === method.id;

          return (
            <div
              key={method.id}
              onClick={() => onChange(method.id)}
              className={`relative p-4 border-2 rounded-xl cursor-pointer transition-all ${
                isSelected
                  ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-600 ring-offset-2'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              {method.recommended && (
                <span className="absolute top-2 right-2 bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                  Recommandé
                </span>
              )}
              <div className="flex items-center gap-3">
                <div
                  className={`p-3 rounded-lg ${
                    isSelected ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  <Icon className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{method.name}</h3>
                  <p className="text-sm text-gray-500">{method.description}</p>
                </div>
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    isSelected ? 'border-blue-600 bg-blue-600' : 'border-gray-300'
                  }`}
                >
                  {isSelected && (
                    <div className="w-2.5 h-2.5 bg-white rounded-full" />
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
        <CreditCard className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-800">
          <p className="font-semibold mb-1">Paiement sécurisé</p>
          <p>Vos informations de paiement sont cryptées et sécurisées. Nous ne stockons jamais vos données bancaires.</p>
        </div>
      </div>
    </div>
  );
};

export default PaymentMethodSelector;
