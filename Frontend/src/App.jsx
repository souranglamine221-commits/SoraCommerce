// src/App.jsx
import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProductCard from './components/ProductCard';
import ProductDetails from './pages/ProductDetails';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Confirmation from './pages/Confirmation';
import AdminDashboard from './pages/AdminDashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import AdminRoute from './components/AdminRoute';
import Contact from './pages/Contact';
import Categories from './pages/Categories';
import API_URL from './utils/api';

function App() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;

    const fetchProducts = async () => {
      try {
        const response = await fetch(`${API_URL}/products`);
        if (!response.ok) throw new Error(`Erreur serveur: ${response.status}`);
        const data = await response.json();
        if (!ignore) setProducts(data);
      } catch (error) {
        if (!ignore) console.error('❌ Erreur chargement produits:', error);
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    fetchProducts();
    return () => { ignore = true; };
  }, []);

  return (
    <Router>
      <AuthProvider>
        <CartProvider>
          {/* ✅ Fond Blanc Cassé Premium */}
          <div className="min-h-screen bg-gray-50 flex flex-col">
            <Navbar />

            <main className="flex-grow">
              <Routes>
                <Route
                  path="/"
                  element={
                    <div className="max-w-7xl mx-auto px-4 py-16">
                      <div className="mb-16 text-center space-y-4">
                        {/* ✅ Titre en Bleu Nuit Profond */}
                        <h1 className="text-4xl md:text-5xl font-extrabold text-primary tracking-tight">
                          SoraCommerce <span className="text-accent">Global</span>
                        </h1>
                        
                        {/* ✅ Sous-titre lisible et élégant */}
                        <p className="text-lg text-gray-800 max-w-2xl mx-auto leading-relaxed font-medium">
                          Découvrez notre sélection premium livrée partout dans le monde. 
                          Qualité, fiabilité et service client exceptionnel.
                        </p>
                      </div>

                      {loading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 animate-pulse">
                          {[1, 2, 3].map((i) => (
                            <div key={i} className="bg-white h-[420px] rounded-xl shadow-sm"></div>
                          ))}
                        </div>
                      ) : products.length === 0 ? (
                        /* ✅ Message vide parfaitement lisible */
                        <p className="text-center text-gray-600 py-10 font-medium">
                          Aucun produit disponible pour le moment.
                        </p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                          {products.map((product) => (
                            <ProductCard key={product._id} product={{ ...product, isNew: product.is_new }} />
                          ))}
                        </div>
                      )}
                    </div>
                  }
                />

                <Route path="/product/:id" element={<ProductDetails />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/confirmation" element={<Confirmation />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/categories" element={<Categories />} />
                <Route path="/profile" element={<Profile />} />

                <Route
                  path="/admin"
                  element={
                    <AdminRoute>
                      <AdminDashboard />
                    </AdminRoute>
                  }
                />
              </Routes>
            </main>

            <Footer />
          </div>
        </CartProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;