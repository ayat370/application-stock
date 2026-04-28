# 📦 Guide - Gestion des Mouvements de Stock

## Vue d'ensemble

Cette nouvelle fonctionnalité permet une gestion professionnelle et complète des mouvements de stock, avec suivi détaillé des entrées, sorties et transferts entre emplacements.

---

## 🗄️ Architecture Backend

### 1. Modèle de Données (`models/MouvementStock.js`)

```javascript
{
  _id: ObjectId,
  produit: ObjectId (ref: Produit),
  lot: ObjectId (ref: Lot),
  type: "entrée" | "sortie" | "transfert",
  quantite: Number,
  emplacementSource: ObjectId (ref: Emplacement),
  emplacementDestinaire: ObjectId (ref: Emplacement),
  dateMouvement: Date,
  description: String,
  utilisateur: ObjectId (ref: User),
  statut: "en_attente" | "approuvé" | "rejeté",
  reference: String (Facture, BL, etc.),
  createdAt: Date,
  updatedAt: Date
}
```

### 2. Service Métier (`services/mouvementStockService.js`)

#### Fonctions principales :

- **`ajouterStock(params)`** - Enregistre une entrée de stock
  - Augmente la quantité du lot
  - Crée un mouvement de type "entrée"
  - Génère une notification

- **`retirerStock(params)`** - Enregistre une sortie de stock
  - Vérifie la disponibilité suffisante
  - Diminue la quantité du lot
  - Crée un mouvement de type "sortie"

- **`transfererStock(params)`** - Transfère entre emplacements
  - Enregistre un mouvement de type "transfert"
  - Référence l'emplacement source et destinataire

- **`afficherStock(filters)`** - Récupère l'historique avec filtres
  - Pagination
  - Filtres par type, produit, lot, date
  - Calcul du bilan par type

- **`obtenirResumStock(filters)`** - Résumé agrégé par produit
  - Entrees, Sorties, Transferts
  - Bilan net

### 3. Contrôleur (`controllers/mouvementStockController.js`)

#### Endpoints :

```
GET    /api/mouvements              - Liste tous les mouvements (avec pagination/filtres)
GET    /api/mouvements/:id          - Détail d'un mouvement
GET    /api/mouvements/stats/resume - Résumé du stock
GET    /api/mouvements/stats/parType - Statistiques par type

POST   /api/mouvements/entree/create   - Créer une entrée
POST   /api/mouvements/sortie/create   - Créer une sortie
POST   /api/mouvements/transfert/create - Créer un transfert

PUT    /api/mouvements/:id         - Mettre à jour un mouvement
DELETE /api/mouvements/:id         - Supprimer un mouvement (en_attente seulement)
```

### 4. Routes (`routes/mouvements.js`)

Toutes les routes nécessitent l'authentification (`protect` middleware).

---

## 🎨 Architecture Frontend

### Écrans

#### 1. **MouvementsScreen.js** - Historique des mouvements
- Affiche tous les mouvements en tableau/liste
- Filtrage par type (Entrée, Sortie, Transfert)
- Pagination
- Boutons pour créer : Entrée, Sortie, Transfert, Statistiques
- Modal de statistiques par type

#### 2. **MouvementFormScreen.js** - Formulaire dynamique
- S'adapte selon le type (entrée/sortie/transfert)
- Sélecteurs pour :
  - Produit (avec recherche)
  - Lot (liste des lots du produit)
  - Emplacement(s) source/destinataire
- Validation en temps réel
- Support des références (facture, BL)
- Description optionnelle

#### 3. **MouvementDetailScreen.js** - Détail d'un mouvement
- Affichage complet des informations
- Dates formatées
- Informations sur le produit, lot, utilisateur
- Boutons : Modifier, Supprimer (si en_attente)
- Bilan visuel avec couleurs

### Navigation

Intégration dans `AppNavigator.js` :
- Tab "Mouvements" dans la barre de navigation principale
- Routes Stack pour MouvementForm et MouvementDetail

---

## 🚀 Cas d'utilisation

### 1. Entrée de Stock (Réception)
```
Utilisateur → Tab Mouvements → Bouton "+ Entrée"
  ↓
Sélectionner Produit
Sélectionner Lot (ou créer nouveau)
Entrer Quantité
Sélectionner Emplacement de stockage
Ajouter Description (ex: Commande fournisseur)
Saisir Référence (ex: BL-2024-001)
Valider
  ↓
Mouvement créé → Stock mis à jour → Notification
```

### 2. Sortie de Stock (Préparation/Livraison)
```
Utilisateur → Tab Mouvements → Bouton "- Sortie"
  ↓
Sélectionner Produit
Sélectionner Lot et Quantité
Sélectionner Emplacement source
Ajouter Description (ex: Commande client)
Saisir Référence (ex: COMMANDE-12345)
Valider
  ↓
Vérification stock suffisant → Mouvement créé → Stock diminué → Notification
```

### 3. Transfert Entre Emplacements
```
Utilisateur → Tab Mouvements → Bouton "↔ Transfert"
  ↓
Sélectionner Produit
Sélectionner Lot
Entrer Quantité
Sélectionner Emplacement Source
Sélectionner Emplacement Destinataire
Ajouter Description (ex: Réorganisation)
Valider
  ↓
Mouvement créé → Historique pour audit
```

