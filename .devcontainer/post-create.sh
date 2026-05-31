#!/usr/bin/env bash
# Script que se ejecuta una vez al crear el Codespace / Dev Container.
set -euo pipefail

echo "🚀 Configurando el entorno del monorepo going..."

# 1. Asegura que pnpm esté disponible (versión >=9 según package.json)
corepack enable
corepack prepare pnpm@latest --activate
echo "✅ pnpm $(pnpm --version) listo"

# 2. Instala todas las dependencias del workspace
echo "📦 Instalando dependencias con pnpm (esto puede tardar unos minutos)..."
pnpm install --frozen-lockfile || pnpm install

# 3. Crea un .env local a partir del ejemplo si aún no existe
if [ ! -f .env ] && [ -f .env.example ]; then
  cp .env.example .env
  echo "📝 .env creado a partir de .env.example — recuerda completar los valores reales (secrets/claves)."
fi

echo "🎉 Entorno listo. Comandos útiles:"
echo "   pnpm dev:webapp      → frontend (Next.js, puerto 3000)"
echo "   pnpm dev:admin       → admin dashboard"
echo "   pnpm storybook       → Storybook (puerto 6006)"
echo "   pnpm test            → tests con Jest"
echo "   docker compose up    → levantar servicios de infraestructura"
