/**
 * 🧪 Tests API - Gestion des Mouvements de Stock
 * 
 * Ce fichier contient des exemples de requêtes pour tester l'API des mouvements
 * 
 * Usage:
 * 1. Remplacer les variables PLACEHOLDERS par des vraies valeurs (IDs, tokens)
 * 2. Envoyer les requêtes via Postman, cURL, ou directly via fetch
 */

// ============================================
// 🔐 AUTHENTIFICATION - À FAIRE EN PREMIER
// ============================================

// POST - Se connecter et récupérer le token
const LOGIN = {
  method: 'POST',
  url: 'http://localhost:5000/api/auth/login',
  body: {
    email: 'user@example.com',
    password: 'password123'
  },
  expected: {
    token: 'eyJhbGciOiJIUzI1NiIs...',
    user: { id: 'USER_ID', nom: 'John', role: 'gestionnaire' }
  }
};

// ============================================
// 📦 RÉCUPÉRER LES DONNÉES NÉCESSAIRES
// ============================================

// GET - Tous les produits (pour choisir un produit)
const GET_PRODUITS = {
  method: 'GET',
  url: 'http://localhost:5000/api/produits?limit=100',
  headers: { 'Authorization': 'Bearer TOKEN_HERE' },
  expected: {
    produits: [
      { _id: 'PRODUIT_ID_1', nom: 'Produit A', codebarre: '123456' },
      { _id: 'PRODUIT_ID_2', nom: 'Produit B', codebarre: '789012' }
    ]
  }
};

// GET - Tous les lots d'un produit
const GET_LOTS = {
  method: 'GET',
  url: 'http://localhost:5000/api/lots?produit=PRODUIT_ID_1&limit=100',
  headers: { 'Authorization': 'Bearer TOKEN_HERE' },
  expected: {
    lots: [
      { _id: 'LOT_ID_1', idlot: 'LOT-2024-001', quantite: 100 },
      { _id: 'LOT_ID_2', idlot: 'LOT-2024-002', quantite: 50 }
    ]
  }
};

// GET - Tous les emplacements
const GET_EMPLACEMENTS = {
  method: 'GET',
  url: 'http://localhost:5000/api/emplacements?limit=100',
  headers: { 'Authorization': 'Bearer TOKEN_HERE' },
  expected: {
    emplacements: [
      { _id: 'EMPL_ID_1', nomemplacement: 'Entrepôt A', zone: 'A1' },
      { _id: 'EMPL_ID_2', nomemplacement: 'Magasin B', zone: 'B2' }
    ]
  }
};

// ============================================
// ✅ CRÉER DES MOUVEMENTS
// ============================================

// POST - ENTRÉE de stock
const CREATE_ENTREE = {
  method: 'POST',
  url: 'http://localhost:5000/api/mouvements/entree/create',
  headers: {
    'Authorization': 'Bearer TOKEN_HERE',
    'Content-Type': 'application/json'
  },
  body: {
    produit: 'PRODUIT_ID_1',
    lot: 'LOT_ID_1',  // optionnel
    quantite: 50,
    emplacement: 'EMPL_ID_1',  // emplacement destinataire
    description: 'Réception commande fournisseur',
    reference: 'BL-2024-001'
  },
  expected: {
    success: true,
    message: 'Entrée de stock enregistrée',
    mouvement: {
      _id: 'MOUVEMENT_ID',
      type: 'entrée',
      quantite: 50,
      statut: 'approuvé'
    }
  }
};

// POST - SORTIE de stock
const CREATE_SORTIE = {
  method: 'POST',
  url: 'http://localhost:5000/api/mouvements/sortie/create',
  headers: {
    'Authorization': 'Bearer TOKEN_HERE',
    'Content-Type': 'application/json'
  },
  body: {
    produit: 'PRODUIT_ID_1',
    lot: 'LOT_ID_1',
    quantite: 30,
    emplacement: 'EMPL_ID_1',  // emplacement source
    description: 'Préparation commande client',
    reference: 'CMD-2024-001'
  },
  expected: {
    success: true,
    message: 'Sortie de stock enregistrée',
    mouvement: { type: 'sortie', quantite: 30, statut: 'approuvé' }
  }
};

// POST - TRANSFERT entre emplacements
const CREATE_TRANSFERT = {
  method: 'POST',
  url: 'http://localhost:5000/api/mouvements/transfert/create',
  headers: {
    'Authorization': 'Bearer TOKEN_HERE',
    'Content-Type': 'application/json'
  },
  body: {
    produit: 'PRODUIT_ID_1',
    lot: 'LOT_ID_1',
    quantite: 20,
    emplacementSource: 'EMPL_ID_1',
    emplacementDestinaire: 'EMPL_ID_2',
    description: 'Réorganisation du stock',
    reference: 'TRANSFER-001'
  },
  expected: {
    success: true,
    message: 'Transfert de stock enregistré',
    mouvement: { type: 'transfert', quantite: 20, statut: 'approuvé' }
  }
};

