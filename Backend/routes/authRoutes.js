// Backend/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs'); // <--- AJOUT DE CET IMPORT INDISPENSABLE

// Inscription
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: 'Utilisateur déjà existant' });

    const user = await User.create({ name, email, password });
    
    // Génération du token
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || 'secretkey', { expiresIn: '7d' });
    
    res.status(201).json({ _id: user._id, name: user.name, email: user.email, role: user.role, token });
  } catch (error) {
    console.error("Erreur d'inscription:", error);
    res.status(500).json({ message: error.message });
  }
});

// Connexion
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    
    if (user && (await bcrypt.compare(password, user.password))) {
      const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || 'secretkey', { expiresIn: '7d' });
      res.json({ _id: user._id, name: user.name, email: user.email, role: user.role, token });
    } else {
      res.status(401).json({ message: 'Email ou mot de passe incorrect' });
    }
  } catch (error) {
    console.error("Erreur de connexion:", error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;