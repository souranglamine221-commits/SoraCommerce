// Frontend/src/App.jsx
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProductCard from './components/ProductCard';
import ProductDetails from './pages/ProductDetails';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import AdminDashboard from './pages/AdminDashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminRoute from './components/AdminRoute';
import Contact from './pages/Contact'; // <--- 1. AJOUTE CETTE LIGNE ICI

function App() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/products');
        const data = await response.json();
        setProducts(data);
      } catch (error) {
        console.error("Erreur lors de la récupération des produits:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  return (
    <Router>
      <AuthProvider>
        <CartProvider>
          <div className="min-h-screen bg-gray-50 flex flex-col">
            <Navbar />
            
            <main className="flex-grow">
              <Routes>
                {/* Page d'accueil */}
                <Route path="/" element={
                  <div className="max-w-7xl mx-auto px-4 py-8">
                    <div className="mb-8">
                      <h1 className="text-3xl font-bold text-gray-900">Nos Produits Populaires</h1>
                      <p className="mt-2 text-gray-600">Découvrez les meilleures offres du moment.</p>
                    </div>

                    {loading ? (
                      <p className="text-center text-gray-500">Chargement des produits...</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {products.map((product) => (
                          <Link key={product._id} to={`/product/${product._id}`}>
                            <ProductCard 
                              product={{
                                ...product,
                                isNew: product.is_new
                              }} 
                            />
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                } />
                
                {/* Pages Publiques */}
                <Route path="/product/:id" element={<ProductDetails />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/contact" element={<Contact />} /> {/* <--- 2. AJOUTE CETTE LIGNE ICI */}

                {/* Page Admin Protégée */}
                <Route path="/admin" element={
                  <AdminRoute>
                    <AdminDashboard />
                  </AdminRoute>
                } />
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