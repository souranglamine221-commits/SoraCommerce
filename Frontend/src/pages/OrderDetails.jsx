// Frontend/src/pages/OrderDetails.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_URL from '../utils/api';
import { Package, Calendar, DollarSign, MapPin, Phone, User, ArrowLeft, CheckCircle, Clock, Truck, XCircle } from 'lucide-react';
import { formatPrice } from '../utils/formatPrice';

const OrderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchOrderDetails();
  }, [id]);

  const fetchOrderDetails = async () => {
    try {
      const res = await axios.get(`${API_URL}/orders/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('sora_token')}` }
      });
      setOrder(res.data.order);
    } catch (err) {
      console.error('Erreur récupération commande:', err);
      setError(err.response?.data?.message || 'Impossible de charger les détails de la commande');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    const icons = {
      pending: Clock,
      confirmed: CheckCircle,
      shipped: Truck,
      delivered: CheckCircle,
      cancelled: XCircle,
    };
    const Icon = icons[status] || Package;
    return Icon;
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      shipped: 'bg-purple-100 text-purple-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status) => {
    const labels = {
      pending: 'En attente',
      confirmed: 'Confirmée',
      shipped: 'Expédiée',
      delivered: 'Livrée',
      cancelled: 'Annulée',
    };
    return labels[status] || status;
  };

  const getPaymentStatusColor = (status) => {
    const colors = {
      unpaid: 'bg-red-100 text-red-800',
      paid: 'bg-green-100 text-green-800',
      refunded: 'bg-orange-100 text-orange-800',
      partial: 'bg-yellow-100 text-yellow-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPaymentStatusLabel = (status) => {
    const labels = {
      unpaid: 'Non payé',
      paid: 'Payé',
      refunded: 'Remboursé',
      partial: 'Partiel',
    };
    return labels[status] || status;
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center py-12 text-gray-500">Chargement des détails...</div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error || 'Commande non trouvée'}
        </div>
        <button
          onClick={() => navigate('/orders')}
          className="mt-4 text-blue-600 hover:text-blue-800 font-medium"
        >
          ← Retour aux commandes
        </button>
      </div>
    );
  }

  const StatusIcon = getStatusIcon(order.orderStatus || order.status);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <button
        onClick={() => navigate('/orders')}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="h-5 w-5" />
        Retour aux commandes
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Informations principales */}
        <div className="lg:col-span-2 space-y-6">
          {/* En-tête commande */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  Commande #{order._id.slice(-8)}
                </h1>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Calendar className="h-4 w-4" />
                  {new Date(order.createdAt).toLocaleDateString('fr-FR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>
              <div className="flex gap-2">
                <span className={`flex items-center gap-1 text-sm px-3 py-1 rounded-full ${getStatusColor(order.orderStatus || order.status)}`}>
                  <StatusIcon className="h-4 w-4" />
                  {getStatusLabel(order.orderStatus || order.status)}
                </span>
                <span className={`text-sm px-3 py-1 rounded-full ${getPaymentStatusColor(order.paymentStatus)}`}>
                  {getPaymentStatusLabel(order.paymentStatus)}
                </span>
              </div>
            </div>

            {order.trackingNumber && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
                <div className="flex items-center gap-2 text-blue-800">
                  <Truck className="h-4 w-4" />
                  <span className="font-medium">Numéro de suivi:</span>
                  <span className="font-mono">{order.trackingNumber}</span>
                </div>
              </div>
            )}
          </div>

          {/* Produits */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Produits commandés</h2>
            <div className="space-y-4">
              {order.items?.map((item, index) => (
                <div key={index} className="flex items-start gap-4 pb-4 border-b border-gray-100 last:border-0 last:pb-0">
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
                    <p className="text-sm text-gray-500">Prix unitaire: {formatPrice(item.price, order.currency || 'FCFA')}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      {formatPrice(item.quantity * item.price, order.currency || 'FCFA')}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Récapitulatif prix */}
            <div className="mt-6 pt-4 border-t border-gray-200 space-y-2">
              <div className="flex justify-between text-gray-600">
                <span>Sous-total</span>
                <span>{formatPrice(order.subtotal, order.currency || 'FCFA')}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Frais de livraison</span>
                <span>{formatPrice(order.shippingCost, order.currency || 'FCFA')}</span>
              </div>
              <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t border-gray-200">
                <span>Total</span>
                <span>{formatPrice(order.total, order.currency || 'FCFA')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Informations de livraison */}
        <div className="space-y-6">
          {/* Adresse de livraison */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Adresse de livraison
            </h2>
            {order.shippingAddress ? (
              <div className="space-y-2 text-sm">
                <p className="font-medium text-gray-900">{order.shippingAddress.fullName}</p>
                <div className="flex items-center gap-2 text-gray-600">
                  <Phone className="h-4 w-4" />
                  {order.shippingAddress.phone}
                </div>
                <p className="text-gray-600">{order.shippingAddress.address}</p>
                <p className="text-gray-600">{order.shippingAddress.city}, {order.shippingAddress.country}</p>
                {order.shippingAddress.postalCode && (
                  <p className="text-gray-600">{order.shippingAddress.postalCode}</p>
                )}
              </div>
            ) : (
              <p className="text-gray-500">{order.address || 'Adresse non spécifiée'}</p>
            )}
          </div>

          {/* Informations client */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <User className="h-5 w-5" />
              Client
            </h2>
            <div className="space-y-2 text-sm">
              <p className="font-medium text-gray-900">{order.user || order.userId?.name || 'Client'}</p>
              <p className="text-gray-600">{order.email || order.userId?.email || ''}</p>
            </div>
          </div>

          {/* Méthode de paiement */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Paiement
            </h2>
            <div className="space-y-2 text-sm">
              <p className="text-gray-600">
                <span className="font-medium text-gray-900">Méthode:</span>{' '}
                {order.paymentMethod?.replace('_', ' ') || 'Non spécifié'}
              </p>
              <p className="text-gray-600">
                <span className="font-medium text-gray-900">Devise:</span>{' '}
                {order.currency || 'CAD'}
              </p>
              {order.exchangeRate && order.exchangeRate !== 1 && (
                <p className="text-gray-600">
                  <span className="font-medium text-gray-900">Taux:</span>{' '}
                  {order.exchangeRate}
                </p>
              )}
            </div>
          </div>

          {/* Notes */}
          {order.notes && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Notes</h2>
              <p className="text-sm text-gray-600">{order.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;
