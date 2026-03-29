# CV Adapter - Progress

Ce fichier documente les phases de développement du module CV Adapter.
Basé sur l'analyse du projet cv-tools dans le workspace.

## Phase 1 - Module de base (TERMINÉE)

**Change OpenSpec:** `cv-adapter-phase1-base`
**Branche:** `feat/cv-adapter-phase1`

### Fonctionnalités implémentées
- CV Management (CRUD avec modèle de données complet)
- Import CV (PDF/DOCX avec parsing IA Claude Vision)
- Gestion médias (photos profil, logos, screenshots)
- Interface d'édition MyProfilePage avec auto-save
- Tests unitaires

---

## Phase 2 - Intelligence Artificielle (TERMINÉE)

**Change OpenSpec:** `cv-adapter-phase2-ai`
**Branche:** `feat/cv-adapter-phase1` (même branche, continuation)

### Fonctionnalités implémentées
- Adaptation CV aux offres d'emploi via Claude API (claude-sonnet-4-20250514)
- Génération de nouvelles missions et projets
- Ajout de compétences ciblées (max 1 par catégorie)
- Génération PDF avec Puppeteer (layout 2 colonnes, style terminal)
- Preview HTML et PDF
- Tests unitaires (72 tests passent)

---

## Phase 2 - Intelligence Artificielle (DÉTAILS CONSERVÉS)

### Fonctionnalités à implémenter

#### 1. Adaptation CV aux offres d'emploi
- Endpoint `POST /cv-adapter-api/adapt`
- Analyse de l'offre d'emploi (extraction des requirements)
- Génération IA de nouvelles missions (ajoutées à la 1ère expérience)
- Génération IA de nouveaux projets (inspirés des side projects)
- Ajout de compétences pertinentes (max 1 par catégorie)
- Instructions personnalisées par l'utilisateur
- Historique des versions adaptées

**Règles d'adaptation (du projet cv-tools):**
- Garder toutes les missions originales, ajouter 1-2 nouvelles à la fin
- Ajouter 1 nouveau projet en 1ère position, reformuler 1-2 existants
- Ajouter max 1 compétence par catégorie si applicable
- Ne modifier QUE la 1ère expérience, laisser les autres intactes

#### 2. Génération PDF
- Endpoint `POST /cv-adapter-api/generate-pdf`
- Layout 2 colonnes : sidebar (280px) + main (520px)
- Sidebar : photo profil (120px cercle) + contact + compétences
- Main : expériences, formations, projets, awards
- Images en base64 inline (pour Puppeteer)
- Fonts : Playfair Display pour nom, monospace pour body
- Style terminal (coins carrés, thème sombre)
- Puppeteer pour génération serveur

#### 3. Endpoints supplémentaires
- `POST /cv-adapter-api/modify` - Modifications custom post-adaptation
- `GET /cv-adapter-api/preview` - Preview HTML avant PDF
- `GET /cv-adapter-api/preview-pdf` - Preview PDF

### Dépendances à ajouter
- puppeteer

---

## Phase 3 - Extensions Chrome (TERMINÉE)

**Change OpenSpec:** `cv-adapter-phase3-extensions`
**Branche:** `feat/cv-adapter-phase1` (même branche, continuation)

### Fonctionnalités implémentées

#### 1. Autofill Forms (backend)
- Endpoint `POST /cv-adapter-api/autofill-form`
- Détection des types de champs (text, email, tel, textarea, select, contenteditable)
- Mapping direct pour champs simples (nom, email, téléphone, ville)
- Génération IA via Claude Opus 4.5 pour champs complexes
- Support des éditeurs rich text (ProseMirror, TipTap)

#### 2. Extension Chrome - Version Dev
- Manifest V3 complet
- Popup UI avec états (loading, connected, no-cv, error)
- Content script pour détection et remplissage de formulaires
- Background service worker pour messages
- Permissions : activeTab, storage
- Host permissions : localhost:*
- Icônes (16, 48, 128px)

#### 3. Extension Chrome - Version Local/Prod
- Configuration BASE_URL pour serveur distant
- Host permissions : https://*/*
- Documentation d'installation

### Structure créée
```
extensions/
├── README.md
├── cv-adapter-dev/
│   ├── manifest.json
│   ├── config.js
│   ├── popup.html
│   ├── popup.css
│   ├── popup.js
│   ├── content.js
│   ├── content-styles.css
│   ├── background.js
│   └── icons/
│       ├── icon.svg
│       ├── icon-16.png
│       ├── icon-48.png
│       └── icon-128.png
└── cv-adapter-local/
    └── (même structure, config modifiée)
```

### Tests ajoutés
- Tests autofillService (field type detection, CSS selectors, direct mapping)
- Total : 86 tests passent

---

## Notes techniques

### Modèle IA utilisés (du projet cv-tools)
- `claude-sonnet-4-20250514` : parsing CV, adaptation
- `claude-opus-4-5-20251101` : autofill forms (qualité maximale)

### Variables d'environnement requises
```
ANTHROPIC_API_KEY=sk-ant-...
```

### Référence
Le projet source est dans `/Users/francetv/Documents/workspace/cv-tools`
