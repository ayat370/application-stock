/**
 * Script pour créer des données de test
 * Usage : node create-test-data.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Produit = require('./models/Produit');
const Emplacement = require('./models/Emplacement');
const Lot = require('./models/Lot');

async function createTestData() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connecté à MongoDB');

    // Créer des emplacements de test
    const emplacements = await Emplacement.find({});
    let emp1, emp2;

    if (emplacements.length === 0) {
      emp1 = await Emplacement.create({
        nomemplacement: 'Entrepôt A',
        zone: 'Zone 1'
      });
      emp2 = await Emplacement.create({
        nomemplacement: 'Entrepôt B', 
        zone: 'Zone 2'
      });
      console.log('📍 Emplacements créés');
    } else {
      emp1 = emplacements[0];
      emp2 = emplacements[1] || emplacements[0];
    }

    // Créer des produits de test
    const produitsExistants = await Produit.find({});
    if (produitsExistants.length === 0) {
      const produits = [
        {
          nom: 'Ordinateur Portable',
          description: 'Ordinateur portable professionnel',
          codebarre: '1234567890123',
          emplacement: emp1._id
        },
        {
          nom: 'Clavier USB',
          description: 'Clavier mécanique USB',
          codebarre: '1234567890124',
          emplacement: emp1._id
        },
        {
          nom: 'Souris Optique',
          description: 'Souris optique sans fil',
          codebarre: '1234567890125',
          emplacement: emp2._id
        },
        {
          nom: 'Écran 24""',
          description: 'Moniteur LED 24 pouces',
          codebarre: '1234567890126',
          emplacement: emp2._id
        },
        {
          nom: 'Imprimante Laser',
          description: 'Imprimante laser couleur',
          codebarre: '1234567890127',
          emplacement: emp1._id
        }
      ];

      await Produit.insertMany(produits);
      console.log('📦 Produits de test créés');
    } else {
      console.log('⚠️  Des produits existent déjà');
    }

    console.log('🎉 Données de test créées avec succès !');
    process.exit(0);
  } catch (err) {
    console.error('❌ Erreur :', err.message);
    process.exit(1);
  }
}

createTestData();
