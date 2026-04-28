#!/usr/bin/env node

/**
 * ✅ CHECKLIST - Gestion des Mouvements de Stock
 * 
 * Utilisez cette checklist pour vérifier que tout est bien intégré
 */

console.log(`
╔═══════════════════════════════════════════════════════════════════════════╗
║                   📦 CHECKLIST MOUVEMENTS DE STOCK                        ║
║                                                                           ║
║              Vérification de l'intégration complète                       ║
╚═══════════════════════════════════════════════════════════════════════════╝
`);

const fs = require('fs');
const path = require('path');

// Couleurs pour terminal
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  gray: '\x1b[90m'
};

function check(condition, message) {
  const icon = condition ? '✅' : '❌';
  const color = condition ? colors.green : colors.red;
  console.log(`${color}${icon} ${message}${colors.reset}`);
  return condition;
}

function printSection(title) {
  console.log(`\n${colors.blue}━━━ ${title} ━━━${colors.reset}`);
}

// Configuration
const BASE_PATH = __dirname;
const BACKEND_PATH = path.join(BASE_PATH, 'backend');
const FRONTEND_PATH = path.join(BASE_PATH, 'frontend');

let totalChecks = 0;
let passedChecks = 0;

// ============================================
// BACKEND
// ============================================

printSection('📦 BACKEND');

// Modèles
totalChecks++, passedChecks += check(
  fs.existsSync(path.join(BACKEND_PATH, 'models', 'MouvementStock.js')),
  'Modèle MouvementStock.js existe'
) ? 1 : 0;

// Services
totalChecks++, passedChecks += check(
  fs.existsSync(path.join(BACKEND_PATH, 'services', 'mouvementStockService.js')),
  'Service mouvementStockService.js existe'
) ? 1 : 0;

// Contrôleurs
totalChecks++, passedChecks += check(
  fs.existsSync(path.join(BACKEND_PATH, 'controllers', 'mouvementStockController.js')),
  'Contrôleur mouvementStockController.js existe'
) ? 1 : 0;

// Routes
totalChecks++, passedChecks += check(
  fs.existsSync(path.join(BACKEND_PATH, 'routes', 'mouvements.js')),
  'Routes mouvements.js existe'
) ? 1 : 0;

// Vérifier que server.js importe les routes
const serverContent = fs.readFileSync(path.join(BACKEND_PATH, 'server.js'), 'utf-8');
totalChecks++, passedChecks += check(
  serverContent.includes("'/api/mouvements'") && serverContent.includes('require(\'./routes/mouvements\')'),
  'server.js importe les routes mouvements'
) ? 1 : 0;

// Test API
totalChecks++, passedChecks += check(
  fs.existsSync(path.join(BACKEND_PATH, 'test-mouvements-api.js')),
  'Fichier test-mouvements-api.js existe'
) ? 1 : 0;

// ============================================
// FRONTEND
// ============================================

printSection('📱 FRONTEND');

// Écrans
const screens = [
  { file: 'MouvementsScreen.js', desc: 'Écran historique' },
  { file: 'MouvementFormScreen.js', desc: 'Écran formulaire' },
  { file: 'MouvementDetailScreen.js', desc: 'Écran détail' }
];

screens.forEach(screen => {
  totalChecks++, passedChecks += check(
    fs.existsSync(path.join(FRONTEND_PATH, 'screens', screen.file)),
    `${screen.desc}: ${screen.file}`
  ) ? 1 : 0;
});

// Vérifier navigation
const navigationContent = fs.readFileSync(
  path.join(FRONTEND_PATH, 'navigation', 'AppNavigator.js'),
  'utf-8'
);

totalChecks++, passedChecks += check(
  navigationContent.includes('MouvementsScreen') &&
  navigationContent.includes('MouvementFormScreen') &&
  navigationContent.includes('MouvementDetailScreen'),
  'Tous les imports d\'écrans sont présents'
) ? 1 : 0;

totalChecks++, passedChecks += check(
  navigationContent.includes("name=\"Mouvements\"") &&
  navigationContent.includes('component={MouvementsScreen}'),
  'Tab Mouvements dans la barre de navigation'
) ? 1 : 0;

totalChecks++, passedChecks += check(
  navigationContent.includes("name=\"MouvementForm\"") &&
  navigationContent.includes("name=\"MouvementDetail\""),
  'Routes Stack pour formulaire et détail'
) ? 1 : 0;

// ============================================
// DOCUMENTATION
// ============================================

printSection('📚 DOCUMENTATION');

totalChecks++, passedChecks += check(
  fs.existsSync(path.join(BASE_PATH, 'MOUVEMENT_STOCK_GUIDE.md')),
  'Guide complet MOUVEMENT_STOCK_GUIDE.md existe'
) ? 1 : 0;

totalChecks++, passedChecks += check(
  fs.existsSync(path.join(BASE_PATH, 'README.md')),
  'README.md mis à jour'
) ? 1 : 0;

// ============================================
// VÉRIFICATIONS SUPPLÉMENTAIRES
// ============================================

printSection('🔍 VÉRIFICATIONS SUPPLÉMENTAIRES');

// Vérifier que les services sont bien importés dans le contrôleur
const controllerContent = fs.readFileSync(
  path.join(BACKEND_PATH, 'controllers', 'mouvementStockController.js'),
  'utf-8'
);

totalChecks++, passedChecks += check(
  controllerContent.includes('ajouterStock') &&
  controllerContent.includes('retirerStock') &&
  controllerContent.includes('transfererStock') &&
  controllerContent.includes('afficherStock'),
  'Services métier utilisés dans contrôleur'
) ? 1 : 0;

// Vérifier la structure de formulaire
const formContent = fs.readFileSync(
  path.join(FRONTEND_PATH, 'screens', 'MouvementFormScreen.js'),
  'utf-8'
);

totalChecks++, passedChecks += check(
  formContent.includes('emplacementSource') &&
  formContent.includes('emplacementDestinaire') &&
  formContent.includes('type ==='),
  'Formulaire adaptatif par type'
) ? 1 : 0;

// ============================================
// RÉSUMÉ
// ============================================

printSection('📊 RÉSUMÉ');

const percentage = Math.round((passedChecks / totalChecks) * 100);
const status = percentage === 100 ? '🟢' : percentage >= 80 ? '🟡' : '🔴';

console.log(`
${status} Tests réussis: ${colors.green}${passedChecks}/${totalChecks}${colors.reset} (${percentage}%)

`);

if (percentage === 100) {
  console.log(`${colors.green}
╔════════════════════════════════════════════════════════════════╗
║  ✅ EXCELLENT! Tout est bien intégré et prêt à l'emploi        ║
║                                                                ║
║  Prochaines étapes:                                            ║
║  1. Démarrer le backend: npm run dev                           ║
║  2. Démarrer le frontend: npx expo start                       ║
║  3. Tester avec test-mouvements-api.js                         ║
║  4. Consulter MOUVEMENT_STOCK_GUIDE.md pour la documentation  ║
╚════════════════════════════════════════════════════════════════╝
${colors.reset}`);
} else if (percentage >= 80) {
  console.log(`${colors.yellow}
⚠️  La plupart des vérifications passent. Vérifiez les 
   éléments manquants ci-dessus.${colors.reset}`);
} else {
  console.log(`${colors.red}
❌ Certains fichiers manquent ou ne sont pas bien intégrés.
   Vérifiez la documentation.${colors.reset}`);
}

console.log(`\n${colors.gray}
┌─────────────────────────────────────────────────────────────┐
│ Pour plus d'informations, consultez:                        │
│ - MOUVEMENT_STOCK_GUIDE.md (guide complet)                 │
│ - README.md (vue d'ensemble du projet)                      │
│ - backend/test-mouvements-api.js (exemples API)            │
└─────────────────────────────────────────────────────────────┘
${colors.reset}\n`);

process.exit(percentage === 100 ? 0 : 1);
