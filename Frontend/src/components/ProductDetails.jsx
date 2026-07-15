// Frontend/src/pages/ProductDetails.jsx
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ShoppingCart, ArrowLeft, Star } from 'lucide-react';
// Dans Frontend/src/pages/ProductDetails.jsx
import { useCart } from '../context/CartContext'; // Importe le hook

const ProductDetails = () => {
  const { addToCart } = useCart(); // Récupère la fonction
  // ...

  const handleAddToCart = () => {
    addToCart(product);
    alert(`${product.name} a été ajouté au panier !`);
  };
  
  // ...
}

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [similarProducts, setSimilarProducts] = useState([]);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        // Récupérer le produit actuel
        const res = await axios.get(`http://localhost:5000/api/products/${id}`);
        setProduct(res.data);

        // Récupérer des produits similaires (même catégorie)
        const allRes = await axios.get('http://localhost:5000/api/products');
        const similar = allRes.data.filter(
          p => p.category === res.data.category && p._id !== res.data._id
        ).slice(0, 3);
        setSimilarProducts(similar);
      } catch (error) {
        console.error("Erreur:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  const handleAddToCart = () => {
    // Structure pour le panier (à connecter avec Context API plus tard)
    alert(`${product.name} ajouté au panier !`);
  };

  if (loading) return <div className="text-center py-20">Chargement...</div>;
  if (!product) return <div className="text-center py-20">Produit non trouvé.</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <button onClick={() => navigate(-1)} className="flex items-center text-gray-600 hover:text-blue-600 mb-6">
        <ArrowLeft className="h-5 w-5 mr-2" /> Retour
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Image */}
        <div className="bg-gray-100 rounded-2xl overflow-hidden h-96 md:h-[500px]">
          <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
        </div>

        {/* Infos */}
        <div className="flex flex-col justify-center">
          <span className="text-blue-600 font-semibold tracking-wide uppercase">{product.category}</span>
          <h1 className="text-4xl font-bold text-gray-900 mt-2">{product.name}</h1>
          
          <div className="flex items-center mt-4 space-x-2">
            <div className="flex text-yellow-400">
              {[...Array(5)].map((_, i) => <Star key={i} className="h-5 w-5 fill-current" />)}
            </div>
            <span className="text-gray-500">(24 avis)</span>
          </div>

          <p className="text-3xl font-bold text-gray-900 mt-6">{product.price.toLocaleString()} FCFA</p>
          <p className="text-gray-600 mt-6 leading-relaxed">{product.description}</p>

          <div className="mt-8 flex items-center space-x-4">
            <div className={`px-4 py-2 rounded-lg text-sm font-medium ${product.stock > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {product.stock > 0 ? `${product.stock} en stock` : 'Rupture de stock'}
            </div>
          </div>

          <button 
            onClick={handleAddToCart}
            disabled={product.stock === 0}
            className="mt-8 w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 flex justify-center items-center"
          >
            <ShoppingCart className="h-6 w-6 mr-2" /> Ajouter au panier
          </button>
        </div>
      </div>

      {/* Produits Similaires */}
      {similarProducts.length > 0 && (
        <div className="mt-20">
          <h2 className="text-2xl font-bold mb-6">Produits similaires</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {similarProducts.map(p => (
              <Link key={p._id} to={`/product/${p._id}`} className="group">
                <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
                  <img src={p.image} alt={p.name} className="w-full h-48 object-cover group-hover:scale-105 transition-transform" />
                  <div className="p-4">
                    <h3 className="font-semibold truncate">{p.name}</h3>
                    <p className="text-blue-600 font-bold">{p.price} FCFA</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetails;