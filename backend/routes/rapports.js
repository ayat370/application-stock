const express = require('express');
const router = express.Router();
const Rapport = require('../models/Rapport');
const Produit = require('../models/Produit');
const Lot = require('../models/Lot');
const Emplacement = require('../models/Emplacement');
const { protect, authorize } = require('../middleware/auth');
const PDFDocument = require('pdfkit');

// Fonction pour générer PDF
const generatePDF = (rapport, data) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument();
    const buffers = [];

    doc.on('data', (chunk) => {
      buffers.push(chunk);
    });
    doc.on('end', () => {
      resolve(Buffer.concat(buffers));
    });
    doc.on('error', reject);

    // Header
    doc.fontSize(20).text(`Rapport ${rapport.type.toUpperCase()}`, { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Généré le: ${new Date(rapport.dategeneration).toLocaleDateString()}`);
    doc.moveDown();

    if (rapport.type === 'inventaire') {
      doc.fontSize(16).text('Inventaire des Produits');
      doc.moveDown();

      // Table header
      doc.fontSize(10).text('Produit | Quantité | Emplacement | Statut', { underline: true });
      doc.moveDown();

      if (data.produits && data.lots) {
        data.produits.forEach(produit => {
          const lots = data.lots.filter(l => {
            const produitId = l.produit && l.produit._id ? l.produit._id.toString() : null;
            return produitId === produit._id.toString();
          });
          const quantite = lots.reduce((sum, lot) => sum + lot.quantite, 0);
          const statut = quantite < 10 ? 'Faible' : 'OK';
          const emplacement = produit.emplacement ? `${produit.emplacement.nomemplacement} (${produit.emplacement.zone})` : 'N/A';

          doc.fontSize(9).text(`${produit.nom} | ${quantite} | ${emplacement} | ${statut}`);
        });
      }
    } else if (rapport.type === 'bilan') {
      doc.fontSize(16).text('Bilan Global');
      doc.moveDown();
      doc.fontSize(12).text(`Total Produits: ${data.totalProduits || 0}`);
      doc.text(`Total Lots: ${data.totalLots || 0}`);
      doc.text(`Total Emplacements: ${data.totalEmplacements || 0}`);
      doc.text(`Quantité Totale: ${data.quantiteTotal || 0}`);
    }

    doc.end();
  });
};

// GET /api/rapports — admin et gestionnaire
router.get('/', protect, authorize('admin', 'gestionnaire'), async (req, res) => {
  try {
    const { page = 1, limit = 10, sortBy = 'dategeneration', sortOrder = 'desc' } = req.query;
    
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    const skip = (page - 1) * limit;
    const rapports = await Rapport.find()
      .populate('generePar', 'nom role')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Rapport.countDocuments();
    
    res.json({
      rapports,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/rapports/generer — générer inventaire ou bilan
router.post('/generer', protect, authorize('admin', 'gestionnaire'), async (req, res) => {
  try {
    const { type } = req.body;
    let data = {};

    if (type === 'inventaire') {
      const produits = await Produit.find().populate('emplacement', 'nomemplacement zone');
      const lots = await Lot.find().populate('produit', 'nom codebarre');
      data = { produits, lots, totalProduits: produits.length, totalLots: lots.length };
    } else if (type === 'bilan') {
      const totalProduits = await Produit.countDocuments();
      const totalLots = await Lot.countDocuments();
      const totalEmplacements = await Emplacement.countDocuments();
      const quantiteTotal = await Lot.aggregate([{ $group: { _id: null, total: { $sum: '$quantite' } } }]);
      data = {
        totalProduits,
        totalLots,
        totalEmplacements,
        quantiteTotal: quantiteTotal[0]?.total || 0,
      };
    }

    const rapport = await Rapport.create({ type, data, generePar: req.user._id });
    res.status(201).json(rapport);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/rapports/:id/pdf — exporter en PDF
router.get('/:id/pdf', protect, authorize('admin', 'gestionnaire'), async (req, res) => {
  try {
    const rapport = await Rapport.findById(req.params.id).populate('generePar', 'nom');
    if (!rapport) return res.status(404).json({ message: 'Rapport non trouvé' });

    // Récupérer les données fraîches pour la génération PDF
    let data = {};
    if (rapport.type === 'inventaire') {
      const produits = await Produit.find().populate('emplacement', 'nomemplacement zone');
      const lots = await Lot.find().populate('produit', 'nom codebarre');
      data = { produits, lots };
    } else if (rapport.type === 'bilan') {
      const totalProduits = await Produit.countDocuments();
      const totalLots = await Lot.countDocuments();
      const totalEmplacements = await Emplacement.countDocuments();
      const quantiteTotal = await Lot.aggregate([{ $group: { _id: null, total: { $sum: '$quantite' } } }]);
      data = {
        totalProduits,
        totalLots,
        totalEmplacements,
        quantiteTotal: quantiteTotal[0]?.total || 0,
      };
    }

    const pdfBuffer = await generatePDF(rapport, data);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=rapport-${rapport.type}-${rapport._id}.pdf`);
    res.send(pdfBuffer);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/rapports/stats/dashboard — données pour le tableau de bord
router.get('/stats/dashboard', protect, async (req, res) => {
  try {
    const totalProduits = await Produit.countDocuments();
    const totalLots = await Lot.countDocuments();
    const totalEmplacements = await Emplacement.countDocuments();
    const quantiteTotal = await Lot.aggregate([{ $group: { _id: null, total: { $sum: '$quantite' } } }]);

    // Produits avec stock faible (< 10)
    const today = new Date();
    const lowStockLotsQuery = await Lot.find({ quantite: { $lt: 10 } })
      .populate('produit', 'nom codebarre')
      .sort('quantite')
      .limit(6);
    const lowStockProduits = lowStockLotsQuery.length;

    // Lots expirés
    const expiredLotsQuery = await Lot.find({ dateExpiration: { $lt: today } })
      .populate('produit', 'nom codebarre')
      .sort('dateExpiration')
      .limit(6);
    const expiredLots = expiredLotsQuery.length;

    const lowStockLots = lowStockLotsQuery.map((lot) => ({
      idLot: lot.idlot,
      quantite: lot.quantite,
      produit: lot.produit?.nom || 'N/A',
      codebarre: lot.produit?.codebarre || '-',
    }));

    const expiredLotsList = expiredLotsQuery.map((lot) => ({
      idLot: lot.idlot,
      quantite: lot.quantite,
      produit: lot.produit?.nom || 'N/A',
      codebarre: lot.produit?.codebarre || '-',
      dateExpiration: lot.dateExpiration,
    }));

    res.json({
      totalProduits,
      totalLots,
      totalEmplacements,
      quantiteTotal: quantiteTotal[0]?.total || 0,
      lowStockProduits,
      expiredLots,
      lowStockLots,
      expiredLotsList,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
