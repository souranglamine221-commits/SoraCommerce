/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useContext, useCallback, useEffect } from 'react';

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage doit être utilisé dans un LanguageProvider');
  }
  return context;
};

// Traductions disponibles - Structure prête pour l'internationalisation
const TRANSLATIONS = {
  fr: {
    nav: {
      home: 'Accueil',
      shop: 'Boutique',
      categories: 'Catégories',
      promotions: 'Promotions',
      contact: 'Contact',
      search: 'Rechercher...',
      account: 'Compte',
      favorites: 'Favoris',
      cart: 'Panier',
      login: 'Connexion',
      register: 'Créer un compte',
      logout: 'Déconnexion',
      myAccount: 'Mon compte',
      myOrders: 'Mes commandes',
      myFavorites: 'Mes favoris',
      hello: 'Bonjour',
    },
  },
  en: {
    nav: {
      home: 'Home',
      shop: 'Shop',
      categories: 'Categories',
      promotions: 'Promotions',
      contact: 'Contact',
      search: 'Search...',
      account: 'Account',
      favorites: 'Favorites',
      cart: 'Cart',
      login: 'Login',
      register: 'Create account',
      logout: 'Logout',
      myAccount: 'My account',
      myOrders: 'My orders',
      myFavorites: 'My favorites',
      hello: 'Hello',
    },
  },
};

const FLAGS = {
  fr: '🇫🇷',
  en: '🇬🇧',
};

export const LanguageProvider = ({ children }) => {
  // Charger la langue depuis localStorage ou utiliser FR par défaut
  const [language, setLanguage] = useState(() => {
    const saved = localStorage.getItem('sora_language');
    return saved && TRANSLATIONS[saved] ? saved : 'fr';
  });

  // Sauvegarder la langue dans localStorage quand elle change
  useEffect(() => {
    localStorage.setItem('sora_language', language);
  }, [language]);

  // Fonction pour obtenir une traduction
  const t = useCallback(
    (key) => {
      const keys = key.split('.');
      let value = TRANSLATIONS[language];
      
      for (const k of keys) {
        if (value && value[k]) {
          value = value[k];
        } else {
          return key; // Retourner la clé si traduction non trouvée
        }
      }
      
      return value;
    },
    [language],
  );

  // Changer la langue
  const changeLanguage = useCallback((lang) => {
    if (TRANSLATIONS[lang]) {
      setLanguage(lang);
    }
  }, []);

  return (
    <LanguageContext.Provider 
      value={{ 
        language, 
        setLanguage: changeLanguage, 
        t,
        TRANSLATIONS,
        FLAGS
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};
