const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendEmail = async ({ to, subject, html }) => {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html,
    });
    console.log(`📧 Email envoyé à ${to}`);
  } catch (error) {
    console.error('Erreur email:', error.message);
  }
};

// Template email pour stock faible
const lowStockTemplate = (produit, lot, seuil) => `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <style>
      body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background: #dc3545; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
      .content { background: #f8f9fa; padding: 20px; border-radius: 0 0 8px 8px; }
      .alert { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 15px 0; }
      .product-info { background: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
      .footer { text-align: center; font-size: 12px; color: #666; margin-top: 20px; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>🚨 Alerte Stock Faible</h1>
      </div>
      <div class="content">
        <div class="alert">
          <h2>Attention : Stock critique détecté</h2>
          <p>Le système de gestion de stock a détecté un niveau de stock préoccupant.</p>
        </div>

        <div class="product-info">
          <h3>📦 Informations du produit</h3>
          <p><strong>Produit :</strong> ${produit.nom}</p>
          <p><strong>Code-barres :</strong> ${produit.codebarre}</p>
          <p><strong>Quantité actuelle :</strong> <span style="color: #dc3545; font-weight: bold;">${lot.quantite}</span></p>
          <p><strong>Seuil minimum :</strong> ${seuil}</p>
          <p><strong>Écart :</strong> <span style="color: #dc3545;">${lot.quantite - seuil} unités</span></p>
          ${produit.emplacement ? `<p><strong>Emplacement :</strong> ${produit.emplacement.nomemplacement} (${produit.emplacement.zone})</p>` : ''}
        </div>

        <div style="background: #d4edda; border: 1px solid #c3e6cb; padding: 15px; border-radius: 5px; margin: 15px 0;">
          <h4>📋 Actions recommandées</h4>
          <ul>
            <li>Vérifier le stock physique</li>
            <li>Commander de nouveaux produits</li>
            <li>Contacter le fournisseur</li>
            <li>Mettre à jour l'inventaire</li>
          </ul>
        </div>

        <p style="color: #666; font-size: 14px;">
          Cette alerte a été générée automatiquement le ${new Date().toLocaleString('fr-FR')}.
        </p>
      </div>
      <div class="footer">
        <p>Système de Gestion de Stock - Notifications Automatiques</p>
      </div>
    </div>
  </body>
  </html>
`;

// Template email pour produit expiré
const expiredProductTemplate = (produit, lot) => `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <style>
      body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background: #6f42c1; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
      .content { background: #f8f9fa; padding: 20px; border-radius: 0 0 8px 8px; }
      .alert { background: #f8d7da; border: 1px solid #f5c6cb; padding: 15px; border-radius: 5px; margin: 15px 0; }
      .product-info { background: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
      .footer { text-align: center; font-size: 12px; color: #666; margin-top: 20px; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>⚠️ Alerte Produit Expiré</h1>
      </div>
      <div class="content">
        <div class="alert">
          <h2>Attention : Produit périmé détecté</h2>
          <p>Un produit a dépassé sa date d'expiration et doit être retiré immédiatement du stock.</p>
        </div>

        <div class="product-info">
          <h3>📦 Informations du lot expiré</h3>
          <p><strong>Produit :</strong> ${produit.nom}</p>
          <p><strong>Code-barres :</strong> ${produit.codebarre}</p>
          <p><strong>ID du lot :</strong> ${lot.idlot}</p>
          <p><strong>Quantité :</strong> ${lot.quantite}</p>
          <p><strong>Date d'expiration :</strong> <span style="color: #dc3545; font-weight: bold;">${new Date(lot.dateExpiration).toLocaleDateString('fr-FR')}</span></p>
          <p><strong>Jours de retard :</strong> <span style="color: #dc3545;">${Math.floor((new Date() - new Date(lot.dateExpiration)) / (1000 * 60 * 60 * 24))} jours</span></p>
          ${produit.emplacement ? `<p><strong>Emplacement :</strong> ${produit.emplacement.nomemplacement} (${produit.emplacement.zone})</p>` : ''}
        </div>

        <div style="background: #d4edda; border: 1px solid #c3e6cb; padding: 15px; border-radius: 5px; margin: 15px 0;">
          <h4>🚨 Actions urgentes requises</h4>
          <ul>
            <li>Retirer immédiatement ce lot du stock</li>
            <li>Vérifier l'état du produit</li>
            <li>Mettre à jour l'inventaire</li>
            <li>Contacter le service qualité si nécessaire</li>
          </ul>
        </div>

        <p style="color: #666; font-size: 14px;">
          Cette alerte a été générée automatiquement le ${new Date().toLocaleString('fr-FR')}.
        </p>
      </div>
      <div class="footer">
        <p>Système de Gestion de Stock - Notifications Automatiques</p>
      </div>
    </div>
  </body>
  </html>
`;

module.exports = { sendEmail, lowStockTemplate, expiredProductTemplate };
