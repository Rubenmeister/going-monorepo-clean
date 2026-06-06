#!/usr/bin/env bash
# ══════════════════════════════════════════════════════════════════
# Going Platform — Verifica rutas en vivo (página por página)
#
# Recorre las rutas de la webapp del pasajero contra el dominio
# desplegado y reporta el HTTP status de cada una.
#
#   200/3xx = la página carga
#   404     = no desplegada / ruta no existe
#   5xx     = build roto / error de servidor
#   000     = no respondió (timeout/DNS)
#
# OJO: status 200 confirma que la PÁGINA carga, no que el flujo
# interactivo (formularios, pagos) funcione. Para eso, ver el smoke
# test de Playwright (scripts/smoke-passenger-flows.spec.ts).
#
# Uso:
#   ./scripts/check-live-routes.sh                      # app.goingec.com
#   BASE_URL=https://staging.goingec.com ./scripts/check-live-routes.sh
# ══════════════════════════════════════════════════════════════════
set -uo pipefail

BASE_URL="${BASE_URL:-https://app.goingec.com}"
UA="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; BLUE='\033[0;34m'; NC='\033[0m'

ok=0; warn=0; fail=0

check() {  # check <ruta> <descripción>
  local path="$1" desc="$2"
  local code
  code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 20 -A "$UA" \
         -H "Accept: text/html" "${BASE_URL}${path}" 2>/dev/null || echo "000")
  local tag
  if [[ "$code" =~ ^(200|301|302|307|308)$ ]]; then
    tag="${GREEN}[ ${code} OK ]${NC}"; ((ok++))
  elif [[ "$code" =~ ^(401|403)$ ]]; then
    tag="${YELLOW}[ ${code} AUTH]${NC}"; ((warn++))   # protegida = existe pero requiere login
  else
    tag="${RED}[ ${code} ✗  ]${NC}"; ((fail++))
  fi
  printf "  %b  %-34s %s\n" "$tag" "$path" "$desc"
}

section() { echo ""; echo -e "${BLUE}── $1 ──────────────────────────────────────${NC}"; }

echo ""
echo "══════════════════════════════════════════════════════════"
echo "  Verificación en vivo: $BASE_URL"
echo "══════════════════════════════════════════════════════════"

section "Núcleo / Home"
check "/"                       "Home"
check "/search"                 "Búsqueda unificada"
check "/services/transport"     "Landing transporte"
check "/services/envios"        "Landing envíos"

section "Flujo PASAJERO — Compartido y Privado"
check "/ride"                   "Pedir viaje (compartido + privado)"
check "/ride/historial"         "Historial de viajes"
check "/dashboard/pasajero"     "Dashboard pasajero"
check "/bookings"               "Mis reservas"

section "Flujo ENVÍOS"
check "/envios"                 "Landing envíos"
check "/envios/cotizar"         "Cotizar envío"
check "/envios/mis-envios"      "Mis envíos"
check "/envios/tracking/TEST123" "Tracking público (con código demo)"

section "Pagos / Cuenta"
check "/payment/wallet"         "Wallet"
check "/payment/result"         "Resultado de pago"
check "/account"               "Cuenta"

section "Auth (entrada a los flujos)"
check "/auth/login"             "Login"
check "/auth/register"          "Registro"
check "/register"               "Registro (alias)"
check "/onboarding"             "Onboarding"

echo ""
echo "══════════════════════════════════════════════════════════"
echo -e "  Resumen:  ${GREEN}${ok} OK${NC}   ${YELLOW}${warn} protegidas/auth${NC}   ${RED}${fail} con problema${NC}"
echo "══════════════════════════════════════════════════════════"
echo ""
if [ "$fail" -gt 0 ]; then
  echo -e "  ${RED}Hay rutas con 404/5xx${NC} — revisa el deploy de Vercel para esas páginas."
else
  echo -e "  ${GREEN}Todas las páginas responden.${NC} (Esto confirma que cargan, no que"
  echo "  el flujo interactivo completo funcione — para eso usa el smoke test.)"
fi
echo ""
