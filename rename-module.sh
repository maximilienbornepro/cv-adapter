#!/bin/bash
set -e

# =============================================================================
# rename-module.sh - Rename a module (directories, routes, imports, config)
# Usage: ./rename-module.sh <old-name> <new-name> [--display "Display Name"]
#
# Example: ./rename-module.sh cv-adapter mon-cv --display "Mon CV"
# =============================================================================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

log()  { echo -e "${CYAN}[RENAME]${NC} $1"; }
ok()   { echo -e "${GREEN}[OK]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
err()  { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

# --- Parse args ---
OLD_NAME=""
NEW_NAME=""
DISPLAY_NAME=""

while [[ $# -gt 0 ]]; do
  case $1 in
    --display)
      DISPLAY_NAME="$2"
      shift 2
      ;;
    *)
      if [ -z "$OLD_NAME" ]; then
        OLD_NAME="$1"
      elif [ -z "$NEW_NAME" ]; then
        NEW_NAME="$1"
      fi
      shift
      ;;
  esac
done

if [ -z "$OLD_NAME" ] || [ -z "$NEW_NAME" ]; then
  err "Usage: ./rename-module.sh <old-name> <new-name> [--display \"Display Name\"]"
fi

# Generate display name from new-name if not provided
if [ -z "$DISPLAY_NAME" ]; then
  DISPLAY_NAME=$(echo "$NEW_NAME" | sed 's/-/ /g' | awk '{for(i=1;i<=NF;i++) $i=toupper(substr($i,1,1)) tolower(substr($i,2))}1')
fi

# Generate PascalCase variants
OLD_PASCAL=$(echo "$OLD_NAME" | sed 's/-\([a-z]\)/\U\1/g; s/^\([a-z]\)/\U\1/')
NEW_PASCAL=$(echo "$NEW_NAME" | sed 's/-\([a-z]\)/\U\1/g; s/^\([a-z]\)/\U\1/')

# Generate camelCase variants
OLD_CAMEL=$(echo "$OLD_PASCAL" | sed 's/^\([A-Z]\)/\L\1/')
NEW_CAMEL=$(echo "$NEW_PASCAL" | sed 's/^\([A-Z]\)/\L\1/')

# Generate old display name from old-name
OLD_DISPLAY=$(grep -o "name: '[^']*'" packages/shared/src/components/SharedNav/constants.ts 2>/dev/null | grep -i "$(echo $OLD_NAME | tr '-' '.')" | head -1 | sed "s/name: '//;s/'//")
if [ -z "$OLD_DISPLAY" ]; then
  OLD_DISPLAY=$(echo "$OLD_NAME" | sed 's/-/ /g' | awk '{for(i=1;i<=NF;i++) $i=toupper(substr($i,1,1)) tolower(substr($i,2))}1')
fi

log "Renaming module: $OLD_NAME -> $NEW_NAME"
log "Display: $OLD_DISPLAY -> $DISPLAY_NAME"
log "PascalCase: $OLD_PASCAL -> $NEW_PASCAL"
log "camelCase: $OLD_CAMEL -> $NEW_CAMEL"
echo ""

# --- Verify source directories exist ---
FRONTEND="apps/platform/src/modules/$OLD_NAME"
BACKEND="apps/platform/servers/unified/src/modules/$OLD_NAME"
BACKEND_TESTS="apps/platform/servers/unified/src/modules/__tests__/$OLD_NAME"

if [ ! -d "$FRONTEND" ]; then
  err "Frontend directory not found: $FRONTEND"
fi
if [ ! -d "$BACKEND" ]; then
  err "Backend directory not found: $BACKEND"
fi

# --- Step 1: Rename directories ---
log "Step 1: Renaming directories..."

mv "$FRONTEND" "apps/platform/src/modules/$NEW_NAME"
ok "Frontend: modules/$OLD_NAME -> modules/$NEW_NAME"

mv "$BACKEND" "apps/platform/servers/unified/src/modules/$NEW_NAME"
ok "Backend: modules/$OLD_NAME -> modules/$NEW_NAME"

if [ -d "$BACKEND_TESTS" ]; then
  mv "$BACKEND_TESTS" "apps/platform/servers/unified/src/modules/__tests__/$NEW_NAME"
  ok "Backend tests: __tests__/$OLD_NAME -> __tests__/$NEW_NAME"
fi

# Rename test files inside directories
for f in $(find "apps/platform/src/modules/$NEW_NAME" "apps/platform/servers/unified/src/modules/__tests__/$NEW_NAME" -name "$OLD_NAME.test.ts" 2>/dev/null); do
  NEW_F=$(echo "$f" | sed "s/$OLD_NAME.test.ts/$NEW_NAME.test.ts/")
  mv "$f" "$NEW_F"
  ok "Test file: $(basename $f) -> $(basename $NEW_F)"
done

# Rename extension directories
for dir in extensions/${OLD_NAME}-*/; do
  if [ -d "$dir" ]; then
    NEW_DIR=$(echo "$dir" | sed "s/$OLD_NAME/$NEW_NAME/")
    mv "$dir" "$NEW_DIR"
    ok "Extension: $(basename $dir) -> $(basename $NEW_DIR)"
  fi
done

# --- Step 2: Update file contents ---
log "Step 2: Updating file contents..."

# Files to update (source code, config, not node_modules or .git)
FILES=$(find \
  apps/platform/src \
  apps/platform/servers \
  apps/platform/vite.config.ts \
  apps/platform/nginx.conf \
  packages/shared/src \
  extensions \
  vitest.config.ts \
  package.json \
  -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.css" -o -name "*.json" -o -name "*.js" -o -name "*.html" \) \
  2>/dev/null)

COUNT=0
for f in $FILES; do
  if grep -q "$OLD_NAME\|$OLD_PASCAL\|$OLD_CAMEL\|$OLD_DISPLAY" "$f" 2>/dev/null; then
    # Replace kebab-case (routes, paths, IDs)
    sed -i '' "s|$OLD_NAME|$NEW_NAME|g" "$f"
    # Replace PascalCase (component names, class names)
    sed -i '' "s|$OLD_PASCAL|$NEW_PASCAL|g" "$f"
    # Replace camelCase (variable names)
    sed -i '' "s|$OLD_CAMEL|$NEW_CAMEL|g" "$f"
    # Replace display name
    sed -i '' "s|$OLD_DISPLAY|$DISPLAY_NAME|g" "$f"
    COUNT=$((COUNT + 1))
  fi
done
ok "Updated $COUNT files"

# --- Step 3: Update backend module exports ---
log "Step 3: Updating backend module index..."

BACKEND_INDEX="apps/platform/servers/unified/src/modules/$NEW_NAME/index.ts"
if [ -f "$BACKEND_INDEX" ]; then
  # Ensure function names match
  sed -i '' "s/init${OLD_PASCAL}/init${NEW_PASCAL}/g" "$BACKEND_INDEX"
  sed -i '' "s/create${OLD_PASCAL}Router/create${NEW_PASCAL}Router/g" "$BACKEND_INDEX"
  sed -i '' "s/create${OLD_PASCAL}Routes/create${NEW_PASCAL}Routes/g" "$BACKEND_INDEX"
  ok "Backend index exports updated"
fi

BACKEND_ROUTES="apps/platform/servers/unified/src/modules/$NEW_NAME/routes.ts"
if [ -f "$BACKEND_ROUTES" ]; then
  sed -i '' "s/create${OLD_PASCAL}Routes/create${NEW_PASCAL}Routes/g" "$BACKEND_ROUTES"
  ok "Backend routes export updated"
fi

# --- Step 4: Update server index.ts ---
log "Step 4: Updating server index.ts..."

SERVER_INDEX="apps/platform/servers/unified/src/index.ts"
if [ -f "$SERVER_INDEX" ]; then
  sed -i '' "s|modules/$OLD_NAME|modules/$NEW_NAME|g" "$SERVER_INDEX"
  sed -i '' "s|init${OLD_PASCAL}|init${NEW_PASCAL}|g" "$SERVER_INDEX"
  sed -i '' "s|create${OLD_PASCAL}Router|create${NEW_PASCAL}Router|g" "$SERVER_INDEX"
  sed -i '' "s|/$OLD_NAME/api|/$NEW_NAME/api|g" "$SERVER_INDEX"
  ok "Server index.ts updated"
fi

# --- Step 5: Update router.tsx ---
log "Step 5: Updating router.tsx..."

ROUTER="apps/platform/src/router.tsx"
if [ -f "$ROUTER" ]; then
  sed -i '' "s|modules/$OLD_NAME|modules/$NEW_NAME|g" "$ROUTER"
  sed -i '' "s|${OLD_PASCAL}App|${NEW_PASCAL}App|g" "$ROUTER"
  sed -i '' "s|/$OLD_NAME/|/$NEW_NAME/|g" "$ROUTER"
  ok "router.tsx updated"
fi

# --- Step 6: Update database permissions ---
log "Step 6: Database permissions reminder"
warn "Run this SQL on production to update permissions:"
echo ""
echo "  UPDATE user_permissions SET app_id = '$NEW_NAME' WHERE app_id = '$OLD_NAME';"
echo ""

# --- Step 7: Update reverse proxy reminder ---
log "Step 7: Reverse proxy reminder"
warn "Update the shared-proxy nginx config on the server:"
echo ""
echo "  sed -i 's/$OLD_NAME-api/$NEW_NAME-api/g; s/$OLD_NAME\\/api/$NEW_NAME\\/api/g' /opt/apps/proxy/nginx/nginx.conf"
echo "  docker exec shared-proxy nginx -t && docker exec shared-proxy nginx -s reload"
echo ""

# --- Step 8: Run tests ---
log "Step 8: Running tests..."
if npm test 2>&1 | tail -5 | grep -q "passed"; then
  ok "All tests pass"
else
  err "Tests failed! Review the changes manually."
fi

echo ""
ok "Module renamed: $OLD_NAME -> $NEW_NAME ($DISPLAY_NAME)"
log "Next steps:"
echo "  1. Review changes: git diff"
echo "  2. Commit: git add -A && git commit -m 'refactor: rename module $OLD_NAME to $NEW_NAME'"
echo "  3. Deploy: ./deploy-remote.sh deploy"
echo "  4. Update DB permissions (see SQL above)"
echo "  5. Update reverse proxy (see commands above)"
