// src/components/Navbar.jsx
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ShoppingBag, User, MessageCircle } from 'lucide-react';
import logo from '../assets/logo.png'; // ✅ Import du logo officiel

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  // Fonction utilitaire pour vérifier si un lien est actif
  const isActive = (path) => location.pathname === path;

  const navLinks = [
    { name: 'Accueil', path: '/' },
    { name: 'Catégories', path: '/categories' },
    { name: 'Contact', path: '/contact' },
  ];

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          
          {/* LOGO OFFICIEL SORACOMMERCE */}
          <Link to="/" className="flex items-center group">
            <img 
              src={logo} 
              alt="SoraCommerce Global" 
              className="h-12 w-auto object-contain group-hover:scale-105 transition-transform duration-300"
            />
          </Link>

          {/* NAVIGATION BUREAU */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className={`font-medium transition-colors ${
                  isActive(link.path) 
                    ? 'text-accent border-b-2 border-accent pb-1' 
                    : 'text-gray-600 hover:text-primary'
                }`}
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* ACTIONS UTILISATEUR */}
          <div className="hidden md:flex items-center space-x-4">
            <a 
              href="https://wa.me/221773521208" 
              target="_blank" 
              rel="noreferrer"
              className="p-2 text-green-600 hover:bg-green-50 rounded-full transition"
              title="WhatsApp"
            >
              <MessageCircle size={22} />
            </a>
            <Link to="/profile" className="p-2 text-gray-600 hover:text-primary hover:bg-gray-50 rounded-full transition">
              <User size={22} />
            </Link>
            <Link to="/cart" className="relative p-2 text-primary hover:text-accent transition">
              <ShoppingBag size={22} />
              {/* Badge panier dynamique (à connecter avec le contexte plus tard) */}
              <span className="absolute -top-1 -right-1 bg-accent text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full font-bold">0</span>
            </Link>
          </div>

          {/* BOUTON MENU MOBILE */}
          <button 
            className="md:hidden p-2 text-gray-600"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* MENU MOBILE DÉROULANT */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 py-4 px-4 space-y-4 shadow-lg">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.path}
              className={`block font-medium ${isActive(link.path) ? 'text-accent' : 'text-gray-600'}`}
              onClick={() => setIsMenuOpen(false)}
            >
              {link.name}
            </Link>
          ))}
          <div className="pt-4 border-t border-gray-100 flex space-x-6">
             <Link to="/profile" className="text-gray-600"><User size={20} /></Link>
             <Link to="/cart" className="text-primary"><ShoppingBag size={20} /></Link>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;