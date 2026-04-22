const express = require('express');
const router = express.Router();
const Emplacement = require('../models/Emplacement');
const { protect, authorize } = require('../middleware/auth');

// GET /api/emplacements
router.get('/', protect, async (req, res) => {
  try {
    const emplacements = await Emplacement.find();
    res.json(emplacements);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/emplacements/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const emp = await Emplacement.findById(req.params.id);
    if (!emp) return res.status(404).json({ message: 'Emplacement non trouvé' });
    res.json(emp);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/emplacements — admin ou gestionnaire
router.post('/', protect, authorize('admin', 'gestionnaire'), async (req, res) => {
  try {
    const emp = await Emplacement.create(req.body);
    res.status(201).json(emp);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT /api/emplacements/:id — admin ou gestionnaire
router.put('/:id', protect, authorize('admin', 'gestionnaire'), async (req, res) => {
  try {
    const emp = await Emplacement.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!emp) return res.status(404).json({ message: 'Emplacement non trouvé' });
    res.json(emp);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE /api/emplacements/:id — admin uniquement
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    await Emplacement.findByIdAndDelete(req.params.id);
    res.json({ message: 'Emplacement supprimé' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
