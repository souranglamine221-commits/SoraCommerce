const OpenAI = require('openai');

// Initialize OpenAI client seulement si la clé API est définie
let openai = null;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
} else {
  console.log('🔧 OpenAI désactivé - OPENAI_API_KEY non définie');
}

// Chatbot conversation
const chatWithAI = async (messages, context = {}) => {
  try {
    if (!openai) {
      throw new Error('OpenAI non configuré. Veuillez définir OPENAI_API_KEY dans .env');
    }

    const systemPrompt = `Tu es un assistant IA pour SoraCommerce, une plateforme e-commerce premium.
    
    Contexte:
    - Boutique: SoraCommerce
    - Catégories: Électronique, Mode, Maison, Sports
    - Services: Livraison, Retours, Support client
    - Horaires: 9h-18h du lundi au vendredi
    
    Règles:
    - Réponds en français
    - Sois courtois et professionnel
    - Aide les clients à trouver des produits
    - Explique les politiques de livraison et retour
    - Si tu ne connais pas la réponse, suggère de contacter le support
    
    Contexte utilisateur:
    ${context.userEmail ? `Email: ${context.userEmail}` : ''}
    ${context.orderId ? `Commande: ${context.orderId}` : ''}
    ${context.cartItems ? `Panier: ${context.cartItems.length} articles` : ''}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        ...messages
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    return completion.choices[0].message.content;
  } catch (error) {
    console.error('OpenAI Chat Error:', error);
    throw new Error('Erreur lors de la conversation avec l\'IA');
  }
};

// Intelligent search with natural language
const intelligentSearch = async (query, products = []) => {
  try {
    if (!openai) {
      throw new Error('OpenAI non configuré. Veuillez définir OPENAI_API_KEY dans .env');
    }

    const productContext = products.map(p => ({
      id: p._id,
      name: p.name,
      category: p.category,
      description: p.description,
      price: p.price,
    })).slice(0, 50); // Limit to 50 products for context

    const systemPrompt = `Tu es un assistant de recherche pour SoraCommerce.
    
    À partir de la requête de l'utilisateur et de la liste de produits, retourne:
    1. Les IDs des produits les plus pertinents (max 10)
    2. Une explication de la recherche
    
    Format de réponse JSON:
    {
      "productIds": ["id1", "id2", ...],
      "explanation": "explication de la recherche"
    }`;

    const userPrompt = `Requête: "${query}"
    
    Produits disponibles:
    ${JSON.stringify(productContext, null, 2)}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.3,
      max_tokens: 300,
    });

    const response = completion.choices[0].message.content;
    return JSON.parse(response);
  } catch (error) {
    console.error('OpenAI Search Error:', error);
    // Fallback to simple keyword search
    const keywords = query.toLowerCase().split(' ');
    const relevantProducts = products.filter(p => 
      keywords.some(keyword => 
        p.name.toLowerCase().includes(keyword) ||
        p.description?.toLowerCase().includes(keyword) ||
        p.category?.toLowerCase().includes(keyword)
      )
    ).slice(0, 10);
    
    return {
      productIds: relevantProducts.map(p => p._id),
      explanation: 'Recherche par mots-clés (IA indisponible)'
    };
  }
};

