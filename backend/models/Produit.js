const mongoose = require('mongoose');

const produitSchema = new mongoose.Schema({
  nom: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  codebarre: { type: String, required: true, unique: true, trim: true },
  emplacement: { type: mongoose.Schema.Types.ObjectId, ref: 'Emplacement' },
  seuilMinimum: { type: Number, default: 10, min: 0 }, // Seuil minimum pour alerte stock faible
}, { timestamps: true });

module.exports = mongoose.model('Produit', produitSchema);
