# CV Adapter - Extensions Chrome

Extensions Chrome pour le remplissage automatique de formulaires de candidature.

## Versions disponibles

| Version | Dossier | Usage |
|---------|---------|-------|
| **Dev** | `cv-adapter-dev/` | Développement local (localhost) |
| **Local** | `cv-adapter-local/` | Production (serveur distant) |

## Installation

### Version Dev (développement)

1. Ouvrir Chrome et aller à `chrome://extensions/`
2. Activer le **Mode développeur** (coin supérieur droit)
3. Cliquer sur **Charger l'extension non empaquetée**
4. Sélectionner le dossier `extensions/cv-adapter-dev/`
5. L'extension apparaît dans la barre d'outils

### Version Local (production)

1. Copier le dossier `cv-adapter-local/`
2. Éditer `config.js` et remplacer `BASE_URL` par l'URL de votre serveur :
   ```javascript
   BASE_URL: 'https://votre-serveur.com',
   ```
3. Suivre les mêmes étapes d'installation que la version Dev

## Utilisation

1. Se connecter à la plateforme CV Adapter et créer/importer un CV
2. Aller sur une page avec un formulaire de candidature
3. Cliquer sur l'icône de l'extension
4. L'extension affiche :
   - Votre nom et titre professionnel
   - Le nombre de champs détectés sur la page
5. Cliquer sur **Remplir le formulaire**
6. Les champs sont remplis automatiquement avec vos données

## Fonctionnement

### Détection des champs

L'extension détecte automatiquement :
- Champs texte (`<input type="text">`)
- Champs email (`<input type="email">`)
- Champs téléphone (`<input type="tel">`)
- Zones de texte (`<textarea>`)
- Listes déroulantes (`<select>`)
- Zones éditables (`contenteditable="true"`)
- Éditeurs riches (ProseMirror, TipTap)

### Remplissage intelligent

L'API utilise Claude Opus 4.5 pour :
- Mapper les champs simples (nom, email, téléphone, ville)
- Générer du contenu adapté pour les champs complexes (résumé, lettre de motivation)
- Analyser le contexte de la page pour un remplissage pertinent

### Sécurité

- Les données CV transitent uniquement entre votre navigateur et votre serveur
- Aucune donnée n'est stockée localement par l'extension
- L'authentification utilise les cookies de session existants

## Dépannage

### "Non connecté"

- Vérifiez que vous êtes connecté à la plateforme CV Adapter
- Rafraîchissez la page de la plateforme et réessayez

### "Aucun CV"

- Créez ou importez un CV sur la plateforme
- Assurez-vous que votre CV contient au minimum votre nom

### "0 champs détectés"

- La page ne contient pas de formulaire standard
- Essayez de cliquer dans un champ du formulaire avant d'utiliser l'extension

### Erreur de connexion

- Vérifiez que le serveur est accessible
- Pour la version Dev, assurez-vous que le serveur local tourne sur `http://localhost:5173`

## Développement

### Structure des fichiers

```
cv-adapter-dev/
├── manifest.json      # Configuration Manifest V3
├── config.js          # URL du serveur (localhost)
├── popup.html         # Interface popup
├── popup.css          # Styles popup
├── popup.js           # Logique popup
├── content.js         # Script injecté dans les pages
├── content-styles.css # Styles pour feedback visuel
├── background.js      # Service worker
└── icons/             # Icônes de l'extension
    ├── icon-16.png
    ├── icon-48.png
    └── icon-128.png
```

### Tester les modifications

1. Modifier les fichiers dans `cv-adapter-dev/`
2. Aller à `chrome://extensions/`
3. Cliquer sur l'icône de rafraîchissement de l'extension
4. Tester sur une page avec un formulaire

### API Endpoint

L'extension appelle `POST /cv-adapter-api/autofill-form` avec :

```json
{
  "cvData": { ... },
  "fields": [
    {
      "selector": "#firstName",
      "type": "text",
      "label": "Prénom",
      "placeholder": "Entrez votre prénom",
      "name": "firstName",
      "context": "..."
    }
  ],
  "pageUrl": "https://example.com/apply",
  "pageTitle": "Candidature - Example Corp"
}
```

Réponse :

```json
{
  "fields": {
    "#firstName": "Jean",
    "#lastName": "Dupont",
    "#email": "jean@example.com"
  }
}
```

## Icônes

Les icônes actuelles sont des placeholders. Pour créer de vraies icônes :

1. Créer un design 128x128 pixels au format PNG
2. Redimensionner en 48x48 et 16x16
3. Remplacer les fichiers dans `icons/`

Style recommandé : fond sombre (#0a0a0a), accent cyan (#06b6d4), thème terminal.
