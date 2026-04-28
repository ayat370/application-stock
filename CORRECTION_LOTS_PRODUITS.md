# Correction: Logique de sélection des lots dans les mouvements

## 📋 Objectif
Garantir que chaque lot ne peut être sélectionné que pour le produit auquel il appartient, et empêcher les incohérences de données.

## ✅ Corrections apportées

### 1. **Backend - Route Lots** 
**Fichier:** `backend/routes/lots.js`
- ✅ Mise à jour du filtre pour accepter à la fois `produit` et `produitId` en tant que paramètres de requête
- Cela permet une meilleure compatibilité avec différents clients

```javascript
const { produitId, produit, ...rest } = req.query;
const productId = produitId || produit;
if (productId) query.produit = productId;
```

### 2. **Backend - Validation Service**
**Fichier:** `backend/services/mouvementStockService.js`

#### Nouvelle fonction de validation:
```javascript
async function validerLotAppartientAuProduit(produitId, lotId)
```
- Valide que le lot spécifié appartient au produit sélectionné
- Utilise la comparaison d'ObjectId pour éviter les problèmes de type
- Lance une erreur explicite si incohérence détectée

#### Appels ajoutés dans:
- ✅ `ajouterStock()` - Entrée de stock
- ✅ `retirerStock()` - Sortie de stock  
- ✅ `transfererStock()` - Transfert entre emplacements
- ✅ `annulerMouvement()` - Annulation de mouvement (sécurité)

### 3. **Backend - Validation Controller**
**Fichier:** `backend/controllers/mouvementStockController.js`

Ajout de validations côté contrôleur pour chaque endpoint:
- ✅ `entreeStock()` - Valide le lot avant la création
- ✅ `sortieStock()` - Valide le lot avant le retrait
- ✅ `transfertStock()` - Valide le lot avant le transfert

**Avantages:**
- Double validation (controller + service)
- Messages d'erreur clairs à l'utilisateur
- Protection contre les manipulations de requête

### 4. **Frontend - UX Amélioration**
**Fichier:** `frontend/screens/MouvementFormScreen.js`

#### Messages plus clairs:
```javascript
{selectedLot ? selectedLot.idlot : !selectedProduit ? '⚠️ Sélectionner d\'abord un produit' : 'Aucun lot pour ce produit'}
```

#### Réinitialisation du lot lors du changement de produit:
```javascript
const handleSelectProduit = (produit) => {
  setFormData(prev => ({ ...prev, produit: produit._id, lot: '' })); // Réinitialiser
  setSelectedLot(null);
  // ... reste du code
};
```

## 🔍 Flux de validation complet

```
1. Frontend - Sélection produit
   ↓
2. Chargement automatique des lots du produit
   ↓
3. Frontend - Sélection d'un lot
   ↓
4. Envoi du mouvement au backend
   ↓
5. Controller - Validation lot ∈ produit
   ↓
6. Service - Validation supplémentaire lot ∈ produit
   ↓
7. Enregistrement du mouvement (garanti valide)
```

## 🛡️ Protection contre les incohérences

### Scénarios couverts:
1. ✅ Manipulation directe d'API (envoi d'un lot d'un autre produit)
2. ✅ Changement de produit sans réinitialisation du lot (frontend)
3. ✅ Sélection d'un lot inexistant
4. ✅ Suppression du lot avant création du mouvement (vérification existe)
5. ✅ Annulation d'un mouvement avec un lot supprimé (vérification existe)

## 📝 Règles appliquées

1. **Un lot = un seul produit** ✅ (relation MongoDB)
2. **Sélection produit avant lot** ✅ (frontend filtrage + validation backend)
3. **Validation incohérence** ✅ (double validation controller + service)
4. **Messages clairs à l'utilisateur** ✅ (frontend + API)

## 🧪 Tests recommandés

```javascript
// Test 1: Sélectionner un produit → vérifier lots filtrés
// Test 2: Sélectionner lot → créer mouvement (doit réussir)
// Test 3: Manipuler API avec lot invalide (doit échouer)
// Test 4: Annuler mouvement avec lot d'un autre produit (doit échouer)
// Test 5: Changer produit → vérifier lot réinitialisé
```

## 📦 Fichiers modifiés

| Fichier | Type | Action |
|---------|------|--------|
| `backend/routes/lots.js` | Route | Accepter deux formats de paramètres |
| `backend/services/mouvementStockService.js` | Service | Ajouter validation + appels |
| `backend/controllers/mouvementStockController.js` | Controller | Valider avant service |
| `frontend/screens/MouvementFormScreen.js` | Screen | Améliorer UX + réinitialiser |

---

**Date:** 28 avril 2026  
**État:** ✅ Complété
