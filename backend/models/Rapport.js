const mongoose = require('mongoose');

const rapportSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['inventaire', 'bilan'],
    required: true,
  },
  dategeneration: { type: Date, default: Date.now },
  generePar: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  data: { type: mongoose.Schema.Types.Mixed },
}, { timestamps: true });

module.exports = mongoose.model('Rapport', rapportSchema);
