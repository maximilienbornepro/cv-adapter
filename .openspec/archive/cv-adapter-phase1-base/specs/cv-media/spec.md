## ADDED Requirements

### Requirement: Upload photo de profil
Le systeme SHALL permettre l'upload d'une photo de profil pour le CV.

#### Scenario: Upload photo valide
- **WHEN** un utilisateur uploade une image JPG/PNG de moins de 500KB
- **THEN** le systeme stocke l'image en base64 dans le champ profilePhoto du CV

#### Scenario: Redimensionnement automatique
- **WHEN** une image uploadee depasse 120x120 pixels
- **THEN** le systeme redimensionne l'image avant stockage

#### Scenario: Rejet format invalide
- **WHEN** un utilisateur uploade un fichier non-image
- **THEN** le systeme retourne une erreur 400

#### Scenario: Compression si necessaire
- **WHEN** une image depasse 500KB apres redimensionnement
- **THEN** le systeme compresse l'image en JPEG qualite 80

### Requirement: Upload logos entreprises
Le systeme SHALL permettre l'upload de logos pour chaque experience professionnelle.

#### Scenario: Upload logo pour experience
- **WHEN** un utilisateur uploade un logo pour une experience
- **THEN** le systeme stocke le logo dans la table cv_logos et reference l'ID dans l'experience

#### Scenario: Cache de logos par nom d'entreprise
- **WHEN** un utilisateur uploade un logo pour "Google"
- **THEN** le systeme associe ce logo au nom d'entreprise pour reutilisation

#### Scenario: Reutilisation de logo existant
- **WHEN** un utilisateur ajoute une experience chez "Google" et qu'un logo existe deja
- **THEN** le systeme propose automatiquement le logo existant

### Requirement: Upload screenshots projets
Le systeme SHALL permettre l'upload de screenshots pour les projets dans les experiences.

#### Scenario: Upload screenshot projet
- **WHEN** un utilisateur uploade un screenshot pour un projet
- **THEN** le systeme stocke l'image en base64 dans le projet avec une legende optionnelle

#### Scenario: Multiple screenshots par projet
- **WHEN** un utilisateur ajoute plusieurs screenshots
- **THEN** le systeme stocke un tableau de screenshots avec leurs legendes

#### Scenario: Suppression screenshot
- **WHEN** un utilisateur supprime un screenshot
- **THEN** le systeme retire l'image du tableau sans affecter les autres

### Requirement: API de gestion des logos
Le systeme SHALL fournir des endpoints pour gerer les logos.

#### Scenario: Liste des logos utilisateur
- **WHEN** un utilisateur appelle GET /cv-adapter-api/logos
- **THEN** le systeme retourne la liste de ses logos avec id, company_name, created_at

#### Scenario: Recuperation image logo
- **WHEN** un utilisateur appelle GET /cv-adapter-api/logos/:id/image
- **THEN** le systeme retourne l'image avec le bon Content-Type

#### Scenario: Upload nouveau logo
- **WHEN** un utilisateur appelle POST /cv-adapter-api/logos/upload avec fichier et company_name
- **THEN** le systeme cree le logo et retourne son ID

### Requirement: Fetch automatique de logo
Le systeme SHALL permettre de recuperer automatiquement le logo d'une entreprise.

#### Scenario: Fetch logo par nom
- **WHEN** un utilisateur appelle POST /cv-adapter-api/fetch-company-logo avec company_name
- **THEN** le systeme tente de recuperer le logo via Clearbit/Google et le stocke

#### Scenario: Logo non trouve
- **WHEN** aucun logo n'est trouve pour l'entreprise
- **THEN** le systeme retourne une reponse indiquant l'absence de logo

#### Scenario: Cache du resultat
- **WHEN** un logo est recupere automatiquement
- **THEN** le systeme le stocke dans cv_logos pour eviter les appels repetes

### Requirement: Gestion des images dans le frontend
Le frontend SHALL fournir des composants d'upload intuitifs.

#### Scenario: ImageUploader avec preview
- **WHEN** un utilisateur selectionne une image
- **THEN** le composant affiche un apercu avant upload

#### Scenario: Drag and drop
- **WHEN** un utilisateur fait glisser une image sur la zone d'upload
- **THEN** le composant accepte le fichier et lance l'upload

#### Scenario: Indicateur de progression
- **WHEN** un upload est en cours
- **THEN** le composant affiche une barre de progression

#### Scenario: Bouton de suppression
- **WHEN** une image est deja uploadee
- **THEN** le composant affiche un bouton pour la supprimer
