// backend/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Assurez-vous que ce modèle existe
const { protect } = require('../middleware/auth.middleware'); // Import protect middleware

// ==========================================
// ✅ CONFIGURATION PASSPORT (Google Strategy)
// ==========================================
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || "http://localhost:5000/api/auth/google/callback",
    scope: ['profile', 'email']
}, async (accessToken, refreshToken, profile, done) => {
    try {
        // 1. Chercher si l'utilisateur existe déjà avec cet ID Google
        let user = await User.findOne({ googleId: profile.id });

               // 2. S'il n'existe pas, on le crée (Inscription automatique via Google)
        if (!user) {
            user = await User.create({
                googleId: profile.id,
                name: profile.displayName,
                email: profile.emails[0].value,
                role: 'customer', // ✅ CORRIGÉ pour correspondre à votre modèle User.js
                avatar: profile.photos ? profile.photos[0].value : '' // ✅ Bonus : on récupère aussi la photo de profil Google !
            });
            console.log(`✅ Nouvel utilisateur créé via Google : ${user.email}`);
        }

        return done(null, user);
    } catch (error) {
        console.error('❌ Erreur Google OAuth:', error);
        return done(error, null);
    }
}));

// Sérialisation/Désérialisation (requis par Passport)
passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (error) {
        done(error, null);
    }
});

// ==========================================
// ✅ ROUTES D'AUTHENTIFICATION
// ==========================================

// 1. Route qui redirige vers la page de connexion Google
router.get('/google', passport.authenticate('google'));

// 2. Route de rappel (Callback) après que l'utilisateur a accepté sur Google
router.get('/google/callback', 
    passport.authenticate('google', { failureRedirect: `${process.env.FRONTEND_URL}/login?error=google_failed` }),
    async (req, res) => {
        try {
            // L'authentification a réussi, req.user contient l'utilisateur
            const user = req.user;

            // Générer un token JWT pour le frontend
            const token = jwt.sign(
                { id: user._id, email: user.email, role: user.role },
                process.env.JWT_SECRET || 'votre_super_secret_jwt_par_defaut',
                { expiresIn: '7d' } // Token valide 7 jours
            );

            // Option A : Rediriger le frontend avec le token en paramètre d'URL (plus simple pour débuter)
            // Le frontend lira ce token et le stockera dans le localStorage
            res.redirect(`${process.env.FRONTEND_URL}/login?token=${token}&email=${user.email}`);

            // Option B (Plus sécurisée) : Définir un cookie httpOnly
            // res.cookie('token', token, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000, sameSite: 'lax' });
            // res.redirect('http://localhost:5173/');
            
        } catch (error) {
            console.error('❌ Erreur génération token:', error);
            res.redirect(`${process.env.FRONTEND_URL}/login?error=server_error`);
        }
    }
);

// 3. Route de déconnexion (optionnelle, surtout si vous utilisez des tokens côté frontend)
router.get('/logout', (req, res) => {
    res.json({ message: 'Déconnecté avec succès' });
});

// ==========================================
// ✅ ROUTE POST /api/auth/google (Google JWT Credential)
// ==========================================
router.post('/google', async (req, res) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({ 
        success: false,
        message: 'Credential Google manquant' 
      });
    }

    // Décoder le JWT Google (sans vérification de signature pour simplifier)
    // En production, vous devriez vérifier la signature avec Google's public keys
    const decoded = JSON.parse(Buffer.from(credential.split('.')[1], 'base64').toString());

    const { email, name, sub: googleId, picture } = decoded;

    // Chercher ou créer l'utilisateur
    let user = await User.findOne({ googleId });

    if (!user) {
      // Vérifier si l'utilisateur existe déjà avec cet email
      const existingUser = await User.findOne({ email });
      
      if (existingUser) {
        // Lier le compte Google à l'utilisateur existant
        existingUser.googleId = googleId;
        existingUser.avatar = picture || existingUser.avatar;
        await existingUser.save();
        user = existingUser;
      } else {
        // Créer un nouvel utilisateur
        user = await User.create({
          googleId,
          name: name || email.split('@')[0],
          email,
          role: 'customer',
          avatar: picture || ''
        });
      }
    }

    // Générer le token JWT
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'votre_super_secret_jwt_par_defaut',
      { expiresIn: '7d' }
    );

    const userResponse = user.toObject();
    delete userResponse.password;

    res.json({
      success: true,
      message: 'Connexion Google réussie',
      token,
      user: userResponse
    });

  } catch (error) {
    console.error('❌ Erreur Google JWT:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erreur lors de la connexion Google',
      error: error.message 
    });
  }
});

