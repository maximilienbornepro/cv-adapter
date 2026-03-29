## Why

L'aperçu HTML actuel affiche une version simplifiée du CV (descriptions raccourcies, projets résumés). L'utilisateur souhaite pouvoir voir une version **complète** du CV dans le template, avec toutes les données affichées intégralement, sans aucune simplification.

## What Changes

- Ajout d'un nouveau bouton "Aperçu complet" dans la section Export, à côté du bouton "Aperçu HTML" existant
- Ce bouton ouvre un aperçu HTML avec **toutes les données** affichées sans simplification
- L'aperçu actuel "Aperçu HTML" reste disponible pour la version simplifiée
- Pas d'appel Claude nécessaire - juste un rendu différent du template

## Capabilities

### New Capabilities
- `cv-full-preview`: Aperçu HTML complet du CV avec toutes les données affichées intégralement (descriptions complètes, tous les projets, toutes les missions, etc.)

### Modified Capabilities


## Impact

- **Frontend**: Modification de `ExportSection.tsx` pour ajouter le bouton "Aperçu complet"
- **Backend**: Nouvel endpoint `/cv-adapter/api/full-preview` ou paramètre sur `/preview`
- **pdfService**: Paramètre optionnel `fullVersion` pour désactiver les simplifications dans `generateCVHTML`