// ============================================
// 📋 CONSULTER LES MOUVEMENTS
// ============================================

// GET - Tous les mouvements (avec pagination)
const GET_ALL_MOUVEMENTS = {
  method: 'GET',
  url: 'http://localhost:5000/api/mouvements?page=1&limit=20&sortBy=dateMouvement&sortOrder=desc',
  headers: { 'Authorization': 'Bearer TOKEN_HERE' },
  expected: {
    mouvements: [
      {
        _id: 'ID',
        type: 'entrée',
        quantite: 50,
        produit: { nom: 'Produit A' },
        dateMouvement: '2024-04-27T10:30:00Z'
      }
    ],
    pagination: { page: 1, limit: 20, total: 45, pages: 3 },
    bilan: { entrée: 150, sortie: 80, transfert: 20 }
  }
};

// GET - Mouvements filtrés par type
const GET_MOUVEMENTS_BY_TYPE = {
  method: 'GET',
  url: 'http://localhost:5000/api/mouvements?type=entrée&page=1&limit=10',
  headers: { 'Authorization': 'Bearer TOKEN_HERE' },
  notes: 'Types disponibles: entrée, sortie, transfert'
};

// GET - Mouvements d'un produit spécifique
const GET_MOUVEMENTS_BY_PRODUIT = {
  method: 'GET',
  url: 'http://localhost:5000/api/mouvements?produit=PRODUIT_ID_1&page=1&limit=10',
  headers: { 'Authorization': 'Bearer TOKEN_HERE' }
};

// GET - Mouvements dans une plage de dates
const GET_MOUVEMENTS_BY_DATE = {
  method: 'GET',
  url: 'http://localhost:5000/api/mouvements?dateDebut=2024-04-01&dateFin=2024-04-30&page=1&limit=10',
  headers: { 'Authorization': 'Bearer TOKEN_HERE' }
};

// GET - Détail d'un mouvement spécifique
const GET_MOUVEMENT_DETAIL = {
  method: 'GET',
  url: 'http://localhost:5000/api/mouvements/MOUVEMENT_ID',
  headers: { 'Authorization': 'Bearer TOKEN_HERE' },
  expected: {
    _id: 'MOUVEMENT_ID',
    type: 'entrée',
    quantite: 50,
    produit: { _id: 'ID', nom: 'Produit A', codebarre: '123456' },
    lot: { _id: 'ID', idlot: 'LOT-2024-001', quantite: 100 },
    emplacementDestinaire: { _id: 'ID', nomemplacement: 'Entrepôt A', zone: 'A1' },
    utilisateur: { nom: 'John Doe', email: 'john@example.com' },
    dateMouvement: '2024-04-27T10:30:00Z',
    description: 'Réception commande',
    reference: 'BL-2024-001',
    statut: 'approuvé'
  }
};

// ============================================
// 📊 STATISTIQUES
// ============================================

// GET - Résumé du stock par produit
const GET_RESUME_STOCK = {
  method: 'GET',
  url: 'http://localhost:5000/api/mouvements/stats/resume',
  headers: { 'Authorization': 'Bearer TOKEN_HERE' },
  expected: {
    resume: [
      {
        _id: 'PRODUIT_ID',
        produit: 'Produit A',
        codebarre: '123456',
        entrees: 150,
        sorties: 80,
        transferts: 20,
        bilan: 90
      }
    ],
    totalLignes: 1,
    bilanGlobal: { entrees: 150, sorties: 80, transferts: 20, bilan: 90 }
  }
};

// GET - Statistiques par type de mouvement
const GET_STATS_PAR_TYPE = {
  method: 'GET',
  url: 'http://localhost:5000/api/mouvements/stats/parType',
  headers: { 'Authorization': 'Bearer TOKEN_HERE' },
  expected: [
    { _id: 'entrée', count: 25, totalQuantite: 500 },
    { _id: 'sortie', count: 18, totalQuantite: 300 },
    { _id: 'transfert', count: 12, totalQuantite: 200 }
  ]
};

// ============================================
// ✏️ MODIFIER UN MOUVEMENT
// ============================================

// PUT - Mettre à jour un mouvement
const UPDATE_MOUVEMENT = {
  method: 'PUT',
  url: 'http://localhost:5000/api/mouvements/MOUVEMENT_ID',
  headers: {
    'Authorization': 'Bearer TOKEN_HERE',
    'Content-Type': 'application/json'
  },
  body: {
    description: 'Description mise à jour',
    reference: 'REF-UPDATED',
    statut: 'approuvé'
  },
  expected: {
    success: true,
    message: 'Mouvement mis à jour',
    mouvement: {
      _id: 'MOUVEMENT_ID',
      description: 'Description mise à jour'
    }
  }
};

