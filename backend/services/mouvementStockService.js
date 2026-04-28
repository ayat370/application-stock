const MouvementStock = require('../models/MouvementStock');
const Lot = require('../models/Lot');
const Produit = require('../models/Produit');
const Notification = require('../models/Notification');

/**
 * Valide que le lot appartient au produit spécifié
 * @param {string} produitId - ID du produit
 * @param {string} lotId - ID du lot (optionnel)
 * @throws Error si le lot n'appartient pas au produit
 */
async function validerLotAppartientAuProduit(produitId, lotId) {
  if (!lotId) {
    // Si pas de lot, c'est valide (lot optionnel)
    return;
  }

  const lot = await Lot.findById(lotId).select('produit');
  if (!lot) {
    throw new Error('Lot non trouvé');
  }

  // Comparer les IDs en tant que string pour éviter les problèmes d'ObjectId
  if (lot.produit.toString() !== produitId.toString()) {
    throw new Error('Le lot sélectionné n\'appartient pas au produit. Incohérence détectée');
  }
}

async function verifierDoublonMouvement(params) {
  const {
    produit,
    lot,
    type,
    quantite,
    emplacementSource,
    emplacementDestinaire
  } = params;

  const query = {
    produit,
    lot: lot || null,
    type,
    quantite,
    statut: 'approuvé',
    correctionType: 'original'
  };

  if (type === 'entrée') {
    query.emplacementDestinaire = emplacementDestinaire;
  } else if (type === 'sortie') {
    query.emplacementSource = emplacementSource;
  } else if (type === 'transfert') {
    query.emplacementSource = emplacementSource;
    query.emplacementDestinaire = emplacementDestinaire;
  }

  const maintenant = new Date();
  const limiteDate = new Date(maintenant.getTime() - 5 * 60 * 1000);
  query.dateMouvement = { $gte: limiteDate };

  return await MouvementStock.findOne(query);
}

/**
 * Ajoute du stock à un produit/lot
 * @param {Object} params - { produit, lot, quantite, emplacement, description, utilisateur }
 */
async function ajouterStock(params) {
  try {
    const { produit, lot, quantite, emplacement, description, utilisateur, reference } = params;

    if (quantite <= 0) {
      throw new Error('La quantité doit être positive');
    }

    // Valider que le lot appartient au produit
    await validerLotAppartientAuProduit(produit, lot);

    const doublon = await verifierDoublonMouvement({
      produit,
      lot: lot || null,
      type: 'entrée',
      quantite,
      emplacementDestinaire: emplacement
    });
    if (doublon) {
      throw new Error('Doublon de mouvement détecté : même produit, même quantité et même type dans les dernières minutes');
    }

    // Augmenter la quantité du lot
    if (lot) {
      const lotDoc = await Lot.findByIdAndUpdate(
        lot,
        { $inc: { quantite: quantite } },
        { new: true }
      );
      if (!lotDoc) throw new Error('Lot non trouvé');
    }

    // Créer le mouvement de stock
    const mouvement = new MouvementStock({
      produit,
      lot,
      type: 'entrée',
      quantite,
      emplacementDestinaire: emplacement,
      description,
      utilisateur,
      reference,
      statut: 'approuvé'
    });

    await mouvement.save();

    // Créer une notification
    await Notification.create({
      type: 'mouvement_stock',
      titre: 'Entrée de stock',
      message: `Entrée de ${quantite} unités`,
      read: false,
      userId: utilisateur
    });

    return mouvement;
  } catch (error) {
    throw new Error(`Erreur lors de l'ajout de stock: ${error.message}`);
  }
}

/**
 * Retire du stock à un produit/lot
 * @param {Object} params - { produit, lot, quantite, emplacement, description, utilisateur }
 */
