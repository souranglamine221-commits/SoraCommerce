// src/components/Footer.jsx
import { Mail, Phone, Clock, Globe } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-primary text-gray-300 pt-16 pb-8 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* GRILLE PRINCIPALE */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          
          {/* COLONNE 1: MARQUE */}
          <div>
            <h3 className="text-2xl font-bold text-white mb-4 tracking-tight">
              Sora<span className="text-accent">Commerce</span>
            </h3>
            <p className="text-gray-300 leading-relaxed mb-6 max-w-xs">
              Votre boutique de confiance livrée dans plus de 50 pays. 
              Nous connectons le monde à travers des produits d'exception.
            </p>
            <div className="flex items-center text-accent bg-white/5 w-fit px-3 py-1.5 rounded-full border border-white/10">
              <Globe size={16} className="mr-2" />
              <span className="text-sm font-medium text-white">Livraison Internationale</span>
            </div>
          </div>

          {/* COLONNE 2: LIENS RAPIDES */}
          <div>
            <h4 className="text-white font-bold text-lg mb-6 tracking-wide uppercase text-xs opacity-90">Liens Rapides</h4>
            <ul className="space-y-3">
              <li><a href="/" className="text-white hover:text-accent transition-colors duration-200">Accueil</a></li>
              <li><a href="/categories" className="text-white hover:text-accent transition-colors duration-200">Nos Catégories</a></li>
              <li><a href="/contact" className="text-white hover:text-accent transition-colors duration-200">Service Client</a></li>
              <li><a href="#" className="text-white hover:text-accent transition-colors duration-200">Suivre ma commande</a></li>
            </ul>
          </div>

          {/* COLONNE 3: CONTACT */}
          <div>
            <h4 className="text-white font-bold text-lg mb-6 tracking-wide uppercase text-xs opacity-90">Nous Contacter</h4>
            <ul className="space-y-4">
              <li className="flex items-start group">
                <Mail size={18} className="text-accent mr-3 mt-1 shrink-0 group-hover:text-white transition-colors" />
                <a href="mailto:support@soracommerce.com" className="text-white hover:text-accent transition-colors">support@soracommerce.com</a>
              </li>
              <li className="flex items-start group">
                <Phone size={18} className="text-accent mr-3 mt-1 shrink-0 group-hover:text-white transition-colors" />
                <a href="https://wa.me/221773521208" target="_blank" rel="noreferrer" className="text-white hover:text-accent transition-colors">+221 77 352 12 08</a>
              </li>
              <li className="flex items-start">
                <Clock size={18} className="text-accent mr-3 mt-1 shrink-0" />
                <span className="text-white">Lun-Ven, 9h-18h (GMT)</span>
              </li>
            </ul>
          </div>

          {/* COLONNE 4: PAIEMENTS */}
          <div>
            <h4 className="text-white font-bold text-lg mb-6 tracking-wide uppercase text-xs opacity-90">Paiements Sécurisés</h4>
            <p className="text-sm text-gray-300 mb-4">Transactions cryptées SSL 256-bit</p>
            <div className="flex flex-wrap gap-2">
              {['VISA', 'MC', 'AMEX', 'PAYPAL'].map((card) => (
                <span 
                  key={card} 
                  className="px-3 py-1.5 bg-white/5 rounded border border-white/10 text-xs font-bold text-white hover:bg-white/10 hover:border-white/20 transition-all cursor-default"
                >
                  {card}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* BAS DE PAGE */}
        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-gray-400">
          <p>© {currentYear} SoraCommerce Global. Tous droits réservés.</p>
          <div className="mt-4 md:mt-0 space-x-4">
            <a href="#" className="hover:text-white transition-colors">Mentions légales</a>
            <span className="text-gray-600">•</span>
            <a href="#" className="hover:text-white transition-colors">Confidentialité</a>
            <span className="text-gray-600">•</span>
            <a href="#" className="hover:text-white transition-colors">CGV</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;