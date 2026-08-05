// Frontend/src/pages/OrderHistory.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_URL from '../utils/api';
import { Package, Calendar, DollarSign, Eye } from 'lucide-react';
import { formatPrice } from '../utils/formatPrice';

const OrderHistory = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchOrders();
  }, [user, navigate]);

  const fetchOrders = async () => {
    try {
      const res = await axios.get(`${API_URL}/orders/my-orders`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('sora_token')}` }
      });
      setOrders(res.data.orders || []);
    } catch (error) {
      console.error('Erreur récupération commandes:', error);
    } finally {
      setLoading(false);
    }
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

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center py-12 text-gray-500">Chargement des commandes...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-gray-900">Mes Commandes</h1>

      {orders.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <Package className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Aucune commande</h2>
          <p className="text-gray-500 mb-6">Vous n'avez pas encore passé de commande.</p>
          <button
            onClick={() => navigate('/')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            Découvrir nos produits
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order._id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-semibold text-gray-900">Commande #{order._id.slice(-8)}</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(order.orderStatus || order.status)}`}>
                      {getStatusLabel(order.orderStatus || order.status)}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {new Date(order.createdAt).toLocaleDateString('fr-FR')}
                    </div>
                    <div className="flex items-center gap-1">
                      <Package className="h-4 w-4" />
                      {order.items?.length || 0} article(s)
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-lg font-bold text-gray-900">
                    <DollarSign className="h-5 w-5" />
                    {formatPrice(order.total, order.currency || 'FCFA')}
                  </div>
                  <button
                    onClick={() => navigate(`/orders/${order._id}`)}
                    className="mt-2 text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
                  >
                    <Eye className="h-4 w-4" />
                    Voir détails
                  </button>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-4">
                <div className="flex -space-x-2 overflow-hidden">
                  {order.items?.slice(0, 3).map((item, index) => (
                    <div
                      key={index}
                      className="w-12 h-12 rounded-lg border-2 border-white bg-gray-100 flex items-center justify-center"
                    >
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xs text-gray-500">IMG</span>
                      )}
                    </div>
                  ))}
                  {order.items?.length > 3 && (
                    <div className="w-12 h-12 rounded-lg border-2 border-white bg-gray-100 flex items-center justify-center">
                      <span className="text-xs text-gray-500">+{order.items.length - 3}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrderHistory;
