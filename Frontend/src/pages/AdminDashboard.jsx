// Frontend/src/pages/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Menu } from 'lucide-react';
import API_URL from '../utils/api';
import AdminSidebar from '../components/admin/AdminSidebar';
import StatsCard from '../components/admin/StatsCard';
import OrdersTable from '../components/admin/OrdersTable';
import UsersTable from '../components/admin/UsersTable';
import SalesChart from '../components/admin/SalesChart';
import { Users, Package, ShoppingCart, DollarSign, TrendingUp } from 'lucide-react';

const AdminDashboard = () => {
  const [currentView, setCurrentView] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Stats
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  
  // Orders
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  
  // Users
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  
  // Products (existing functionality)
  const [products, setProducts] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    discountPrice: '',
    category: '',
    subcategory: '',
    brand: '',
    sku: '',
    stock: '',
    is_new: false,
    isFeatured: false,
    weight: '',
    countryOrigin: '',
    image: '',
    images: []
  });
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch stats
  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      const res = await axios.get(`${API_URL}/admin/stats`);
      setStats(res.data.stats);
    } catch (error) {
      console.error('Erreur récupération stats:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  // Fetch orders
  useEffect(() => {
    if (currentView === 'orders') {
      fetchOrders();
    }
  }, [currentView]);

  const fetchOrders = async () => {
    setOrdersLoading(true);
    try {
      const res = await axios.get(`${API_URL}/admin/orders`);
      setOrders(res.data.orders);
    } catch (error) {
      console.error('Erreur récupération commandes:', error);
    } finally {
      setOrdersLoading(false);
    }
  };

  // Fetch users
  useEffect(() => {
    if (currentView === 'users') {
      fetchUsers();
    }
  }, [currentView]);

  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      const res = await axios.get(`${API_URL}/admin/users`);
      setUsers(res.data.users);
    } catch (error) {
      console.error('Erreur récupération utilisateurs:', error);
    } finally {
      setUsersLoading(false);
    }
  };

  // Fetch products (existing)
  useEffect(() => {
    if (currentView === 'products') {
      fetchProducts();
    }
  }, [currentView]);

  const fetchProducts = async () => {
    try {
      const res = await axios.get(`${API_URL}/products`);
      setProducts(res.data.products || res.data);
    } catch (error) {
      console.error('Erreur récupération produits:', error);
    }
  };

  // Update order status
  const handleOrderStatusChange = async (orderId, newStatus) => {
    try {
      await axios.put(`${API_URL}/admin/orders/${orderId}/status`, { status: newStatus });
      fetchOrders();
      fetchStats();
    } catch (error) {
      console.error('Erreur mise à jour statut:', error);
      alert('Erreur lors de la mise à jour du statut');
    }
  };

  // Update user role
  const handleUserRoleChange = async (userId, newRole) => {
    try {
      await axios.put(`${API_URL}/admin/users/${userId}/role`, { role: newRole });
      fetchUsers();
    } catch (error) {
      console.error('Erreur mise à jour rôle:', error);
      alert('Erreur lors de la mise à jour du rôle');
    }
  };

  // Product form handlers (existing)
  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleFileChange = (e) => {
    setImageFile(e.target.files[0]);
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name || '',
      description: product.description || '',
      price: product.price || '',
      discountPrice: product.discountPrice || '',
      category: product.category || '',
      subcategory: product.subcategory || '',
      brand: product.brand || '',
      sku: product.sku || '',
      stock: product.stock || '',
      is_new: product.is_new || false,
      isFeatured: product.isFeatured || false,
      weight: product.weight || '',
      countryOrigin: product.countryOrigin || '',
      image: product.image || '',
      images: product.images || []
    });
  };

  const handleCancelEdit = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      description: '',
      price: '',
      discountPrice: '',
      category: '',
      subcategory: '',
      brand: '',
      sku: '',
      stock: '',
      is_new: false,
      isFeatured: false,
      weight: '',
      countryOrigin: '',
      image: '',
      images: []
    });
    setImageFile(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = new FormData();
      Object.keys(formData).forEach(key => {
        if (key !== 'image' && key !== 'images') {
          data.append(key, formData[key]);
        }
      });
      
      if (imageFile) {
        data.append('image', imageFile);
      } else if (formData.image) {
        data.append('image', formData.image);
      }

      if (editingProduct) {
        await axios.put(`${API_URL}/products/${editingProduct._id}`, data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        alert('Produit modifié avec succès !');
      } else {
        await axios.post(`${API_URL}/products`, data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        alert('Produit ajouté avec succès !');
      }

      handleCancelEdit();
      fetchProducts();
      fetchStats();
    } catch (error) {
      console.error('Erreur produit:', error);
      alert('Erreur lors de l\'opération sur le produit');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) {
      try {
        await axios.delete(`${API_URL}/products/${id}`);
        fetchProducts();
        fetchStats();
      } catch (error) {
        console.error('Erreur suppression:', error);
      }
    }
  };

  const getStockStatus = (stock) => {
    if (stock === 0) return { text: 'Rupture', color: 'bg-red-100 text-red-800' };
    if (stock < 10) return { text: 'Stock faible', color: 'bg-yellow-100 text-yellow-800' };
    return { text: 'En stock', color: 'bg-green-100 text-green-800' };
  };

  // Render dashboard view
  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Utilisateurs"
          value={stats?.totalUsers || 0}
          icon={Users}
          color="blue"
        />
        <StatsCard
          title="Produits"
          value={stats?.totalProducts || 0}
          icon={Package}
          color="green"
        />
        <StatsCard
          title="Commandes"
          value={stats?.totalOrders || 0}
          icon={ShoppingCart}
          color="purple"
        />
        <StatsCard
          title="Chiffre d'affaires"
          value={stats?.totalRevenue || 0}
          icon={DollarSign}
          color="orange"
        />
      </div>

      {/* Sales Chart */}
      <SalesChart data={[]} />

      {/* Recent Orders */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Commandes récentes</h2>
        <OrdersTable 
          orders={stats?.recentOrders || []}
          onStatusChange={handleOrderStatusChange}
          onViewDetails={(order) => console.log('View details:', order)}
        />
      </div>
    </div>
  );

  // Render products view (existing functionality)
  const renderProducts = () => (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">
            {editingProduct ? 'Modifier le produit' : 'Ajouter un nouveau produit'}
          </h2>
          {editingProduct && (
            <button
              onClick={handleCancelEdit}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
            >
              Annuler
            </button>
          )}
        </div>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input name="name" placeholder="Nom du produit" value={formData.name} onChange={handleChange} className="p-2 border rounded" required />
          <input name="sku" placeholder="SKU (optionnel)" value={formData.sku} onChange={handleChange} className="p-2 border rounded" />
          <input name="price" type="number" placeholder="Prix (FCFA)" value={formData.price} onChange={handleChange} className="p-2 border rounded" required />
          <input name="discountPrice" type="number" placeholder="Prix promo (optionnel)" value={formData.discountPrice} onChange={handleChange} className="p-2 border rounded" />
          <select name="category" value={formData.category} onChange={handleChange} className="p-2 border rounded" required>
            <option value="">Sélectionner une catégorie</option>
            <option value="Accessoires">Accessoires</option>
            <option value="Bagages">Bagages</option>
            <option value="Électronique">Électronique</option>
            <option value="Vêtements">Vêtements</option>
            <option value="Maison">Maison</option>
            <option value="Autre">Autre</option>
          </select>
          <input name="subcategory" placeholder="Sous-catégorie (optionnel)" value={formData.subcategory} onChange={handleChange} className="p-2 border rounded" />
          <input name="brand" placeholder="Marque (optionnel)" value={formData.brand} onChange={handleChange} className="p-2 border rounded" />
          <input name="stock" type="number" placeholder="Stock" value={formData.stock} onChange={handleChange} className="p-2 border rounded" required />
          <input name="weight" type="number" placeholder="Poids (kg, optionnel)" value={formData.weight} onChange={handleChange} className="p-2 border rounded" />
          <input name="countryOrigin" placeholder="Pays d'origine (optionnel)" value={formData.countryOrigin} onChange={handleChange} className="p-2 border rounded" />
          
          <div className="md:col-span-2">
            <textarea name="description" placeholder="Description" value={formData.description} onChange={handleChange} className="w-full p-2 border rounded" rows="3" required />
          </div>

          <div className="md:col-span-2 flex gap-4 items-center">
            <label className="flex-1">
              <span className="block text-sm font-medium text-gray-700 mb-1">Image (Fichier)</span>
              <input type="file" onChange={handleFileChange} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"/>
            </label>
            <div className="flex-1">
              <span className="block text-sm font-medium text-gray-700 mb-1">Ou lien URL</span>
              <input name="image" placeholder="https://..." value={formData.image} onChange={handleChange} className="w-full p-2 border rounded" />
            </div>
          </div>

          <div className="md:col-span-2 flex items-center gap-4">
            <div className="flex items-center gap-2">
              <input type="checkbox" name="is_new" checked={formData.is_new} onChange={handleChange} id="is_new" />
              <label htmlFor="is_new">Marquer comme "Nouveau"</label>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" name="isFeatured" checked={formData.isFeatured} onChange={handleChange} id="isFeatured" />
              <label htmlFor="isFeatured">Marquer comme "Vedette"</label>
            </div>
          </div>

          <button type="submit" disabled={loading} className="md:col-span-2 bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 transition disabled:bg-gray-400">
            {loading ? 'Traitement...' : (editingProduct ? 'Modifier le produit' : 'Ajouter le produit')}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-4">Image</th>
              <th className="p-4">Nom</th>
              <th className="p-4">Catégorie</th>
              <th className="p-4">Prix</th>
              <th className="p-4">Stock</th>
              <th className="p-4">Statut</th>
              <th className="p-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map(product => {
              const stockStatus = getStockStatus(product.stock);
              return (
                <tr key={product._id} className="border-t">
                  <td className="p-4">
                    <img 
                      src={product.image || product.images?.[0] || '/placeholder.jpg'} 
                      alt={product.name} 
                      className="w-12 h-12 object-cover rounded" 
                    />
                  </td>
                  <td className="p-4 font-medium">{product.name}</td>
                  <td className="p-4">{product.category}</td>
                  <td className="p-4">
                    {product.discountPrice ? (
                      <div>
                        <span className="text-red-600 font-bold">{product.discountPrice} FCFA</span>
                        <span className="text-gray-400 line-through text-sm ml-2">{product.price} FCFA</span>
                      </div>
                    ) : (
                      <span>{product.price} FCFA</span>
                    )}
                  </td>
                  <td className="p-4">{product.stock}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${stockStatus.color}`}>
                      {stockStatus.text}
                    </span>
                  </td>
                  <td className="p-4 flex gap-2">
                    <button 
                      onClick={() => handleEdit(product)} 
                      className="text-blue-600 hover:text-blue-800 font-bold text-sm"
                    >
                      Modifier
                    </button>
                    <button 
                      onClick={() => handleDelete(product._id)} 
                      className="text-red-600 hover:text-red-800 font-bold text-sm"
                    >
                      Supprimer
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  // Render orders view
  const renderOrders = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Toutes les commandes</h2>
      </div>
      {ordersLoading ? (
        <div className="text-center py-12 text-gray-500">Chargement...</div>
      ) : (
        <OrdersTable 
          orders={orders}
          onStatusChange={handleOrderStatusChange}
          onViewDetails={(order) => console.log('View details:', order)}
        />
      )}
    </div>
  );

  // Render users view
  const renderUsers = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-900">Gestion des utilisateurs</h2>
      {usersLoading ? (
        <div className="text-center py-12 text-gray-500">Chargement...</div>
      ) : (
        <UsersTable 
          users={users}
          onRoleChange={handleUserRoleChange}
        />
      )}
    </div>
  );

  // Render settings view
  const renderSettings = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Paramètres</h2>
      <p className="text-gray-600">Paramètres du dashboard administrateur.</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2 bg-white rounded-lg shadow-md hover:bg-gray-100"
        >
          <Menu className="h-6 w-6" />
        </button>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <AdminSidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          currentView={currentView}
          onViewChange={setCurrentView}
        />

        {/* Main content */}
        <main className="flex-1 lg:ml-64 p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">
              {currentView === 'dashboard' && 'Dashboard'}
              {currentView === 'products' && 'Gestion des produits'}
              {currentView === 'orders' && 'Gestion des commandes'}
              {currentView === 'users' && 'Gestion des utilisateurs'}
              {currentView === 'settings' && 'Paramètres'}
            </h1>

            {statsLoading && currentView === 'dashboard' ? (
              <div className="text-center py-12 text-gray-500">Chargement des statistiques...</div>
            ) : (
              <>
                {currentView === 'dashboard' && renderDashboard()}
                {currentView === 'products' && renderProducts()}
                {currentView === 'orders' && renderOrders()}
                {currentView === 'users' && renderUsers()}
                {currentView === 'settings' && renderSettings()}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;