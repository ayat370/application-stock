const express = require('express');
const router = express.Router();
const mouvementStockController = require('../controllers/mouvementStockController');
const { protect, authorize } = require('../middleware/auth');

// Toutes les routes sont protégées
router.use(protect);

// ===== ROUTES STATIQUES SPÉCIFIQUES (AVANT les routes dynamiques) =====

// GET - Récupère le résumé/statistiques
router.get('/stats/resume', mouvementStockController.getResume);

// GET - Obtient les statistiques par type
router.get('/stats/parType', mouvementStockController.getStatParType);

// POST - Ajoute du stock (entrée)
router.post('/entree/create', mouvementStockController.entreeStock);

// POST - Retire du stock (sortie)
router.post('/sortie/create', mouvementStockController.sortieStock);

// POST - Transfert entre emplacements
router.post('/transfert/create', mouvementStockController.transfertStock);

// POST - Annule un mouvement en créant un mouvement inverse
router.post('/:id/annuler', mouvementStockController.annulerMouvement);
// Supporte également le format alternatif /annuler/:id pour éviter les erreurs de chemin
router.post('/annuler/:id', mouvementStockController.annulerMouvement);

// ===== ROUTES DYNAMIQUES (APRÈS les routes statiques) =====

// GET - Récupère la liste des mouvements
router.get('/', mouvementStockController.getMouvements);

// GET - Récupère un mouvement spécifique
router.get('/:id', mouvementStockController.getMouvementById);

// PUT - Met à jour un mouvement
router.put('/:id', mouvementStockController.updateMouvement);

// DELETE - Supprime un mouvement
router.delete('/:id', mouvementStockController.deleteMouvement);

module.exports = router;
