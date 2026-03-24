## ADDED Requirements

### Requirement: Upload de fichiers CV
Le systeme SHALL accepter l'upload de fichiers PDF et DOCX pour import.

#### Scenario: Upload PDF valide
- **WHEN** un utilisateur uploade un fichier .pdf
- **THEN** le systeme accepte le fichier et lance le parsing

#### Scenario: Upload DOCX valide
- **WHEN** un utilisateur uploade un fichier .docx
- **THEN** le systeme accepte le fichier et lance le parsing

#### Scenario: Rejet de format invalide
- **WHEN** un utilisateur uploade un fichier .txt ou autre format
- **THEN** le systeme retourne une erreur 400 avec message explicatif

#### Scenario: Limite de taille
- **WHEN** un utilisateur uploade un fichier de plus de 10MB
- **THEN** le systeme retourne une erreur 413 avec message explicatif

### Requirement: Parsing PDF avec texte
Le systeme SHALL extraire le texte des PDFs contenant du texte selectionnable.

#### Scenario: PDF avec texte extractible
- **WHEN** un PDF contient du texte selectionnable
- **THEN** le systeme extrait le texte avec pdf-parse

#### Scenario: Structuration du texte extrait
- **WHEN** le texte est extrait d'un PDF
- **THEN** le systeme utilise Claude pour structurer les donnees selon le modele CV

### Requirement: Parsing PDF images avec Vision
Le systeme SHALL utiliser Claude Vision pour parser les PDFs scannes.

#### Scenario: PDF image detecte
- **WHEN** un PDF contient moins de 100 caracteres de texte extractible
- **THEN** le systeme convertit le PDF en image et utilise Claude Vision

#### Scenario: Extraction via Vision
- **WHEN** Claude Vision analyse une image de CV
- **THEN** le systeme extrait et structure les informations selon le modele CV

### Requirement: Parsing DOCX
Le systeme SHALL extraire le contenu des fichiers DOCX avec mammoth.

#### Scenario: DOCX valide
- **WHEN** un fichier DOCX est uploade
- **THEN** le systeme extrait le texte avec mammoth puis structure avec Claude

#### Scenario: DOCX corrompu
- **WHEN** un fichier DOCX est invalide ou corrompu
- **THEN** le systeme retourne une erreur 400 avec message explicatif

### Requirement: Preview avant import
Le systeme SHALL afficher un apercu des donnees importees avant de les integrer.

#### Scenario: Appel preview
- **WHEN** un utilisateur appelle POST /cv-adapter-api/import-cv-preview avec un fichier
- **THEN** le systeme retourne les donnees parsees sans modifier le CV existant

#### Scenario: Affichage des differences
- **WHEN** le frontend recoit les donnees parsees
- **THEN** il affiche une modale avec les sections nouvelles/differentes par rapport au CV actuel

### Requirement: Merge selectif
Le systeme SHALL permettre de fusionner selectivement les sections importees.

#### Scenario: Selection des sections
- **WHEN** un utilisateur selectionne certaines sections dans la modale de preview
- **THEN** seules ces sections sont marquees pour import

#### Scenario: Appel merge
- **WHEN** un utilisateur appelle POST /cv-adapter-api/import-cv-merge avec les sections selectionnees
- **THEN** le systeme fusionne uniquement ces sections dans le CV existant

#### Scenario: Conservation des donnees non selectionnees
- **WHEN** un utilisateur importe seulement les experiences
- **THEN** les autres sections du CV (formations, competences, etc.) restent inchangees

### Requirement: Gestion des erreurs de parsing
Le systeme SHALL gerer gracieusement les erreurs de parsing IA.

#### Scenario: Reponse IA invalide
- **WHEN** Claude retourne une reponse mal formatee
- **THEN** le systeme retente une fois puis retourne une erreur explicative

#### Scenario: Timeout API
- **WHEN** l'appel a Claude timeout apres 60 secondes
- **THEN** le systeme retourne une erreur 504 avec suggestion de reessayer
