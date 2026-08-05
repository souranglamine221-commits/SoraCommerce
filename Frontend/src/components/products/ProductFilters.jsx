// Frontend/src/components/products/ProductFilters.jsx
import React, { useState } from 'react';
import { Filter, X, ChevronDown } from 'lucide-react';

const ProductFilters = ({ onFilterChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState({
    minPrice: '',
    maxPrice: '',
    category: '',
    brand: '',
    inStock: false,
    minRating: ''
  });

  const categories = ['Accessoires', 'Bagages', 'Électronique', 'Vêtements', 'Maison', 'Autre'];
  const brands = ['Nike', 'Adidas', 'Apple', 'Samsung', 'Sony', 'LG', 'Dell', 'HP'];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    
    setFilters(prev => ({
      ...prev,
      [name]: newValue
    }));

    if (onFilterChange) {
      onFilterChange({ ...filters, [name]: newValue });
    }
  };

  const handleClear = () => {
    setFilters({
      minPrice: '',
      maxPrice: '',
      category: '',
      brand: '',
      inStock: false,
      minRating: ''
    });

    if (onFilterChange) {
      onFilterChange({});
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Filtres
        </h3>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="lg:hidden text-gray-500 hover:text-gray-700"
        >
          <ChevronDown className={`h-5 w-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      <div className={`${isOpen ? 'block' : 'hidden'} lg:block space-y-6`}>
        {/* Prix */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Prix</label>
          <div className="flex gap-2">
            <input
              type="number"
              name="minPrice"
              value={filters.minPrice}
              onChange={handleChange}
              placeholder="Min"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
            />
            <input
              type="number"
              name="maxPrice"
              value={filters.maxPrice}
              onChange={handleChange}
              placeholder="Max"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
            />
          </div>
        </div>

        {/* Catégorie */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Catégorie</label>
          <select
            name="category"
            value={filters.category}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm bg-white"
          >
            <option value="">Toutes les catégories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Marque */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Marque</label>
          <select
            name="brand"
            value={filters.brand}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm bg-white"
          >
            <option value="">Toutes les marques</option>
            {brands.map(brand => (
              <option key={brand} value={brand}>{brand}</option>
            ))}
          </select>
        </div>

        {/* Note minimale */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Note minimale</label>
          <select
            name="minRating"
            value={filters.minRating}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm bg-white"
          >
            <option value="">Toutes les notes</option>
            <option value="4">4 étoiles et plus</option>
            <option value="3">3 étoiles et plus</option>
            <option value="2">2 étoiles et plus</option>
            <option value="1">1 étoile et plus</option>
          </select>
        </div>

        {/* En stock */}
        <div className="flex items-center">
          <input
            type="checkbox"
            name="inStock"
            id="inStock"
            checked={filters.inStock}
            onChange={handleChange}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label htmlFor="inStock" className="ml-2 text-sm text-gray-700">
            En stock uniquement
          </label>
        </div>

        {/* Bouton réinitialiser */}
        <button
          onClick={handleClear}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
        >
          <X className="h-4 w-4" />
          Réinitialiser
        </button>
      </div>
    </div>
  );
};

export default ProductFilters;
