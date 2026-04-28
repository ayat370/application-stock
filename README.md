# 📦 StockApp — Application Mobile de Gestion de Stock

Application mobile complète : React Native (Expo) + Node.js + MongoDB

---

## 🗂️ Structure du projet

```
stock-app/
├── backend/          ← API Node.js + Express + MongoDB
│   ├── config/       ← DB + Email
│   ├── middleware/   ← Auth JWT
│   ├── models/       ← User, Produit, Lot, Emplacement, Rapport
│   ├── routes/       ← auth, produits, lots, emplacements, rapports
│   └── server.js
└── frontend/         ← React Native (Expo)
    ├── components/   ← Composants réutilisables
    ├── context/      ← AuthContext (état global)
    ├── navigation/   ← AppNavigator
    ├── screens/      ← Tous les écrans
    └── services/     ← API Axios
```

---

## 🚀 Installation

### 1. Backend

```bash
cd backend
npm install
```

Copiez `.env` et remplissez vos valeurs :
- `MONGO_URI` : votre URI MongoDB (local ou Atlas)
- `JWT_SECRET` : une chaîne longue secrète
- `EMAIL_*` : config Gmail ou autre SMTP

```bash
npm run dev      # développement avec nodemon
npm start        # production
```

L'API tourne sur : http://localhost:5000

### 2. Créer le premier admin (via Thunder Client)

**POST** `http://localhost:5000/api/auth/login`  
> ⚠️ Avant tout, insérez manuellement un admin dans MongoDB :

```js
// Dans MongoDB Compass ou mongosh :
db.users.insertOne({
  nom: "Admin",
  login: "admin",
  mdp: "$2a$10$...",  // hasher via bcrypt ou utiliser le script ci-dessous
  role: "admin",
  email: "admin@stock.com"
})
```

Ou utilisez ce script d'initialisation :

```bash
cd backend
node -e "
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
require('dotenv').config();
mongoose.connect(process.env.MONGO_URI).then(async () => {
  const hash = await bcrypt.hash('admin123', 10);
  const User = require('./models/User');
  await User.create({ nom: 'Admin', login: 'admin', mdp: hash, role: 'admin', email: 'admin@stock.com' });
  console.log('Admin créé !');
  process.exit();
});
"
```

### 3. Frontend

```bash
cd frontend
npm install
```

Modifiez `services/api.js` :
```js
// Pour émulateur Android : 10.0.2.2
// Pour appareil physique : votre IP locale (ex: 192.168.1.10)
const BASE_URL = 'http://10.0.2.2:5000/api';
```

```bash
npx expo start
```

---

## 🔐 Rôles et permissions

| Action                      | Magasinier | Gestionnaire | Admin |
|-----------------------------|:----------:|:------------:|:-----:|
| Consulter les données       | ✅         | ✅           | ✅    |
| Scanner un produit          | ✅         | ✅           | ✅    |
| Ajouter / Modifier produits | ❌         | ✅           | ✅    |
| Gérer les lots              | ❌         | ✅           | ✅    |
| Gérer les emplacements      | ❌         | ✅           | ✅    |
| Générer des rapports        | ❌         | ✅           | ✅    |
| Supprimer des données       | ❌         | ❌           | ✅    |
| Gérer les utilisateurs      | ❌         | ❌           | ✅    |

---

## 📡 Endpoints API (Thunder Client)

### Auth
| Méthode | URL | Auth | Description |
|---------|-----|------|-------------|
| POST | /api/auth/login | ❌ | Connexion |
| GET | /api/auth/me | ✅ | Mon profil |
| PUT | /api/auth/profil | ✅ | Modifier profil |
| POST | /api/auth/register | Admin | Créer utilisateur |
| GET | /api/auth/users | Admin | Liste utilisateurs |
| DELETE | /api/auth/users/:id | Admin | Supprimer utilisateur |

### Produits
| Méthode | URL | Auth | Description |
|---------|-----|------|-------------|
| GET | /api/produits | ✅ | Liste (search=xxx) |
| GET | /api/produits/codebarre/:code | ✅ | Chercher par code |
| POST | /api/produits | Gestionnaire+ | Ajouter |
| PUT | /api/produits/:id | Gestionnaire+ | Modifier |
| DELETE | /api/produits/:id | Admin | Supprimer |

### Lots
| Méthode | URL | Auth | Description |
|---------|-----|------|-------------|
| GET | /api/lots | ✅ | Liste (produitId=xxx) |
| POST | /api/lots | Gestionnaire+ | Créer |
| PUT | /api/lots/:id | Gestionnaire+ | Modifier |
| DELETE | /api/lots/:id | Admin | Supprimer |

### Emplacements
| Méthode | URL | Auth | Description |
|---------|-----|------|-------------|
| GET | /api/emplacements | ✅ | Liste |
| POST | /api/emplacements | Gestionnaire+ | Ajouter |
| PUT | /api/emplacements/:id | Gestionnaire+ | Modifier |
| DELETE | /api/emplacements/:id | Admin | Supprimer |

### Rapports
| Méthode | URL | Auth | Description |
|---------|-----|------|-------------|
| GET | /api/rapports | Gestionnaire+ | Liste |
| POST | /api/rapports/generer | Gestionnaire+ | Générer (type: inventaire/bilan) |
| GET | /api/rapports/stats/dashboard | ✅ | Stats tableau de bord |

