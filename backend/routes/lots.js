const express = require('express');
const router = express.Router();
const Lot = require('../models/Lot');
const Notification = require('../models/Notification');
const { protect, authorize } = require('../middleware/auth');
const { sendEmail } = require('../config/email');

// GET /api/lots
router.get('/', protect, async (req, res) => {
  try {
    const { produitId, search, page = 1, limit = 10, sortBy = 'datecreation', sortOrder = 'desc' } = req.query;
    let query = produitId ? { produit: produitId } : {};
    
    if (search) {
      query.$or = [
        { idlot: { $regex: search, $options: 'i' } },
        { 'produit.nom': { $regex: search, $options: 'i' } }
      ];
    }
    
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    const skip = (page - 1) * limit;
    const lots = await Lot.find(query)
      .populate('produit', 'nom codebarre')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Lot.countDocuments(query);
    
    res.json({
      lots,
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

// GET /api/lots/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const lot = await Lot.findById(req.params.id).populate('produit');
    if (!lot) return res.status(404).json({ message: 'Lot non trouvé' });
    res.json(lot);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/lots — admin ou gestionnaire
router.post('/', protect, authorize('admin', 'gestionnaire'), async (req, res) => {
  try {
    console.log('Création lot - Données reçues:', req.body);
    const lot = await Lot.create(req.body);
    console.log('Lot créé:', lot);
    await lot.populate('produit', 'nom');
    // Notification
    const admins = await require('../models/User').find({ role: { $in: ['admin', 'gestionnaire'] } });
    const emails = admins.map(a => a.email).join(',');
    await sendEmail({
      to: emails,
      subject: '📦 Nouveau lot créé',
      html: `<p>Lot <strong>${lot.idlot}</strong> créé pour le produit <strong>${lot.produit?.nom}</strong>. Quantité: ${lot.quantite}</p>`,
    });
    await Notification.create({
      message: `Nouveau lot créé pour ${lot.produit?.nom}: ${lot.idlot}`,
      userId: req.user._id,
    });
    res.status(201).json(lot);
  } catch (err) {
    console.error('Erreur création lot:', err.message);
    res.status(400).json({ message: err.message });
  }
});

// PUT /api/lots/:id — admin ou gestionnaire
router.put('/:id', protect, authorize('admin', 'gestionnaire'), async (req, res) => {
  try {
    const lot = await Lot.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!lot) return res.status(404).json({ message: 'Lot non trouvé' });
    res.json(lot);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE /api/lots/:id — admin uniquement
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const lot = await Lot.findByIdAndDelete(req.params.id);
    if (!lot) return res.status(404).json({ message: 'Lot non trouvé' });
    res.json({ message: 'Lot supprimé' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
