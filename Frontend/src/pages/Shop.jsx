// src/pages/Shop.jsx — PHASE 13.10 Seller Shop Public
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Star, Package, Store } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import API_URL from '../utils/api';

const Shop = () => {
  const { id } = useParams();

  const [seller, setSeller] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let ignore = false;

    const fetchShop = async () => {
      try {
        // 1. Récupérer les infos publiques du vendeur
        const sellerResponse = await fetch(`${API_URL}/sellers/${id}`);
        if (!sellerResponse.ok) {
          throw new Error('Boutique introuvable.');
        }
        const sellerData = await sellerResponse.json();
        const sellerInfo = sellerData.seller;

        // 2. Récupérer les produits publiés du vendeur
        const productsResponse = await fetch(`${API_URL}/sellers/${id}/products`);
        if (!productsResponse.ok) {
          throw new Error('Impossible de charger les produits de cette boutique.');
        }
        const productsData = await productsResponse.json();

        if (!ignore) {
          setSeller(sellerInfo);
          setProducts(productsData.products || []);
        }
      } catch (err) {
        if (!ignore) setError(err.message);
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    fetchShop();
    return () => { ignore = true; };
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Chargement de la boutique...</p>
      </div>
    );
  }

  if (error || !seller) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold text-gray-700 mb-4">Boutique non trouvée</h2>
        <p className="text-gray-500 mb-6">{error}</p>
        <Link to="/" className="inline-flex items-center text-blue-600 hover:underline">
          <ArrowLeft className="h-5 w-5 mr-2" />
          Retour à l'accueil
        </Link>
      </div>
    );
  }

  const renderStars = (rating) => {
    return [...Array(5)].map((_, index) => (
      <Star
        key={index}
        className={`h-4 w-4 ${index < Math.round(rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
      />
    ));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Bouton retour */}
      <Link
        to="/"
        className="inline-flex items-center text-gray-600 hover:text-blue-600 mb-6 transition"
      >
        <ArrowLeft className="h-5 w-5 mr-2" />
        Retour à l'accueil
      </Link>

      {/* Bannière de la boutique */}
      <div className="relative w-full h-48 md:h-64 rounded-xl overflow-hidden bg-gradient-to-r from-[#0F172A] to-blue-900 mb-8">
        {seller.banner ? (
          <img
            src={seller.banner}
            alt={`Bannière ${seller.storeName}`}
            className="w-full h-full object-cover"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Store className="h-16 w-16 text-white/30" />
          </div>
        )}
      </div>

      {/* En-tête de la boutique */}
      <div className="flex flex-col md:flex-row gap-6 items-start md:items-center mb-10">
        {/* Logo */}
        <div className="w-24 h-24 rounded-full overflow-hidden bg-white border-2 border-gray-200 shadow-md flex-shrink-0">
          {seller.logo ? (
            <img
              src={seller.logo}
              alt={`Logo ${seller.storeName}`}
              className="w-full h-full object-cover"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-[#0F172A]">
              <Store className="h-10 w-10 text-white" />
            </div>
          )}
        </div>

        {/* Infos */}
        <div className="flex-1">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
            {seller.storeName}
          </h1>

          <div className="flex items-center gap-2 mt-2">
            <div className="flex">{renderStars(seller.rating || 0)}</div>
            <span className="text-sm text-gray-600">
              {seller.totalReviews || 0} avis
            </span>
          </div>

          {seller.description && (
            <p className="text-gray-600 mt-3 leading-relaxed max-w-2xl">
              {seller.description}
            </p>
          )}
        </div>
      </div>

      {/* Liste des produits */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Package className="h-6 w-6 text-blue-600" />
          Produits de la boutique
          <span className="text-sm font-normal text-gray-500">({products.length})</span>
        </h2>
      </div>

      {products.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-10 text-center">
          <p className="text-gray-600">
            Aucun produit disponible pour le moment dans cette boutique.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      )}

      {/* Note devise par défaut */}
      <p className="text-xs text-gray-400 mt-8">
        Prix affichés en FCFA par défaut.
      </p>
    </div>
  );
};

export default Shop;
