const mongoose = require('mongoose');

const mouvementStockSchema = new mongoose.Schema({
  produit: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Produit', 
    required: true 
  },
  lot: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Lot',
    required: false
  },
  type: { 
    type: String, 
    enum: ['entrée', 'sortie', 'transfert'], 
    required: true 
  },
  quantite: { 
    type: Number, 
    required: true, 
    min: 1 
  },
  emplacementSource: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Emplacement',
    required: false
  },
  emplacementDestinaire: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Emplacement',
    required: false
  },
  dateMouvement: { 
    type: Date, 
    default: Date.now 
  },
  description: { 
    type: String, 
    trim: true,
    maxlength: 500
  },
  utilisateur: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true
  },
  statut: {
    type: String,
    enum: ['en_attente', 'approuvé', 'rejeté'],
    default: 'approuvé'
  },
  reference: {
    type: String,
    trim: true
  },
  correctionType: {
    type: String,
    enum: ['original', 'correction'],
    default: 'original'
  },
  originalMouvement: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MouvementStock',
    required: false
  },
  annulePar: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MouvementStock',
    required: false
  }
}, { timestamps: true });

// Index pour optimiser les recherches
mouvementStockSchema.index({ produit: 1, dateMouvement: -1 });
mouvementStockSchema.index({ type: 1, dateMouvement: -1 });
mouvementStockSchema.index({ emplacementSource: 1 });
mouvementStockSchema.index({ emplacementDestinaire: 1 });
mouvementStockSchema.index({ lot: 1 });
mouvementStockSchema.index({ produit: 1, type: 1, quantite: 1, lot: 1, emplacementSource: 1, emplacementDestinaire: 1, dateMouvement: -1 });

module.exports = mongoose.model('MouvementStock', mouvementStockSchema);
