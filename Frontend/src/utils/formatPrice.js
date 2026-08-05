// src/utils/formatPrice.js

/**
 * Formate un prix selon la devise.
 * Par défaut : XOF → affiché "FCFA" avec formatage localisé.
 * Devises supportées : XOF(FCFA), CAD($), USD($), EUR(€)
 *
 * @param {number} price - Le prix numérique du produit
 * @param {string} currency - Le code de la devise (XOF, USD, EUR, CAD)
 * @returns {string} Le prix formaté (ex: "1 500 FCFA", "10.99 $")
 */
export const formatPrice = (price, currency = 'XOF') => {
  // Vérifie si le prix est valide
  if (!price && price !== 0) return '';

  // XOF / FCFA → Afficher en FCFA (pas de décimales, séparateur fr-FR)
  if (currency === 'XOF' || currency === 'FCFA') {
    const formatted = new Intl.NumberFormat('fr-FR', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
    return `${formatted} FCFA`;
  }

  // CAD, USD, EUR → format international avec symbole
  const locale = currency === 'EUR' ? 'fr-FR' : 'en-US';
  const fractionDigits = currency === 'CAD' ? 2 : 2;

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(price);
};
