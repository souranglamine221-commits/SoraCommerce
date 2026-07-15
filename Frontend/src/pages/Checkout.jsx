// Frontend/src/pages/Checkout.jsx
import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';
import { CreditCard, Truck, User } from 'lucide-react';

const Checkout = () => {
  const { cartItems, clearCart } = useCart();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    address: '',
    city: '',
    cardNumber: ''
  });

  const total = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Simulation de paiement réussi
    alert(`Merci ${formData.fullName} ! Votre commande de ${total.toLocaleString()} FCFA a été validée.`);
    clearCart();
    navigate('/');
  };

  if (cartItems.length === 0) {
    navigate('/cart');
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Finaliser la commande</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold mb-4 flex items-center"><User className="mr-2 h-5 w-5" /> Informations personnelles</h2>
            <div className="grid grid-cols-1 gap-4">
              <input required type="text" placeholder="Nom complet" className="w-full p-3 border rounded-lg" 
                onChange={e => setFormData({...formData, fullName: e.target.value})} />
              <input required type="email" placeholder="Adresse email" className="w-full p-3 border rounded-lg" 
                onChange={e => setFormData({...formData, email: e.target.value})} />
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold mb-4 flex items-center"><Truck className="mr-2 h-5 w-5" /> Livraison</h2>
            <div className="grid grid-cols-1 gap-4">
              <input required type="text" placeholder="Adresse de livraison" className="w-full p-3 border rounded-lg" 
                onChange={e => setFormData({...formData, address: e.target.value})} />
              <input required type="text" placeholder="Ville" className="w-full p-3 border rounded-lg" 
                onChange={e => setFormData({...formData, city: e.target.value})} />
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold mb-4 flex items-center"><CreditCard className="mr-2 h-5 w-5" /> Paiement</h2>
            <input required type="text" placeholder="Numéro de carte (Simulation)" className="w-full p-3 border rounded-lg" 
              onChange={e => setFormData({...formData, cardNumber: e.target.value})} />
          </div>

          <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-700 transition-colors">
            Payer {total.toLocaleString()} FCFA
          </button>
        </form>

        {/* Résumé de la commande */}
        <div className="bg-gray-50 p-6 rounded-xl h-fit">
          <h2 className="text-xl font-bold mb-4">Votre commande</h2>
          {cartItems.map(item => (
            <div key={item._id} className="flex justify-between items-center mb-4 pb-4 border-b">
              <div className="flex items-center">
                <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded-md mr-4" />
                <div>
                  <p className="font-semibold">{item.name}</p>
                  <p className="text-sm text-gray-500">Qté: {item.quantity}</p>
                </div>
              </div>
              <p className="font-bold">{(item.price * item.quantity).toLocaleString()} FCFA</p>
            </div>
          ))}
          <div className="flex justify-between font-bold text-xl mt-6 pt-4 border-t">
            <span>Total à payer</span>
            <span>{total.toLocaleString()} FCFA</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;