async function retirerStock(params) {
  try {
    const { produit, lot, quantite, emplacement, description, utilisateur, reference } = params;

    if (quantite <= 0) {
      throw new Error('La quantité doit être positive');
    }

    // Valider que le lot appartient au produit
    await validerLotAppartientAuProduit(produit, lot);

    const doublon = await verifierDoublonMouvement({
      produit,
      lot: lot || null,
      type: 'sortie',
      quantite,
      emplacementSource: emplacement
    });
    if (doublon) {
      throw new Error('Doublon de mouvement détecté : même produit, même quantité et même type dans les dernières minutes');
    }

    // Vérifier la disponibilité
    let lotDoc = null;
    if (lot) {
      lotDoc = await Lot.findById(lot);
      if (!lotDoc) throw new Error('Lot non trouvé');
      if (lotDoc.quantite < quantite) {
        throw new Error(`Stock insuffisant. Disponible: ${lotDoc.quantite}, Demandé: ${quantite}`);
      }
    }

    // Diminuer la quantité du lot
    if (lot && lotDoc) {
      await Lot.findByIdAndUpdate(
        lot,
        { $inc: { quantite: -quantite } },
        { new: true }
      );
    }

    // Créer le mouvement de stock
    const mouvement = new MouvementStock({
      produit,
      lot,
      type: 'sortie',
      quantite,
      emplacementSource: emplacement,
      description,
      utilisateur,
      reference,
      statut: 'approuvé'
    });

    await mouvement.save();

    // Créer une notification
    await Notification.create({
      type: 'mouvement_stock',
      titre: 'Sortie de stock',
      message: `Sortie de ${quantite} unités`,
      read: false,
      userId: utilisateur
    });

    return mouvement;
  } catch (error) {
    throw new Error(`Erreur lors du retrait de stock: ${error.message}`);
  }
}

/**
 * Transfert de stock entre emplacements
 * @param {Object} params - { produit, lot, quantite, emplacementSource, emplacementDestinaire, description, utilisateur }
 */
async function transfererStock(params) {
  try {
    const { produit, lot, quantite, emplacementSource, emplacementDestinaire, description, utilisateur, reference } = params;

    if (quantite <= 0) {
      throw new Error('La quantité doit être positive');
    }

    if (!emplacementSource || !emplacementDestinaire) {
      throw new Error('Emplacements source et destinataire requis');
    }

    // Valider que le lot appartient au produit
    await validerLotAppartientAuProduit(produit, lot);

    const doublon = await verifierDoublonMouvement({
      produit,
      lot: lot || null,
      type: 'transfert',
      quantite,
      emplacementSource,
      emplacementDestinaire
    });
    if (doublon) {
      throw new Error('Doublon de mouvement détecté : même produit, même quantité et même type dans les dernières minutes');
    }

    // Créer le mouvement de stock
    const mouvement = new MouvementStock({
      produit,
      lot,
      type: 'transfert',
      quantite,
      emplacementSource,
      emplacementDestinaire,
      description,
      utilisateur,
      reference,
      statut: 'approuvé'
    });

    await mouvement.save();

    // Créer une notification
    await Notification.create({
      type: 'mouvement_stock',
      titre: 'Transfert de stock',
      message: `Transfert de ${quantite} unités entre emplacements`,
      read: false,
      userId: utilisateur
    });

    return mouvement;
  } catch (error) {
    throw new Error(`Erreur lors du transfert de stock: ${error.message}`);
  }
}

