const express = require('express');
const router = express.Router();
const path = require('path');
const Rapport = require('../models/Rapport');
const Produit = require('../models/Produit');
const Lot = require('../models/Lot');
const Emplacement = require('../models/Emplacement');
const { protect, authorize } = require('../middleware/auth');
const pdfMake = require('pdfmake/js/index.js');

const fonts = {
  Roboto: {
    normal: path.join(__dirname, '..', 'node_modules', 'pdfmake', 'fonts', 'Roboto', 'Roboto-Regular.ttf'),
    bold: path.join(__dirname, '..', 'node_modules', 'pdfmake', 'fonts', 'Roboto', 'Roboto-Medium.ttf'),
    italics: path.join(__dirname, '..', 'node_modules', 'pdfmake', 'fonts', 'Roboto', 'Roboto-Italic.ttf'),
    bolditalics: path.join(__dirname, '..', 'node_modules', 'pdfmake', 'fonts', 'Roboto', 'Roboto-MediumItalic.ttf')
  }
};

pdfMake.fonts = fonts;

// Styles pour pdfmake
const styles = {
  header: {
    fontSize: 18,
    bold: true,
    color: '#1F2937',
    margin: [0, 0, 0, 10]
  },
  subheader: {
    fontSize: 14,
    bold: true,
    color: '#6366F1',
    margin: [0, 10, 0, 5]
  },
  tableHeader: {
    bold: true,
    fontSize: 12,
    color: '#FFFFFF',
    fillColor: '#6366F1',
    alignment: 'center'
  },
  tableCell: {
    fontSize: 10,
    color: '#1F2937'
  },
  warningCell: {
    fillColor: '#FEF3C7',
    color: '#F59E0B'
  },
  footer: {
    fontSize: 8,
    color: '#6B7280',
    margin: [40, 10, 40, 0]
  }
};

