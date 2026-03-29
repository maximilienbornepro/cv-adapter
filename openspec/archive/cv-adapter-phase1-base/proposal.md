## Why

La plateforme a besoin d'un module de gestion de CV professionnel permettant aux utilisateurs d'importer, editer et gerer leurs CVs. Ce module est la base pour les fonctionnalites d'adaptation IA et de generation PDF prevues dans les phases suivantes.

## What Changes

- Ajout d'un nouveau module `cv-adapter` avec gestion complete des CVs
- Creation d'une structure de donnees riche pour les CVs (experiences, formations, competences, projets)
- Import de CVs depuis PDF/DOCX avec parsing IA (Claude Vision)
- Upload et gestion de medias (photos profil, logos entreprises, screenshots projets)
- Multi-versions de CV par utilisateur avec systeme de "default"
- Interface d'edition complete avec sections expandables et auto-save

## Capabilities

### New Capabilities

- `cv-management`: CRUD complet des CVs avec modele de donnees riche (experiences, formations, competences, awards, side-projects), multi-versions par utilisateur, marqueur default
- `cv-import`: Import de fichiers PDF/DOCX avec parsing IA via Claude Vision, preview et merge selectif des sections importees
- `cv-media`: Gestion des medias - upload photo profil, logos entreprises par experience, screenshots projets avec legendes, cache logos en base

### Modified Capabilities

(Aucune - nouveau module)

## Impact

- **Base de donnees**: Nouvelles tables `cvs` (JSONB) et `cv_logos`
- **Backend**: Nouveau module Express avec 10+ endpoints API
- **Frontend**: Nouvelle page MyProfile avec editeur complet
- **Dependencies**: mammoth (DOCX), pdf-parse, @anthropic-ai/sdk
- **Configuration**: Variable ANTHROPIC_API_KEY requise