async function annulerMouvement(mouvementId, utilisateur) {
  try {
    console.log('🔍 [Service] Recherche du mouvement:', mouvementId);
    const original = await MouvementStock.findById(mouvementId);
    
    if (!original) {
      console.error('❌ [Service] Mouvement non trouvé:', mouvementId);
      throw new Error('Mouvement non trouvé');
    }
    console.log('✅ [Service] Mouvement trouvé:', original._id, 'Type:', original.type);

    if (original.correctionType === 'correction') {
      console.error('❌ [Service] Tentative d\'annulation d\'une correction');
      throw new Error('Impossible d\'annuler une correction');
    }

    const details = {
      produit: original.produit,
      lot: original.lot,
      quantite: original.quantite,
      description: `Annulation du mouvement ${original._id}${original.description ? ' - ' + original.description : ''}`,
      reference: `ANNUL-${original.reference || original._id}`,
      correctionType: 'correction',
      originalMouvement: original._id,
      utilisateur
    };

    // Valider que le lot appartient toujours au produit (vérification de sécurité)
    if (original.lot) {
      await validerLotAppartientAuProduit(original.produit, original.lot);
    }

    let mouvementCorrection;

    if (original.type === 'entrée') {
      console.log('📥 [Service] Annulation d\'une ENTRÉE');
      if (!original.emplacementDestinaire) {
        throw new Error('Emplacement destinataire manquant pour annulation');
      }
      if (original.lot) {
        console.log('📦 [Service] Mise à jour du lot:', original.lot);
        const lotDoc = await Lot.findById(original.lot);
        if (!lotDoc) throw new Error('Lot non trouvé');
        if (lotDoc.quantite < original.quantite) {
          throw new Error(`Stock insuffisant pour annuler l'entrée. Disponible: ${lotDoc.quantite}`);
        }
        await Lot.findByIdAndUpdate(original.lot, { $inc: { quantite: -original.quantite } });
        console.log('✅ [Service] Lot mis à jour (quantité retirée)');
      }

      mouvementCorrection = new MouvementStock({
        ...details,
        type: 'sortie',
        emplacementSource: original.emplacementDestinaire,
        statut: 'approuvé'
      });
      console.log('✅ [Service] Mouvement de correction créé (type: sortie)');
    } else if (original.type === 'sortie') {
      console.log('📤 [Service] Annulation d\'une SORTIE');
      if (!original.emplacementSource) {
        throw new Error('Emplacement source manquant pour annulation');
      }
      if (original.lot) {
        console.log('📦 [Service] Mise à jour du lot:', original.lot);
        await Lot.findByIdAndUpdate(original.lot, { $inc: { quantite: original.quantite } });
        console.log('✅ [Service] Lot mis à jour (quantité ajoutée)');
      }

      mouvementCorrection = new MouvementStock({
        ...details,
        type: 'entrée',
        emplacementDestinaire: original.emplacementSource,
        statut: 'approuvé'
      });
      console.log('✅ [Service] Mouvement de correction créé (type: entrée)');
    } else if (original.type === 'transfert') {
      console.log('↔️ [Service] Annulation d\'un TRANSFERT');
      if (!original.emplacementSource || !original.emplacementDestinaire) {
        throw new Error('Emplacements manquants pour annulation du transfert');
      }

      mouvementCorrection = new MouvementStock({
        ...details,
        type: 'transfert',
        emplacementSource: original.emplacementDestinaire,
        emplacementDestinaire: original.emplacementSource,
        statut: 'approuvé'
      });
      console.log('✅ [Service] Mouvement de correction créé (type: transfert)');
    } else {
      console.error('❌ [Service] Type de mouvement non supporté:', original.type);
      throw new Error('Type de mouvement non supporté');
    }

    console.log('💾 [Service] Sauvegarde du mouvement de correction...');
    await mouvementCorrection.save();
    console.log('✅ [Service] Correction sauvegardée:', mouvementCorrection._id);

    console.log('🔗 [Service] Liaison du mouvement original au mouvement de correction...');
    original.annulePar = mouvementCorrection._id;
    await original.save();
    console.log('✅ [Service] Mouvement original mis à jour');

    console.log('📢 [Service] Création de la notification...');
    await Notification.create({
      type: 'mouvement_stock',
      titre: 'Annulation de mouvement',
      message: `Annulation du mouvement ${original._id}`,
      read: false,
      userId: utilisateur
    });
    console.log('✅ [Service] Notification créée');

    console.log('✅ [Service] Annulation complète - Retour du mouvement:', mouvementCorrection._id);
    return mouvementCorrection;
  } catch (error) {
    throw new Error(`Erreur lors de l'annulation du mouvement: ${error.message}`);
  }
}

/**
 * Met à jour le stock après un mouvement
 * @param {string} mouvementId - ID du mouvement
 */
