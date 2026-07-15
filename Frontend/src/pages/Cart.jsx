// Frontend/src/pages/Cart.jsx
import React from 'react';
import { useCart } from '../context/CartContext';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, ArrowRight, ShoppingBag } from 'lucide-react';

const Cart = () => {
  const { cartItems, removeFromCart, clearCart } = useCart();
  const navigate = useNavigate();

  // Calcul du total
  const total = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

  if (cartItems.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <ShoppingBag className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900">Votre panier est vide</h2>
        <p className="mt-2 text-gray-600">Il semble que vous n'ayez rien ajouté pour l'instant.</p>
        <Link to="/" className="mt-6 inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700">
          Retourner à la boutique
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Votre Panier</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Liste des articles */}
        <div className="lg:col-span-2 space-y-4">
          {cartItems.map((item) => (
            <div key={item._id} className="flex items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
              <img src={item.image} alt={item.name} className="w-24 h-24 object-cover rounded-lg" />
              
              <div className="ml-4 flex-1">
                <h3 className="font-semibold text-gray-900">{item.name}</h3>
                <p className="text-gray-500 text-sm">{item.category}</p>
                <p className="text-blue-600 font-bold mt-1">{item.price.toLocaleString()} FCFA</p>
              </div>

              <div className="flex items-center space-x-4">
                <span className="bg-gray-100 px-3 py-1 rounded-md text-sm font-medium">x{item.quantity}</span>
                <button 
                  onClick={() => removeFromCart(item._id)}
                  className="text-red-500 hover:text-red-700 p-2"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            </div>
          ))}
          
          <button 
            onClick={clearCart}
            className="text-sm text-red-600 hover:underline mt-4"
          >
            Vider le panier
          </button>
        </div>

        {/* Résumé de la commande */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-fit">
          <h2 className="text-xl font-bold mb-4">Résumé</h2>
          <div className="flex justify-between mb-2 text-gray-600">
            <span>Sous-total</span>
            <span>{total.toLocaleString()} FCFA</span>
          </div>
          <div className="flex justify-between mb-4 text-gray-600">
            <span>Livraison</span>
            <span>Gratuite</span>
          </div>
          <div className="border-t pt-4 flex justify-between font-bold text-lg text-gray-900">
            <span>Total</span>
            <span>{total.toLocaleString()} FCFA</span>
          </div>

          <button 
            onClick={() => navigate('/checkout')}
            className="w-full mt-6 bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors flex justify-center items-center"
          >
            Passer la commande <ArrowRight className="h-5 w-5 ml-2" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Cart;