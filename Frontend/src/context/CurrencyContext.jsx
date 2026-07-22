/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useContext, useCallback } from 'react';

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
  USD: 0.0016,   // 1 FCFA ≈ 0.0016 USD
  EUR: 0.0015,   // 1 FCFA ≈ 0.0015 EUR
};

const SYMBOLS = {
  FCFA: 'FCFA',
  USD: '$',
  EUR: '€',
};

export const CurrencyProvider = ({ children }) => {
  // ✅ État local simple — pas de useEffect nécessaire
  // Devise par défaut : USD (orientation internationale)
  const [currency, setCurrency] = useState('USD');

  // ✅ Fonction pure de formatage (calcul pendant le rendu)
  const formatPrice = useCallback(
    (priceInFCFA) => {
      const converted = priceInFCFA * RATES[currency];
      const symbol = SYMBOLS[currency];

      if (currency === 'FCFA') {
        return `${Math.round(converted).toLocaleString()} ${symbol}`;
      }
      return `${symbol}${converted.toFixed(2)}`;
    },
    [currency],
  );

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, formatPrice }}>
      {children}
    </CurrencyContext.Provider>
  );
};