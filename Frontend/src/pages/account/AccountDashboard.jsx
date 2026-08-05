// Frontend/src/pages/account/AccountDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { useCurrency } from '../../context/CurrencyContext';
import { formatPrice } from '../../utils/formatPrice';
import API_URL from '../../utils/api';
import { 
  User, 
  Package, 
  Heart, 
  MapPin, 
  Settings, 
  LogOut,
  ChevronRight 
} from 'lucide-react';

const AccountDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { setCurrency } = useCurrency();
  const [currentSection, setCurrentSection] = useState('profile');
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem('sora_token');
      const res = await axios.get(`${API_URL}/api/users/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUserData(res.data.user);
      
      // Sync currency with user preference
      if (res.data.user.preferences?.currency) {
        setCurrency(res.data.user.preferences.currency);
      }
    } catch (error) {
      console.error('Erreur récupération données utilisateur:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const sections = [
    { id: 'profile', label: 'Mon profil', icon: User },
    { id: 'orders', label: 'Mes commandes', icon: Package },
    { id: 'addresses', label: 'Mes adresses', icon: MapPin },
    { id: 'favorites', label: 'Mes favoris', icon: Heart },
    { id: 'settings', label: 'Paramètres', icon: Settings },
  ];

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Bonjour, {userData?.name || user?.name} 👋
        </h1>
        <p className="text-gray-600 mt-2">
          Gérez votre compte et vos préférences
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Navigation */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <nav className="space-y-2">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setCurrentSection(section.id)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition ${
                    currentSection === section.id
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <section.icon className="h-5 w-5" />
                    <span className="font-medium">{section.label}</span>
                  </div>
                  <ChevronRight className="h-4 w-4" />
                </button>
              ))}
            </nav>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition"
              >
                <LogOut className="h-5 w-5" />
                <span className="font-medium">Déconnexion</span>
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          {currentSection === 'profile' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-bold mb-6">Mon profil</h2>
              <ProfileSection userData={userData} onUpdate={fetchUserData} />
            </div>
          )}

          {currentSection === 'orders' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-bold mb-6">Mes commandes</h2>
              <OrdersSection userId={user?._id} />
            </div>
          )}

          {currentSection === 'addresses' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-bold mb-6">Mes adresses</h2>
              <AddressesSection userData={userData} onUpdate={fetchUserData} />
            </div>
          )}

          {currentSection === 'favorites' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-bold mb-6">Mes favoris</h2>
              <FavoritesSection />
            </div>
          )}

          {currentSection === 'settings' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-bold mb-6">Paramètres</h2>
              <SettingsSection userData={userData} onUpdate={fetchUserData} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Profile Section Component
const ProfileSection = ({ userData, onUpdate }) => {
  const [formData, setFormData] = useState({
    name: userData?.name || '',
    email: userData?.email || '',
    phone: userData?.phone || '',
    avatar: userData?.avatar || ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('sora_token');
      await axios.put(`${API_URL}/api/users/profile`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Profil mis à jour avec succès !');
      onUpdate();
    } catch (error) {
      console.error('Erreur mise à jour profil:', error);
      alert('Erreur lors de la mise à jour du profil');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center gap-6">
        <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
          {formData.avatar ? (
            <img src={formData.avatar} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <User className="h-12 w-12 text-gray-400" />
          )}
        </div>
        <div>
          <input
            type="text"
            placeholder="URL de l'avatar"
            value={formData.avatar}
            onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg w-64"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Nom complet</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Téléphone</label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:bg-gray-400"
      >
        {loading ? 'Enregistrement...' : 'Enregistrer'}
      </button>
    </form>
  );
};

// Orders Section Component
const OrdersSection = ({ userId }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('sora_token');
      const res = await axios.get(`${API_URL}/api/orders/my-orders`, {
        headers: { Authorization: `Bearer ${token}` }
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
      processing: 'bg-purple-100 text-purple-800',
      shipped: 'bg-indigo-100 text-indigo-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Chargement...</div>;
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-12">
        <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-600">Aucune commande pour le moment</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <div key={order._id} className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="font-semibold">Commande #{order._id.slice(-6)}</p>
              <p className="text-sm text-gray-500">{new Date(order.createdAt).toLocaleDateString('fr-FR')}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
              {order.status}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-gray-600">{order.items?.length || 0} article(s)</p>
            <p className="font-bold">{formatPrice(order.total, order.currency || 'FCFA')}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

// Addresses Section Component
const AddressesSection = ({ userData, onUpdate }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    country: '',
    postalCode: '',
    isDefault: false
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem('sora_token');
      
      if (editingAddress) {
        await axios.put(`${API_URL}/api/users/address/${editingAddress}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post(`${API_URL}/api/users/address`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }

      setShowForm(false);
      setEditingAddress(null);
      setFormData({
        fullName: '',
        phone: '',
        street: '',
        city: '',
        state: '',
        country: '',
        postalCode: '',
        isDefault: false
      });
      onUpdate();
    } catch (error) {
      console.error('Erreur adresse:', error);
      alert('Erreur lors de l\'opération sur l\'adresse');
    }
  };

  const handleDelete = async (addressId) => {
    if (!window.confirm('Supprimer cette adresse ?')) return;

    try {
      const token = localStorage.getItem('sora_token');
      await axios.delete(`${API_URL}/api/users/address/${addressId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      onUpdate();
    } catch (error) {
      console.error('Erreur suppression adresse:', error);
    }
  };

  const handleEdit = (address) => {
    setEditingAddress(address._id);
    setFormData({
      fullName: address.fullName,
      phone: address.phone,
      street: address.street,
      city: address.city,
      state: address.state,
      country: address.country,
      postalCode: address.postalCode,
      isDefault: address.isDefault
    });
    setShowForm(true);
  };

  return (
    <div className="space-y-6">
      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
        >
          + Ajouter une adresse
        </button>
      ) : (
        <div className="border border-gray-200 rounded-lg p-6">
          <h3 className="font-bold mb-4">
            {editingAddress ? 'Modifier l\'adresse' : 'Nouvelle adresse'}
          </h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Nom complet"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg"
              required
            />
            <input
              type="tel"
              placeholder="Téléphone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg"
              required
            />
            <input
              type="text"
              placeholder="Adresse"
              value={formData.street}
              onChange={(e) => setFormData({ ...formData, street: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg md:col-span-2"
              required
            />
            <input
              type="text"
              placeholder="Ville"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg"
              required
            />
            <input
              type="text"
              placeholder="État/Région"
              value={formData.state}
              onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg"
              required
            />
            <input
              type="text"
              placeholder="Pays"
              value={formData.country}
              onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg"
              required
            />
            <input
              type="text"
              placeholder="Code postal"
              value={formData.postalCode}
              onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg"
              required
            />
            <div className="flex items-center gap-2 md:col-span-2">
              <input
                type="checkbox"
                id="isDefault"
                checked={formData.isDefault}
                onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
              />
              <label htmlFor="isDefault">Adresse par défaut</label>
            </div>
            <div className="flex gap-2 md:col-span-2">
              <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
                Enregistrer
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingAddress(null);
                }}
                className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300"
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {userData?.addresses?.map((address) => (
          <div key={address._id} className="border border-gray-200 rounded-lg p-4 relative">
            {address.isDefault && (
              <span className="absolute top-2 right-2 bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                Par défaut
              </span>
            )}
            <p className="font-semibold">{address.fullName}</p>
            <p className="text-sm text-gray-600">{address.phone}</p>
            <p className="text-sm text-gray-600 mt-2">{address.street}</p>
            <p className="text-sm text-gray-600">{address.city}, {address.state}</p>
            <p className="text-sm text-gray-600">{address.country}, {address.postalCode}</p>
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => handleEdit(address)}
                className="text-blue-600 text-sm hover:underline"
              >
                Modifier
              </button>
              <button
                onClick={() => handleDelete(address._id)}
                className="text-red-600 text-sm hover:underline"
              >
                Supprimer
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Favorites Section Component
const FavoritesSection = () => {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = require('../../context/CartContext').useCart();

  useEffect(() => {
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    try {
      const token = localStorage.getItem('sora_token');
      const res = await axios.get(`${API_URL}/api/users/favorites`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFavorites(res.data.favorites || []);
    } catch (error) {
      console.error('Erreur récupération favoris:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFavorite = async (productId) => {
    try {
      const token = localStorage.getItem('sora_token');
      await axios.delete(`${API_URL}/api/users/favorites/${productId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchFavorites();
    } catch (error) {
      console.error('Erreur suppression favori:', error);
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Chargement...</div>;
  }

  if (favorites.length === 0) {
    return (
      <div className="text-center py-12">
        <Heart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-600">Aucun favori pour le moment</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {favorites.map((product) => (
        <div key={product._id} className="border border-gray-200 rounded-lg p-4 relative">
          <button
            onClick={() => handleRemoveFavorite(product._id)}
            className="absolute top-2 right-2 text-red-500 hover:text-red-700"
          >
            <Heart className="h-5 w-5 fill-current" />
          </button>
          <img
            src={product.image || product.images?.[0] || '/placeholder.jpg'}
            alt={product.name}
            className="w-full h-48 object-cover rounded-lg mb-4"
          />
          <h3 className="font-semibold">{product.name}</h3>
          <p className="text-blue-600 font-bold mt-2">{formatPrice(product.price)}</p>
          <button
            onClick={() => addToCart(product)}
            className="mt-4 w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
          >
            Ajouter au panier
          </button>
        </div>
      ))}
    </div>
  );
};

