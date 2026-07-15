// Frontend/src/pages/AdminDashboard.jsx
import React, { useState, useCallback } from 'react';
import axios from 'axios';
import { Trash2, Plus, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true); // État pour suivre le chargement
  
  const [newProduct, setNewProduct] = useState({
    name: '', price: '', category: '', image: '', description: '', stock: ''
  });

  const { logout } = useAuth();
  const navigate = useNavigate();

  // Fonction de chargement stable
  const fetchProducts = useCallback(async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/products');
      setProducts(res.data);
    } catch (error) {
      console.error("Erreur de chargement:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Appel direct au premier rendu (remplace useEffect)
  if (isLoading && products.length === 0) {
    fetchProducts();
  }

  const handleAddProduct = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/products', newProduct);
      alert('Produit ajouté avec succès !');
      setNewProduct({ name: '', price: '', category: '', image: '', description: '', stock: '' });
      fetchProducts(); // Recharge la liste après ajout
    } catch (error) {
      console.error("Erreur détaillée:", error);
      alert('Erreur lors de l\'ajout');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr ?')) {
      try {
        await axios.delete(`http://localhost:5000/api/products/${id}`);
        fetchProducts(); // Recharge la liste après suppression
      } catch (error) {
        console.error("Erreur de suppression:", error);
      }
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Tableau de Bord Administrateur</h1>
        <button onClick={handleLogout} className="flex items-center text-red-600 hover:text-red-800 font-medium">
          <LogOut className="h-5 w-5 mr-2" /> Déconnexion
        </button>
      </div>

      {/* Formulaire d'ajout */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8">
        <h2 className="text-xl font-bold mb-4 flex items-center"><Plus className="mr-2 h-5 w-5" /> Ajouter un produit</h2>
        <form onSubmit={handleAddProduct} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input required type="text" placeholder="Nom" className="p-3 border rounded-lg" 
            value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} />
          <input required type="number" placeholder="Prix" className="p-3 border rounded-lg" 
            value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value})} />
          <input required type="text" placeholder="Catégorie" className="p-3 border rounded-lg" 
            value={newProduct.category} onChange={e => setNewProduct({...newProduct, category: e.target.value})} />
          <input required type="text" placeholder="URL Image" className="p-3 border rounded-lg" 
            value={newProduct.image} onChange={e => setNewProduct({...newProduct, image: e.target.value})} />
          <textarea required placeholder="Description" className="p-3 border rounded-lg md:col-span-2" 
            value={newProduct.description} onChange={e => setNewProduct({...newProduct, description: e.target.value})} />
          <input required type="number" placeholder="Stock" className="p-3 border rounded-lg" 
            value={newProduct.stock} onChange={e => setNewProduct({...newProduct, stock: e.target.value})} />
          <button type="submit" className="md:col-span-2 bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700">
            Ajouter le produit
          </button>
        </form>
      </div>

      {/* Liste des produits */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-4">Nom</th>
              <th className="p-4">Prix</th>
              <th className="p-4">Stock</th>
              <th className="p-4">Action</th>
            </tr>
          </thead>
          <tbody>
            {products.map(product => (
              <tr key={product._id} className="border-t">
                <td className="p-4">{product.name}</td>
                <td className="p-4">{product.price} FCFA</td>
                <td className="p-4">{product.stock}</td>
                <td className="p-4">
                  <button onClick={() => handleDelete(product._id)} className="text-red-500 hover:text-red-700">
                    <Trash2 className="h-5 w-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminDashboard;