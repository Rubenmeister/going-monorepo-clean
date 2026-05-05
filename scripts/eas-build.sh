#!/usr/bin/env bash
# eas-build.sh — Reproducible EAS build for mobile-user-app / mobile-driver-app.
#
# Por qué este script existe:
# El monorepo tiene `pnpm-workspace.yaml` y otros workspace markers que hacen
# que `eas-cli` (cuando se corre desde mobile-*-app/) suba archives de 4+ GB
# y exceda el límite de 2 GB de EAS. La solución estable es copiar el app a
# un directorio limpio fuera del monorepo, hacer npm install ahí, y disparar
# eas-cli desde esa copia. Este script automatiza ese baile.
#
# Uso:
#   ./scripts/eas-build.sh <user|driver> <preview|production> [android|ios]
#
# Ejemplos:
#   ./scripts/eas-build.sh user preview          # APK pasajero, dispositivo interno
#   ./scripts/eas-build.sh user production       # AAB pasajero, Play Store
#   ./scripts/eas-build.sh driver preview ios    # iOS dev del driver app
#
# Requisitos:
# - Logged in en eas-cli (npx eas-cli login)
# - Para AABs production de Play Store: google-service-account.json en raíz monorepo
set -euo pipefail

APP="${1:-}"
PROFILE="${2:-preview}"
PLATFORM="${3:-android}"

if [[ "$APP" != "user" && "$APP" != "driver" ]]; then
  echo "ERROR: primer arg debe ser 'user' o 'driver'."
  echo "Uso: $0 <user|driver> [preview|production] [android|ios]"
  exit 1
fi

if [[ "$PROFILE" != "preview" && "$PROFILE" != "production" && "$PROFILE" != "development" ]]; then
  echo "ERROR: profile debe ser 'preview', 'production' o 'development'."
  exit 1
fi

if [[ "$PLATFORM" != "android" && "$PLATFORM" != "ios" ]]; then
  echo "ERROR: platform debe ser 'android' o 'ios'."
  exit 1
fi

SOURCE_DIR_NAME="mobile-${APP}-app"
MONOREPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SOURCE_DIR="${MONOREPO_ROOT}/${SOURCE_DIR_NAME}"
BUILD_DIR="${TMPDIR:-/tmp}/going-mobile-build-${APP}"

if [[ ! -d "$SOURCE_DIR" ]]; then
  echo "ERROR: no existe $SOURCE_DIR"
  exit 1
fi

echo "=== EAS Build ${APP} (${PROFILE}/${PLATFORM}) ==="
echo "Source:  $SOURCE_DIR"
echo "Build:   $BUILD_DIR"
echo

echo "[1/5] Preparando build dir limpio..."
rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR"

echo "[2/5] Copiando $SOURCE_DIR_NAME (sin node_modules, build artifacts, web junk)..."
tar \
  --exclude='node_modules' \
  --exclude='.next' \
  --exclude='.expo' \
  --exclude='.cache' \
  --exclude='ios/Pods' \
  --exclude='ios/build' \
  --exclude='android/build' \
  --exclude='android/.gradle' \
  --exclude='android/app/build' \
  --exclude='*.html' \
  --exclude='next.config.js' \
  --exclude='next-env.d.ts' \
  --exclude='public' \
  --exclude='__tests__' \
  --exclude='coverage' \
  --exclude='*.log' \
  -cf - -C "$SOURCE_DIR" . | tar -xf - -C "$BUILD_DIR"

cd "$BUILD_DIR"
SIZE=$(du -sh . | cut -f1)
echo "  Tamano copia: $SIZE"

echo "[3/5] Init git (eas-cli puede requerirlo)..."
git init -q
git add -A
git -c user.email="build@going.dev" -c user.name="EAS Build" commit -q -m "snapshot for EAS build"

echo "[4/5] npm install (necesario para que 'expo config' resuelva plugins)..."
npm install --no-audit --no-fund --legacy-peer-deps 2>&1 | tail -5

echo "[5/5] Disparando eas build..."
npx eas-cli build --platform "$PLATFORM" --profile "$PROFILE" --non-interactive --no-wait

echo
echo "=== Build disparado. Sigue progreso en https://expo.dev/accounts/rubenmeister/projects ==="
