## Context

Les Phases 1 et 2 du module CV Adapter sont implémentées :
- Phase 1 : CRUD CV, import PDF/DOCX, gestion médias
- Phase 2 : Adaptation IA, génération PDF

Le projet de référence `cv-tools` contient déjà des extensions Chrome fonctionnelles pour l'autofill. Cette phase adapte ces extensions au boilerplate platform.

## Goals / Non-Goals

**Goals:**
- Permettre le remplissage automatique de formulaires de candidature
- Détecter les champs de formulaire (input, textarea, select, contenteditable)
- Générer des réponses contextuelles via Claude Opus 4.5
- Fournir une popup UI pour déclencher l'autofill
- Supporter les environnements dev (localhost) et local/prod

**Non-Goals:**
- Publication sur le Chrome Web Store (extensions locales uniquement)
- Support d'autres navigateurs (Firefox, Safari)
- Authentification OAuth dans l'extension (cookie-based auth)
- Sauvegarde des réponses générées

## Decisions

### 1. Modèle Claude pour l'autofill

**Décision**: Utiliser `claude-opus-4-5-20251101` pour la génération des réponses

**Rationale**: L'autofill nécessite une compréhension fine du contexte (CV + champ + page) et une génération de haute qualité. Opus 4.5 est le modèle le plus performant disponible.

**Alternative considérée**: Sonnet - rejeté car la qualité des réponses est critique pour les candidatures.

### 2. Architecture extension Manifest V3

**Décision**: Utiliser Manifest V3 avec:
- `popup.html/js` : Interface utilisateur
- `content.js` : Script injecté dans les pages
- `background.js` : Service worker pour l'authentification

**Rationale**: Manifest V3 est obligatoire pour les nouvelles extensions Chrome. Le service worker gère les requêtes cross-origin.

### 3. Détection des champs de formulaire

**Décision**: Scanner le DOM pour :
- `input[type=text|email|tel|url]`
- `textarea`
- `select`
- `[contenteditable=true]`
- Éditeurs rich text (ProseMirror, TipTap via class `.ProseMirror`, `.tiptap`)

**Rationale**: Couvre 99% des formulaires de candidature. Les éditeurs rich text sont courants sur les ATS modernes.

### 4. Communication extension ↔ backend

**Décision**:
- L'extension récupère le cookie d'auth depuis le site principal
- Appels API via `fetch` avec `credentials: include`
- Le backend valide le JWT cookie

**Rationale**: Pas besoin de système d'auth séparé dans l'extension. L'utilisateur doit être connecté sur le site principal.

### 5. Deux versions d'extension

**Décision**: Créer deux dossiers :
- `extensions/cv-adapter-dev/` : host_permissions `http://localhost:*`
- `extensions/cv-adapter-local/` : host_permissions configurables

**Rationale**: Les permissions d'hôte doivent être déclarées dans le manifest. Deux builds séparés simplifient la configuration.

### 6. Remplissage des champs

**Décision**: Utiliser une séquence d'events pour simuler une saisie utilisateur :
1. Focus sur l'élément
2. Définir la valeur
3. Dispatch `input`, `change`, `blur` events
4. Pour les éditeurs rich text : insérer directement dans le DOM

**Rationale**: Les frameworks React/Vue détectent les events, pas les modifications directes de `value`.

### 7. Structure de la réponse autofill

**Décision**: L'API retourne un objet `{ fields: { [selector]: value } }` où :
- `selector` : CSS selector unique généré pour chaque champ
- `value` : Réponse générée par Claude

**Rationale**: Le content script peut appliquer les valeurs de manière déterministe via les selectors.

## Sequence Diagrams

### 1. Autofill Flow

