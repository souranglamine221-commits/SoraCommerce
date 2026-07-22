// src/utils/formatPrice.js

/**
 * Formate un prix en devise internationale.
 * Par défaut, utilise le Dollar US (USD) pour un look international.
 * 
 * @param {number} price - Le prix numérique du produit
 * @param {string} currency - Le code de la devise (USD, EUR, XOF, etc.)
 * @returns {string} Le prix formaté (ex: "100.00 $")
 */
export const formatPrice = (price, currency = 'USD') => {
  // Vérifie si le prix est valide
  if (!price && price !== 0) return '';

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price);
};