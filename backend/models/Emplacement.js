const mongoose = require('mongoose');

const emplacementSchema = new mongoose.Schema({
  nomemplacement: { type: String, required: true, unique: true, trim: true },
  zone: {
    type: String,
    enum: ['rayon', 'depot', 'etagere'],
    default: 'rayon',
  },
  nbboite: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Emplacement', emplacementSchema);
