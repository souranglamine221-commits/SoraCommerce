import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { ShoppingCart, ArrowLeft, Star, ShieldCheck, Truck } from 'lucide-react';
import { useCart } from '../context/CartContext';
import API_URL from '../utils/api';

const ProductDetails = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { addToCart } = useCart();

  // ✅ useEffect JUSTIFIÉ : Synchronisation avec un système externe (API)
  // ✅ Cleanup incluse pour éviter les race conditions
  useEffect(() => {
    let ignore = false;

    const fetchProduct = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get(`${API_URL}/products/${id}`);
        if (!ignore) {
          setProduct(response.data);
        }
      } catch (err) {
        if (!ignore) {
          console.error('Erreur lors du chargement du produit :', err);
          setError('Produit introuvable');
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    fetchProduct();

    return () => {
      ignore = true; // ✅ Ignore les réponses obsolètes si l'id change vite
    };
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto mt-20 text-center">
        <p className="text-gray-500 text-lg">Chargement du produit...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-4xl mx-auto mt-20 text-center p-8">
        <h2 className="text-2xl font-bold text-red-600 mb-4">
          {error || 'Produit non trouvé'}
        </h2>
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-blue-600 hover:underline"
        >
          <ArrowLeft className="h-5 w-5" /> Retour à l'accueil
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-blue-600 mb-6 transition"
      >
        <ArrowLeft className="h-5 w-5" /> Retour aux produits
      </Link>

      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
          {/* Image */}
          <div className="relative h-96 md:h-auto bg-gray-100">
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover"
            />
            {product.is_new && (
              <span className="absolute top-4 left-4 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                NOUVEAU
              </span>
            )}
          </div>

          {/* Détails */}
          <div className="p-8 flex flex-col justify-center">
            <p className="text-sm text-blue-600 font-semibold uppercase tracking-wide mb-2">
              {product.category}
            </p>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {product.name}
            </h1>

            <div className="flex items-center gap-2 mb-4">
              <div className="flex text-yellow-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-current" />
                ))}
              </div>
              <span className="text-sm text-gray-500">(4.8)</span>
            </div>

            <p className="text-gray-600 leading-relaxed mb-6">
              {product.description}
            </p>

            {/* ✅ PRIX INTERNATIONAL (USD) */}
            <div className="flex items-center gap-4 mb-8">
              <span className="text-4xl font-bold text-blue-600">
                ${product.price.toLocaleString()} USD
              </span>
              <span
                className={`text-sm font-medium px-3 py-1 rounded-full ${
                  product.stock > 0
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                }`}
              >
                {product.stock > 0
                  ? `En stock (${product.stock})`
                  : 'Rupture de stock'}
              </span>
            </div>

            {/* Avantages */}
            <div className="grid grid-cols-2 gap-3 mb-8">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Truck className="h-5 w-5 text-blue-500" />
                Livraison internationale
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <ShieldCheck className="h-5 w-5 text-blue-500" />
                Garantie incluse
              </div>
            </div>

            {/* Bouton d'action */}
            <div className="flex gap-3">
              <button
                onClick={() => addToCart(product)}
                disabled={product.stock === 0}
                className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                <ShoppingCart className="h-6 w-6" />
                Ajouter au panier
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;