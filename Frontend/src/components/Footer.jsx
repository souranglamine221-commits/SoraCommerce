// Frontend/src/components/Footer.jsx
import React from 'react';
import { Mail, Phone, MessageCircle } from 'lucide-react'; // On garde seulement les icônes sûres
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white pt-12 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          
          {/* Section Marque */}
          <div>
            <h3 className="text-xl font-bold mb-4 text-blue-400">SoraCommerce</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Votre destination privilégiée pour les produits tech de qualité au Sénégal. 
              Fiabilité, rapidité et service client d'excellence.
            </p>
          </div>
          
          {/* Section Liens Rapides */}
          <div>
            <h3 className="text-xl font-bold mb-4">Liens Rapides</h3>
            <ul className="space-y-2 text-sm text-gray-300">
              <li><Link to="/" className="hover:text-white transition-colors">Accueil</Link></li>
              <li><Link to="/cart" className="hover:text-white transition-colors">Panier</Link></li>
              <li><Link to="/contact" className="hover:text-white transition-colors">Contact</Link></li>
            </ul>
          </div>

          {/* Section Contact & Social */}
          <div>
            <h3 className="text-xl font-bold mb-4">Nous Contacter</h3>
            <div className="space-y-3 text-sm">
              <a href="mailto:souranglamine221@gmail.com" className="flex items-center text-gray-300 hover:text-white transition-colors">
                <Mail className="h-4 w-4 mr-2" /> souranglamine221@gmail.com
              </a>
              <a href="tel:+221773521208" className="flex items-center text-gray-300 hover:text-white transition-colors">
                <Phone className="h-4 w-4 mr-2" /> +221 77 352 12 08
              </a>
              <a href="https://wa.me/221773521208" target="_blank" rel="noreferrer" className="flex items-center text-green-400 hover:text-green-300 transition-colors font-medium">
                <MessageCircle className="h-4 w-4 mr-2" /> WhatsApp Direct
              </a>
            </div>
            
            {/* Liens Sociaux en texte pour éviter les erreurs d'icônes */}
            <div className="mt-6 flex space-x-4 text-sm font-bold">
              <a href="https://linkedin.com/in/mamadou-lamine-sourang" target="_blank" rel="noreferrer" className="text-gray-400 hover:text-blue-500">
                LinkedIn
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8 text-center text-gray-500 text-xs">
          ©️ 2026 SoraCommerce. Tous droits réservés.
        </div>
      </div>
    </footer>
  );
};

export default Footer;