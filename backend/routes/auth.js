const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');
const multer = require('multer');

// Configuration multer pour upload d'images
const storage = multer.memoryStorage(); // Stockage en mémoire
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Seules les images sont autorisées'));
    }
  },
});

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE });

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { login, mdp } = req.body;
    const user = await User.findOne({ login });
    if (!user || !(await user.comparePassword(mdp))) {
      return res.status(401).json({ message: 'Identifiants incorrects' });
    }
    res.json({
      token: generateToken(user._id),
      user: {
        id: user._id,
        nom: user.nom,
        role: user.role,
        email: user.email,
        login: user.login,
        profilePhoto: user.profilePhoto || null,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/auth/me
router.get('/me', protect, (req, res) => {
  res.json(req.user);
});

// PUT /api/auth/profil — modifier son propre profil
router.put('/profil', protect, async (req, res) => {
  try {
    const { nom, email } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { nom, email },
      { new: true, runValidators: true }
    ).select('-mdp');
    res.json(user);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT /api/auth/profil/photo — uploader photo de profil
router.put('/profil/photo', protect, upload.single('photo'), async (req, res) => {
  try {
    console.log('UPLOAD PHOTO ROUTE - headers:', req.headers['content-type']);
    console.log('UPLOAD PHOTO ROUTE - body keys:', Object.keys(req.body));
    console.log('UPLOAD PHOTO ROUTE - file:', req.file ? { fieldname: req.file.fieldname, mimetype: req.file.mimetype, size: req.file.size } : null);

    let profilePhoto = null;

    if (req.file) {
      const base64 = req.file.buffer.toString('base64');
      const mimeType = req.file.mimetype;
      profilePhoto = `data:${mimeType};base64,${base64}`;
    } else if (req.body.photoBase64) {
      profilePhoto = req.body.photoBase64;
    }

    if (!profilePhoto) {
      return res.status(400).json({ message: 'Aucune image fournie' });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { profilePhoto },
      { new: true }
    ).select('-mdp');

    res.json(user);
  } catch (err) {
    console.error('UPLOAD PHOTO ERROR:', err);
    res.status(400).json({ message: err.message });
  }
});

// POST /api/auth/register — Admin uniquement
router.post('/register', protect, authorize('admin'), async (req, res) => {
  try {
    const { nom, login, mdp, role, email } = req.body;
    const user = await User.create({ nom, login, mdp, role, email });
    res.status(201).json({ id: user._id, nom: user.nom, role: user.role });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// GET /api/auth/users — Admin uniquement
router.get('/users', protect, authorize('admin'), async (req, res) => {
  try {
    const users = await User.find().select('-mdp');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/auth/users/:id — Admin uniquement
router.delete('/users/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const userId = req.params.id;
    const currentUser = req.user;

    // Empêcher la suppression de soi-même
    if (userId === currentUser._id.toString()) {
      return res.status(400).json({ message: 'Vous ne pouvez pas vous supprimer vous-même' });
    }

    // Vérifier qu'il reste au moins un admin
    const userToDelete = await User.findById(userId);
    if (!userToDelete) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    if (userToDelete.role === 'admin') {
      const adminCount = await User.countDocuments({ role: 'admin' });
      if (adminCount <= 1) {
        return res.status(400).json({ message: 'Il doit rester au moins un administrateur' });
      }
    }

    await User.findByIdAndDelete(userId);
    res.json({ message: 'Utilisateur supprimé' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
