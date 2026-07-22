import { Link } from 'react-router-dom';
import { CheckCircle, ShoppingBag } from 'lucide-react';

const Confirmation = () => {
  return (
    <div className="max-w-2xl mx-auto mt-20 p-8 text-center">
      <CheckCircle className="h-20 w-20 text-green-500 mx-auto mb-6" />
      <h1 className="text-3xl font-bold text-gray-900 mb-4">
        Commande confirmée ! 🎉
      </h1>
      <p className="text-gray-600 text-lg mb-8">
        Merci pour votre achat chez SoraCommerce. 
        Vous recevrez bientôt un email de confirmation à votre adresse.
      </p>
      <Link
        to="/"
        className="inline-flex items-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-blue-700 transition"
      >
        <ShoppingBag className="h-6 w-6" />
        Continuer mes achats
      </Link>
    </div>
  );
};

export default Confirmation;