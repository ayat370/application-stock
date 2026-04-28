# 🚀 QUICK START - Gestion des Mouvements de Stock

Démarrez rapidement la nouvelle fonctionnalité!

---

## ⚡ Démarrage en 3 étapes

### 1️⃣ Vérifier l'intégration

```bash
cd ProjetStock
node check-integration.js
```

Cela vérifie que tous les fichiers sont en place. ✅ = Bon à aller!

### 2️⃣ Démarrer le Backend

```bash
cd backend
npm run dev
```

Le serveur démarre sur `http://localhost:5000`

**Vous devez voir :**
```
🚀 API Stock fonctionnelle
MongoDB connected
```

### 3️⃣ Démarrer le Frontend

```bash
cd frontend
npx expo start
```

- **Appuyez sur `a`** pour l'émulateur Android
- **Appuyez sur `i`** pour le simulateur iOS
- **Scannez le QR code** pour tester sur téléphone

---

## 🧪 Test Immédiat

### Via l'App

1. **Connectez-vous** avec vos identifiants
2. **Aller à l'onglet "↔️ Mouvements"** (nouveau!)
3. **Cliquez "+ Entrée"** pour tester

### Via l'API (Thunder Client / Postman)

```bash
# 1. Se connecter
POST http://localhost:5000/api/auth/login
Body:
{
  "email": "user@example.com",
  "password": "password123"
}

# Copier le token retourné

# 2. Créer une entrée
POST http://localhost:5000/api/mouvements/entree/create
Headers: Authorization: Bearer TOKEN_ICI
Body:
{
  "produit": "ID_PRODUIT",
  "quantite": 50,
  "emplacement": "ID_EMPLACEMENT",
  "description": "Test",
  "reference": "TEST-001"
}

# 3. Voir tous les mouvements
GET http://localhost:5000/api/mouvements
Headers: Authorization: Bearer TOKEN_ICI
```

---

## 📋 Exemples Rapides

### Tester une Entrée

```javascript
// Copier dans le navigateur console (app React)
api.post('/mouvements/entree/create', {
  produit: 'ID_PRODUIT',
  quantite: 25,
  emplacement: 'ID_EMPLACEMENT',
  description: 'Test entrée',
  reference: 'QUICK-001'
}).then(r => console.log('✅', r.data))
  .catch(e => console.error('❌', e.message));
```

### Tester une Sortie

```javascript
api.post('/mouvements/sortie/create', {
  produit: 'ID_PRODUIT',
  quantite: 10,
  emplacement: 'ID_EMPLACEMENT',
  description: 'Test sortie',
  reference: 'QUICK-002'
}).then(r => console.log('✅', r.data))
  .catch(e => console.error('❌', e.message));
```

### Voir l'Historique

```javascript
api.get('/mouvements?page=1&limit=10')
  .then(r => console.log('📋', r.data.mouvements))
  .catch(e => console.error('❌', e.message));
```

---

## 🎯 Fonctionnalités à Tester

### ✅ Checklist de Test

- [ ] **Écran Mouvements** s'affiche
- [ ] **Boutons d'action** (Entrée, Sortie, Transfert) fonctionnent
- [ ] **Formulaire d'entrée** fonctionne
  - [ ] Sélection de produit OK
  - [ ] Sélection d'emplacement OK
  - [ ] Validation des quantités OK
- [ ] **Formulaire de sortie** fonctionne
  - [ ] Vérification du stock OK
  - [ ] Rejet si stock insuffisant OK
- [ ] **Formulaire de transfert** fonctionne
  - [ ] 2 emplacements requis OK
- [ ] **Historique** s'affiche
- [ ] **Filtres** par type fonctionnent
- [ ] **Modal Statistiques** affiche les stats
- [ ] **Détail d'un mouvement** s'affiche
- [ ] **Pagination** fonctionne

---

## 🐛 Dépannage Rapide

| Problème | Solution |
|----------|----------|
| **"Stock insuffisant"** | Créer une entrée avant de tester une sortie |
| **"Produit/Lot non trouvé"** | Vérifier l'ID dans la base MongoDB |
| **L'onglet Mouvements n'existe pas** | Vérifier AppNavigator.js importe MouvementsScreen |
| **401 Unauthorized** | Token expiré, se reconnecter |
| **Erreur de connexion API** | Vérifier que le backend tourne sur port 5000 |

---

## 📞 Besoin d'Aide?

| Ressource | Contenu |
|-----------|---------|
| **MOUVEMENT_STOCK_GUIDE.md** | 📖 Documentation complète |
| **README.md** | 📚 Vue d'ensemble du projet |
| **backend/test-mouvements-api.js** | 🧪 Exemples API détaillés |
| **check-integration.js** | ✅ Vérification d'intégration |

---

## 🎉 Vous êtes Prêt!

La gestion des mouvements de stock est maintenant **entièrement intégrée**:

✅ Backend avec API complète  
✅ Frontend avec écrans professionnels  
✅ Validation et règles métier  
✅ Audit et historique  
✅ Statistiques et rapports  

**Bon test! 🚀**

---

## 💡 Tips Pro

1. **Tester en Mobile** — L'app est conçue pour mobile
2. **Utiliser les Filtres** — Facile de retrouver les mouvements
3. **Consulter les Stats** — Elles montrent le bilan en temps réel
4. **Références utiles** — Toujours ajouter une référence (facture, etc.)
5. **Descriptions** — Utiles pour l'audit et historique

---

## 🔄 Workflow Suggéré

```
1. Créer des produits + lots (si pas déjà fait)
   ↓
2. Créer des emplacements (si pas déjà fait)
   ↓
3. Tester une ENTRÉE (+ Quantité)
   ↓
4. Voir l'historique (résumé du stock)
   ↓
5. Tester une SORTIE (- Quantité)
   ↓
6. Tester un TRANSFERT (entre deux zones)
   ↓
7. Consulter les STATISTIQUES
   ↓
✅ Succès!
```

---

Dernière actualisation: 2024-04-27  
Version: 1.0 - Gestion Complète des Mouvements de Stock
