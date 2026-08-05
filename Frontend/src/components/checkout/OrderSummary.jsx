// Frontend/src/components/checkout/OrderSummary.jsx
import React from 'react';
import { Package, Truck, DollarSign } from 'lucide-react';
import { formatPrice } from '../../utils/formatPrice';

const OrderSummary = ({ cartItems, subtotal, shippingCost, total, currency }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
      <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
        <Package className="h-6 w-6" />
        Récapitulatif de commande
      </h2>

      <div className="space-y-4">
        {cartItems.map((item) => (
          <div key={item._id} className="flex items-start gap-4 pb-4 border-b border-gray-100 last:border-0 last:pb-0">
            <div className="w-20 h-20 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden">
              {item.image ? (
                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <Package className="h-8 w-8" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-gray-900">{item.name}</h3>
              <p className="text-sm text-gray-500">Quantité: {item.quantity}</p>
<p className="text-sm text-gray-500">
                Prix unitaire: {formatPrice(item.price, currency || 'FCFA')}
              </p>
            </div>
<div className="text-right">
              <p className="font-semibold text-gray-900">
                {formatPrice(item.quantity * item.price, currency || 'FCFA')}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-3 pt-4 border-t border-gray-200">
        <div className="flex justify-between text-gray-600">
          <span>Sous-total</span>
<span>{formatPrice(subtotal, currency || 'FCFA')}</span>
        </div>
        <div className="flex justify-between text-gray-600">
          <div className="flex items-center gap-2">
            <Truck className="h-4 w-4" />
            <span>Frais de livraison</span>
          </div>
          <span>{formatPrice(shippingCost, currency || 'FCFA')}</span>
        </div>
        <div className="flex justify-between text-lg font-bold text-gray-900 pt-3 border-t border-gray-200">
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            <span>Total</span>
          </div>
<span className="text-blue-600">{formatPrice(total, currency || 'FCFA')}</span>
        </div>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <p className="text-sm text-green-800">
          <span className="font-semibold">Livraison gratuite</span> pour les commandes de plus de 50 000 FCFA
        </p>
      </div>
    </div>
  );
};

export default OrderSummary;
