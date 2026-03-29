#!/bin/bash
set -e

# =============================================================================
# select-modules.sh - Sélection des modules à garder dans le projet
# Usage: ./select-modules.sh
#
# Ce script permet de choisir quels modules garder.
# Les modules non sélectionnés sont supprimés (frontend, backend, tests, SQL).
# Les fichiers d'intégration sont nettoyés automatiquement.
# =============================================================================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
DIM='\033[2m'
NC='\033[0m'

log()  { echo -e "${CYAN}[MODULES]${NC} $1"; }
ok()   { echo -e "${GREEN}  ✓${NC} $1"; }
warn() { echo -e "${YELLOW}  !${NC} $1"; }
err()  { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

# =============================================================================
# Registry des modules disponibles
# =============================================================================

# Chaque module est défini par :
#   ID | Nom affiché | Description | Couleur SharedNav | Dépendances npm supplémentaires

declare -A MODULE_NAMES=(
  [conges]="Congés"
  [roadmap]="Roadmap"
  [suivitess]="SuiViTess"
  [delivery]="Delivery Board"
  [mon-cv]="Mon CV"
)

declare -A MODULE_DESCRIPTIONS=(
  [conges]="Gestion des congés et absences (calendrier annuel)"
  [roadmap]="Planification Gantt interactif (drag, dépendances, marqueurs)"
  [suivitess]="Suivi de sujets structurés (documents, snapshots, diff)"
  [delivery]="Board de sprint planning avec grille drag & drop"
  [mon-cv]="Gestion de CV avec import IA (Claude) et export PDF"
)

# Ordre d'affichage
MODULES_ORDER=(conges roadmap suivitess delivery mon-cv)

# =============================================================================
# Détection des modules actuellement présents
# =============================================================================

detect_present_modules() {
  local present=()
  for mod in "${MODULES_ORDER[@]}"; do
    if [ -d "apps/platform/src/modules/$mod" ]; then
      present+=("$mod")
    fi
  done
  echo "${present[@]}"
}

# =============================================================================
# Interface de sélection
# =============================================================================

echo ""
echo -e "${BOLD}╔══════════════════════════════════════════╗${NC}"
echo -e "${BOLD}║        Sélection des Modules             ║${NC}"
echo -e "${BOLD}╚══════════════════════════════════════════╝${NC}"
echo ""

PRESENT_MODULES=($(detect_present_modules))

if [ ${#PRESENT_MODULES[@]} -eq 0 ]; then
  err "Aucun module détecté. Vérifiez que vous êtes à la racine du boilerplate."
fi

echo -e "${BOLD}Modules disponibles :${NC}"
echo ""

# Afficher les modules avec numéros
for i in "${!PRESENT_MODULES[@]}"; do
  mod="${PRESENT_MODULES[$i]}"
  num=$((i + 1))
  echo -e "  ${BOLD}${num}.${NC} ${GREEN}${MODULE_NAMES[$mod]}${NC} ${DIM}($mod)${NC}"
  echo -e "     ${MODULE_DESCRIPTIONS[$mod]}"
  echo ""
done

echo -e "${CYAN}Quels modules voulez-vous garder ?${NC}"
echo -e "${DIM}Entrez les numéros séparés par des espaces (ex: 1 3 5)${NC}"
echo -e "${DIM}Appuyez sur Entrée pour tout garder.${NC}"
echo ""
echo -n "> "
read -r SELECTION

# Interpréter la sélection
SELECTED_MODULES=()

if [ -z "$SELECTION" ]; then
  # Tout garder
  SELECTED_MODULES=("${PRESENT_MODULES[@]}")
  log "Tous les modules conservés."
else
  for num in $SELECTION; do
    idx=$((num - 1))
    if [ $idx -ge 0 ] && [ $idx -lt ${#PRESENT_MODULES[@]} ]; then
      SELECTED_MODULES+=("${PRESENT_MODULES[$idx]}")
    else
      warn "Numéro invalide : $num (ignoré)"
    fi
  done
fi

if [ ${#SELECTED_MODULES[@]} -eq 0 ]; then
  err "Aucun module sélectionné. Au moins un module est requis."
fi

# Calculer les modules à supprimer
MODULES_TO_REMOVE=()
for mod in "${PRESENT_MODULES[@]}"; do
  keep=false
  for sel in "${SELECTED_MODULES[@]}"; do
    if [ "$mod" == "$sel" ]; then
      keep=true
      break
    fi
  done
  if ! $keep; then
    MODULES_TO_REMOVE+=("$mod")
  fi
done

# Confirmation
echo ""
echo -e "${BOLD}Récapitulatif :${NC}"
echo ""
for mod in "${SELECTED_MODULES[@]}"; do
  echo -e "  ${GREEN}✓ ${MODULE_NAMES[$mod]}${NC} ($mod)"
done
for mod in "${MODULES_TO_REMOVE[@]}"; do
  echo -e "  ${RED}✗ ${MODULE_NAMES[$mod]}${NC} ($mod) — sera supprimé"
done
echo ""

if [ ${#MODULES_TO_REMOVE[@]} -eq 0 ]; then
  ok "Aucun module à supprimer."
  exit 0
fi

echo -e "${YELLOW}Confirmer la suppression ?${NC} (y/N)"
read -r confirm
if [[ "$confirm" != "y" && "$confirm" != "Y" ]]; then
  log "Annulé."
  exit 0
fi

echo ""
log "Suppression des modules non sélectionnés..."

# =============================================================================
# Suppression des modules
# =============================================================================

for mod in "${MODULES_TO_REMOVE[@]}"; do
  log "Suppression de ${BOLD}${MODULE_NAMES[$mod]}${NC}..."

  # Frontend
  rm -rf "apps/platform/src/modules/$mod"
  ok "Frontend supprimé"

  # Backend
  rm -rf "apps/platform/servers/unified/src/modules/$mod"
  rm -rf "apps/platform/servers/unified/src/modules/__tests__/$mod"
  ok "Backend supprimé"

  # Database schema
  for sql in database/init/*_${mod}*.sql database/init/*_cv_*.sql; do
    if [ -f "$sql" ]; then
      rm -f "$sql"
      ok "Schema SQL supprimé : $(basename $sql)"
    fi
  done

  # OpenSpec changes
  rm -rf "openspec/changes/module-$mod"

  ok "${MODULE_NAMES[$mod]} supprimé"
  echo ""
done

# =============================================================================
# Nettoyage des fichiers d'intégration
# =============================================================================

log "Nettoyage des fichiers d'intégration..."

# --- router.tsx ---
ROUTER="apps/platform/src/router.tsx"
if [ -f "$ROUTER" ]; then
  for mod in "${MODULES_TO_REMOVE[@]}"; do
    # Déterminer le nom du composant
    case "$mod" in
      conges) COMP="CongesApp" ;;
      roadmap) COMP="RoadmapApp" ;;
      suivitess) COMP="SuivitessApp" ;;
      delivery) COMP="DeliveryApp" ;;
      mon-cv) COMP="MonCvApp" ;;
      *) continue ;;
    esac

    # Supprimer le lazy import
    sed -i '' "/const ${COMP} = lazy/d" "$ROUTER" 2>/dev/null || true

    # Supprimer les Route blocks (multi-line) — utiliser perl pour multi-line
    perl -i -0pe "s|        <Route\n          path=\"/${mod}/\*\"\n          element=\{\n            <SuspenseWrapper>\n              <${COMP}[^/]*/>\n            </SuspenseWrapper>\n          \}\n        />\n||gs" "$ROUTER" 2>/dev/null || true

    # Fallback: supprimer lignes contenant le path du module
    sed -i '' "/${mod}\/\*/d" "$ROUTER" 2>/dev/null || true
    sed -i '' "/<${COMP}/d" "$ROUTER" 2>/dev/null || true
  done
  ok "router.tsx nettoyé"
fi

# --- vite.config.ts ---
VITE="apps/platform/vite.config.ts"
if [ -f "$VITE" ]; then
  for mod in "${MODULES_TO_REMOVE[@]}"; do
    # Supprimer le bloc proxy (4 lignes : commentaire, clé, target, rewrite + },)
    sed -i '' "/\/${mod}-api/,/},/d" "$VITE" 2>/dev/null || true
    # Supprimer commentaire orphelin
    sed -i '' "/\/\/ .*${mod}/Id" "$VITE" 2>/dev/null || true
  done
  ok "vite.config.ts nettoyé"
fi

# --- Server index.ts ---
INDEX="apps/platform/servers/unified/src/index.ts"
if [ -f "$INDEX" ]; then
  for mod in "${MODULES_TO_REMOVE[@]}"; do
    # Déterminer les noms de fonctions
    case "$mod" in
      conges) INIT="initConges"; ROUTER_FN="createCongesRouter"; MOUNT="conges" ;;
      roadmap) INIT="initRoadmap"; ROUTER_FN="createRoadmapRouter"; MOUNT="roadmap" ;;
      suivitess) INIT="initSuivitess"; ROUTER_FN="createSuivitessRouter"; MOUNT="suivitess" ;;
      delivery) INIT="initDelivery"; ROUTER_FN="createDeliveryRouter"; MOUNT="delivery" ;;
      mon-cv) INIT="initMonCv"; ROUTER_FN="createMonCvRouter"; MOUNT="mon-cv" ;;
      *) continue ;;
    esac

    # Supprimer import
    sed -i '' "/${INIT}/d" "$INDEX" 2>/dev/null || true
    # Supprimer init + mount
    sed -i '' "/await ${INIT}/d" "$INDEX" 2>/dev/null || true
    sed -i '' "/${ROUTER_FN}/d" "$INDEX" 2>/dev/null || true
    # Supprimer commentaire
    sed -i '' "/\/\/ .*$(echo $mod | sed 's/-/./g')/Id" "$INDEX" 2>/dev/null || true
  done
  ok "index.ts (serveur) nettoyé"
fi

# --- gateway.ts AVAILABLE_APPS ---
GATEWAY="apps/platform/servers/unified/src/modules/gateway.ts"
if [ -f "$GATEWAY" ]; then
  for mod in "${MODULES_TO_REMOVE[@]}"; do
    # Supprimer le module de AVAILABLE_APPS
    sed -i '' "s/, '$mod'//" "$GATEWAY" 2>/dev/null || true
    sed -i '' "s/'$mod', //" "$GATEWAY" 2>/dev/null || true
    sed -i '' "s/'$mod'//" "$GATEWAY" 2>/dev/null || true
  done
  ok "gateway.ts AVAILABLE_APPS nettoyé"
fi

# --- SharedNav constants.ts ---
CONSTANTS="packages/shared/src/components/SharedNav/constants.ts"
if [ -f "$CONSTANTS" ]; then
  for mod in "${MODULES_TO_REMOVE[@]}"; do
    # Supprimer le bloc de l'app (entre { id: 'mod' et },)
    perl -i -0pe "s|  \{\n    id: '${mod}',\n.*?\n  \},\n||gs" "$CONSTANTS" 2>/dev/null || true
  done
  ok "SharedNav/constants.ts nettoyé"
fi

# --- vitest.config.ts ---
VITEST="vitest.config.ts"
if [ -f "$VITEST" ]; then
  for mod in "${MODULES_TO_REMOVE[@]}"; do
    # Supprimer les blocs server-mod et client-mod
    perl -i -0pe "s|      // Server: ${mod}\n      \{\n        test: \{\n.*?name: 'server-${mod}',\n.*?\n        \},\n      \},\n||gs" "$VITEST" 2>/dev/null || true
    perl -i -0pe "s|      // Client: ${mod}\n      \{\n        test: \{\n.*?name: 'client-${mod}',\n.*?\n        \},\n      \},\n||gs" "$VITEST" 2>/dev/null || true
    # Fallback: supprimer par nom de projet
    perl -i -0pe "s|      \{\n        test: \{\n          name: 'server-${mod}',\n.*?\n        \},\n      \},\n||gs" "$VITEST" 2>/dev/null || true
    perl -i -0pe "s|      \{\n        test: \{\n          name: 'client-${mod}',\n.*?\n        \},\n      \},\n||gs" "$VITEST" 2>/dev/null || true
  done
  ok "vitest.config.ts nettoyé"
fi

# --- package.json test scripts ---
PKG="package.json"
if [ -f "$PKG" ]; then
  for mod in "${MODULES_TO_REMOVE[@]}"; do
    sed -i '' "/test:server:${mod}/d" "$PKG" 2>/dev/null || true
    sed -i '' "/test:client:${mod}/d" "$PKG" 2>/dev/null || true
  done
  ok "package.json nettoyé"
fi

# =============================================================================
# Vérification
# =============================================================================

echo ""
log "Vérification..."

# Lancer les tests
if npm test 2>&1 | tail -3 | grep -q "passed"; then
  ok "Tous les tests passent"
else
  warn "Vérifiez les tests manuellement : npm test"
fi

# =============================================================================
# Résultat
# =============================================================================

echo ""
echo -e "${BOLD}${GREEN}✓ Modules configurés avec succès${NC}"
echo ""
echo -e "${BOLD}Modules actifs :${NC}"
for mod in "${SELECTED_MODULES[@]}"; do
  echo -e "  ${GREEN}●${NC} ${MODULE_NAMES[$mod]} ${DIM}(/$mod)${NC}"
done
echo ""

# Sauvegarder la sélection
echo "${SELECTED_MODULES[*]}" > .modules
echo -e "${DIM}Sélection sauvegardée dans .modules${NC}"
echo ""
