import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ShoppingCart, ArrowLeft, Star, Package, Tag, Award, CheckCircle, Store } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useCurrency } from '../context/CurrencyContext';
import ProductGallery from '../components/products/ProductGallery';
import API_URL from '../utils/api';

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { formatPrice } = useCurrency();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [similarProducts, setSimilarProducts] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const productResponse = await axios.get(`${API_URL}/api/products/${id}`);
        const currentProduct = productResponse.data;
        setProduct(currentProduct);

        // Fetch similar products
        const productsResponse = await axios.get(`${API_URL}/api/products`);
        const similar = productsResponse.data.products || productsResponse.data;
        setSimilarProducts(
          similar
            .filter((p) => p.category === currentProduct.category && p._id !== currentProduct._id)
            .slice(0, 4)
        );

        // Fetch reviews
        try {
          const reviewsResponse = await axios.get(`${API_URL}/api/reviews/product/${id}`);
          setReviews(reviewsResponse.data.reviews || []);
        } catch (reviewError) {
          console.error('Erreur chargement avis:', reviewError);
        }
      } catch (error) {
        console.error('Erreur lors du chargement du produit:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      addToCart(product);
    }
    alert(`${quantity}x ${product.name} a été ajouté au panier !`);
  };

  const renderStars = (rating) => {
    return [...Array(5)].map((_, index) => (
      <Star
        key={index}
        className={`h-5 w-5 ${index < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
      />
    ));
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Chargement...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold text-gray-700 mb-4">Produit non trouvé</h2>
        <button onClick={() => navigate('/')} className="text-blue-600 hover:underline">
          Retour à l'accueil
        </button>
      </div>
    );
  }

  const hasDiscount = product.discountPrice && product.discountPrice < product.price;
  const discountPercentage = hasDiscount
    ? Math.round(((product.price - product.discountPrice) / product.price) * 100)
    : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center text-gray-600 hover:text-blue-600 mb-6 transition"
      >
        <ArrowLeft className="h-5 w-5 mr-2" />
        Retour
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Gallery */}
        <div>
          <ProductGallery images={product.images} mainImage={product.image} />
        </div>

        {/* Product Info */}
        <div className="flex flex-col justify-center">
          {/* Badges */}
          <div className="flex gap-2 mb-4">
            {product.is_new && (
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-semibold">
                Nouveau
              </span>
            )}
            {product.isFeatured && (
              <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-xs font-semibold">
                Vedette
              </span>
            )}
            {hasDiscount && (
              <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-xs font-semibold">
                -{discountPercentage}%
              </span>
            )}
          </div>

          <span className="text-blue-600 font-semibold tracking-wide uppercase text-sm">
            {product.category}
            {product.subcategory && ` > ${product.subcategory}`}
          </span>

          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mt-2">
            {product.name}
          </h1>

          {/* Brand */}
          {product.brand && (
            <p className="text-gray-500 mt-2 flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Marque: {product.brand}
            </p>
          )}

          {/* SKU */}
          {product.sku && (
            <p className="text-gray-500 text-sm flex items-center gap-2">
              <Package className="h-4 w-4" />
              SKU: {product.sku}
            </p>
          )}

          {/* Rating */}
          <div className="flex items-center mt-4 space-x-2">
            <div className="flex">{renderStars(Math.round(product.rating))}</div>
            <span className="text-gray-500">
              ({product.numReviews || 0} avis)
            </span>
          </div>

          {/* Price */}
          <div className="mt-6">
            {hasDiscount ? (
              <div className="flex items-center gap-3">
                <p className="text-3xl font-bold text-red-600">
                  {formatPrice(product.discountPrice)}
                </p>
                <p className="text-xl text-gray-400 line-through">
                  {formatPrice(product.price)}
                </p>
              </div>
            ) : (
              <p className="text-3xl font-bold text-gray-900">
                {formatPrice(product.price)}
              </p>
            )}
          </div>

          {/* Description */}
          <p className="text-gray-600 mt-6 leading-relaxed">
            {product.description}
          </p>

          {/* Stock */}
          <div className="mt-6 flex items-center gap-4">
            <div
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${
                product.stock > 10
                  ? 'bg-green-100 text-green-800'
                  : product.stock > 0
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-red-100 text-red-800'
              }`}
            >
              {product.stock > 10 ? (
                <>
                  <CheckCircle className="h-4 w-4" />
                  En stock
                </>
              ) : product.stock > 0 ? (
                <>
                  <Package className="h-4 w-4" />
                  Plus que {product.stock} unités
                </>
              ) : (
                <>
                  <Package className="h-4 w-4" />
                  Rupture de stock
                </>
              )}
            </div>
          </div>

          {/* Quantity */}
          <div className="mt-6 flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700">Quantité:</label>
            <div className="flex items-center border border-gray-300 rounded-lg">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="px-4 py-2 hover:bg-gray-100 transition"
              >
                -
              </button>
              <span className="px-4 py-2 border-x border-gray-300">{quantity}</span>
              <button
                onClick={() => setQuantity(Math.min(product.stock || 10, quantity + 1))}
                disabled={product.stock === 0}
                className="px-4 py-2 hover:bg-gray-100 transition disabled:opacity-50"
              >
                +
              </button>
            </div>
          </div>

          {/* Add to Cart */}
          <button
            onClick={handleAddToCart}
            disabled={product.stock === 0}
            className="mt-8 w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex justify-center items-center"
          >
            <ShoppingCart className="h-6 w-6 mr-2" />
            Ajouter au panier
          </button>

          {/* Additional Info */}
          {product.countryOrigin && (
            <p className="text-sm text-gray-500 mt-4">
              Origine: {product.countryOrigin}
            </p>
          )}

          {/* ✅ PHASE 13.11 — Section Vendeur */}
          {product.sellerId?._id && (
            <div className="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center gap-3">
                {/* Logo */}
                <div className="w-12 h-12 rounded-full overflow-hidden bg-white border border-gray-200 flex-shrink-0">
                  {product.sellerId.logo ? (
                    <img
                      src={product.sellerId.logo}
                      alt={`Logo ${product.sellerId.storeName}`}
                      className="w-full h-full object-cover"
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-[#0F172A]">
                      <Store className="h-6 w-6 text-white" />
                    </div>
                  )}
                </div>

                {/* Infos boutique */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Vendeur</p>
                  <p className="font-semibold text-gray-900 truncate">
                    {product.sellerId.storeName}
                  </p>
                  {product.sellerId.rating > 0 && (
                    <div className="flex items-center gap-1">
                      <div className="flex">{renderStars(Math.round(product.sellerId.rating))}</div>
                      <span className="text-xs text-gray-500">
                        ({product.sellerId.totalReviews || 0} avis)
                      </span>
                    </div>
                  )}
                </div>

                {/* Bouton Voir la boutique */}
                <Link
                  to={`/shop/${product.sellerId._id}`}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#0F172A] text-white text-xs font-semibold rounded-lg hover:bg-[#020617] transition whitespace-nowrap"
                >
                  Voir la boutique
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Reviews Section */}
      <div className="mt-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <Award className="h-6 w-6" />
          Avis clients
        </h2>

        {reviews.length > 0 ? (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review._id} className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{review.userId?.name || 'Client'}</span>
                    <div className="flex">{renderStars(review.rating)}</div>
                  </div>
                  <span className="text-sm text-gray-500">
                    {new Date(review.createdAt).toLocaleDateString('fr-FR')}
                  </span>
                </div>
                {review.title && <h4 className="font-semibold text-gray-900 mb-1">{review.title}</h4>}
                <p className="text-gray-600">{review.comment}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-gray-50 rounded-lg p-8 text-center">
            <p className="text-gray-600">Aucun avis pour le moment. Soyez le premier à donner votre avis !</p>
          </div>
        )}
      </div>

      {/* Similar Products */}
      {similarProducts.length > 0 && (
        <div className="mt-20">
          <h2 className="text-2xl font-bold mb-6">Produits similaires</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {similarProducts.map((similarProduct) => (
              <Link
                key={similarProduct._id}
                to={`/product/${similarProduct._id}`}
                className="group"
              >
                <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 hover:shadow-md transition">
                  <div className="aspect-square bg-gray-100">
                    <img
                      src={similarProduct.image || similarProduct.images?.[0] || '/placeholder.jpg'}
                      alt={similarProduct.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold truncate text-gray-900">{similarProduct.name}</h3>
                    <p className="text-blue-600 font-bold mt-2">
                      {formatPrice(similarProduct.price)}
                    </p>
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
