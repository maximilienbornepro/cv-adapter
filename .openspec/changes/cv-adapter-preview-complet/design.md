## Context

L'aperçu HTML actuel simplifie le contenu du CV pour une présentation concise. L'utilisateur souhaite également pouvoir voir une version complète avec toutes les données affichées intégralement.

Le système de génération HTML (`pdfService.ts`) peut potentiellement limiter ou simplifier certains contenus. Il faut identifier où ces simplifications se font et ajouter un paramètre pour les désactiver.

## Goals / Non-Goals

**Goals:**
- Ajouter un bouton "Aperçu complet" dans la section Export
- Créer un endpoint `/full-preview` qui génère le HTML sans simplifications
- Afficher toutes les descriptions, missions, projets et technologies en intégralité
- Garder le même template visuel (deux colonnes, thème terminal)

**Non-Goals:**
- Modifier l'aperçu HTML existant (il reste disponible)
- Appeler Claude ou faire de l'IA
- Changer le template ou le style

## Decisions

### 1. Paramètre `fullVersion` dans generateCVHTML

**Décision**: Ajouter un paramètre optionnel `fullVersion: boolean` à la fonction `generateCVHTML`.

**Rationale**:
- Réutilise le code existant
- Un seul endroit pour gérer les deux modes
- Pas de duplication de template

### 2. Nouvel endpoint `/full-preview`

**Décision**: Créer un endpoint séparé plutôt que paramètre sur `/preview`.

**Rationale**:
- API claire et explicite
- Pas de risque de casser l'existant
- Plus facile à documenter

**Alternatives considérées**:
- Paramètre `?full=true` sur `/preview` → Rejeté car modifie l'endpoint existant

### 3. Pas de modifications en base

**Décision**: L'aperçu complet est en lecture seule, rien n'est sauvegardé.

**Rationale**: Cohérent avec l'aperçu existant.

## Sequence Diagrams

### 1. Full Preview Flow (authenticated user)

```mermaid
sequenceDiagram
    actor User
    participant ExportSection
    participant Backend as POST /full-preview
    participant pdfService
    participant generateCVHTML
    participant Browser as New Tab

    User->>ExportSection: Clicks "Aperçu complet"
    ExportSection->>Backend: POST /cv-adapter/api/full-preview<br/>body: { cvData }
    Backend->>pdfService: getFullPreviewHTML(cvData)
    pdfService->>generateCVHTML: generateCVHTML(cvData, fullVersion=true)
    generateCVHTML-->>pdfService: Complete HTML (no simplifications)
    pdfService-->>Backend: HTML string
    Backend-->>ExportSection: 200 OK + HTML
    ExportSection->>Browser: window.open() with HTML content
    Browser-->>User: Displays full CV preview
```

### 2. Embed Preview Flow (public access, no auth)

```mermaid
sequenceDiagram
    actor ExternalUser as External User / iframe
    participant AppTsx as App.tsx
    participant EmbedView
    participant Backend as GET /embed/:id/preview
    participant pdfService
    participant generateCVHTML

    ExternalUser->>AppTsx: Access /cv-adapter/?embed=ID
    AppTsx->>AppTsx: Detects ?embed=ID param
    AppTsx->>EmbedView: Renders EmbedView(itemId=ID)
    EmbedView->>Backend: GET /cv-adapter/api/embed/ID/preview<br/>(public, no authMiddleware)
    Backend->>pdfService: getFullPreviewHTML(cvData)
    pdfService->>generateCVHTML: generateCVHTML(cvData, fullVersion=true)
    generateCVHTML-->>pdfService: Complete HTML
    pdfService-->>Backend: HTML string
    Backend-->>EmbedView: 200 OK + HTML
    EmbedView-->>ExternalUser: Renders HTML in iframe
```

## Risks / Trade-offs

**[Performance]** → Plus de contenu = page plus lourde
- Mitigation: Acceptable car c'est le comportement demandé

**[Consistance]** → Deux aperçus différents peuvent créer de la confusion
- Mitigation: Labels clairs "Aperçu HTML" vs "Aperçu complet"
