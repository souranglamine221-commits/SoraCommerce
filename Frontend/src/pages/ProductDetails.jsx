import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ShoppingCart, ArrowLeft, Star } from 'lucide-react';
import { useCart } from '../context/CartContext';
import API_URL from '../utils/api';

const ProductDetails = () => {
const { id } = useParams();
const navigate = useNavigate();
const { addToCart } = useCart();

const [product, setProduct] = useState(null);
const [loading, setLoading] = useState(true);
const [similarProducts, setSimilarProducts] = useState([]);

useEffect(() => {
const fetchProduct = async () => {
try {
const productResponse = await axios.get(
`${API_URL}/api/products/${id}`
);

    const currentProduct = productResponse.data;

    setProduct(currentProduct);

    const productsResponse = await axios.get(
      `${API_URL}/api/products`
    );

    const similar = productsResponse.data
      .filter(
        (p) =>
          p.category === currentProduct.category &&
          p._id !== currentProduct._id
      )
      .slice(0, 3);

    setSimilarProducts(similar);
  } catch (error) {
    console.error(
      'Erreur lors du chargement du produit :',
      error
    );
  } finally {
    setLoading(false);
  }
};

fetchProduct();

}, [id]);

const handleAddToCart = () => {
addToCart(product);
alert(`${product.name} a été ajouté au panier !`);
};

if (loading) {
return (
<div className="text-center py-20">
Chargement...
</div>
);
}

if (!product) {
return (
<div className="text-center py-20">
Produit non trouvé.
</div>
);
}

return (
<div className="max-w-7xl mx-auto px-4 py-8">
<button
onClick={() => navigate(-1)}
className="flex items-center text-gray-600 hover:text-blue-600 mb-6"
>
<ArrowLeft className="h-5 w-5 mr-2" />
Retour
</button>

  <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
    <div className="bg-gray-100 rounded-2xl overflow-hidden h-96 md:h-[500px]">
      <img
        src={product.image}
        alt={product.name}
        className="w-full h-full object-cover"
      />
    </div>

    <div className="flex flex-col justify-center">
      <span className="text-blue-600 font-semibold tracking-wide uppercase">
        {product.category}
      </span>

      <h1 className="text-4xl font-bold text-gray-900 mt-2">
        {product.name}
      </h1>

      <div className="flex items-center mt-4 space-x-2">
        <div className="flex text-yellow-400">
          {[...Array(5)].map((_, index) => (
            <Star
              key={index}
              className="h-5 w-5 fill-current"
            />
          ))}
        </div>

        <span className="text-gray-500">
          (24 avis)
        </span>
      </div>

      <p className="text-3xl font-bold text-gray-900 mt-6">
        {Number(product.price).toLocaleString()} FCFA
      </p>

      <p className="text-gray-600 mt-6 leading-relaxed">
        {product.description}
      </p>

      <div className="mt-8 flex items-center space-x-4">
        <div
          className={`px-4 py-2 rounded-lg text-sm font-medium ${
            product.stock > 0
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
          }`}
        >
          {product.stock > 0
            ? `${product.stock} en stock`
            : 'Rupture de stock'}
        </div>
      </div>

      <button
        onClick={handleAddToCart}
        disabled={product.stock === 0}
        className="mt-8 w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 flex justify-center items-center"
      >
        <ShoppingCart className="h-6 w-6 mr-2" />
        Ajouter au panier
      </button>
    </div>
  </div>

  {similarProducts.length > 0 && (
    <div className="mt-20">
      <h2 className="text-2xl font-bold mb-6">
        Produits similaires
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {similarProducts.map((similarProduct) => (
          <Link
            key={similarProduct._id}
            to={`/product/${similarProduct._id}`}
            className="group"
          >
            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
              <img
                src={similarProduct.image}
                alt={similarProduct.name}
                className="w-full h-48 object-cover group-hover:scale-105 transition-transform"
              />

              <div className="p-4">
                <h3 className="font-semibold truncate">
                  {similarProduct.name}
                </h3>

                <p className="text-blue-600 font-bold">
                  {Number(
                    similarProduct.price
                  ).toLocaleString()}{' '}
                  FCFA
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
