# Plan PHASE 13.11 — Lien "Voir la boutique"

## Étapes

- [x] Plan approuvé
- [x] 1. Modifier `Frontend/src/components/ProductCard.jsx` — lien "Voir la boutique" si `product.sellerId?._id` existe
- [x] 2. Modifier `Frontend/src/pages/ProductDetails.jsx` — section "Vendeur" (logo, storeName, note, bouton vers `/shop/:id`)
- [x] 3. Vérifier les imports
- [x] 4. Vérifier que le frontend compile sans erreur
- [x] 5. Rapport final

## Contraintes

- Modifier uniquement : `ProductCard.jsx`, `ProductDetails.jsx`
- Aucune modification backend
- Aucune nouvelle route API
- Utiliser uniquement les données déjà renvoyées par l'API
- Ne pas casser les fonctionnalités existantes
- Conserver le design actuel
- Le lien ne doit pas perturber le clic sur la carte produit
- Ne pas commencer de phase suivante
