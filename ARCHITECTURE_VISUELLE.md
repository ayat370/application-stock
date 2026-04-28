# 🏗️ Architecture Visuelle - Gestion des Mouvements de Stock

## 📐 Diagramme Global

```
┌─────────────────────────────────────────────────────────────────────┐
│                       APPLICATION STOCK                              │
│                                                                      │
│  ┌────────────────────────────────────┬────────────────────────────┐
│  │          FRONTEND (React Native)   │   BACKEND (Node.js/Express)│
│  │                                    │                            │
│  │  ┌──────────────────────────────┐  │  ┌────────────────────────┐
│  │  │   MouvementsScreen.js        │  │  │   Routes               │
│  │  │  - Liste des mouvements     │  │  │  /api/mouvements       │
│  │  │  - Filtres par type         │  │  │                        │
│  │  │  - Modal statistiques       │  │  ├────────────────────────┤
│  │  │  - Pagination              │  │  │   Controllers           │
│  │  └──────────────┬──────────────┘  │  │  - getMouvements()     │
│  │                 │                 │  │  - entreeStock()       │
│  │  ┌──────────────▼──────────────┐  │  │  - sortieStock()       │
│  │  │ MouvementFormScreen.js      │  │  │  - transfertStock()    │
│  │  │  - Formulaires dynamiques   │  │  │  - getResume()         │
│  │  │  - Sélecteurs adaptatifs    │  │  │  - getStatParType()    │
│  │  │  - Validation client        │  │  │                        │
│  │  └──────────────┬──────────────┘  │  ├────────────────────────┤
│  │                 │                 │  │   Services             │
│  │  ┌──────────────▼──────────────┐  │  │  - ajouterStock()      │
│  │  │ MouvementDetailScreen.js    │  │  │  - retirerStock()      │
│  │  │  - Affichage détaillé       │  │  │  - transfererStock()   │
│  │  │  - Modification             │  │  │  - afficherStock()     │
│  │  │  - Suppression (attente)    │  │  │  - obtenirResumStock() │
│  │  └──────────────┬──────────────┘  │  │                        │
│  │                 │                 │  ├────────────────────────┤
│  │  ┌──────────────▼──────────────┐  │  │   Modèles              │
│  │  │   API Service               │  │  │  - MouvementStock      │
│  │  │   (Axios)                   │  │  │  - Produit (ref)       │
│  │  │  ├─ GET /mouvements         │  │  │  - Lot (ref)           │
│  │  │  ├─ POST /entree/create     │──────► - Emplacement (ref)  │
│  │  │  ├─ POST /sortie/create     │  │  │  - User (ref)          │
│  │  │  ├─ POST /transfert/create  │  │  │                        │
│  │  │  ├─ PUT /:id                │  │  └────────────────────────┘
│  │  │  └─ DELETE /:id             │  │
│  │  └─────────────────────────────┘  │
│  └────────────────────────────────────┴────────────────────────────┘
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐
│  │                    MONGODB                                     │
│  │                                                                │
│  │  Collections:                                                  │
│  │  ├─ mouvementstocks (NEW)                                    │
│  │  ├─ produits                                                 │
│  │  ├─ lots                                                     │
│  │  ├─ emplacements                                             │
│  │  ├─ users                                                    │
│  │  └─ notifications                                            │
│  └────────────────────────────────────────────────────────────────┘
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Flux de Données - Création d'une Entrée

```
Utilisateur clique "📥 Entrée"
         ↓
   [MouvementsScreen]
         ↓
   Navigation vers MouvementFormScreen avec type='entrée'
         ↓
   Formulaire s'affiche avec champs:
   - Produit (obligatoire)
   - Lot (optionnel)
   - Quantité (obligatoire)
   - Emplacement Destinataire (obligatoire)
   - Description (optionnel)
   - Référence (optionnel)
         ↓
Utilisateur remplissent et clique "Enregistrer"
         ↓
   Validation Client:
   - Quantité > 0 ?
   - Produit sélectionné ?
   - Emplacement sélectionné ?
         ↓ (✅ Valide)
   
   POST /api/mouvements/entree/create
   {
     produit: ID,
     lot: ID,
     quantite: 50,
     emplacement: ID,
     description: "...",
     reference: "..."
   }
         ↓
   [Backend - Route]
   [Backend - Controller - entreeStock()]
         ↓
   Validation Serveur:
   - Produit existe ?
   - Quantité valide ?
   - Lot existe ?
         ↓ (✅ OK)
   
   [Service - ajouterStock()]
   - Augmente quantité du lot
   - Crée document MouvementStock
   - Crée notification
         ↓
   Sauvegarde MongoDB
         ↓
   Response 201 Created
   { success: true, mouvement: {...} }
         ↓
   Alert "✅ Succès!"
   Navigation vers MouvementsScreen
         ↓
   FlatList se met à jour
   Nouveau mouvement visible en haut
