require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
const connectDB = require('./config/db');
const { sendEmail, lowStockTemplate, expiredProductTemplate } = require('./config/email');
const User = require('./models/User');
const Produit = require('./models/Produit');
const Lot = require('./models/Lot');
const Notification = require('./models/Notification');

const app = express();

// Connexion MongoDB
connectDB();

// Middlewares
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/produits', require('./routes/produits'));
app.use('/api/lots', require('./routes/lots'));
app.use('/api/emplacements', require('./routes/emplacements'));
app.use('/api/rapports', require('./routes/rapports'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/mouvements', require('./routes/mouvements'));

// Route de test
app.get('/', (req, res) => res.json({ message: '🚀 API Stock fonctionnelle' }));

// Endpoint de test d'email
app.get('/test-email', async (req, res) => {
  try {
    const recipient = process.env.EMAIL_TEST_TO || process.env.EMAIL_USER;
    if (!recipient) {
      return res.status(400).json({ message: 'EMAIL_TEST_TO ou EMAIL_USER manquant dans .env' });
    }

    await sendEmail({
      to: recipient,
      subject: 'Test d’envoi de mail - Stock App',
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <h2 style="color: #1d4ed8;">Test d’email automatique</h2>
          <p>Ce message confirme que votre configuration Nodemailer fonctionne correctement.</p>
          <p><strong>Application :</strong> Système de gestion de stock</p>
          <p><strong>Date :</strong> ${new Date().toLocaleString('fr-FR')}</p>
        </div>
      `,
    });

    res.json({ message: `Email de test envoyé à ${recipient}` });
  } catch (error) {
    console.error('Erreur test email:', error);
    res.status(500).json({ message: error.message });
  }
});

// 404 JSON pour les routes non trouvées
app.use((req, res) => {
  res.status(404).json({ message: 'Route API introuvable' });
});

// Gestion erreurs globale
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Erreur serveur' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Serveur lancé sur le port ${PORT}`));

// Tâche cron pour vérifier les alertes (toutes les heures)
cron.schedule('0 * * * *', async () => {
  console.log('🔍 Vérification des alertes de stock...');

  try {
    // Récupérer les admins et gestionnaires
    const admins = await User.find({ role: { $in: ['admin', 'gestionnaire'] } }).select('email nom');

    if (admins.length === 0) {
      console.log('⚠️ Aucun administrateur trouvé pour recevoir les notifications');
      return;
    }

    // Vérifier stock faible avec seuils configurables
    const lots = await Lot.find().populate('produit');
    const lowStockLots = lots.filter(lot => {
      if (!lot.produit) return false;
      const seuil = lot.produit.seuilMinimum || 10;
      return lot.quantite < seuil;
    });

    for (const lot of lowStockLots) {
      const message = `Stock faible détecté pour ${lot.produit.nom} (${lot.quantite}/${lot.produit.seuilMinimum || 10}).`;
      const alreadyNotified = await Notification.findOne({
        message,
        userId: { $in: admins.map(a => a._id) },
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      });

      if (!alreadyNotified) {
        const subject = `🚨 Alerte Stock Faible: ${lot.produit.nom}`;
        const html = lowStockTemplate(lot.produit, lot, lot.produit.seuilMinimum || 10);

        for (const admin of admins) {
          await sendEmail({ to: admin.email, subject, html });
          await Notification.create({
            message,
            userId: admin._id,
            metadata: {
              type: 'low_stock',
              produit: lot.produit.nom,
              lot: lot.idlot,
              quantite: lot.quantite,
              seuil: lot.produit.seuilMinimum || 10,
            }
          });
        }

        console.log(`📧 Notification stock faible envoyée pour ${lot.produit.nom} (${lot.quantite}/${lot.produit.seuilMinimum || 10})`);
      }
    }

    // Vérifier produits expirés
    const today = new Date();
    const expiredLots = await Lot.find({ dateExpiration: { $lt: today } }).populate('produit');

    const validExpiredLots = expiredLots.filter(lot => lot.produit);

    for (const lot of validExpiredLots) {
      const message = `Produit expiré détecté pour ${lot.produit.nom} (lot ${lot.idlot}).`;
      const alreadyNotified = await Notification.findOne({
        message,
        userId: { $in: admins.map(a => a._id) },
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      });

      if (!alreadyNotified) {
        const subject = `⚠️ Alerte Produit Expiré: ${lot.produit.nom}`;
        const html = expiredProductTemplate(lot.produit, lot);

        for (const admin of admins) {
          await sendEmail({ to: admin.email, subject, html });
          await Notification.create({
            message,
            userId: admin._id,
            metadata: {
              type: 'expired_product',
              produit: lot.produit.nom,
              lot: lot.idlot,
              dateExpiration: lot.dateExpiration,
            }
          });
        }

        console.log(`📧 Notification expiration envoyée pour ${lot.produit.nom} (lot ${lot.idlot})`);
      }
    }

    console.log('✅ Vérification des alertes terminée');

  } catch (error) {
    console.error('❌ Erreur lors de la vérification des alertes:', error);
  }
});
