const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Vérifier le token JWT
const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) return res.status(401).json({ message: 'Non autorisé' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-mdp');
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token invalide' });
  }
};

// Vérifier le rôle
const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ message: 'Accès refusé' });
  }
  next();
};

module.exports = { protect, authorize };