```mermaid
sequenceDiagram
    actor User
    participant Popup as popup.js
    participant Content as content.js
    participant BG as background.js
    participant API as Backend API
    participant Claude as Claude Opus 4.5

    User->>Popup: Click "Autofill"
    Popup->>Content: Request field scan
    Content->>Content: Scan DOM (input, textarea, select, contenteditable)
    Content->>Content: Build field descriptors (labels, placeholders, selectors)
    Content-->>Popup: Return detected fields
    Popup->>BG: Send fields + CV context
    BG->>API: POST /cv-adapter/api/autofill-form (fields, cvId)
    API->>Claude: Prompt with CV data + field descriptors
    Claude-->>API: Generated responses per field
    API-->>BG: { fields: { [selector]: value } }
    BG-->>Popup: Forward response
    Popup->>Content: Apply field values
    loop For each field
        Content->>Content: Focus element
        Content->>Content: Set value
        Content->>Content: Dispatch input/change/blur events
    end
    Content-->>Popup: Confirm fields filled
    Popup-->>User: Display success status
```

### 2. Extension Authentication

```mermaid
sequenceDiagram
    actor User
    participant Site as Main Site (platform)
    participant Browser as Browser (cookies)
    participant BG as background.js
    participant API as Backend API

    User->>Site: Login (email + password)
    Site->>API: POST /gateway/api/login
    API-->>Site: Set JWT cookie (HttpOnly)
    Site-->>Browser: Store auth cookie

    Note over User,API: Later, user activates extension

    User->>BG: Open extension popup
    BG->>Browser: Read auth cookie for site domain
    Browser-->>BG: JWT cookie value
    BG->>API: API call with credentials: include (cookie attached)
    API->>API: Validate JWT from cookie
    alt JWT valid
        API-->>BG: 200 OK + response data
    else JWT invalid or missing
        API-->>BG: 401 Unauthorized
        BG-->>User: Display "Please log in on main site"
    end
```

### 3. Field Detection

```mermaid
sequenceDiagram
    participant Content as content.js
    participant DOM as Page DOM

    Content->>DOM: querySelectorAll("input[type=text], input[type=email], input[type=tel], input[type=url]")
    DOM-->>Content: Input elements

    Content->>DOM: querySelectorAll("textarea")
    DOM-->>Content: Textarea elements

    Content->>DOM: querySelectorAll("select")
    DOM-->>Content: Select elements

    Content->>DOM: querySelectorAll("[contenteditable=true], .ProseMirror, .tiptap")
    DOM-->>Content: Rich text editors

    loop For each detected element
        Content->>DOM: Find associated <label> (for attribute or parent)
        DOM-->>Content: Label text (or null)
        Content->>DOM: Read placeholder attribute
        DOM-->>Content: Placeholder text (or null)
        Content->>DOM: Read name / id / aria-label attributes
        DOM-->>Content: Attribute values
        Content->>Content: Generate unique CSS selector
        Content->>Content: Build field descriptor {selector, type, label, placeholder, name}
    end

    Content->>Content: Aggregate field descriptors into array
    Content-->>Content: Return fields[] to popup via message
```

## Risks / Trade-offs

### [Sécurité des cookies]
L'extension accède aux cookies du site principal.
→ **Mitigation**: Seules les extensions chargées localement (unpacked) ont accès. Pas de publication publique.

### [Limitations des permissions host]
L'extension ne peut pas accéder à tous les sites sans permission explicite.
→ **Mitigation**: L'utilisateur doit accorder la permission via `activeTab` pour chaque site.

### [Coût API Opus 4.5]
Claude Opus 4.5 est le modèle le plus cher.
→ **Mitigation**: Limiter le contexte envoyé. Traiter les champs par batch si possible.

### [Compatibilité des formulaires]
Certains formulaires utilisent des structures DOM non standard.
→ **Mitigation**: Fallback sur les selectors génériques. Documentation des limitations.

### [Mise à jour des extensions]
Les extensions locales ne se mettent pas à jour automatiquement.
→ **Mitigation**: Documentation du processus de rechargement dans Chrome.