---

## 🧪 Test avec Thunder Client

1. **Login** → récupérer le `token`
2. Ajouter dans Headers : `Authorization: Bearer <token>`
3. Tester les routes

---

## 📱 Écrans de l'application

- **Login** — Connexion sécurisée
- **Dashboard** — Stats + accès rapides
- **Produits** — Liste, recherche, ajout/modif/suppr
- **Lots** — Gestion des lots + alertes expiration
- **Stock** — Vue globale du stock disponible
- **Mouvements** — 🆕 Historique et gestion des mouvements de stock
- **Scanner** — Scan code-barres via caméra
- **Emplacements** — Gestion des zones de stockage
- **Rapports** — Inventaire et bilan
- **Profil** — Info utilisateur + permissions
- **Utilisateurs** — Gestion des comptes (Admin)

---

## 🆕 Gestion des Mouvements de Stock

### 📊 Nouvelle Fonctionnalité : Historique Complet des Mouvements

Une interface professionnelle pour tracker tous les mouvements de stock avec audit complet.

### Types de Mouvements

| Type | Icon | Description |
|------|------|-------------|
| **Entrée** | 📥 | Réception (fournisseur, retour client...) |
| **Sortie** | 📤 | Préparation/Livraison (commande client, perte...) |
| **Transfert** | ↔️ | Déplacement entre emplacements |

### Endpoints API des Mouvements

| Méthode | URL | Description |
|---------|-----|-------------|
| GET | /api/mouvements | Liste mouvements (pagination, filtres, tri) |
| GET | /api/mouvements/:id | Détail d'un mouvement |
| GET | /api/mouvements/stats/resume | Résumé du stock par produit |
| GET | /api/mouvements/stats/parType | Statistiques par type de mouvement |
| POST | /api/mouvements/entree/create | Créer une entrée |
| POST | /api/mouvements/sortie/create | Créer une sortie |
| POST | /api/mouvements/transfert/create | Créer un transfert |
| PUT | /api/mouvements/:id | Mettre à jour un mouvement |
| DELETE | /api/mouvements/:id | Supprimer (seulement en_attente) |

### Champs du Mouvement de Stock

```json
{
  "_id": "ObjectId",
  "produit": "ObjectId (ref: Produit)",
  "lot": "ObjectId (ref: Lot)",
  "type": "entrée|sortie|transfert",
  "quantite": "Number",
  "emplacementSource": "ObjectId (ref: Emplacement)",
  "emplacementDestinaire": "ObjectId (ref: Emplacement)",
  "dateMouvement": "Date",
  "description": "String",
  "utilisateur": "ObjectId (ref: User)",
  "statut": "en_attente|approuvé|rejeté",
  "reference": "String (BL, Facture, etc.)",
  "timestamps": "createdAt, updatedAt"
}
```

### Cas d'Usage

#### 1. Créer une Entrée de Stock

```bash
POST /api/mouvements/entree/create
{
  "produit": "607f1f77bcf86cd799439011",
  "lot": "607f1f77bcf86cd799439012",
  "quantite": 50,
  "emplacement": "607f1f77bcf86cd799439013",
  "description": "Réception commande fournisseur",
  "reference": "BL-2024-001"
}
```

#### 2. Créer une Sortie de Stock

```bash
POST /api/mouvements/sortie/create
{
  "produit": "607f1f77bcf86cd799439011",
  "lot": "607f1f77bcf86cd799439012",
  "quantite": 30,
  "emplacement": "607f1f77bcf86cd799439013",
  "description": "Préparation commande client",
  "reference": "CMD-2024-001"
}
```

#### 3. Créer un Transfert

```bash
POST /api/mouvements/transfert/create
{
  "produit": "607f1f77bcf86cd799439011",
  "lot": "607f1f77bcf86cd799439012",
  "quantite": 20,
  "emplacementSource": "607f1f77bcf86cd799439013",
  "emplacementDestinaire": "607f1f77bcf86cd799439014",
  "description": "Réorganisation du stock",
  "reference": "TRANSFER-001"
}
```

### Filtrage et Recherche

```bash
GET /api/mouvements?type=entrée&page=1&limit=20
GET /api/mouvements?produit=607f1f77bcf86cd799439011&page=1&limit=10
GET /api/mouvements?dateDebut=2024-04-01&dateFin=2024-04-30
```

### Validation et Règles Métier

✅ **Ajout (Entrée)**
- Augmente la quantité du lot
- Crée une notification

✅ **Retrait (Sortie)**
- Vérifie la disponibilité suffisante
- Refuse si stock insuffisant
- Crée une notification

✅ **Transfert**
- Enregistre l'emplacement source et destinataire
- Audit complet

### Outils de Test

Pour tester l'API des mouvements, consultez :
- **`backend/test-mouvements-api.js`** — Exemples de requêtes
- **`MOUVEMENT_STOCK_GUIDE.md`** — Documentation complète

### Frontend - Écrans

- **MouvementsScreen** — Historique avec filtres et stats
- **MouvementFormScreen** — Formulaires adaptatifs (Entrée/Sortie/Transfert)
- **MouvementDetailScreen** — Détail complet d'un mouvement

---
