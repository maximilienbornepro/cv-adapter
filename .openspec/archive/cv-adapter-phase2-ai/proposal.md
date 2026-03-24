## Why

Le module CV Adapter Phase 1 permet de créer et éditer des CVs, mais ne permet pas encore de les adapter automatiquement aux offres d'emploi ni de les exporter en PDF. Cette phase ajoute l'intelligence artificielle pour adapter le contenu du CV aux exigences d'une offre, et la génération PDF professionnelle pour l'export.

## What Changes

- Ajout d'un système d'adaptation IA qui analyse les offres d'emploi et adapte le CV en conséquence
- Génération de nouvelles missions et projets pertinents via Claude API
- Ajout de compétences ciblées (max 1 par catégorie)
- Génération PDF avec layout 2 colonnes et style terminal
- Preview HTML avant export PDF
- Interface frontend pour l'adaptation et l'export

## Capabilities

### New Capabilities

- `cv-adaptation`: Adaptation intelligente du CV aux offres d'emploi via Claude API - analyse des requirements, génération de missions/projets, ajout de compétences
- `pdf-generation`: Génération de CV au format PDF avec Puppeteer - layout 2 colonnes, style terminal, images base64 inline
- `cv-preview`: Preview HTML du CV avant export PDF - rendu fidèle au PDF final

### Modified Capabilities

(Aucune modification de capabilities existantes - extension du module cv-adapter)

## Impact

- **Backend**: Nouveaux endpoints dans cv-adapter routes (`/adapt`, `/modify`, `/preview`, `/preview-pdf`, `/generate-pdf`)
- **Services**: Nouveau `adaptService.ts` pour l'IA, nouveau `pdfService.ts` pour Puppeteer
- **Frontend**: Nouvelle page `AdaptCVPage` avec formulaire d'adaptation et preview
- **Dépendances**: Ajout de `puppeteer` dans le serveur
- **Variables d'environnement**: `ANTHROPIC_API_KEY` requis pour l'adaptation IA
