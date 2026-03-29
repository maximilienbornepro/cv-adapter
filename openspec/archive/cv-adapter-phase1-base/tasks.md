## 1. Setup et structure du module

- [x] 1.1 Creer la structure du module backend: apps/platform/servers/unified/src/modules/cv-adapter/
- [x] 1.2 Creer la structure du module frontend: apps/platform/src/modules/cv-adapter/
- [x] 1.3 Ajouter les dependances npm: mammoth, pdf-parse, @anthropic-ai/sdk
- [x] 1.4 Creer le schema SQL pour les tables cvs et cv_logos dans database/init/

## 2. Backend - CV Management

- [x] 2.1 Creer le fichier types.ts avec le modele CVData complet
- [x] 2.2 Creer dbService.ts avec les fonctions CRUD pour les CVs
- [x] 2.3 Implementer GET /cv - recuperation du CV par defaut
- [x] 2.4 Implementer PUT /cv - mise a jour du CV par defaut
- [x] 2.5 Implementer GET /my-cvs - liste de tous les CVs utilisateur
- [x] 2.6 Implementer POST /cvs - creation d'un nouveau CV
- [x] 2.7 Implementer DELETE /cvs/:id - suppression d'un CV non-default
- [x] 2.8 Creer index.ts avec initCvAdapter et createCvAdapterRouter

## 3. Backend - Import CV

- [x] 3.1 Creer le service de parsing PDF avec pdf-parse
- [x] 3.2 Creer le service de parsing DOCX avec mammoth
- [x] 3.3 Integrer Claude pour la structuration des donnees extraites
- [x] 3.4 Implementer la detection PDF image vs PDF texte
- [x] 3.5 Implementer Claude Vision pour les PDFs images
- [x] 3.6 Implementer POST /upload-cv - import direct
- [x] 3.7 Implementer POST /import-cv-preview - preview avant merge
- [x] 3.8 Implementer POST /import-cv-merge - merge selectif

## 4. Backend - Media Management

- [x] 4.1 Creer le dbService pour cv_logos
- [x] 4.2 Implementer POST /screenshots/upload avec redimensionnement
- [x] 4.3 Implementer POST /logos/upload
- [x] 4.4 Implementer GET /logos - liste des logos utilisateur
- [x] 4.5 Implementer GET /logos/:id/image - recuperation image
- [x] 4.6 Implementer POST /fetch-company-logo - auto-fetch via web

## 5. Integration Backend

- [x] 5.1 Monter le module dans index.ts du serveur unifie
- [x] 5.2 Ajouter le proxy dans vite.config.ts
- [x] 5.3 Ajouter cv-adapter dans AVAILABLE_APPS de gateway.ts
- [x] 5.4 Ajouter l'app dans SharedNav constants.ts

## 6. Frontend - Types et Services

- [x] 6.1 Creer types/index.ts avec les interfaces TypeScript
- [x] 6.2 Creer services/api.ts avec les appels API CRUD

## 7. Frontend - Composants de base

- [x] 7.1 Creer ExpandableSection - section collapsible
- [x] 7.2 Creer TagEditor - editeur de tags pour competences
- [x] 7.3 Creer ListEditor - editeur de listes pour missions/projets
- [x] 7.4 Creer ImageUploader - upload avec preview et drag-drop

## 8. Frontend - Page MyProfile

- [x] 8.1 Creer la structure de base de MyProfilePage
- [x] 8.2 Implementer la section informations de base (name, title, summary)
- [x] 8.3 Implementer la section photo de profil
- [x] 8.4 Implementer la section contact
- [x] 8.5 Implementer la section competences avec TagEditors
- [x] 8.6 Implementer la section experiences avec ListEditor
- [x] 8.7 Implementer la section formations
- [x] 8.8 Implementer la section awards
- [x] 8.9 Implementer la section side projects
- [x] 8.10 Implementer l'auto-save avec debounce

## 9. Frontend - Import CV

- [x] 9.1 Creer le composant ImportCVModal
- [x] 9.2 Implementer la zone d'upload fichier
- [x] 9.3 Implementer l'affichage du preview avec differences
- [x] 9.4 Implementer la selection des sections a merger
- [x] 9.5 Implementer le bouton de confirmation du merge

## 10. Frontend - Integration et App

- [x] 10.1 Creer App.tsx principal du module
- [x] 10.2 Ajouter les routes dans router.tsx
- [x] 10.3 Creer index.css avec les styles du module

## 11. Tests

- [x] 11.1 Creer les tests backend dans __tests__/cv-adapter/
- [x] 11.2 Creer les tests frontend dans __tests__/
- [x] 11.3 Ajouter les projets Vitest dans vitest.config.ts
- [x] 11.4 Ajouter les scripts test dans package.json
- [x] 11.5 Verifier que npm test passe

## 12. Documentation et finalisation

- [x] 12.1 Mettre a jour le README si necessaire
- [x] 12.2 Verifier l'integration complete avec le boilerplate
- [x] 12.3 Tester le flux complet manuellement