async function mettreAJourStock(mouvementId) {
  try {
    const mouvement = await MouvementStock.findById(mouvementId);
    if (!mouvement) throw new Error('Mouvement non trouvé');

    // Valider et mettre à jour
    if (mouvement.type === 'entrée') {
      if (mouvement.lot) {
        await Lot.findByIdAndUpdate(
          mouvement.lot,
          { $inc: { quantite: mouvement.quantite } },
          { new: true }
        );
      }
    } else if (mouvement.type === 'sortie') {
      if (mouvement.lot) {
        const lotDoc = await Lot.findById(mouvement.lot);
        if (lotDoc.quantite < mouvement.quantite) {
          throw new Error('Stock insuffisant');
        }
        await Lot.findByIdAndUpdate(
          mouvement.lot,
          { $inc: { quantite: -mouvement.quantite } },
          { new: true }
        );
      }
    }

    mouvement.statut = 'approuvé';
    await mouvement.save();
    return mouvement;
  } catch (error) {
    throw new Error(`Erreur lors de la mise à jour du stock: ${error.message}`);
  }
}

/**
 * Affiche l'état actuel du stock avec historique
 * @param {Object} filters - { produit, lot, type, dateDebut, dateFin }
 */
async function afficherStock(filters = {}) {
  try {
    const { produit, lot, type, dateDebut, dateFin, page = 1, limit = 10 } = filters;

    let query = {};

    if (produit) query.produit = produit;
    if (lot) query.lot = lot;
    if (type) query.type = type;

    if (dateDebut || dateFin) {
      query.dateMouvement = {};
      if (dateDebut) query.dateMouvement.$gte = new Date(dateDebut);
      if (dateFin) query.dateMouvement.$lte = new Date(dateFin);
    }

    const skip = (page - 1) * limit;

    const mouvements = await MouvementStock.find(query)
      .populate('produit', 'nom codebarre')
      .populate('lot', 'idlot quantite')
      .populate('emplacementSource', 'nomemplacement')
      .populate('emplacementDestinaire', 'nomemplacement')
      .populate('utilisateur', 'nom email')
      .sort({ dateMouvement: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await MouvementStock.countDocuments(query);

    // Calculer le bilan
    const bilan = await MouvementStock.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$quantite' }
        }
      }
    ]);

    return {
      mouvements,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      },
      bilan: bilan.reduce((acc, item) => {
        acc[item._id] = item.total;
        return acc;
      }, {})
    };
  } catch (error) {
    throw new Error(`Erreur lors de l'affichage du stock: ${error.message}`);
  }
}

/**
 * Obtient le résumé du stock par produit
 */
async function obtenirResumStock(filters = {}) {
  try {
    const { produit, dateDebut, dateFin } = filters;

    let query = {};
    if (produit) query.produit = produit;

    if (dateDebut || dateFin) {
      query.dateMouvement = {};
      if (dateDebut) query.dateMouvement.$gte = new Date(dateDebut);
      if (dateFin) query.dateMouvement.$lte = new Date(dateFin);
    }

    const resume = await MouvementStock.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$produit',
          entrees: {
            $sum: {
              $cond: [{ $eq: ['$type', 'entrée'] }, '$quantite', 0]
            }
          },
          sorties: {
            $sum: {
              $cond: [{ $eq: ['$type', 'sortie'] }, '$quantite', 0]
            }
          },
          transferts: {
            $sum: {
              $cond: [{ $eq: ['$type', 'transfert'] }, '$quantite', 0]
            }
          }
        }
      },
      {
        $lookup: {
          from: 'produits',
          localField: '_id',
          foreignField: '_id',
          as: 'produit'
        }
      },
      { $unwind: '$produit' },
      {
        $project: {
          _id: 1,
          produit: '$produit.nom',
          codebarre: '$produit.codebarre',
          entrees: 1,
          sorties: 1,
          transferts: 1,
          bilan: {
            $subtract: [
              { $add: ['$entrees', '$transferts'] },
              '$sorties'
            ]
          }
        }
      }
    ]);

    return resume;
  } catch (error) {
    throw new Error(`Erreur lors du calcul du résumé: ${error.message}`);
  }
}

module.exports = {
  ajouterStock,
  retirerStock,
  transfererStock,
  annulerMouvement,
  mettreAJourStock,
  afficherStock,
  obtenirResumStock
};
