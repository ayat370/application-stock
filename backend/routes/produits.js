const express = require('express');
const router = express.Router();
const Produit = require('../models/Produit');
const Notification = require('../models/Notification');
const { protect, authorize } = require('../middleware/auth');
const { sendEmail } = require('../config/email');

// GET /api/produits — tous les rôles
router.get('/', protect, async (req, res) => {
  try {
    const { search, page = 1, limit = 10, sortBy = 'nom', sortOrder = 'asc', emplacement } = req.query;
    let query = {};
    
    if (search) {
      query.$or = [{ nom: { $regex: search, $options: 'i' } }, { codebarre: search }];
    }
    
    if (emplacement) {
      query.emplacement = emplacement;
    }
    
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    const skip = (page - 1) * limit;
    const produits = await Produit.find(query)
      .populate('emplacement', 'nomemplacement zone')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Produit.countDocuments(query);
    
    res.json({
      produits,
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

// GET /api/produits/codebarre/:code — scanner
router.get('/codebarre/:code', protect, async (req, res) => {
  try {
    const produit = await Produit.findOne({ codebarre: req.params.code }).populate('emplacement');
    if (!produit) return res.status(404).json({ message: 'Produit non trouvé' });
    res.json(produit);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/produits/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const produit = await Produit.findById(req.params.id).populate('emplacement');
    if (!produit) return res.status(404).json({ message: 'Produit non trouvé' });
    res.json(produit);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/produits — admin ou gestionnaire
router.post('/', protect, authorize('admin', 'gestionnaire'), async (req, res) => {
  try {
    console.log('Création produit - Données reçues:', req.body);
    const produit = await Produit.create(req.body);
    console.log('Produit créé:', produit);
    // Notification email
    const admins = await require('../models/User').find({ role: { $in: ['admin', 'gestionnaire'] } });
    const emails = admins.map(a => a.email).join(',');
    await sendEmail({
      to: emails,
      subject: '✅ Nouveau produit ajouté',
      html: `<p>Le produit <strong>${produit.nom}</strong> (${produit.codebarre}) a été ajouté.</p>`,
    });
    await Notification.create({
      message: `Nouveau produit ajouté: ${produit.nom}`,
      userId: req.user._id,
    });
    res.status(201).json(produit);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT /api/produits/:id — admin ou gestionnaire
router.put('/:id', protect, authorize('admin', 'gestionnaire'), async (req, res) => {
  try {
    const produit = await Produit.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!produit) return res.status(404).json({ message: 'Produit non trouvé' });
    res.json(produit);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE /api/produits/:id — admin uniquement
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    console.log('DELETE /api/produits/:', req.params.id, 'par user:', req.user?.nom, 'role:', req.user?.role);
    const produit = await Produit.findByIdAndDelete(req.params.id);
    if (!produit) {
      console.log('Produit non trouvé:', req.params.id);
      return res.status(404).json({ message: 'Produit non trouvé' });
    }
    console.log('Produit supprimé:', produit.nom);
    res.json({ message: 'Produit supprimé' });
  } catch (err) {
    console.error('Erreur suppression:', err.message);
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/produits/:id/seuil — admin ou gestionnaire
router.put('/:id/seuil', protect, authorize('admin', 'gestionnaire'), async (req, res) => {
  try {
    const { seuilMinimum } = req.body;
    if (seuilMinimum < 0) return res.status(400).json({ message: 'Le seuil minimum doit être positif' });

    const produit = await Produit.findByIdAndUpdate(
      req.params.id,
      { seuilMinimum },
      { new: true, runValidators: true }
    ).populate('emplacement');

    if (!produit) return res.status(404).json({ message: 'Produit non trouvé' });

    res.json(produit);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
