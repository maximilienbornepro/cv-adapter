#!/bin/bash
set -e

# =============================================================================
# update-project-name.sh - Renommer le projet apres initialisation
# Usage: ./update-project-name.sh [nouveau-slug]
#
# Ce script permet de changer le nom du projet apres une initialisation.
# Il met a jour tous les fichiers de configuration et sources.
# =============================================================================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

log()  { echo -e "${CYAN}[UPDATE]${NC} $1"; }
ok()   { echo -e "${GREEN}[OK]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
err()  { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

# =============================================================================
# Detecter le nom actuel
# =============================================================================
detect_current_name() {
  # Chercher dans package.json
  if [ -f "package.json" ]; then
    local pkg_name
    pkg_name=$(grep '"name":' package.json | head -1 | sed 's/.*"name": "\([^"]*\)".*/\1/' | sed 's/-platform$//')
    if [ -n "$pkg_name" ] && [ "$pkg_name" != "boilerplate" ]; then
      echo "$pkg_name"
      return
    fi
  fi

  # Chercher dans .initialized
  if [ -f ".initialized" ]; then
    local init_name
    init_name=$(grep "^PROJECT_SLUG=" .initialized | cut -d= -f2)
    if [ -n "$init_name" ]; then
      echo "$init_name"
      return
    fi
  fi

  # Default
  echo "boilerplate"
}

CURRENT_SLUG=$(detect_current_name)

# =============================================================================
# Arguments et questions
# =============================================================================
echo ""
echo -e "${BOLD}╔══════════════════════════════════════════╗${NC}"
echo -e "${BOLD}║      Renommage du Projet                 ║${NC}"
echo -e "${BOLD}╚══════════════════════════════════════════╝${NC}"
echo ""

log "Nom actuel detecte : ${BOLD}$CURRENT_SLUG${NC}"
echo ""

# Nouveau slug
if [ -n "$1" ]; then
  NEW_SLUG="$1"
else
  echo -e "${CYAN}Nouveau nom du projet${NC} (slug, ex: my-app, crm-interne):"
  read -r NEW_SLUG
fi

# Validation
if [[ ! "$NEW_SLUG" =~ ^[a-z][a-z0-9-]{1,30}$ ]]; then
  err "Nom invalide. Utilisez uniquement des minuscules, chiffres et tirets (ex: my-app)."
fi

if [ "$NEW_SLUG" == "$CURRENT_SLUG" ]; then
  warn "Le nouveau nom est identique a l'actuel. Rien a faire."
  exit 0
fi

# Nom d'affichage
echo ""
echo -e "${CYAN}Nouveau nom d'affichage${NC} (ex: My App, CRM Interne):"
read -r NEW_DISPLAY_NAME
if [ -z "$NEW_DISPLAY_NAME" ]; then
  NEW_DISPLAY_NAME=$(echo "$NEW_SLUG" | sed 's/-/ /g' | awk '{for(i=1;i<=NF;i++) $i=toupper(substr($i,1,1)) tolower(substr($i,2))}1')
fi

# Confirmation
echo ""
echo -e "${BOLD}Recapitulatif :${NC}"
echo -e "  Ancien slug    : ${RED}$CURRENT_SLUG${NC}"
echo -e "  Nouveau slug   : ${GREEN}$NEW_SLUG${NC}"
echo -e "  Nom affiche    : ${GREEN}$NEW_DISPLAY_NAME${NC}"
echo ""
echo -e "${YELLOW}ATTENTION : Arretez les containers Docker avant de continuer.${NC}"
echo -e "Confirmer le renommage ? (y/N)"
read -r confirm
[[ "$confirm" != "y" && "$confirm" != "Y" ]] && { log "Annule."; exit 0; }

echo ""
log "Renommage en cours..."
echo ""

# =============================================================================
# Fonction de remplacement
# =============================================================================
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

replace_in_all_files() {
  local from="$1"
  local to="$2"
  local pattern="$3"

  while IFS= read -r file; do
    if [ -f "$file" ] && grep -q "$from" "$file" 2>/dev/null; then
      replace "$file" "$from" "$to"
    fi
  done < <(find . -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.json" -o -name "*.yml" -o -name "*.yaml" -o -name "*.sh" -o -name "*.html" -o -name "*.css" -o -name "*.md" \) ! -path "*/node_modules/*" ! -path "*/.git/*" 2>/dev/null)
}

# =============================================================================
# Remplacements
# =============================================================================

# --- Package names ---
log "Mise a jour des package.json..."
replace "package.json" \
  "\"name\": \"${CURRENT_SLUG}-platform\"" \
  "\"name\": \"${NEW_SLUG}-platform\""

replace "packages/shared/package.json" \
  "\"name\": \"@${CURRENT_SLUG}/shared\"" \
  "\"name\": \"@${NEW_SLUG}/shared\""

replace "apps/platform/package.json" \
  "\"@${CURRENT_SLUG}/shared\": \"\*\"" \
  "\"@${NEW_SLUG}/shared\": \"*\""

replace "apps/platform/servers/unified/package.json" \
  "\"@${CURRENT_SLUG}/shared\": \"\*\"" \
  "\"@${NEW_SLUG}/shared\": \"*\""

# --- Imports dans les sources ---
log "Mise a jour des imports TypeScript..."
replace_in_all_files "@${CURRENT_SLUG}/shared" "@${NEW_SLUG}/shared"

# --- Docker ---
log "Mise a jour des fichiers Docker..."
replace "docker-compose.yml" \
  "container_name: ${CURRENT_SLUG}-db" \
  "container_name: ${NEW_SLUG}-db"

replace "docker-compose.prod.yml" \
  "container_name: ${CURRENT_SLUG}-postgres" \
  "container_name: ${NEW_SLUG}-postgres"

replace "docker-compose.prod.yml" \
  "container_name: ${CURRENT_SLUG}-unified-server" \
  "container_name: ${NEW_SLUG}-unified-server"

replace "docker-compose.prod.yml" \
  "container_name: ${CURRENT_SLUG}-platform-client" \
  "container_name: ${NEW_SLUG}-platform-client"

# --- deploy.sh ---
log "Mise a jour de deploy.sh..."
replace "deploy.sh" \
  "PROJECT_NAME=\"${CURRENT_SLUG}\"" \
  "PROJECT_NAME=\"${NEW_SLUG}\""

# --- .deploy.env.example ---
log "Mise a jour de .deploy.env.example..."
replace ".deploy.env.example" \
  "REMOTE_PATH=/opt/apps/${CURRENT_SLUG}" \
  "REMOTE_PATH=/opt/apps/${NEW_SLUG}"

# --- index.html ---
log "Mise a jour de index.html..."
replace "apps/platform/index.html" \
  "${CURRENT_SLUG}-theme" \
  "${NEW_SLUG}-theme"

# --- SharedNav ---
log "Mise a jour de SharedNav..."
replace "packages/shared/src/components/SharedNav/constants.ts" \
  "${CURRENT_SLUG}-theme" \
  "${NEW_SLUG}-theme"

# --- Nom d'affichage dans l'UI ---
log "Mise a jour du nom d'affichage..."

# Detecter l'ancien nom d'affichage
OLD_DISPLAY_NAME=""
if [ -f ".initialized" ]; then
  OLD_DISPLAY_NAME=$(grep "^PROJECT_DISPLAY_NAME=" .initialized | cut -d= -f2)
fi
if [ -z "$OLD_DISPLAY_NAME" ]; then
  OLD_DISPLAY_NAME=$(echo "$CURRENT_SLUG" | sed 's/-/ /g' | awk '{for(i=1;i<=NF;i++) $i=toupper(substr($i,1,1)) tolower(substr($i,2))}1')
fi

if [ -n "$OLD_DISPLAY_NAME" ]; then
  replace "packages/shared/src/components/SharedNav/SharedNav.tsx" \
    "alt=\"${OLD_DISPLAY_NAME}\"" \
    "alt=\"${NEW_DISPLAY_NAME}\""
  replace "packages/shared/src/components/SharedNav/SharedNav.tsx" \
    ">${OLD_DISPLAY_NAME}<" \
    ">${NEW_DISPLAY_NAME}<"
  replace "apps/platform/src/modules/gateway/components/LoginPage.tsx" \
    ">${OLD_DISPLAY_NAME}<" \
    ">${NEW_DISPLAY_NAME}<"
  replace "apps/platform/src/modules/gateway/components/LandingPage.tsx" \
    "${OLD_DISPLAY_NAME}" \
    "${NEW_DISPLAY_NAME}"
  replace "apps/platform/index.html" \
    "<title>${OLD_DISPLAY_NAME}</title>" \
    "<title>${NEW_DISPLAY_NAME}</title>"
fi

# --- vite.config.ts ---
log "Mise a jour de vite.config.ts..."
replace "apps/platform/vite.config.ts" \
  "'vendor-shared': \['@${CURRENT_SLUG}/shared'\]" \
  "'vendor-shared': ['@${NEW_SLUG}/shared']"

# --- Dockerfile.prod ---
log "Mise a jour de Dockerfile.prod..."
replace "apps/platform/servers/unified/Dockerfile.prod" \
  "@${CURRENT_SLUG}\\/shared" \
  "@${NEW_SLUG}\\/shared"

# =============================================================================
# Mettre a jour .initialized
# =============================================================================
log "Mise a jour de .initialized..."
cat > ".initialized" <<EOF
PROJECT_SLUG=${NEW_SLUG}
PROJECT_DISPLAY_NAME=${NEW_DISPLAY_NAME}
PROJECT_DESCRIPTION=Plateforme ${NEW_DISPLAY_NAME}
UPDATED_AT=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
EOF

# =============================================================================
# Reinstaller les dependances
# =============================================================================
echo ""
log "Reinstallation des dependances..."
rm -rf node_modules package-lock.json 2>/dev/null || true
npm install

# =============================================================================
# Termine
# =============================================================================
echo ""
echo -e "${BOLD}${GREEN}Projet renomme : ${NEW_DISPLAY_NAME}${NC}"
echo ""
echo -e "${BOLD}Prochaines etapes :${NC}"
echo ""
echo -e "  1. Relancer la base de donnees :"
echo -e "     ${CYAN}npm run db:reset${NC}"
echo ""
echo -e "  2. Relancer le projet :"
echo -e "     ${CYAN}npm run dev${NC}"
echo ""
if [ -n "$(git remote get-url origin 2>/dev/null)" ]; then
  echo -e "  3. Commit et push les changements :"
  echo -e "     ${CYAN}git add -A && git commit -m 'chore: rename project to ${NEW_SLUG}'${NC}"
  echo -e "     ${CYAN}git push${NC}"
fi
echo ""