```

---

## 🔄 Flux de Données - Création d'une Sortie

```
Utilisateur clique "📤 Sortie"
         ↓
   [MouvementsScreen]
         ↓
   Navigation vers MouvementFormScreen avec type='sortie'
         ↓
   Formulaire s'affiche (adapté pour sortie):
   - Produit (obligatoire)
   - Lot (obligatoire - doit avoir du stock)
   - Quantité (obligatoire)
   - Emplacement Source (obligatoire)
   - Description (optionnel)
   - Référence (optionnel)
         ↓
Utilisateur remplis et clique "Enregistrer"
         ↓
   Validation Client
         ↓ (✅ Valide)
   
   POST /api/mouvements/sortie/create
         ↓
   [Backend - Controller - sortieStock()]
   [Service - retirerStock()]
         ↓
   Vérification CRITIQUE:
   - Lot existe ?
   - Stock disponible >= Quantité demandée ?
         ↓ (❌ Insuffisant)
   
   Response 400 Bad Request
   { message: "Stock insuffisant. Disponible: 20, Demandé: 50" }
         ↓
   Alert "❌ Erreur!"
   Formulaire reste ouvert
         ↓ (✅ Suffisant)
   
   - Diminue quantité du lot
   - Crée document MouvementStock
   - Crée notification
         ↓
   Sauvegarde MongoDB
         ↓
   Response 201 Created
   { success: true, mouvement: {...} }
         ↓
   Alert "✅ Succès!"
   MouvementsScreen mis à jour
```

---

## 🔄 Flux de Données - Transfert

```
Utilisateur clique "↔️ Transfert"
         ↓
   [MouvementsScreen]
         ↓
   Navigation vers MouvementFormScreen avec type='transfert'
         ↓
   Formulaire s'affiche (adapté pour transfert):
   - Produit (obligatoire)
   - Lot (optionnel)
   - Quantité (obligatoire)
   - Emplacement Source (obligatoire)
   - Emplacement Destinataire (obligatoire)
         ↓
Utilisateur remplis et clique "Enregistrer"
         ↓
   Validation Client
         ↓ (✅ Valide)
   
   POST /api/mouvements/transfert/create
   {
     produit: ID,
     lot: ID,
     quantite: 20,
     emplacementSource: ID1,
     emplacementDestinaire: ID2,
     ...
   }
         ↓
   [Backend - Controller - transfertStock()]
   [Service - transfererStock()]
         ↓
   Validation:
   - Produit existe ?
   - Emplacements existent ?
   - Emplacements différents ?
         ↓ (✅ OK)
   
   - Crée document MouvementStock
   - Crée notification
         ↓
   Sauvegarde MongoDB
         ↓
   Response 201 Created
         ↓
   Alert "✅ Transfert enregistré!"
   MouvementsScreen mis à jour
```

---

## 📊 Structure du Document MouvementStock

```javascript
{
  _id: ObjectId("..."),
  
  // Références
  produit: ObjectId("..."),          // Ref: Produit
  lot: ObjectId("..."),               // Ref: Lot (optionnel)
  
  // Type et Quantité
  type: "entrée" | "sortie" | "transfert",
  quantite: Number,
  
  // Emplacements
  emplacementSource: ObjectId("..."),      // Ref: Emplacement
  emplacementDestinaire: ObjectId("..."),  // Ref: Emplacement
  
  // Dates et Traçabilité
  dateMouvement: Date,
  utilisateur: ObjectId("..."),     // Ref: User (audit)
  
  // Métadonnées
  description: String,
  reference: String,                // BL, Facture, etc.
  statut: "en_attente" | "approuvé" | "rejeté",
  
  // Timestamps
  createdAt: Date,
  updatedAt: Date
}
```

---

## 📋 État et Flux Statuts

```
     CREATE
        ↓
    ┌───────────┐
    │ EN_ATTENTE│ ← État initial (peut être modifié/supprimé)
    └─────┬─────┘
          │ APPROVE
          ↓
    ┌─────────────┐
    │  APPROUVÉ   │ ← État final (exécuté, cannot delete)
    │ (En action) │
    └─────────────┘

    Alternative:
    EN_ATTENTE → REJETÉ (Suppression logique)
```

---

## 🧮 Agrégations MongoDB - Statistiques

```javascript
// Résumé par produit
db.mouvementstocks.aggregate([
  { $group: {
      _id: "$produit",
      entrees: { $sum: { $cond: [{ $eq: ["$type", "entrée"] }, "$quantite", 0] } },
      sorties: { $sum: { $cond: [{ $eq: ["$type", "sortie"] }, "$quantite", 0] } },
      transferts: { $sum: { $cond: [{ $eq: ["$type", "transfert"] }, "$quantite", 0] } }
    }
  }
])

