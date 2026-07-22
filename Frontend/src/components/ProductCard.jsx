// src/components/ProductCard.jsx
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { formatPrice } from '../utils/formatPrice';
import { useState } from 'react';

// ✅ Composant déclaré EN DEHORS de ProductCard (règle ESLint respectée)
const FallbackImage = ({ name }) => (
  <svg 
    viewBox="0 0 300 200" 
    className="w-full h-full bg-[#0F172A] flex items-center justify-center"
    xmlns="http://www.w3.org/2000/svg"
    preserveAspectRatio="xMidYMid meet"
  >
    <path 
      d="M100 60 V40 A50 50 0 0 1 200 40 V60 H240 V180 H60 V60 H100 Z M120 40 A30 30 0 0 1 180 40 V60 H120 V40 Z" 
      fill="none" 
      stroke="#D4AF37" 
      strokeWidth="4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <text 
      x="150" 
      y="150" 
      textAnchor="middle" 
      fill="#D4AF37" 
      fontSize="14" 
      fontWeight="bold"
      fontFamily="system-ui, sans-serif"
    >
      {name.length > 18 ? `${name.substring(0, 18)}...` : name}
    </text>
  </svg>
);

const ProductCard = ({ product }) => {
  const { addToCart } = useCart();
  const [imgError, setImgError] = useState(false);

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product);
  };

  return (
    <Link to={`/product/${product._id}`} className="block group">
      <div className="border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition bg-white h-full flex flex-col overflow-hidden">
        
        {/* ✅ Conteneur d'image sécurisé */}
        <div className="relative w-full h-48 mb-3 rounded-lg overflow-hidden bg-[#0F172A]">
          {!product.image || imgError ? (
            // ✅ Passage du nom via prop au lieu de créer le composant ici
            <FallbackImage name={product.name} />
          ) : (
            <img
              src={product.image}
              alt={product.name}
              onError={() => setImgError(true)}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          )}
          
          {/* Badge Nouveau */}
          {product.is_new && (
            <span className="absolute top-2 left-2 bg-[#D4AF37] text-[#0F172A] text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider shadow-sm">
              Nouveau
            </span>
          )}
        </div>

        <h3 className="font-bold text-[#0F172A] text-lg leading-tight mb-1 line-clamp-2 min-h-[3rem]">
          {product.name}
        </h3>
        
        <p className="text-sm text-gray-500 mb-2">{product.category}</p>
        
        <p className="text-[#D4AF37] font-extrabold text-xl mt-auto">
          {formatPrice(product.price)}
        </p>

        <button
          onClick={handleAddToCart}
          className="w-full mt-4 bg-[#0F172A] text-white py-2.5 rounded-lg hover:bg-[#020617] transition font-semibold text-xs uppercase tracking-wide"
        >
          Ajouter au panier
        </button>
      </div>
    </Link>
  );
};

export default ProductCard;