// Settings Section Component
const SettingsSection = ({ userData, onUpdate }) => {
  const [preferences, setPreferences] = useState({
    language: userData?.preferences?.language || 'fr',
    currency: userData?.preferences?.currency || 'CAD'
  });
  const [loading, setLoading] = useState(false);
  const { setCurrency } = useCurrency();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('sora_token');
      await axios.put(`${API_URL}/api/users/preferences`, preferences, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Update local currency context
      setCurrency(preferences.currency);
      
      alert('Préférences mises à jour !');
      onUpdate();
    } catch (error) {
      console.error('Erreur mise à jour préférences:', error);
      alert('Erreur lors de la mise à jour des préférences');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Langue</label>
        <select
          value={preferences.language}
          onChange={(e) => setPreferences({ ...preferences, language: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
        >
          <option value="fr">Français</option>
          <option value="en">English</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Devise</label>
        <select
          value={preferences.currency}
          onChange={(e) => setPreferences({ ...preferences, currency: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
        >
          <option value="CAD">CAD ($)</option>
          <option value="XOF">XOF (FCFA)</option>
          <option value="USD">USD ($)</option>
          <option value="EUR">EUR (€)</option>
        </select>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:bg-gray-400"
      >
        {loading ? 'Enregistrement...' : 'Enregistrer'}
      </button>
    </form>
  );
};

export default AccountDashboard;