// Fonction pour générer le PDF avec pdfmake
const generatePDF = async (rapport, data, generePar) => {
  let docDefinition = {};

  try {
    if (rapport.type === 'inventaire') {
      // Préparer les données du tableau
    const tableBody = [
      [
        { text: 'Produit', style: 'tableHeader' },
        { text: 'Quantité', style: 'tableHeader' },
        { text: 'Emplacement', style: 'tableHeader' },
        { text: 'Statut', style: 'tableHeader' }
      ]
    ];

      data.produits.forEach(produit => {
        const lots = data.lots.filter(l => {
          const produitId = l.produit && l.produit._id ? l.produit._id.toString() : null;
          return produitId === produit._id.toString();
        });
        const quantite = lots.reduce((sum, lot) => sum + lot.quantite, 0);
        const statut = quantite < 10 ? 'Faible' : 'OK';
        const emplacement = produit.emplacement
          ? `${produit.emplacement.nomemplacement} (${produit.emplacement.zone})`
          : 'N/A';

        const rowStyle = quantite < 10 ? 'warningCell' : 'tableCell';

        tableBody.push([
          { text: produit.nom, style: rowStyle, alignment: 'left' },
          { text: String(quantite), style: rowStyle, alignment: 'center' },
          { text: emplacement, style: rowStyle, alignment: 'left' },
          { text: statut, style: rowStyle, alignment: 'center' }
        ]);
      });

      docDefinition = {
        pageSize: 'A4',
        pageMargins: [40, 60, 40, 60],
        fonts: {
          Roboto: {
            normal: 'Helvetica',
            bold: 'Helvetica-Bold',
            italics: 'Helvetica-Oblique',
            bolditalics: 'Helvetica-BoldOblique'
          }
        },
        header: {
          text: `RAPPORT ${rapport.type.toUpperCase()}`,
          style: 'header',
          alignment: 'center',
          margin: [40, 20, 40, 10]
        },
        footer: function(currentPage, pageCount) {
          return {
            text: `Page ${currentPage} sur ${pageCount} - Système de Gestion de Stock`,
            style: 'footer',
            alignment: 'center'
          };
        },
        content: [
          {
            text: 'Inventaire complet des produits en stock',
            style: 'subheader',
            alignment: 'center',
            margin: [0, 0, 0, 20]
          },
          {
            text: `Généré le: ${new Date(rapport.dategeneration).toLocaleString('fr-FR')}`,
            alignment: 'left',
            margin: [0, 0, 0, 5]
          },
          {
            text: generePar ? `Par: ${generePar.nom}` : 'Par: Système',
            alignment: 'left',
            margin: [0, 0, 0, 20]
          },
          {
            text: 'Détail des Produits',
            style: 'subheader',
            margin: [0, 0, 0, 10]
          },
          {
            table: {
              headerRows: 1,
              widths: ['*', 'auto', '*', 'auto'],
              body: tableBody
            },
            layout: {
              fillColor: function (rowIndex, node, columnIndex) {
                return (rowIndex % 2 === 0) ? '#F9FAFB' : null;
              },
              hLineWidth: function (i, node) {
                return (i === 0 || i === node.table.body.length) ? 2 : 1;
              },
              vLineWidth: function (i, node) {
                return (i === 0 || i === node.table.widths.length) ? 2 : 1;
              },
              hLineColor: function (i, node) {
                return '#E5E7EB';
              },
              vLineColor: function (i, node) {
                return '#E5E7EB';
              }
            }
          },
          {
            text: 'Résumé',
            style: 'subheader',
            margin: [0, 20, 0, 10]
          },
          {
            ul: [
              `Total produits: ${data.produits.length}`,
              `Total lots: ${data.totalLots}`,
              `Date rapport: ${new Date().toLocaleDateString('fr-FR')}`
            ],
            margin: [0, 0, 0, 20]
          }
        ],
        styles: styles
      };
    } else if (rapport.type === 'bilan') {
      docDefinition = {
        pageSize: 'A4',
        pageMargins: [40, 60, 40, 60],
        header: {
          text: `RAPPORT ${rapport.type.toUpperCase()}`,
          style: 'header',
          alignment: 'center',
          margin: [40, 20, 40, 10]
        },
        footer: function(currentPage, pageCount) {
          return {
            text: `Page ${currentPage} sur ${pageCount} - Système de Gestion de Stock`,
            style: 'footer',
            alignment: 'center'
          };
        },
        content: [
          {
            text: 'Bilan global du système de gestion',
            style: 'subheader',
            alignment: 'center',
            margin: [0, 0, 0, 20]
          },
          {
            text: `Généré le: ${new Date(rapport.dategeneration).toLocaleString('fr-FR')}`,
            alignment: 'left',
            margin: [0, 0, 0, 5]
          },
          {
            text: generePar ? `Par: ${generePar.nom}` : 'Par: Système',
            alignment: 'left',
            margin: [0, 0, 0, 20]
          },
          {
            text: 'Statistiques Générales',
            style: 'subheader',
            margin: [0, 0, 0, 10]
          },
          {
            columns: [
              {
                width: '*',
                table: {
                  body: [
                    [
                      { text: 'Total Produits', bold: true, fillColor: '#1F2937', color: '#FFFFFF', alignment: 'center' },
                      { text: String(data.totalProduits), alignment: 'center', fontSize: 24, bold: true }
                    ]
                  ]
                },
                layout: 'noBorders'
              },
              {
                width: '*',
                table: {
                  body: [
                    [
                      { text: 'Total Lots', bold: true, fillColor: '#6366F1', color: '#FFFFFF', alignment: 'center' },
                      { text: String(data.totalLots), alignment: 'center', fontSize: 24, bold: true }
                    ]
                  ]
                },
                layout: 'noBorders'
              },
              {
                width: '*',
                table: {
                  body: [
                    [
                      { text: 'Emplacements', bold: true, fillColor: '#10B981', color: '#FFFFFF', alignment: 'center' },
                      { text: String(data.totalEmplacements), alignment: 'center', fontSize: 24, bold: true }
                    ]
                  ]
                },
                layout: 'noBorders'
              },
              {
                width: '*',
                table: {
                  body: [
                    [
                      { text: 'Quantité Totale', bold: true, fillColor: '#F59E0B', color: '#FFFFFF', alignment: 'center' },
                      { text: String(data.quantiteTotal), alignment: 'center', fontSize: 24, bold: true }
                    ]
                  ]
                },
                layout: 'noBorders'
              }
            ],
            margin: [0, 0, 0, 20]
          },
          {
            text: 'Résumé Complet',
            style: 'subheader',
            margin: [0, 20, 0, 10]
          },
          {
            table: {
              headerRows: 0,
              widths: ['*', 'auto'],
              body: [
                [
                  { text: 'Produits actifs', bold: true },
                  { text: String(data.totalProduits), alignment: 'right' }
                ],
                [
                  { text: 'Lots en stock', bold: true },
                  { text: String(data.totalLots), alignment: 'right' }
                ],
                [
                  { text: 'Emplacements configurés', bold: true },
                  { text: String(data.totalEmplacements), alignment: 'right' }
                ],
                [
                  { text: 'Quantité totale en stock', bold: true },
                  { text: String(data.quantiteTotal) + ' unités', alignment: 'right' }
                ]
              ]
            },
            layout: {
              fillColor: function (rowIndex, node, columnIndex) {
                return (rowIndex % 2 === 0) ? '#F9FAFB' : null;
              }
            }
          }
        ],
        styles: styles
      };
    }

    const pdfDoc = pdfMake.createPdf(docDefinition);
    return await pdfDoc.getBuffer();
  } catch (error) {
    throw error;
  }
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
    
    console.log(`📊 GET Rapports - Page: ${page}, Limite: ${limit}, Total: ${total}, Trouvés: ${rapports.length}`);
    
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
    console.error('❌ Erreur GET rapports:', err.message);
    res.status(500).json({ message: err.message });
  }
});

// POST /api/rapports/generer — générer inventaire ou bilan
router.post('/generer', protect, authorize('admin', 'gestionnaire'), async (req, res) => {
  try {
    const { type } = req.body;
    
    // Validation du type
    if (!type || !['inventaire', 'bilan'].includes(type)) {
      return res.status(400).json({ message: 'Type de rapport invalide. Utilisez "inventaire" ou "bilan"' });
    }

    console.log(`📊 Génération rapport ${type} par ${req.user._id}`);
    let data = {};

    if (type === 'inventaire') {
      const produits = await Produit.find().populate('emplacement', 'nomemplacement zone');
      const lots = await Lot.find().populate('produit', 'nom codebarre');
      data = { produits, lots, totalProduits: produits.length, totalLots: lots.length };
      console.log(`✅ Inventaire: ${produits.length} produits, ${lots.length} lots`);
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
      console.log(`✅ Bilan: ${totalProduits} produits, ${totalLots} lots, ${totalEmplacements} emplacements, Qté: ${data.quantiteTotal}`);
    }

    const rapport = await Rapport.create({ type, data, generePar: req.user._id });
    console.log(`✅ Rapport créé: ${rapport._id}`);
    res.status(201).json(rapport);
  } catch (err) {
    console.error('❌ Erreur génération rapport:', err.message);
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
      const totalLots = lots.length;
      data = { produits, lots, totalLots, totalProduits: produits.length };
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

    const pdfBuffer = await generatePDF(rapport, data, rapport.generePar);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=rapport-${rapport.type}-${rapport._id}.pdf`);
    res.send(pdfBuffer);
  } catch (err) {
    console.error('❌ Erreur génération PDF:', err.message);
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
