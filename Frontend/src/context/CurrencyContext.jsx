/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useContext, useCallback, useEffect } from 'react';

const CurrencyContext = createContext();

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency doit être utilisé dans un CurrencyProvider');
  }
  return context;
};

// Taux de change par rapport au FCFA (devise de référence en base de données)
// ⚠️ À ajuster selon les taux réels du jour
const RATES = {
  FCFA: 1,
  XOF: 1,        // XOF = FCFA (même valeur)
  CAD: 0.0022,   // 1 FCFA ≈ 0.0022 CAD
  USD: 0.0016,   // 1 FCFA ≈ 0.0016 USD
  EUR: 0.0015,   // 1 FCFA ≈ 0.0015 EUR
};

const SYMBOLS = {
  FCFA: 'FCFA',
  XOF: 'CFA',
  CAD: '$',
  USD: '$',
  EUR: '€',
};

const FLAGS = {
  FCFA: '🇸🇳',
  XOF: '🇸🇳',
  CAD: '🇨🇦',
  USD: '🇺🇸',
  EUR: '🇪🇺',
};

export const CurrencyProvider = ({ children }) => {
  // Charger la devise depuis localStorage ou utiliser FCFA par défaut
  const [currency, setCurrency] = useState(() => {
    const saved = localStorage.getItem('sora_currency');
    return saved && RATES[saved] ? saved : 'FCFA';
  });

  // Sauvegarder la devise dans localStorage quand elle change
  useEffect(() => {
    localStorage.setItem('sora_currency', currency);
  }, [currency]);

  // Fonction pure de formatage (calcul pendant le rendu)
  const formatPrice = useCallback(
    (priceInFCFA) => {
      const converted = priceInFCFA * RATES[currency];
      const symbol = SYMBOLS[currency];

      if (currency === 'FCFA') {
        return `${Math.round(converted).toLocaleString('fr-FR')} ${symbol}`;
      }
      return `${symbol}${converted.toFixed(2)}`;
    },
    [currency],
  );

  // Convertir un prix d'une devise à l'autre
  const convertPrice = useCallback(
    (price, fromCurrency = 'FCFA', toCurrency = currency) => {
      const priceInFCFA = price / RATES[fromCurrency];
      return priceInFCFA * RATES[toCurrency];
    },
    [currency],
  );

  // Obtenir le taux de change pour une devise
  const getExchangeRate = useCallback(
    (targetCurrency = currency) => RATES[targetCurrency],
    [currency],
  );

  return (
    <CurrencyContext.Provider 
      value={{ 
        currency, 
        setCurrency, 
        formatPrice, 
        convertPrice,
        getExchangeRate,
        RATES,
        SYMBOLS,
        FLAGS
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
};