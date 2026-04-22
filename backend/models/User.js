const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  nom: { type: String, required: true, trim: true },
  login: { type: String, required: true, unique: true, trim: true },
  mdp: { type: String, required: true, minlength: 6 },
  role: {
    type: String,
    enum: ['admin', 'gestionnaire', 'magasinier'],
    default: 'magasinier',
  },
  email: { type: String, required: true, unique: true },
  profilePhoto: { type: String, default: null }, // URL or base64 string
}, { timestamps: true });

// Hash du mot de passe avant sauvegarde
userSchema.pre('save', async function (next) {
  if (!this.isModified('mdp')) return next();
  this.mdp = await bcrypt.hash(this.mdp, 10);
  next();
});

// Vérifier mot de passe
userSchema.methods.comparePassword = async function (mdp) {
  return bcrypt.compare(mdp, this.mdp);
};

module.exports = mongoose.model('User', userSchema);
