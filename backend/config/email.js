const nodemailer = require('nodemailer');

// Validation des variables d'environnement
const requiredEnvVars = ['EMAIL_HOST', 'EMAIL_PORT', 'EMAIL_USER', 'EMAIL_PASS', 'EMAIL_FROM'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

let transporter = null;
let emailConfigured = false;

if (missingVars.length > 0) {
  console.warn(`⚠️ Configuration Nodemailer incomplète : variables manquantes ${missingVars.join(', ')}. Les emails ne seront pas envoyés.`);
} else {
  // Configuration du transporteur
  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT, 10),
    secure: false, // false pour TLS
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    // Options de sécurité supplémentaires
    tls: {
      rejectUnauthorized: false, // Pour les environnements de développement
    },
  });
  emailConfigured = true;
}

// Vérification de la configuration
const verifyConnection = async () => {
  if (!emailConfigured || !transporter) {
    console.warn('⚠️ Vérification Nodemailer impossible : configuration email incomplète.');
    return false;
  }

  try {
    await transporter.verify();
    console.log('✅ Configuration Nodemailer vérifiée avec succès');
    return true;
  } catch (error) {
    console.error('❌ Erreur de configuration Nodemailer:', error.message);
    return false;
  }
};

// Fonction d'envoi d'email sécurisée
const sendEmail = async ({ to = 'admin1563@gmail.com', subject, html, attachments = [] }) => {
  // Validation des paramètres
  if (!subject || !html) {
    throw new Error('Le sujet et le contenu HTML sont requis pour l\'envoi d\'email');
  }

  if (!to || typeof to !== 'string') {
    throw new Error('Adresse email destinataire invalide');
  }

  if (!emailConfigured || !transporter) {
    throw new Error('La configuration email est incomplète. Vérifiez les variables d\'environnement EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS et EMAIL_FROM.');
  }

  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: to.trim(),
      subject: subject.trim(),
      html,
      attachments,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`📧 Email envoyé avec succès à ${to} (Message ID: ${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi d\'email:', error.message);
    throw error;
  }
};

// Fonction de test d'email
const sendTestEmail = async (recipient = 'admin1563@gmail.com') => {
  const testHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #28a745; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f8f9fa; padding: 20px; border-radius: 0 0 8px 8px; }
        .footer { text-align: center; font-size: 12px; color: #666; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✅ Test d'Email Réussi</h1>
        </div>
        <div class="content">
          <h2>Configuration Nodemailer fonctionnelle</h2>
          <p>Cette email confirme que votre configuration d'envoi d'emails fonctionne correctement.</p>
          <div style="background: white; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <p><strong>Destinataire :</strong> ${recipient}</p>
            <p><strong>Serveur SMTP :</strong> ${process.env.EMAIL_HOST}:${process.env.EMAIL_PORT}</p>
            <p><strong>Expéditeur :</strong> ${process.env.EMAIL_FROM}</p>
            <p><strong>Date :</strong> ${new Date().toLocaleString('fr-FR')}</p>
          </div>
        </div>
        <div class="footer">
          <p>Système de Gestion de Stock - Test Automatique</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({
    to: recipient,
    subject: 'Test de Configuration Email - Stock App',
    html: testHtml,
  });
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

module.exports = {
  sendEmail,
  sendTestEmail,
  verifyConnection,
  lowStockTemplate,
  expiredProductTemplate,
  transporter,
  emailConfigured,
};
