const MouvementStock = require('../models/MouvementStock');
const Emplacement = require('../models/Emplacement');
const Lot = require('../models/Lot');
const {
  ajouterStock,
  retirerStock,
  transfererStock,
  annulerMouvement,
  afficherStock,
  obtenirResumStock
} = require('../services/mouvementStockService');

/**
 * GET /api/mouvements - Récupère tous les mouvements avec filtres
 */
exports.getMouvements = async (req, res) => {
  try {
    const {
      produit,
      lot,
      type,
      dateDebut,
      dateFin,
      page = 1,
      limit = 20,
      sortBy = 'dateMouvement',
      sortOrder = 'desc'
    } = req.query;

    const filters = { produit, lot, type, dateDebut, dateFin, page, limit };
    const result = await afficherStock(filters);

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * GET /api/mouvements/:id - Récupère un mouvement spécifique
 */
exports.getMouvementById = async (req, res) => {
  try {
    const mouvement = await MouvementStock.findById(req.params.id)
      .populate('produit', 'nom codebarre')
      .populate('lot', 'idlot quantite dateExpiration')
      .populate('emplacementSource', 'nomemplacement zone')
      .populate('emplacementDestinaire', 'nomemplacement zone')
      .populate('utilisateur', 'nom email')
      .populate('originalMouvement', 'type quantite dateMouvement')
      .populate('annulePar', 'type quantite dateMouvement');

    if (!mouvement) {
      return res.status(404).json({ message: 'Mouvement non trouvé' });
    }

    res.json(mouvement);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * POST /api/mouvements/entree - Ajoute du stock (entrée)
 */
exports.entreeStock = async (req, res) => {
  try {
    const { produit, lot, quantite, emplacement, description, reference } = req.body;

    if (!produit || !quantite) {
      return res.status(400).json({ message: 'Produit et quantité requis' });
    }

    if (!emplacement) {
      return res.status(400).json({ message: 'Emplacement requis' });
    }

    // Valider que l'emplacement existe
    const emplacementDoc = await Emplacement.findById(emplacement);
    if (!emplacementDoc) {
      return res.status(404).json({ message: 'Emplacement non trouvé' });
    }

    // Valider que le lot appartient au produit (si fourni)
    if (lot) {
      const lotDoc = await Lot.findById(lot).select('produit');
      if (!lotDoc) {
        return res.status(404).json({ message: 'Lot non trouvé' });
      }
      if (lotDoc.produit.toString() !== produit.toString()) {
        return res.status(400).json({ message: 'Le lot sélectionné n\'appartient pas au produit' });
      }
    }

    const params = {
      produit,
      lot,
      quantite: parseInt(quantite),
      emplacement,
      description,
      utilisateur: req.user.id,
      reference
    };

    const mouvement = await ajouterStock(params);

    res.status(201).json({
      success: true,
      message: 'Entrée de stock enregistrée',
      mouvement
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

/**
 * POST /api/mouvements/sortie - Retire du stock (sortie)
 */
exports.sortieStock = async (req, res) => {
  try {
    const { produit, lot, quantite, emplacement, description, reference } = req.body;

    if (!produit || !quantite) {
      return res.status(400).json({ message: 'Produit et quantité requis' });
    }

    if (!emplacement) {
      return res.status(400).json({ message: 'Emplacement requis' });
    }

    // Valider que l'emplacement existe
    const emplacementDoc = await Emplacement.findById(emplacement);
    if (!emplacementDoc) {
      return res.status(404).json({ message: 'Emplacement non trouvé' });
    }

    // Valider que le lot appartient au produit (si fourni)
    if (lot) {
      const lotDoc = await Lot.findById(lot).select('produit');
      if (!lotDoc) {
        return res.status(404).json({ message: 'Lot non trouvé' });
      }
      if (lotDoc.produit.toString() !== produit.toString()) {
        return res.status(400).json({ message: 'Le lot sélectionné n\'appartient pas au produit' });
      }
    }

    const params = {
      produit,
      lot,
      quantite: parseInt(quantite),
      emplacement,
      description,
      utilisateur: req.user.id,
      reference
    };

    const mouvement = await retirerStock(params);

    res.status(201).json({
      success: true,
      message: 'Sortie de stock enregistrée',
      mouvement
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

/**
 * POST /api/mouvements/transfert - Transfère du stock entre emplacements
 */
exports.transfertStock = async (req, res) => {
  try {
    const { produit, lot, quantite, emplacementSource, emplacementDestinaire, description, reference } = req.body;

    if (!produit || !quantite || !emplacementSource || !emplacementDestinaire) {
      return res.status(400).json({
        message: 'Produit, quantité et emplacements (source/destinataire) requis'
      });
    }

    // Valider que les deux emplacements existent
    const [emplacementSourceDoc, emplacementDestinataireDoc] = await Promise.all([
      Emplacement.findById(emplacementSource),
      Emplacement.findById(emplacementDestinaire)
    ]);

    if (!emplacementSourceDoc) {
      return res.status(404).json({ message: 'Emplacement source non trouvé' });
    }

    if (!emplacementDestinataireDoc) {
      return res.status(404).json({ message: 'Emplacement destinataire non trouvé' });
    }

    // Valider que le lot appartient au produit (si fourni)
    if (lot) {
      const lotDoc = await Lot.findById(lot).select('produit');
      if (!lotDoc) {
        return res.status(404).json({ message: 'Lot non trouvé' });
      }
      if (lotDoc.produit.toString() !== produit.toString()) {
        return res.status(400).json({ message: 'Le lot sélectionné n\'appartient pas au produit' });
      }
    }

    const params = {
      produit,
      lot,
      quantite: parseInt(quantite),
      emplacementSource,
      emplacementDestinaire,
      description,
      utilisateur: req.user.id,
      reference
    };

    const mouvement = await transfererStock(params);

    res.status(201).json({
      success: true,
      message: 'Transfert de stock enregistré',
      mouvement
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

/**
 * GET /api/mouvements/resume/stats - Récupère le résumé du stock
 */
exports.getResume = async (req, res) => {
  try {
    const { produit, dateDebut, dateFin } = req.query;
    const filters = { produit, dateDebut, dateFin };
    const resume = await obtenirResumStock(filters);

    res.json({
      resume,
      totalLignes: resume.length,
      bilanGlobal: resume.reduce((acc, item) => ({
        entrees: acc.entrees + item.entrees,
        sorties: acc.sorties + item.sorties,
        transferts: acc.transferts + item.transferts,
        bilan: acc.bilan + item.bilan
      }), { entrees: 0, sorties: 0, transferts: 0, bilan: 0 })
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * PUT /api/mouvements/:id - Met à jour un mouvement
 */
exports.updateMouvement = async (req, res) => {
  try {
    const { description, reference, statut } = req.body;
    const mouvementId = req.params.id;

    const mouvement = await MouvementStock.findByIdAndUpdate(
      mouvementId,
      { description, reference, statut },
      { new: true }
    )
      .populate('produit', 'nom codebarre')
      .populate('utilisateur', 'nom email');

    if (!mouvement) {
      return res.status(404).json({ message: 'Mouvement non trouvé' });
    }

    res.json({
      success: true,
      message: 'Mouvement mis à jour',
      mouvement
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

/**
 * DELETE /api/mouvements/:id - Supprime un mouvement (seulement les mouvements en attente)
 */
exports.deleteMouvement = async (req, res) => {
  res.status(400).json({
    success: false,
    message: 'Suppression interdite. Utilisez l\'annulation du mouvement pour corriger le stock sans perdre l\'historique.'
  });
};

exports.annulerMouvement = async (req, res) => {
  try {
    console.log('🔄 [Controller] Annulation du mouvement:', req.params.id);
    console.log('👤 [Controller] Utilisateur:', req.user);
    
    const mouvement = await annulerMouvement(req.params.id, req.user.id);
    
    console.log('✅ [Controller] Mouvement annulé avec succès:', mouvement._id);
    res.status(201).json({
      success: true,
      message: 'Mouvement annulé et correction enregistrée',
      mouvement
    });
  } catch (error) {
    console.error('❌ [Controller] Erreur lors de l\'annulation:', error.message);
    res.status(400).json({ message: error.message });
  }
};

/**
 * GET /api/mouvements/stats/parType - Obtient les statistiques par type
 */
exports.getStatParType = async (req, res) => {
  try {
    const { dateDebut, dateFin } = req.query;

    let query = {};
    if (dateDebut || dateFin) {
      query.dateMouvement = {};
      if (dateDebut) query.dateMouvement.$gte = new Date(dateDebut);
      if (dateFin) query.dateMouvement.$lte = new Date(dateFin);
    }

    const stats = await MouvementStock.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          totalQuantite: { $sum: '$quantite' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
