// Frontend/src/hooks/useFormatPrice.js
import { formatPrice } from '../utils/formatPrice';

/**
 * Hook pour formater les prix selon la devise.
 * @param {string} currency - Code devise (XOF, USD, EUR, CAD)
 * @returns {(price: number) => string} Fonction de formatage du prix
 */
export const useFormatPrice = (currency = 'XOF') => {
  return (price) => formatPrice(price, currency);
};

