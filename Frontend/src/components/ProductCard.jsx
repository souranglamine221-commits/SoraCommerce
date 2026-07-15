// Frontend/src/components/ProductCard.jsx
import React from 'react';
import { ShoppingCart } from 'lucide-react';

const ProductCard = ({ product }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-shadow duration-300 overflow-hidden border border-gray-100">
      {/* Image du produit */}
      <div className="relative h-64 w-full bg-gray-200">
        <img 
          src={product.image} 
          alt={product.name} 
          className="w-full h-full object-cover"
        />
        {product.isNew && (
          <span className="absolute top-2 left-2 bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded">
            NOUVEAU
          </span>
        )}
      </div>

      {/* Détails du produit */}
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 truncate">{product.name}</h3>
        <p className="text-sm text-gray-500 mt-1">{product.category}</p>
        
        <div className="flex items-center justify-between mt-4">
          <span className="text-xl font-bold text-blue-600">{product.price} FCFA</span>
          <button className="bg-gray-900 text-white p-2 rounded-full hover:bg-blue-600 transition-colors">
            <ShoppingCart className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;