// ============================================
// ❌ SUPPRIMER UN MOUVEMENT
// ============================================

// DELETE - Supprimer un mouvement (seulement s'il est en_attente)
const DELETE_MOUVEMENT = {
  method: 'DELETE',
  url: 'http://localhost:5000/api/mouvements/MOUVEMENT_ID',
  headers: { 'Authorization': 'Bearer TOKEN_HERE' },
  expected: {
    success: true,
    message: 'Mouvement supprimé'
  },
  notes: 'Seuls les mouvements avec le statut "en_attente" peuvent être supprimés'
};

// ============================================
// 🧪 SCRIPT DE TEST COMPLET (Node.js/JavaScript)
// ============================================

/*
// Importer axios si vous utilisez Node.js
const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';
let TOKEN = '';

// 1. Se connecter
async function login() {
  try {
    const res = await axios.post(`${API_BASE}/auth/login`, {
      email: 'user@example.com',
      password: 'password123'
    });
    TOKEN = res.data.token;
    console.log('✅ Connecté - Token:', TOKEN);
    return TOKEN;
  } catch (e) {
    console.error('❌ Erreur login:', e.message);
  }
}

// 2. Récupérer les données
async function getInitialData() {
  try {
    const [prodRes, emplRes] = await Promise.all([
      axios.get(`${API_BASE}/produits?limit=100`, {
        headers: { 'Authorization': `Bearer ${TOKEN}` }
      }),
      axios.get(`${API_BASE}/emplacements?limit=100`, {
        headers: { 'Authorization': `Bearer ${TOKEN}` }
      })
    ]);
    
    const produit = prodRes.data.produits[0];
    const emplacement = emplRes.data.emplacements[0];
    
    console.log('📦 Produit:', produit.nom);
    console.log('📍 Emplacement:', emplacement.nomemplacement);
    
    return { produit, emplacement };
  } catch (e) {
    console.error('❌ Erreur getData:', e.message);
  }
}

// 3. Créer une entrée
async function createEntree(produitId, emplacementId) {
  try {
    const res = await axios.post(`${API_BASE}/mouvements/entree/create`, {
      produit: produitId,
      quantite: 50,
      emplacement: emplacementId,
      description: 'Test entrée',
      reference: 'TEST-001'
    }, {
      headers: { 'Authorization': `Bearer ${TOKEN}` }
    });
    
    console.log('✅ Entrée créée:', res.data.mouvement._id);
    return res.data.mouvement;
  } catch (e) {
    console.error('❌ Erreur createEntree:', e.response?.data?.message || e.message);
  }
}

// 4. Consulter les mouvements
async function getMouvements() {
  try {
    const res = await axios.get(`${API_BASE}/mouvements?page=1&limit=10`, {
      headers: { 'Authorization': `Bearer ${TOKEN}` }
    });
    
    console.log('📋 Mouvements:', res.data.mouvements.length);
    console.log('Bilan:', res.data.bilan);
    return res.data.mouvements;
  } catch (e) {
    console.error('❌ Erreur getMouvements:', e.message);
  }
}

// 5. Exécuter tous les tests
async function runAllTests() {
  console.log('🚀 Démarrage des tests...\n');
  
  await login();
  const { produit, emplacement } = await getInitialData();
  const mouvement = await createEntree(produit._id, emplacement._id);
  await getMouvements();
  
  console.log('✅ Tests terminés!');
}

// runAllTests();
*/

// ============================================
// 📝 NOTES
// ============================================

/*
REMPLACEMENTS OBLIGATOIRES:
- TOKEN_HERE → Votre jeton JWT après login
- PRODUIT_ID_1 → ID réel d'un produit
- LOT_ID_1 → ID réel d'un lot
- EMPL_ID_1 → ID réel d'un emplacement
- MOUVEMENT_ID → ID réel d'un mouvement créé

ERREURS COURANTES:
- "Stock insuffisant" → La quantité dépasse le lot disponible
- "Lot non trouvé" → Vérifier l'ID du lot
- "Mouvement non trouvé" → L'ID est incorrect
- "Unauthorized" → Token expiré ou manquant

BONNES PRATIQUES:
✅ Toujours s'authentifier en premier
✅ Utiliser les IDs retournés par les requêtes précédentes
✅ Vérifier le stock avant une sortie
✅ Fournir des références pertinentes
✅ Tester d'abord en développement
*/

module.exports = {
  LOGIN,
  GET_PRODUITS,
  GET_LOTS,
  GET_EMPLACEMENTS,
  CREATE_ENTREE,
  CREATE_SORTIE,
  CREATE_TRANSFERT,
  GET_ALL_MOUVEMENTS,
  GET_RESUME_STOCK,
  GET_STATS_PAR_TYPE,
  UPDATE_MOUVEMENT,
  DELETE_MOUVEMENT
};
