## Why

Les Phases 1 et 2 permettent de créer, importer, adapter et exporter des CVs. Cependant, l'utilisateur doit copier-coller manuellement les informations de son CV dans les formulaires de candidature en ligne. Cette phase ajoute le remplissage automatique de formulaires via une extension Chrome et une API backend dédiée.

## What Changes

- Ajout d'un endpoint backend pour l'autofill de formulaires avec génération IA des réponses
- Création d'une extension Chrome (version dev) pour détecter et remplir les formulaires
- Création d'une extension Chrome (version local/prod) avec configuration d'URL différente
- Support des éditeurs rich text (ProseMirror, TipTap, ContentEditable)
- Popup UI pour les opérations CV dans l'extension

## Capabilities

### New Capabilities

- `autofill-api`: Endpoint backend pour générer les réponses aux champs de formulaire via Claude Opus 4.5 - analyse des champs, génération contextuelle basée sur le CV
- `chrome-extension-dev`: Extension Chrome pour environnement de développement - popup UI, content script pour détection/remplissage, background service pour auth
- `chrome-extension-local`: Extension Chrome pour environnement local/production - même fonctionnalités, configuration d'URL différente

### Modified Capabilities

(Aucune modification de capabilities existantes)

## Impact

- **Backend**: Nouveau endpoint `/cv-adapter-api/autofill-form` avec génération IA via Claude Opus 4.5
- **Extensions**: Nouveau dossier `extensions/` avec cv-adapter-dev/ et cv-adapter-local/
- **Manifest V3**: Permissions activeTab, storage, downloads
- **Dépendances**: Utilisation de l'API Anthropic existante
- **Variables d'environnement**: ANTHROPIC_API_KEY (déjà ajouté en Phase 2)
