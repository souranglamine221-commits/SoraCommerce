// Backend/src/controllers/auth.controller.js
const jwt = require('jsonwebtoken');
const User = require('../../models/User');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const passport = require('passport');

const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  const cookieOptions = {
    expires: new Date(Date.now() + (process.env.JWT_COOKIE_EXPIRES_IN || 7) * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  };
  res.cookie('jwt', token, cookieOptions);
  user.password = undefined;
  res.status(statusCode).json({ status: 'success', token, data: { user } });
};

const register = catchAsync(async (req, res, next) => {
  const { name, email, password, passwordConfirm } = req.body;
  
  if (password !== passwordConfirm) throw new AppError('Les mots de passe ne correspondent pas.', 400);

  const existingUser = await User.findOne({ email });
  if (existingUser) throw new AppError('Cet email est déjà utilisé.', 400);

  const user = await User.create({ name, email, password });
  
  // TODO: Envoyer l'email de vérification ici
  
  createSendToken(user, 201, res);
});

const login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) throw new AppError('Veuillez fournir un email et un mot de passe.', 400);

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.correctPassword(password, user.password))) {
    throw new AppError('Email ou mot de passe incorrect.', 401);
  }

  createSendToken(user, 200, res);
});

const logout = (req, res) => {
  res.cookie('jwt', 'loggedout', { expires: new Date(Date.now() + 10 * 1000), httpOnly: true });
  res.status(200).json({ status: 'success' });
};

const googleAuthCallback = (req, res, next) => {
  passport.authenticate('google', { session: false }, (err, user, info) => {
    if (err || !user) return next(err || new AppError('Échec de l\'authentification Google.', 401));
    createSendToken(user, 200, res);
  })(req, res, next);
};

module.exports = { register, login, logout, googleAuthCallback };