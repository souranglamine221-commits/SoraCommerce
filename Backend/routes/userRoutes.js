// Backend/routes/userRoutes.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect } = require('../middleware/auth.middleware');

// ==========================================
// ✅ GET /api/users/profile - Obtenir profil complet
// ==========================================
router.get('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password')
      .populate('favorites');

    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'Utilisateur non trouvé' 
      });
    }

    res.json({ 
      success: true,
      user 
    });
  } catch (error) {
    console.error('❌ Erreur récupération profil:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
});

// ==========================================
// ✅ PUT /api/users/profile - Modifier profil
// ==========================================
router.put('/profile', protect, async (req, res) => {
  try {
    const { name, email, phone, avatar } = req.body;

    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (avatar !== undefined) updateData.avatar = avatar;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'Utilisateur non trouvé' 
      });
    }

    res.json({ 
      success: true,
      user 
    });
  } catch (error) {
    console.error('❌ Erreur modification profil:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
});

// ==========================================
// ✅ POST /api/users/address - Ajouter adresse
// ==========================================
router.post('/address', protect, async (req, res) => {
  try {
    const { fullName, phone, street, city, state, country, postalCode, isDefault } = req.body;

    if (!fullName || !phone || !street || !city || !state || !country || !postalCode) {
      return res.status(400).json({ 
        success: false,
        message: 'Tous les champs d\'adresse sont requis' 
      });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'Utilisateur non trouvé' 
      });
    }

    // Si isDefault est true, retirer le flag des autres adresses
    if (isDefault) {
      user.addresses.forEach(addr => addr.isDefault = false);
    }

    user.addresses.push({
      fullName,
      phone,
      street,
      city,
      state,
      country,
      postalCode,
      isDefault: isDefault || false
    });

    await user.save();

    res.json({ 
      success: true,
      addresses: user.addresses 
    });
  } catch (error) {
    console.error('❌ Erreur ajout adresse:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
});

// ==========================================
// ✅ PUT /api/users/address/:id - Modifier adresse
// ==========================================
router.put('/address/:id', protect, async (req, res) => {
  try {
    const { fullName, phone, street, city, state, country, postalCode, isDefault } = req.body;

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'Utilisateur non trouvé' 
      });
    }

    const address = user.addresses.id(req.params.id);

    if (!address) {
      return res.status(404).json({ 
        success: false,
        message: 'Adresse non trouvée' 
      });
    }

    // Si isDefault est true, retirer le flag des autres adresses
    if (isDefault) {
      user.addresses.forEach(addr => addr.isDefault = false);
    }

    if (fullName) address.fullName = fullName;
    if (phone) address.phone = phone;
    if (street) address.street = street;
    if (city) address.city = city;
    if (state) address.state = state;
    if (country) address.country = country;
    if (postalCode) address.postalCode = postalCode;
    if (isDefault !== undefined) address.isDefault = isDefault;

    await user.save();

    res.json({ 
      success: true,
      addresses: user.addresses 
    });
  } catch (error) {
    console.error('❌ Erreur modification adresse:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
});

// ==========================================
// ✅ DELETE /api/users/address/:id - Supprimer adresse
// ==========================================
router.delete('/address/:id', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'Utilisateur non trouvé' 
      });
    }

    const address = user.addresses.id(req.params.id);

    if (!address) {
      return res.status(404).json({ 
        success: false,
        message: 'Adresse non trouvée' 
      });
    }

    address.deleteOne();

    await user.save();

    res.json({ 
      success: true,
      addresses: user.addresses 
    });
  } catch (error) {
    console.error('❌ Erreur suppression adresse:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
});

// ==========================================
// ✅ POST /api/users/favorites/:productId - Ajouter favori
// ==========================================
router.post('/favorites/:productId', protect, async (req, res) => {
  try {
    const { productId } = req.params;

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'Utilisateur non trouvé' 
      });
    }

    // Vérifier si le produit est déjà dans les favoris
    if (user.favorites.includes(productId)) {
      return res.status(400).json({ 
        success: false,
        message: 'Produit déjà dans les favoris' 
      });
    }

    user.favorites.push(productId);
    await user.save();

    await user.populate('favorites');

    res.json({ 
      success: true,
      favorites: user.favorites 
    });
  } catch (error) {
    console.error('❌ Erreur ajout favori:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
});

// ==========================================
// ✅ DELETE /api/users/favorites/:productId - Retirer favori
// ==========================================
router.delete('/favorites/:productId', protect, async (req, res) => {
  try {
    const { productId } = req.params;

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'Utilisateur non trouvé' 
      });
    }

    user.favorites = user.favorites.filter(fav => fav.toString() !== productId);
    await user.save();

    await user.populate('favorites');

    res.json({ 
      success: true,
      favorites: user.favorites 
    });
  } catch (error) {
    console.error('❌ Erreur suppression favori:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
});

// ==========================================
// ✅ GET /api/users/favorites - Voir favoris
// ==========================================
router.get('/favorites', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('favorites');

    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'Utilisateur non trouvé' 
      });
    }

    res.json({ 
      success: true,
      favorites: user.favorites 
    });
  } catch (error) {
    console.error('❌ Erreur récupération favoris:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
});

// ==========================================
// ✅ PUT /api/users/preferences - Modifier préférences
// ==========================================
router.put('/preferences', protect, async (req, res) => {
  try {
    const { language, currency } = req.body;

    const updateData = {};
    if (language) updateData['preferences.language'] = language;
    if (currency) updateData['preferences.currency'] = currency;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'Utilisateur non trouvé' 
      });
    }

    res.json({ 
      success: true,
      preferences: user.preferences 
    });
  } catch (error) {
    console.error('❌ Erreur modification préférences:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
});

module.exports = router;
