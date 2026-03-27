#!/bin/bash
set -e

# =============================================================================
# init.sh - Initialisation du projet boilerplate
# Usage: ./init.sh
#
# Ce script remplace "boilerplate" par le nom de votre projet dans tous les
# fichiers de configuration, sources et scripts.
# =============================================================================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

log()  { echo -e "${CYAN}[INIT]${NC} $1"; }
ok()   { echo -e "${GREEN}[OK]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
err()  { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

# --- Vérification : script déjà lancé ? ---
if [ -f ".initialized" ]; then
  warn "Ce projet a déjà été initialisé (fichier .initialized présent)."
  warn "Voulez-vous ré-initialiser ? (y/N)"
  read -r answer
  [[ "$answer" != "y" && "$answer" != "Y" ]] && { log "Annulé."; exit 0; }
fi

# =============================================================================
# Bienvenue
# =============================================================================
echo ""
echo -e "${BOLD}╔══════════════════════════════════════════╗${NC}"
echo -e "${BOLD}║       Initialisation du Boilerplate      ║${NC}"
echo -e "${BOLD}╚══════════════════════════════════════════╝${NC}"
echo ""

# =============================================================================
# Questions
# =============================================================================

# Nom du projet (slug technique)
while true; do
  echo -e "${CYAN}Nom du projet${NC} (slug, ex: my-app, crm-interne, tools):"
  read -r PROJECT_SLUG

  # Validation : minuscules, chiffres, tirets uniquement
  if [[ "$PROJECT_SLUG" =~ ^[a-z][a-z0-9-]{1,30}$ ]]; then
    break
  else
    warn "Nom invalide. Utilisez uniquement des minuscules, chiffres et tirets (ex: my-app)."
  fi
done

# Nom d'affichage
echo ""
echo -e "${CYAN}Nom d'affichage${NC} (ex: My App, CRM Interne, Tools Platform):"
read -r PROJECT_DISPLAY_NAME
if [ -z "$PROJECT_DISPLAY_NAME" ]; then
  # Capitaliser le slug par défaut
  PROJECT_DISPLAY_NAME=$(echo "$PROJECT_SLUG" | sed 's/-/ /g' | awk '{for(i=1;i<=NF;i++) $i=toupper(substr($i,1,1)) tolower(substr($i,2))}1')
fi

# Description
echo ""
echo -e "${CYAN}Description courte${NC} (ex: Plateforme interne de gestion):"
read -r PROJECT_DESCRIPTION
if [ -z "$PROJECT_DESCRIPTION" ]; then
  PROJECT_DESCRIPTION="Plateforme $PROJECT_DISPLAY_NAME"
fi

# Confirmation
echo ""
echo -e "${BOLD}Récapitulatif :${NC}"
echo -e "  Slug         : ${GREEN}$PROJECT_SLUG${NC}"
echo -e "  Nom affiché  : ${GREEN}$PROJECT_DISPLAY_NAME${NC}"
echo -e "  Description  : ${GREEN}$PROJECT_DESCRIPTION${NC}"
echo ""
echo -e "Confirmer ? (Y/n)"
read -r confirm
[[ "$confirm" == "n" || "$confirm" == "N" ]] && { log "Annulé."; exit 0; }

echo ""

# =============================================================================
# Sélection des modules
# =============================================================================

./select-modules.sh

echo ""
log "Initialisation en cours..."
echo ""

# =============================================================================
# Remplacements
# =============================================================================

# Fonction replace compatible macOS et Linux (sans fichiers de backup)
replace() {
  local file="$1"
  local from="$2"
  local to="$3"
  if [ -f "$file" ]; then
    local tmp_file
    tmp_file=$(mktemp)
    sed "s|$from|$to|g" "$file" > "$tmp_file" && mv "$tmp_file" "$file"
  fi
}

# --- package.json racine ---
log "package.json..."
replace "package.json" \
  '"name": "boilerplate-platform"' \
  "\"name\": \"${PROJECT_SLUG}-platform\""
replace "package.json" \
  '"description": "Boilerplate platform with JWT authentication and design system"' \
  "\"description\": \"${PROJECT_DESCRIPTION}\""

# --- packages/shared/package.json ---
replace "packages/shared/package.json" \
  '"name": "@boilerplate/shared"' \
  "\"name\": \"@${PROJECT_SLUG}/shared\""

# --- apps/platform/package.json ---
replace "apps/platform/package.json" \
  '"@boilerplate/shared": "\*"' \
  "\"@${PROJECT_SLUG}/shared\": \"*\""

# --- apps/platform/servers/unified/package.json ---
replace "apps/platform/servers/unified/package.json" \
  '"@boilerplate/shared": "\*"' \
  "\"@${PROJECT_SLUG}/shared\": \"*\""

# --- Imports @boilerplate/shared -> @PROJECT_SLUG/shared dans les sources ---
log "Imports TypeScript..."

# Utiliser find pour trouver TOUS les fichiers avec @boilerplate/shared (plus fiable que grep -rl sur macOS)
while IFS= read -r file; do
  if [ -f "$file" ] && grep -q "@boilerplate/shared" "$file" 2>/dev/null; then
    replace "$file" "@boilerplate/shared" "@${PROJECT_SLUG}/shared"
  fi
done < <(find . -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.json" \) ! -path "*/node_modules/*" ! -path "*/.git/*" 2>/dev/null)

# --- vite.config.ts ---
log "vite.config.ts..."
replace "apps/platform/vite.config.ts" \
  "'vendor-shared': \['@boilerplate/shared'\]" \
  "'vendor-shared': ['@${PROJECT_SLUG}/shared']"

# --- index.html ---
log "index.html..."
replace "apps/platform/index.html" \
  "<title>Boilerplate Platform</title>" \
  "<title>${PROJECT_DISPLAY_NAME}</title>"
replace "apps/platform/index.html" \
  "boilerplate-theme" \
  "${PROJECT_SLUG}-theme"

# --- SharedNav constants.ts ---
log "SharedNav constants..."
replace "packages/shared/src/components/SharedNav/constants.ts" \
  "boilerplate-theme" \
  "${PROJECT_SLUG}-theme"

# --- SharedNav.tsx (texte affiché) ---
log "SharedNav.tsx..."
replace "packages/shared/src/components/SharedNav/SharedNav.tsx" \
  "alt=\"Boilerplate\"" \
  "alt=\"${PROJECT_DISPLAY_NAME}\""
replace "packages/shared/src/components/SharedNav/SharedNav.tsx" \
  ">Boilerplate<" \
  ">${PROJECT_DISPLAY_NAME}<"

# --- LoginPage.tsx ---
log "LoginPage..."
replace "apps/platform/src/modules/gateway/components/LoginPage.tsx" \
  ">Boilerplate<" \
  ">${PROJECT_DISPLAY_NAME}<"

# --- LandingPage.tsx ---
log "LandingPage..."
replace "apps/platform/src/modules/gateway/components/LandingPage.tsx" \
  "Boilerplate Platform" \
  "${PROJECT_DISPLAY_NAME}"

# --- docker-compose.yml ---
log "docker-compose.yml..."
replace "docker-compose.yml" \
  "container_name: boilerplate-db" \
  "container_name: ${PROJECT_SLUG}-db"

# --- docker-compose.prod.yml ---
log "docker-compose.prod.yml..."
replace "docker-compose.prod.yml" \
  "container_name: boilerplate-postgres" \
  "container_name: ${PROJECT_SLUG}-postgres"
replace "docker-compose.prod.yml" \
  "container_name: boilerplate-unified-server" \
  "container_name: ${PROJECT_SLUG}-unified-server"
replace "docker-compose.prod.yml" \
  "container_name: boilerplate-platform-client" \
  "container_name: ${PROJECT_SLUG}-platform-client"

# --- Dockerfile.prod (server) ---
log "Dockerfile.prod..."
replace "apps/platform/servers/unified/Dockerfile.prod" \
  "@boilerplate\\/shared" \
  "@${PROJECT_SLUG}\\/shared"

# --- deploy.sh ---
log "deploy.sh..."
replace "deploy.sh" \
  'PROJECT_NAME="boilerplate"' \
  "PROJECT_NAME=\"${PROJECT_SLUG}\""

# --- .deploy.env.example ---
log ".deploy.env.example..."
replace ".deploy.env.example" \
  "REMOTE_PATH=/opt/apps/boilerplate" \
  "REMOTE_PATH=/opt/apps/${PROJECT_SLUG}"

# --- .env.example ---
log ".env.example..."

# --- Mettre à jour package.json workspaces (remplacer @boilerplate/shared dans workspaces) ---
# (workspaces reference les chemins, pas le nom du package - pas de changement nécessaire)

# =============================================================================
# Créer le fichier .env depuis .env.example
# =============================================================================
if [ ! -f ".env" ]; then
  log "Création de .env..."
  cp .env.example .env
  ok ".env créé depuis .env.example"
fi

# =============================================================================
# Configuration Git : Upstream Boilerplate
# =============================================================================
log "Configuration des remotes Git..."

# Récupérer l'URL actuelle de origin (c'est le boilerplate)
BOILERPLATE_URL=$(git remote get-url origin 2>/dev/null || echo "")

if [ -n "$BOILERPLATE_URL" ]; then
  # Renommer origin en boilerplate
  git remote rename origin boilerplate 2>/dev/null || true
  ok "Remote 'boilerplate' configuré : $BOILERPLATE_URL"

  # Demander l'URL du nouveau repo
  echo ""
  echo -e "${CYAN}URL du nouveau dépôt Git${NC} (laisser vide pour configurer plus tard) :"
  echo -e "  Ex: git@github.com:votre-org/${PROJECT_SLUG}.git"
  echo -e "  Ex: https://github.com/votre-org/${PROJECT_SLUG}.git"
  read -r NEW_ORIGIN_URL

  if [ -n "$NEW_ORIGIN_URL" ]; then
    git remote add origin "$NEW_ORIGIN_URL"
    ok "Remote 'origin' configuré : $NEW_ORIGIN_URL"
  else
    warn "Pas de nouveau remote configuré. Ajoutez-le plus tard avec :"
    echo -e "     ${CYAN}git remote add origin <url-de-votre-repo>${NC}"
  fi
else
  warn "Pas de remote origin détecté. Configuration manuelle requise."
fi

# Créer le script de synchronisation
log "Création du script sync-boilerplate.sh..."
cat > "sync-boilerplate.sh" <<'SYNCEOF'
#!/bin/bash
set -e

# =============================================================================
# sync-boilerplate.sh - Synchroniser avec le boilerplate upstream
# Usage: ./sync-boilerplate.sh [--dry-run]
# =============================================================================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

log()  { echo -e "${CYAN}[SYNC]${NC} $1"; }
ok()   { echo -e "${GREEN}[OK]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
err()  { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

DRY_RUN=false
if [ "$1" == "--dry-run" ]; then
  DRY_RUN=true
  log "Mode dry-run : aucune modification ne sera appliquée"
fi

# Vérifier que le remote boilerplate existe
if ! git remote get-url boilerplate &>/dev/null; then
  err "Remote 'boilerplate' non configuré. Ajoutez-le avec :"
  echo "  git remote add boilerplate <url-du-boilerplate>"
  exit 1
fi

echo ""
echo -e "${BOLD}╔══════════════════════════════════════════╗${NC}"
echo -e "${BOLD}║     Synchronisation avec Boilerplate     ║${NC}"
echo -e "${BOLD}╚══════════════════════════════════════════╝${NC}"
echo ""

# Fetch les dernières mises à jour
log "Récupération des mises à jour du boilerplate..."
git fetch boilerplate

# Afficher les commits disponibles
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
COMMITS_BEHIND=$(git rev-list --count HEAD..boilerplate/main 2>/dev/null || echo "0")

if [ "$COMMITS_BEHIND" == "0" ]; then
  ok "Votre projet est à jour avec le boilerplate."
  exit 0
fi

log "Il y a ${BOLD}$COMMITS_BEHIND commits${NC} disponibles depuis le boilerplate."
echo ""

# Afficher les commits
echo -e "${BOLD}Commits disponibles :${NC}"
git log --oneline HEAD..boilerplate/main | head -20
if [ "$COMMITS_BEHIND" -gt 20 ]; then
  echo "  ... et $(($COMMITS_BEHIND - 20)) autres commits"
fi
echo ""

# Afficher les fichiers modifiés
echo -e "${BOLD}Fichiers impactés :${NC}"
git diff --stat HEAD...boilerplate/main | tail -20
echo ""

if [ "$DRY_RUN" == "true" ]; then
  log "Mode dry-run terminé. Lancez sans --dry-run pour appliquer."
  exit 0
fi

# Demander confirmation
echo -e "${YELLOW}Voulez-vous merger ces changements ?${NC} (y/N)"
read -r confirm
if [[ "$confirm" != "y" && "$confirm" != "Y" ]]; then
  log "Annulé."
  exit 0
fi

# Merger
log "Merge en cours..."
if git merge boilerplate/main --no-edit; then
  ok "Merge réussi !"
  echo ""
  echo -e "${BOLD}Prochaines étapes :${NC}"
  echo -e "  1. Vérifier les changements : ${CYAN}git diff HEAD~${COMMITS_BEHIND}${NC}"
  echo -e "  2. Lancer les tests : ${CYAN}npm test${NC}"
  echo -e "  3. Si tout est OK : ${CYAN}git push${NC}"
else
  warn "Conflits détectés. Résolvez-les puis :"
  echo -e "  1. ${CYAN}git add <fichiers-résolus>${NC}"
  echo -e "  2. ${CYAN}git commit${NC}"
  echo -e "  3. ${CYAN}npm test${NC}"
  echo -e "  4. ${CYAN}git push${NC}"
fi
SYNCEOF

chmod +x sync-boilerplate.sh
ok "Script sync-boilerplate.sh créé"

# =============================================================================
# Marquer comme initialisé
# =============================================================================
cat > ".initialized" <<EOF
PROJECT_SLUG=${PROJECT_SLUG}
PROJECT_DISPLAY_NAME=${PROJECT_DISPLAY_NAME}
PROJECT_DESCRIPTION=${PROJECT_DESCRIPTION}
BOILERPLATE_URL=${BOILERPLATE_URL}
INITIALIZED_AT=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
EOF

# Ajouter .initialized au .gitignore s'il n'y est pas
if ! grep -q "^\.initialized$" .gitignore 2>/dev/null; then
  echo ".initialized" >> .gitignore
fi

# =============================================================================
# Installation de OpenSpec (spec-driven development)
# =============================================================================
log "Installation de OpenSpec..."

# Vérifier si OpenSpec est déjà installé
if command -v openspec &> /dev/null; then
  ok "OpenSpec déjà installé ($(openspec --version 2>/dev/null || echo 'version inconnue'))"
else
  log "Installation de @fission-ai/openspec..."
  if npm install -g @fission-ai/openspec@latest; then
    ok "OpenSpec installé avec succès"
  else
    warn "Échec de l'installation globale d'OpenSpec. Vous pouvez l'installer manuellement :"
    warn "  npm install -g @fission-ai/openspec@latest"
  fi
fi

# Initialiser OpenSpec dans le projet
if [ ! -d ".openspec" ]; then
  log "Initialisation d'OpenSpec dans le projet..."
  if command -v openspec &> /dev/null; then
    openspec init --yes 2>/dev/null || openspec init 2>/dev/null || warn "Initialisation OpenSpec manuelle requise: openspec init"
    ok "OpenSpec initialisé"
  fi
fi

# =============================================================================
# Instructions suivantes
# =============================================================================
echo ""
echo -e "${BOLD}${GREEN}✓ Projet initialisé : ${PROJECT_DISPLAY_NAME}${NC}"
echo ""
echo -e "${BOLD}Prochaines étapes :${NC}"
echo ""
echo -e "  1. Installer les dépendances :"
echo -e "     ${CYAN}npm install${NC}"
echo ""
echo -e "  2. Lancer la base de données :"
echo -e "     ${CYAN}npm run db:start${NC}"
echo ""
echo -e "  3. Lancer le projet :"
echo -e "     ${CYAN}npm run dev${NC}"
echo ""
echo -e "  4. Se connecter sur http://localhost:5170"
echo -e "     Identifiant : ${CYAN}admin${NC} / Mot de passe : ${CYAN}admin${NC}"
echo ""
echo -e "${BOLD}Workflow OpenSpec (spec-driven development) :${NC}"
echo ""
echo -e "  Utiliser les commandes Claude Code :"
echo -e "     ${CYAN}/opsx:propose \"description de la feature\"${NC}  - Créer une spec"
echo -e "     ${CYAN}/opsx:apply${NC}                                  - Implémenter les tâches"
echo -e "     ${CYAN}/opsx:verify${NC}                                 - Vérifier l'implémentation"
echo -e "     ${CYAN}/opsx:archive${NC}                                - Archiver le travail terminé"
echo ""
echo -e "${BOLD}Synchronisation avec le boilerplate :${NC}"
echo ""
echo -e "  Pour récupérer les mises à jour du boilerplate :"
echo -e "     ${CYAN}./sync-boilerplate.sh --dry-run${NC}  - Voir les changements disponibles"
echo -e "     ${CYAN}./sync-boilerplate.sh${NC}            - Appliquer les mises à jour"
echo ""
echo -e "  Pour le déploiement distant :"
echo -e "     ${CYAN}cp .deploy.env.example .deploy.env${NC}"
echo -e "     ${CYAN}# Éditer .deploy.env puis : ./deploy-remote.sh deploy${NC}"
echo ""
