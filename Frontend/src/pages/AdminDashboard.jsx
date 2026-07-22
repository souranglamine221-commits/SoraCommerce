// Frontend/src/pages/AdminDashboard.jsx
import React, { useState, useCallback, useEffect } from 'react';
import axios from 'axios';
import API_URL from '../utils/api';

const AdminDashboard = () => {
  const [products, setProducts] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    stock: '',
    is_new: false,
    image: '' 
  });
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);

  // ✅ Fonction de chargement stable
  const fetchProducts = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/products`);
      setProducts(res.data);
    } catch (error) {
      console.error('Erreur récupération produits:', error);
    }
  }, []);

  // ✅ Utilisation d'un effet avec une dépendance vide pour le montage initial
  // Note: Si le linter bloque toujours ici, c'est qu'il est configuré de manière extrêmement stricte.
  // Dans ce cas, on peut utiliser un pattern "mount" avec useRef ou simplement ignorer l'avertissement
  // car c'est la méthode standard pour le fetching de données.
  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      const res = await axios.get(`${API_URL}/products`);
      if (isMounted) setProducts(res.data);
    };
    loadData();
    return () => { isMounted = false; };
  }, []);

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleFileChange = (e) => {
    setImageFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = new FormData();
      Object.keys(formData).forEach(key => {
        if (key !== 'image') data.append(key, formData[key]);
      });
      
      if (imageFile) {
        data.append('image', imageFile);
      } else if (formData.image) {
        data.append('image', formData.image);
      }

      await axios.post(`${API_URL}/products`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setFormData({ name: '', description: '', price: '', category: '', stock: '', is_new: false, image: '' });
      setImageFile(null);
      fetchProducts();
      alert('Produit ajouté avec succès !');
    } catch (error) {
      console.error('Erreur ajout produit:', error);
      alert('Erreur lors de l\'ajout du produit');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) {
      try {
        await axios.delete(`${API_URL}/products/${id}`);
        fetchProducts();
      } catch (error) {
        console.error('Erreur suppression:', error);
      }
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Dashboard Administrateur</h1>

      <div className="bg-white p-6 rounded-xl shadow-md mb-10">
        <h2 className="text-xl font-bold mb-4">Ajouter un nouveau produit</h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input name="name" placeholder="Nom du produit" value={formData.name} onChange={handleChange} className="p-2 border rounded" required />
          <input name="price" type="number" placeholder="Prix (FCFA)" value={formData.price} onChange={handleChange} className="p-2 border rounded" required />
          <input name="category" placeholder="Catégorie" value={formData.category} onChange={handleChange} className="p-2 border rounded" />
          <input name="stock" type="number" placeholder="Stock" value={formData.stock} onChange={handleChange} className="p-2 border rounded" />
          
          <div className="md:col-span-2">
            <textarea name="description" placeholder="Description" value={formData.description} onChange={handleChange} className="w-full p-2 border rounded" rows="3" />
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

          <div className="md:col-span-2 flex items-center gap-2">
            <input type="checkbox" name="is_new" checked={formData.is_new} onChange={handleChange} id="is_new" />
            <label htmlFor="is_new">Marquer comme "Nouveau"</label>
          </div>

          <button type="submit" disabled={loading} className="md:col-span-2 bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 transition disabled:bg-gray-400">
            {loading ? 'Ajout en cours...' : 'Ajouter le produit'}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-4">Image</th>
              <th className="p-4">Nom</th>
              <th className="p-4">Prix</th>
              <th className="p-4">Stock</th>
              <th className="p-4">Action</th>
            </tr>
          </thead>
          <tbody>
            {products.map(product => (
              <tr key={product._id} className="border-t">
                <td className="p-4"><img src={product.image} alt={product.name} className="w-12 h-12 object-cover rounded" /></td>
                <td className="p-4 font-medium">{product.name}</td>
                <td className="p-4">{product.price} FCFA</td>
                <td className="p-4">{product.stock}</td>
                <td className="p-4">
                  <button onClick={() => handleDelete(product._id)} className="text-red-600 hover:text-red-800 font-bold">Supprimer</button>
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