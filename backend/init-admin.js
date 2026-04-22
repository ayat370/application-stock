/**
 * Script d'initialisation — créer le premier compte Admin
 * Usage : node init-admin.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

async function createAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connecté à MongoDB');

    const exists = await User.findOne({ login: 'admin' });
    if (exists) {
      console.log('⚠️  Un compte admin existe déjà (login: admin)');
      process.exit(0);
    }

    // Pas de hash manuel - laisser le pre-hook du modèle faire
    await User.create({
      nom: 'Administrateur',
      login: 'admin',
      mdp: 'admin123', // Mot de passe en clair - sera hashé par le pre-hook
      role: 'admin',
      email: 'admin@stockapp.com',
    });

    console.log('');
    console.log('🎉 Compte Admin créé avec succès !');
    console.log('   Login    : admin');
    console.log('   Mot de passe : admin123');
    console.log('   ⚠️  Changez le mot de passe après la première connexion !');
    process.exit(0);
  } catch (err) {
    console.error('❌ Erreur :', err.message);
    process.exit(1);
  }
}

createAdmin();