### 4. Consultation d'Historique
```
Utilisateur → Tab Mouvements
  ↓
Voir tous les mouvements (dernier en premier)
Filtrer par Type (Entrée, Sortie, Transfert)
Cliquer sur un mouvement pour détails
Consulter Statistiques (Modal)
```

---

## 📊 Statistiques et Rapports

### Mode Stats
Accessible via bouton "📊 Stats" dans MouvementsScreen

Affiche par type (Entrée, Sortie, Transfert) :
- Nombre d'opérations
- Quantité totale déplacée

### Résumé par Produit
Endpoint `/api/mouvements/stats/resume`

Retourne :
```json
{
  "produit_id": {
    "produit": "Produit A",
    "codebarre": "123456",
    "entrees": 150,
    "sorties": 80,
    "transferts": 20,
    "bilan": 90
  }
}
```

---

## 🔒 Sécurité et Validation

### Validation Backend
- Quantité > 0
- Produit existe
- Stock suffisant pour sorties
- Emplacements valides

### Validation Frontend
- Champs requis vs optionnels
- Formatage des nombres
- Messages d'erreur clairs

### Audit
- Enregistrement utilisateur qui a effectué le mouvement
- Timestamps (créé à, mis à jour à)
- Statut du mouvement (en_attente, approuvé, rejeté)

---

## 💾 Intégration avec Entités Existantes

### Produits
- Un mouvement référence un produit
- Affichage du nom et code-barre

### Lots
- Un mouvement peut référencer un lot
- La quantité du lot est mise à jour

### Emplacements
- Référence l'emplacement source/destinataire
- Support du nom et zone

### Utilisateurs
- Enregistre l'utilisateur qui crée le mouvement
- Affichage du nom et email

### Notifications
- Une notification est créée pour chaque mouvement approuvé
- Type: "mouvement_stock"

---

## 🛠️ Configuration et Déploiement

### Backend - Variables d'environnement requises
```
MONGO_URI=mongodb://...
JWT_SECRET=...
PORT=5000
```

### Frontend - Point de terminaison API
```javascript
// frontend/services/api.js
const BASE_URL = 'http://[YOUR_IP]:5000/api'; // À adapter
```

### Base de données
Les indexes suivants sont créés automatiquement :
```javascript
mouvementStockSchema.index({ produit: 1, dateMouvement: -1 });
mouvementStockSchema.index({ type: 1, dateMouvement: -1 });
mouvementStockSchema.index({ emplacementSource: 1 });
mouvementStockSchema.index({ emplacementDestinaire: 1 });
mouvementStockSchema.index({ lot: 1 });
```

---

## 📝 Tests Recommandés

1. **Test d'Entrée**
   - Créer une entrée
   - Vérifier que le lot reçoit les quantités
   - Vérifier que la notification est créée

2. **Test de Sortie**
   - Créer une sortie avec quantité suffisante ✅
   - Tenter une sortie avec quantité insuffisante ❌

3. **Test de Transfert**
   - Créer un transfert entre deux emplacements
   - Vérifier l'historique

4. **Test de Filtrage**
   - Filtrer par type
   - Filtrer par date
   - Paginer les résultats

5. **Test de Statistiques**
   - Consulter les stats par type
   - Consulter le résumé par produit

---

## 🔄 Workflow Complet

```
┌─────────────────────────────────────────────────────────┐
│         Application Gestion de Stock                     │
└─────────────────────────────────────────────────────────┘
                          ↓
              [Tab Mouvements / ↔️]
                          ↓
        ┌───────────┬───────────┬───────────┐
        ↓           ↓           ↓           ↓
    Entrée      Sortie    Transfert    Stats
      📥          📤         ↔️          📊
        ↓           ↓           ↓           ↓
   MouvementForm (Formulaire Dynamique)
        ↓
   Validation + Service Métier
        ↓
   MongoDB (Sauvegarde)
        ↓
   Notification + Historique
        ↓
   ✅ Succès + Redirection
```

---

## 📞 Support & Maintenance

### Dépannage Courants

**Erreur : "Stock insuffisant"**
- Vérifier la quantité disponible du lot
- Créer une entrée avant la sortie

**Erreur : "Mouvement non trouvé"**
- Vérifier l'ID du mouvement
- Vérifier les permissions

**Lot n'apparaît pas**
- S'assurer que le produit a des lots
- Vérifier que le produit est sélectionné

---

## 🎯 Améliorations Futures Possibles

- [ ] Approbation des mouvements (workflow)
- [ ] Import/Export CSV
- [ ] Mouvements récurrents (abonnements)
- [ ] Alertes de stock bas automatiques
- [ ] Photos/Codes-barres de validation
- [ ] Analytics avancées

---

## 📚 Fichiers Modifiés

```
Backend:
├── models/MouvementStock.js (NOUVEAU)
├── controllers/mouvementStockController.js (NOUVEAU)
├── services/mouvementStockService.js (NOUVEAU)
├── routes/mouvements.js (NOUVEAU)
└── server.js (MODIFIÉ - ajout route)

Frontend:
├── screens/MouvementsScreen.js (NOUVEAU)
├── screens/MouvementFormScreen.js (NOUVEAU)
├── screens/MouvementDetailScreen.js (NOUVEAU)
└── navigation/AppNavigator.js (MODIFIÉ - ajout routes)
```

---

**Développé avec ❤️ pour une gestion de stock professionnelle**
