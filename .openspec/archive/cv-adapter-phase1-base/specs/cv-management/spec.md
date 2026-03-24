## ADDED Requirements

### Requirement: CV data model
Le systeme SHALL stocker les CVs avec le modele de donnees suivant:
- Informations de base: name, title, summary, profilePhoto (base64)
- Contact: address, city, email, phone
- Competences par categorie: languages, competences, outils, dev, frameworks, solutions
- Experiences: tableau d'objets avec title, company, period, location, description, missions[], projects[], clients[], technologies, logo
- Formations: tableau d'objets avec title, school, period, location
- Awards: tableau d'objets avec type, year, title, location
- Side Projects: objet avec title, description, items[] (categories), technologies

#### Scenario: Creation d'un CV vide
- **WHEN** un utilisateur cree un nouveau CV
- **THEN** le systeme initialise un CV avec toutes les sections vides mais presentes

#### Scenario: CV avec donnees completes
- **WHEN** un utilisateur remplit toutes les sections d'un CV
- **THEN** le systeme stocke toutes les donnees dans la structure JSONB

### Requirement: Multi-versions CV
Le systeme SHALL permettre a chaque utilisateur de posseder plusieurs versions de CV avec un marqueur "default".

#### Scenario: Creation de plusieurs CVs
- **WHEN** un utilisateur cree un deuxieme CV
- **THEN** le systeme stocke les deux CVs et conserve le marqueur default sur le premier

#### Scenario: Changement du CV par defaut
- **WHEN** un utilisateur definit un autre CV comme default
- **THEN** le systeme retire le marqueur default de l'ancien et le place sur le nouveau

### Requirement: CRUD CV par defaut
Le systeme SHALL fournir des endpoints pour lire et mettre a jour le CV par defaut de l'utilisateur.

#### Scenario: Lecture du CV par defaut
- **WHEN** un utilisateur appelle GET /cv-adapter-api/cv
- **THEN** le systeme retourne le CV marque comme default pour cet utilisateur

#### Scenario: Mise a jour du CV par defaut
- **WHEN** un utilisateur appelle PUT /cv-adapter-api/cv avec des donnees
- **THEN** le systeme met a jour le CV default et retourne les donnees mises a jour

#### Scenario: Creation automatique si aucun CV
- **WHEN** un utilisateur sans CV appelle GET /cv-adapter-api/cv
- **THEN** le systeme cree un CV vide marque comme default et le retourne

### Requirement: Liste des CVs utilisateur
Le systeme SHALL permettre de lister tous les CVs d'un utilisateur.

#### Scenario: Liste des CVs
- **WHEN** un utilisateur appelle GET /cv-adapter-api/my-cvs
- **THEN** le systeme retourne la liste de tous ses CVs avec id, name, is_default, created_at, updated_at

### Requirement: Suppression de CV
Le systeme SHALL permettre de supprimer un CV non-default.

#### Scenario: Suppression d'un CV secondaire
- **WHEN** un utilisateur appelle DELETE /cv-adapter-api/cvs/:id sur un CV non-default
- **THEN** le systeme supprime le CV et retourne un succes

#### Scenario: Tentative de suppression du CV default
- **WHEN** un utilisateur appelle DELETE /cv-adapter-api/cvs/:id sur son CV default
- **THEN** le systeme retourne une erreur 400 indiquant qu'on ne peut pas supprimer le CV par defaut

### Requirement: Auto-save frontend
Le frontend SHALL sauvegarder automatiquement les modifications du CV.

#### Scenario: Auto-save apres modification
- **WHEN** un utilisateur modifie un champ du CV
- **THEN** le frontend attend 1 seconde sans autre modification puis appelle PUT /cv-adapter-api/cv

#### Scenario: Indicateur de sauvegarde
- **WHEN** une sauvegarde automatique est en cours
- **THEN** le frontend affiche un indicateur "Sauvegarde..." puis "Sauvegarde effectuee"

### Requirement: Interface d'edition avec sections expandables
Le frontend SHALL afficher le CV avec des sections collapsibles pour chaque partie.

#### Scenario: Sections collapsibles
- **WHEN** un utilisateur clique sur le header d'une section
- **THEN** la section se deplie ou se replie

#### Scenario: Editeurs specialises
- **WHEN** un utilisateur edite les competences
- **THEN** le systeme affiche un TagEditor permettant d'ajouter/supprimer des tags

#### Scenario: Liste d'experiences
- **WHEN** un utilisateur edite ses experiences
- **THEN** le systeme affiche un ListEditor avec possibilite d'ajouter, editer, reordonner et supprimer
