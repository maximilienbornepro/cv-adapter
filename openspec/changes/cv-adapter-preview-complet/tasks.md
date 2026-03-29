## 1. Backend - Identifier les simplifications

- [x] 1.1 Analyser `pdfService.ts` pour identifier où le contenu est simplifié ou tronqué
- [x] 1.2 Ajouter le paramètre `fullVersion: boolean = false` à `generateCVHTML`
- [x] 1.3 Ajouter la fonction `getFullPreviewHTML(cvData: CVData)` qui appelle `generateCVHTML` avec `fullVersion=true`

## 2. Backend - Route Full Preview

- [x] 2.1 Ajouter la route POST `/full-preview` dans `routes.ts`
- [x] 2.2 Implémenter le handler: validation cvData, appel getFullPreviewHTML, retour HTML

## 3. Frontend - API Service

- [x] 3.1 Ajouter la fonction `getFullPreviewHTML(cvData: CVData): Promise<string>` dans `api.ts`

## 4. Frontend - ExportSection

- [x] 4.1 Ajouter le bouton "Aperçu complet" dans `ExportSection.tsx` à côté du bouton "Aperçu HTML"
- [x] 4.2 Implémenter le handler onClick qui appelle l'API et ouvre le HTML dans un nouvel onglet
- [x] 4.3 Ajouter un état loading si nécessaire

## 5. Tests (manuels)

- [ ] 5.1 Tester que l'aperçu complet affiche toutes les données sans simplification
- [ ] 5.2 Vérifier que l'aperçu HTML existant n'est pas modifié
- [ ] 5.3 Vérifier l'affichage des deux boutons et leur fonctionnement
