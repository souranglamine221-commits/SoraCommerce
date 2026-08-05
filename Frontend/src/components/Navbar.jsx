// src/components/Navbar.jsx
import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, ShoppingBag, User, MessageCircle, ChevronDown, LogIn, UserPlus, Heart, Package, Search } from 'lucide-react';
import logo from '../assets/logo.png';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useCurrency } from '../context/CurrencyContext';
import { useLanguage } from '../context/LanguageContext';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCurrencyOpen, setIsCurrencyOpen] = useState(false);
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { cartItems } = useCart();
  const { currency, setCurrency, FLAGS } = useCurrency();
  const { language, setLanguage, t, FLAGS: LANG_FLAGS } = useLanguage();

  // Fonction utilitaire pour vérifier si un lien est actif
  const isActive = (path) => location.pathname === path;

  // Effet blur au scroll
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: t('nav.home'), path: '/' },
    { name: t('nav.shop'), path: '/shop' },
    { name: t('nav.categories'), path: '/categories' },
    { name: t('nav.promotions'), path: '/promotions' },
    { name: t('nav.contact'), path: '/contact' },
  ];

  const currencies = ['CAD', 'USD', 'EUR', 'XOF'];
  const languages = ['fr', 'en'];

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsUserMenuOpen(false);
  };

  return (
    <nav className={`sticky top-0 z-50 transition-all duration-300 ${
      isScrolled 
        ? 'bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-100' 
        : 'bg-white shadow-sm border-b border-gray-100'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          
          {/* LOGO OFFICIEL SORACOMMERCE */}
          <Link to="/" className="flex items-center group">
            <img 
              src={logo} 
              alt="SoraCommerce Global" 
              className="h-[50px] w-auto object-contain group-hover:scale-105 transition-transform duration-300"
            />
            <span className="ml-3 text-xl font-bold text-primary group-hover:text-accent transition-colors duration-300 hidden sm:block">
              SoraCommerce
            </span>
          </Link>

          {/* NAVIGATION BUREAU */}
          <div className="hidden lg:flex items-center space-x-1">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  isActive(link.path) 
                    ? 'text-accent bg-accent/10' 
                    : 'text-gray-600 hover:text-primary hover:bg-gray-50'
                }`}
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* ACTIONS UTILISATEUR */}
          <div className="hidden md:flex items-center space-x-2">
            {/* Search Bar */}
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                placeholder={t('nav.search')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-48 lg:w-64 pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all duration-200"
              />
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            </form>

            {/* Currency Selector */}
            <div className="relative">
              <button
                onClick={() => {setIsCurrencyOpen(!isCurrencyOpen); setIsLanguageOpen(false);}}
                className="flex items-center gap-1 px-3 py-2 hover:bg-gray-50 rounded-lg transition"
              >
                <span className="text-lg">{FLAGS[currency]}</span>
                <span className="text-sm font-medium text-gray-700">{currency}</span>
                <ChevronDown size={14} className={`transition-transform ${isCurrencyOpen ? 'rotate-180' : ''}`} />
              </button>
              {isCurrencyOpen && (
                <div className="absolute right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-50 min-w-[120px]">
                  {currencies.map((curr) => (
                    <button
                      key={curr}
                      onClick={() => {
                        setCurrency(curr);
                        setIsCurrencyOpen(false);
                      }}
                      className={`w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50 transition ${
                        currency === curr ? 'bg-accent/10 text-accent' : 'text-gray-700'
                      }`}
                    >
                      <span className="text-lg">{FLAGS[curr]}</span>
                      <span>{curr}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Language Selector */}
            <div className="relative">
              <button
                onClick={() => {setIsLanguageOpen(!isLanguageOpen); setIsCurrencyOpen(false);}}
                className="flex items-center gap-1 px-3 py-2 hover:bg-gray-50 rounded-lg transition"
              >
                <span className="text-lg">{LANG_FLAGS[language]}</span>
                <span className="text-sm font-medium text-gray-700 uppercase">{language}</span>
                <ChevronDown size={14} className={`transition-transform ${isLanguageOpen ? 'rotate-180' : ''}`} />
              </button>
              {isLanguageOpen && (
                <div className="absolute right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-50 min-w-[100px]">
                  {languages.map((lang) => (
                    <button
                      key={lang}
                      onClick={() => {
                        setLanguage(lang);
                        setIsLanguageOpen(false);
                      }}
                      className={`w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50 transition ${
                        language === lang ? 'bg-accent/10 text-accent' : 'text-gray-700'
                      }`}
                    >
                      <span className="text-lg">{LANG_FLAGS[lang]}</span>
                      <span className="uppercase">{lang}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* WhatsApp */}
            <a 
              href="https://wa.me/221773521208" 
              target="_blank" 
              rel="noreferrer"
              className="p-2 text-green-600 hover:bg-green-50 rounded-full transition"
              title="WhatsApp"
            >
              <MessageCircle size={22} />
            </a>

            {/* User Menu */}
            <div className="relative">
              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center gap-2 p-2 text-gray-600 hover:text-primary hover:bg-gray-50 rounded-full transition"
                  >
                    <User size={22} />
                    <span className="text-sm font-medium hidden lg:block">Bonjour, {user.name?.split(' ')[0]}</span>
                    <ChevronDown size={16} className={`transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-100 py-2 z-50">
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="font-semibold text-gray-900">{user.name}</p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                      <Link
                        to="/account"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-50 transition"
                      >
                        <User size={18} />
                        <span>Mon compte</span>
                      </Link>
                      <Link
                        to="/account"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-50 transition"
                      >
                        <Package size={18} />
                        <span>Mes commandes</span>
                      </Link>
                      <Link
                        to="/account"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-50 transition"
                      >
                        <Heart size={18} />
                        <span>Mes favoris</span>
                      </Link>
                      <div className="border-t border-gray-100 mt-2 pt-2">
                        <button
                          onClick={handleLogout}
                          className="flex items-center gap-3 w-full px-4 py-2 text-red-600 hover:bg-red-50 transition"
                        >
                          <LogIn size={18} />
                          <span>Déconnexion</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    to="/login"
                    className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-primary hover:bg-gray-50 rounded-lg transition"
                  >
                    <LogIn size={18} />
                    <span className="text-sm font-medium">Connexion</span>
                  </Link>
                  <Link
                    to="/register"
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  >
                    <UserPlus size={18} />
                    <span className="text-sm font-medium">Créer un compte</span>
                  </Link>
                </div>
              )}
            </div>

            {/* Favorites */}
            <Link to="/favorites" className="relative p-2 text-gray-600 hover:text-accent hover:bg-gray-50 rounded-full transition">
              <Heart size={22} />
            </Link>

            {/* Cart */}
            <Link to="/cart" className="relative p-2 text-primary hover:text-accent hover:bg-gray-50 rounded-full transition">
              <ShoppingBag size={22} />
              {cartItems.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-accent text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full font-bold">
                  {cartItems.length}
                </span>
              )}
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
        <div className="md:hidden bg-white border-t border-gray-100 py-4 px-4 space-y-4 shadow-lg animate-in slide-in-from-top duration-300">
          {/* Search Bar Mobile */}
          <form onSubmit={handleSearch} className="relative">
            <input
              type="text"
              placeholder={t('nav.search')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all duration-200"
            />
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          </form>

          {/* Currency & Language Selectors Mobile */}
          <div className="flex gap-2">
            <div className="flex-1">
              <button
                onClick={() => setIsCurrencyOpen(!isCurrencyOpen)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
              >
                <span className="text-lg">{FLAGS[currency]}</span>
                <span className="text-sm font-medium text-gray-700">{currency}</span>
              </button>
            </div>
            <div className="flex-1">
              <button
                onClick={() => setIsLanguageOpen(!isLanguageOpen)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
              >
                <span className="text-lg">{LANG_FLAGS[language]}</span>
                <span className="text-sm font-medium text-gray-700 uppercase">{language}</span>
              </button>
            </div>
          </div>

          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.path}
              className={`block font-medium py-2 ${isActive(link.path) ? 'text-accent' : 'text-gray-600'}`}
              onClick={() => setIsMenuOpen(false)}
            >
              {link.name}
            </Link>
          ))}
          
          {/* User Section Mobile */}
          <div className="pt-4 border-t border-gray-100">
            {user ? (
              <div className="space-y-3">
                <div className="px-4 py-2 bg-gray-50 rounded-lg">
                  <p className="font-semibold text-gray-900">{user.name}</p>
                  <p className="text-sm text-gray-500">{user.email}</p>
                </div>
                <Link
                  to="/account"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition"
                >
                  <User size={20} />
                  <span>Mon compte</span>
                </Link>
                <Link
                  to="/account"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition"
                >
                  <Package size={20} />
                  <span>Mes commandes</span>
                </Link>
                <Link
                  to="/account"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition"
                >
                  <Heart size={20} />
                  <span>Mes favoris</span>
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                    setIsMenuOpen(false);
                  }}
                  className="flex items-center gap-3 w-full px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                >
                  <LogIn size={20} />
                  <span>Déconnexion</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <Link
                  to="/login"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition"
                >
                  <LogIn size={20} />
                  <span>Connexion</span>
                </Link>
                <Link
                  to="/register"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  <UserPlus size={20} />
                  <span>Créer un compte</span>
                </Link>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-gray-100 flex space-x-6">
            <Link to="/favorites" className="text-gray-600 flex items-center gap-2">
              <Heart size={20} />
            </Link>
            <Link to="/cart" className="text-primary flex items-center gap-2">
              <ShoppingBag size={20} />
              {cartItems.length > 0 && (
                <span className="bg-accent text-white text-[10px] px-2 py-0.5 rounded-full">
                  {cartItems.length}
                </span>
              )}
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;