// Product recommendations
const getRecommendations = async (product, userHistory = [], allProducts = []) => {
  try {
    if (!openai) {
      throw new Error('OpenAI non configuré. Veuillez définir OPENAI_API_KEY dans .env');
    }

    const systemPrompt = `Tu es un assistant de recommandation pour SoraCommerce.
    
    À partir du produit actuel et de l'historique de l'utilisateur, suggère:
    1. Produits similaires (même catégorie, même gamme de prix)
    2. Produits complémentaires (accessoires, produits associés)
    
    Format de réponse JSON:
    {
      "similar": ["id1", "id2", ...],
      "complementary": ["id3", "id4", ...],
      "reasoning": "explication des recommandations"
    }`;

    const productContext = {
      id: product._id,
      name: product.name,
      category: product.category,
      price: product.price,
      description: product.description,
    };

    const historyContext = userHistory.map(h => ({
      id: h._id,
      name: h.name,
      category: h.category,
    }));

    const availableProducts = allProducts
      .filter(p => p._id.toString() !== product._id.toString())
      .map(p => ({
        id: p._id,
        name: p.name,
        category: p.category,
        price: p.price,
        description: p.description?.substring(0, 200),
      }))
      .slice(0, 100);

    const userPrompt = `Produit actuel: ${JSON.stringify(productContext)}
    
    Historique utilisateur: ${JSON.stringify(historyContext)}
    
    Produits disponibles: ${JSON.stringify(availableProducts)}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.4,
      max_tokens: 400,
    });

    const response = completion.choices[0].message.content;
    return JSON.parse(response);
  } catch (error) {
    console.error('OpenAI Recommendations Error:', error);
    // Fallback to category-based recommendations
    const similar = allProducts
      .filter(p => 
        p._id.toString() !== product._id.toString() &&
        p.category === product.category
      )
      .slice(0, 5);
    
    return {
      similar: similar.map(p => p._id),
      complementary: [],
      reasoning: 'Recommandations par catégorie (IA indisponible)'
    };
  }
};

// Generate product description
const generateProductDescription = async (product) => {
  try {
    if (!openai) {
      throw new Error('OpenAI non configuré. Veuillez définir OPENAI_API_KEY dans .env');
    }

    const systemPrompt = `Tu es un rédacteur professionnel pour SoraCommerce.
    
    Génère une description de produit attrayante et professionnelle en français.
    La description doit être:
    - Engageante et persuasive
    - Mettre en avant les avantages
    - Adaptée au e-commerce
    - Entre 100 et 200 mots`;

    const userPrompt = `Produit: ${product.name}
    Catégorie: ${product.category}
    Prix: ${product.price}
    Caractéristiques: ${product.description || 'Non spécifiées'}
    
    Génère une description de produit:`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.8,
      max_tokens: 300,
    });

    return completion.choices[0].message.content;
  } catch (error) {
    console.error('OpenAI Description Error:', error);
    return product.description || 'Description non disponible';
  }
};

// Summarize reviews
const summarizeReviews = async (reviews) => {
  try {
    if (!openai) {
      throw new Error('OpenAI non configuré. Veuillez définir OPENAI_API_KEY dans .env');
    }

    if (!reviews || reviews.length === 0) {
      return 'Aucun avis disponible pour ce produit.';
    }

    const reviewsText = reviews.map(r => 
      `Note: ${r.rating}/5 - ${r.comment}`
    ).join('\n');

    const systemPrompt = `Tu es un analyste d'avis pour SoraCommerce.
    
    À partir des avis clients, génère un résumé en français qui:
    - Met en avant les points positifs
    - Mentionne les points à améliorer
    - Donne une note globale
    - Est entre 50 et 100 mots`;

    const userPrompt = `Avis clients:\n${reviewsText}\n\nRésumé des avis:`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.5,
      max_tokens: 200,
    });

    return completion.choices[0].message.content;
  } catch (error) {
    console.error('OpenAI Reviews Error:', error);
    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    return `${reviews.length} avis clients. Note moyenne: ${avgRating.toFixed(1)}/5`;
  }
};

// Sales forecast (for admin dashboard)
const forecastSales = async (salesData) => {
  try {
    const systemPrompt = `Tu es un analyste de données pour SoraCommerce.
    
    À partir des données de ventes historiques, génère:
    1. Une prévision de ventes pour le prochain mois
    2. Les tendances observées
    3. Les recommandations
    
    Format de réponse JSON:
    {
      "forecast": 12345,
      "trend": "en hausse/stable/en baisse",
      "recommendations": ["rec1", "rec2", ...]
    }`;

    const userPrompt = `Données de ventes: ${JSON.stringify(salesData)}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.3,
      max_tokens: 300,
    });

    const response = completion.choices[0].message.content;
    return JSON.parse(response);
  } catch (error) {
    console.error('OpenAI Forecast Error:', error);
    return {
      forecast: 0,
      trend: 'indisponible',
      recommendations: ['IA indisponible pour les prévisions']
    };
  }
};

module.exports = {
  chatWithAI,
  intelligentSearch,
  getRecommendations,
  generateProductDescription,
  summarizeReviews,
  forecastSales,
};
