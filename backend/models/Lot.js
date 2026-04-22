const mongoose = require('mongoose');

const lotSchema = new mongoose.Schema({
  idlot: { type: String, required: true, unique: true, trim: true },
  quantite: { type: Number, required: true, min: 0 },
  datecreation: { type: Date, default: Date.now },
  dateExpiration: { type: Date },
  produit: { type: mongoose.Schema.Types.ObjectId, ref: 'Produit', required: true },
}, { timestamps: true });

module.exports = mongoose.model('Lot', lotSchema);
