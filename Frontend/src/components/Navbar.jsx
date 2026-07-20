// Frontend/src/components/Navbar.jsx
import React, { useState } from 'react';
import { ShoppingCart, User, Search, Menu, X, LogOut } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { cartItems } = useCart();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const totalItems = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsMenuOpen(false);
  };

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* Logo */}
          <Link to="/" className="flex-shrink-0 flex items-center cursor-pointer">
            <span className="text-2xl font-bold text-blue-600">SoraCommerce</span>
          </Link>

          {/* Barre de recherche */}
          <div className="hidden md:flex flex-1 mx-8">
            <div className="relative w-full max-w-lg">
              <input
                type="text"
                placeholder="Rechercher un produit..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
          </div>

          {/* Icônes et Menu Desktop */}
          <div className="hidden md:flex items-center space-x-6">
            <Link to="/categories" className="text-gray-700 hover:text-blue-600 font-medium">Catégories</Link>
            <Link to="/contact" className="text-gray-700 hover:text-blue-600 font-medium">Contact</Link>
            
            {/* Panier */}
            <Link to="/cart" className="relative cursor-pointer">
              <ShoppingCart className="h-6 w-6 text-gray-700 hover:text-blue-600" />
              {totalItems > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </Link>

            {/* Section Utilisateur / Déconnexion */}
            {user ? (
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium text-gray-700">Bonjour, {user.name}</span>
                <button onClick={handleLogout} className="text-gray-700 hover:text-red-600 transition-colors" title="Se déconnecter">
                  <LogOut className="h-6 w-6" />
                </button>
              </div>
            ) : (
              <Link to="/login" className="cursor-pointer">
                <User className="h-6 w-6 text-gray-700 hover:text-blue-600" />
              </Link>
            )}
          </div>

          {/* Bouton Menu Mobile */}
          <div className="md:hidden flex items-center">
            <button onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Menu Mobile */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t p-4 space-y-4">
          <input
            type="text"
            placeholder="Rechercher..."
            className="w-full pl-4 pr-4 py-2 border border-gray-300 rounded-lg"
          />
          <Link to="/categories" className="block text-gray-700 font-medium">Catégories</Link>
          <Link to="/contact" className="block text-gray-700 font-medium">Contact</Link>
          <Link to="/cart" className="block text-gray-700 font-medium">Panier ({totalItems})</Link>
          
          {user ? (
            <button onClick={handleLogout} className="block text-left text-red-600 font-medium w-full">
              Se déconnecter ({user.name})
            </button>
          ) : (
            <Link to="/login" className="block text-gray-700 font-medium">Connexion</Link>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
