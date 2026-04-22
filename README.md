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
- **Scanner** — Scan code-barres via caméra
- **Emplacements** — Gestion des zones de stockage
- **Rapports** — Inventaire et bilan
- **Profil** — Info utilisateur + permissions
- **Utilisateurs** — Gestion des comptes (Admin)