// ==========================================
// ✅ ROUTE REGISTER (Inscription email/password)
// ==========================================
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validation des données
    if (!name || !email || !password) {
      return res.status(400).json({ 
        success: false,
        message: 'Tous les champs sont requis' 
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ 
        success: false,
        message: 'Le mot de passe doit contenir au moins 6 caractères' 
      });
    }

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        success: false,
        message: 'Cet email est déjà utilisé' 
      });
    }

    // Créer l'utilisateur (le password sera hashé automatiquement par le middleware du modèle)
    const user = await User.create({
      name,
      email,
      password,
      role: 'customer'
    });

    // Générer le token JWT
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'votre_super_secret_jwt_par_defaut',
      { expiresIn: '7d' }
    );

    // Retourner le user et le token (sans le password)
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json({
      success: true,
      message: 'Inscription réussie',
      token,
      user: userResponse
    });

  } catch (error) {
    console.error('❌ Erreur inscription:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erreur serveur lors de l\'inscription',
      error: error.message 
    });
  }
});

// ==========================================
// ✅ ROUTE LOGIN (Connexion email/password)
// ==========================================
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation des données
    if (!email || !password) {
      return res.status(400).json({ 
        success: false,
        message: 'Email et mot de passe requis' 
      });
    }

    // Trouver l'utilisateur (avec le password car il est select: false par défaut)
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: 'Email ou mot de passe incorrect' 
      });
    }

    // Vérifier le mot de passe
    const isPasswordValid = await user.correctPassword(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false,
        message: 'Email ou mot de passe incorrect' 
      });
    }

    // Générer le token JWT
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'votre_super_secret_jwt_par_defaut',
      { expiresIn: '7d' }
    );

    // Retourner le user et le token (sans le password)
    const userResponse = user.toObject();
    delete userResponse.password;

    res.json({
      success: true,
      message: 'Connexion réussie',
      token,
      user: userResponse
    });

  } catch (error) {
    console.error('❌ Erreur connexion:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erreur serveur lors de la connexion',
      error: error.message 
    });
  }
});

// ==========================================
// ✅ ROUTE GET /api/auth/me (Utilisateur connecté)
// ==========================================
router.get('/me', protect, async (req, res) => {
  try {
    const user = req.user.toObject();
    delete user.password;

    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('❌ Erreur récupération profil:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération du profil',
      error: error.message
    });
  }
});

// ==========================================
// ✅ ROUTE PUT /api/auth/profile (Modifier profil)
// ==========================================
router.put('/profile', protect, async (req, res) => {
  try {
    const { name, email } = req.body;

    // Validation
    if (!name || !email) {
      return res.status(400).json({ 
        success: false,
        message: 'Nom et email requis' 
      });
    }

    // Vérifier si l'email est déjà utilisé par un autre utilisateur
    const existingUser = await User.findOne({ email, _id: { $ne: req.user._id } });
    if (existingUser) {
      return res.status(400).json({ 
        success: false,
        message: 'Cet email est déjà utilisé' 
      });
    }

    // Mettre à jour l'utilisateur
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { name, email },
      { new: true, runValidators: true }
    );

    const userResponse = updatedUser.toObject();
    delete userResponse.password;

    res.json({
      success: true,
      message: 'Profil mis à jour avec succès',
      user: userResponse
    });

  } catch (error) {
    console.error('❌ Erreur modification profil:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erreur serveur lors de la modification du profil',
      error: error.message 
    });
  }
});

// ==========================================
// ✅ ROUTE PUT /api/auth/password (Changer mot de passe)
// ==========================================
router.put('/password', protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Validation
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        success: false,
        message: 'Mot de passe actuel et nouveau requis' 
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ 
        success: false,
        message: 'Le nouveau mot de passe doit contenir au moins 6 caractères' 
      });
    }

    // Récupérer l'utilisateur avec le password
    const user = await User.findById(req.user._id).select('+password');

    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'Utilisateur non trouvé' 
      });
    }

    // Vérifier le mot de passe actuel
    const isPasswordValid = await user.correctPassword(currentPassword, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false,
        message: 'Mot de passe actuel incorrect' 
      });
    }

    // Mettre à jour le mot de passe
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Mot de passe changé avec succès'
    });

  } catch (error) {
    console.error('❌ Erreur changement mot de passe:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erreur serveur lors du changement de mot de passe',
      error: error.message 
    });
  }
});

module.exports = router;