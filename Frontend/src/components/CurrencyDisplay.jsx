// src/components/CurrencyDisplay.jsx
import { formatPrice } from '../utils/formatPrice';

/**
 * Composant d'affichage de prix formaté.
 * Props :
 * - price  : number (prix numérique)
 * - currency : string (XOF, USD, EUR, CAD) — défaut 'XOF'
 */
const CurrencyDisplay = ({ price, currency }) => {
  return <span>{formatPrice(price, currency)}</span>;
};

export default CurrencyDisplay;

<IO>                                                                                                      </IO>