// Résultat:
[
  {
    _id: ObjectId("..."),
    entrees: 150,
    sorties: 80,
    transferts: 20
    // bilan = 150 + 20 - 80 = 90
  }
]
```

---

## 🔐 Sécurité et Authentification

```
┌─────────────────────────────────────┐
│  Frontend                            │
│  ├─ Utilisateur se connecte (Login)│
│  └─ Reçoit: token JWT               │
└──────────────┬──────────────────────┘
               │
               ↓
        [axios.interceptor]
        Ajoute header:
        Authorization: Bearer TOKEN
               │
               ↓
┌──────────────────────────────────┐
│  Backend                         │
│  ├─ Reçoit requête               │
│  ├─ Middleware: protect()        │
│  │  ├─ Extrait token            │
│  │  ├─ Vérifie JWT              │
│  │  ├─ Décode payload           │
│  │  ├─ Charge utilisateur (req)  │
│  │  └─ Token valide → next()     │
│  ├─ Route exécutée              │
│  └─ Réponse                      │
└──────────────────────────────────┘
```

---

## 🔍 Index et Performance

```javascript
// Indexes créés pour optimiser les requêtes

1. produit + dateMouvement DESC
   → GET /mouvements?produit=X&sortBy=date
   
2. type + dateMouvement DESC
   → GET /mouvements?type=entrée
   
3. emplacementSource
   → Recherche par emplacement source
   
4. emplacementDestinaire
   → Recherche par emplacement destinataire
   
5. lot
   → Recherche par lot
```

---

## 📱 Composants Frontend - Hiérarchie

```
App
├─ AppNavigator
│  ├─ Tab.Navigator (MainTabs)
│  │  ├─ Dashboard
│  │  ├─ Produits
│  │  ├─ Lots
│  │  ├─ Stock
│  │  ├─ Mouvements    ← NEW
│  │  ├─ Notifications
│  │  └─ Profil
│  │
│  └─ Stack.Navigator
│     ├─ ProduitForm
│     ├─ LotForm
│     ├─ ... (autres)
│     ├─ MouvementForm       ← NEW
│     └─ MouvementDetail     ← NEW

MouvementsScreen
├─ View (actionBar)
│  ├─ TouchableOpacity (Entrée)
│  ├─ TouchableOpacity (Sortie)
│  ├─ TouchableOpacity (Transfert)
│  └─ TouchableOpacity (Stats)
├─ ScrollView (filterChips)
│  ├─ filterChip (type)
│  ├─ filterChip (type)
│  └─ filterChip (type)
├─ FlatList (mouvements)
│  └─ MouvementCard (item)
└─ Modal (statistiques)
```

---

## 🎨 Design - Couleurs et Styles

```
Palette:
├─ Entrée    📥 #4CAF50 (Vert)
├─ Sortie    📤 #FF6B6B (Rouge)
└─ Transfert ↔️ #2196F3 (Bleu)

Typographie:
├─ Titre    : 24px Bold (couleur primaire)
├─ Subtitle : 14px Normal (gris)
├─ Caption  : 12px Light (gris clair)
└─ Label    : 13px Medium (gris foncé)

Spacing:
├─ Padding  : 12px, 15px, 20px
├─ Margin   : 8px, 10px, 15px
└─ Border   : 1px #eee
```

---

## 🚀 Cas d'Usage - Workflow Complet

```
DAY 1 - Réception:
  1. Supplier envoie marchandise
  2. Magasinier scan colis
  3. Clique "📥 Entrée"
  4. Sélectionne Produit
  5. Saisit Quantité + Emplacement
  6. Valide + Référence facture
  7. ✅ Stock augmenté

DAY 2-5 - Stockage:
  8. Stock en entrepôt A
  9. Besoin de réorganiser
  10. Clique "↔️ Transfert"
  11. Transfert Emplacement A → B
  12. ✅ Historique enregistré

DAY 6 - Préparation:
  13. Commande client reçue
  14. Clique "📤 Sortie"
  15. Sélectionne Produit + Quantité
  16. Vérifie stock (✅ OK)
  17. Saisit Emplacement source
  18. ✅ Stock diminué
  19. Prépare colis

DAY 7 - Rapports:
  20. Gestionnaire consulte "📊 Stats"
  21. Voit résumé : +500 entrées, -300 sorties
  22. Bilan = +200 unités
```

---

*Diagrammes créés pour faciliter la compréhension de l'architecture*  
*Version: 1.0 - 2024-04-27*
