#!/usr/bin/env bash
# Smoke test pre-AAB — verifica endpoints críticos contra producción.
# Uso: ./scripts/smoke-pre-aab.sh
# Sale con código 0 si todos los checks pasan, 1 si alguno falla.
#
# Requiere: curl, python3.

set -uo pipefail

API="${API:-https://api.goingec.com}"
USER_EMAIL="${USER_EMAIL:-staging@going.test}"
USER_PASS="${USER_PASS:-Staging123!}"
ADMIN_EMAIL="${ADMIN_EMAIL:-admin@going.com}"
ADMIN_PASS="${ADMIN_PASS:-Admin123!}"

# Colors
G='\033[0;32m'
R='\033[0;31m'
Y='\033[0;33m'
B='\033[0;36m'
N='\033[0m'

PASS=0
FAIL=0
WARN=0

# check METHOD URL EXPECTED_STATUS TOKEN_OR_EMPTY BODY_OR_EMPTY DESCRIPTION
check() {
  local method="$1"
  local url="$2"
  local expected="$3"
  local token="${4:-}"
  local body="${5:-}"
  local desc="${6:-}"

  local auth=""
  [ -n "$token" ] && auth="-H Authorization:Bearer\ $token"

  local args=(-s -o /dev/null -w "%{http_code}|%{time_total}" --max-time 10 -X "$method")
  [ -n "$token" ] && args+=(-H "Authorization: Bearer $token")
  if [ -n "$body" ]; then
    args+=(-H "Content-Type: application/json" -d "$body")
  fi

  local result
  result=$(curl "${args[@]}" "$url" 2>&1)
  local code="${result%%|*}"
  local time="${result##*|}"
  time=$(printf "%6.0fms" "$(echo "$time * 1000" | bc 2>/dev/null || echo 0)")

  local status_color="$R" symbol="✗"
  if [ "$code" = "$expected" ]; then
    status_color="$G"
    symbol="✓"
    PASS=$((PASS+1))
  elif [[ "$code" =~ ^[23] ]] && [[ "$expected" =~ ^[23] ]]; then
    status_color="$Y"
    symbol="~"
    WARN=$((WARN+1))
  else
    FAIL=$((FAIL+1))
  fi

  printf "  ${status_color}${symbol}${N} %-6s %-45s ${status_color}%-3s${N} (exp %s) %s  ${B}%s${N}\n" \
    "$method" "${url#$API}" "$code" "$expected" "$time" "$desc"
}

echo ""
echo -e "${B}========================================================${N}"
echo -e "${B}  SMOKE TEST PRE-AAB — endpoints críticos en producción${N}"
echo -e "${B}========================================================${N}"
echo ""

# ─────────────────────────────────────────────────────────────
echo -e "${B}[1/5] Auth + tokens${N}"
# ─────────────────────────────────────────────────────────────
check GET "$API/health" 200 "" "" "API gateway healthy"
check POST "$API/auth/login" 200 "" '{"email":"'"$USER_EMAIL"'","password":"'"$USER_PASS"'"}' "Login user"

USER_TOKEN=$(curl -s -X POST "$API/auth/login" -H "Content-Type: application/json" \
  -d "{\"email\":\"$USER_EMAIL\",\"password\":\"$USER_PASS\"}" \
  | python -c "import sys,json; d=json.load(sys.stdin); print(d.get('accessToken') or d.get('token') or '')" 2>/dev/null)

ADMIN_TOKEN=$(curl -s -X POST "$API/auth/login" -H "Content-Type: application/json" \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASS\"}" \
  | python -c "import sys,json; d=json.load(sys.stdin); print(d.get('accessToken') or d.get('token') or '')" 2>/dev/null)

if [ -z "$USER_TOKEN" ]; then
  echo -e "  ${R}✗ no se pudo obtener USER_TOKEN — abortar${N}"
  exit 1
fi
if [ -z "$ADMIN_TOKEN" ]; then
  echo -e "  ${Y}~ no se pudo obtener ADMIN_TOKEN — algunos checks de admin pueden saltar${N}"
fi

check GET "$API/auth/me" 200 "$USER_TOKEN" "" "Get my profile"
check GET "$API/auth/me" 401 "" "" "Reject without token"
check POST "$API/auth/login" 401 "" '{"email":"'"$USER_EMAIL"'","password":"WRONG"}' "Reject bad password"

# ─────────────────────────────────────────────────────────────
echo ""
echo -e "${B}[2/5] Pasajero — ride flow${N}"
# ─────────────────────────────────────────────────────────────
RIDE_BODY='{"pickupLatitude":-0.2201,"pickupLongitude":-78.5123,"dropoffLatitude":-0.1865,"dropoffLongitude":-78.4831,"serviceType":"suv_confort","passengers":1,"mode":"private"}'
check POST "$API/rides/request" 201 "$USER_TOKEN" "$RIDE_BODY" "Create ride"
check GET "$API/rides/pending" 200 "$USER_TOKEN" "" "List pending rides"
check GET "$API/tracking/active-drivers" 200 "$USER_TOKEN" "" "Active drivers"
check GET "$API/bookings/me" 404 "$USER_TOKEN" "" "Bookings (no booking → 404 OK)"

# ─────────────────────────────────────────────────────────────
echo ""
echo -e "${B}[3/5] Conductor — wallet/earnings${N}"
# ─────────────────────────────────────────────────────────────
check GET "$API/drivers/me/wallet" 200 "$USER_TOKEN" "" "Driver wallet (fix recién aplicado)"
check GET "$API/drivers/me/earnings" 200 "$USER_TOKEN" "" "Driver earnings"
check GET "$API/drivers/me/earnings/history" 200 "$USER_TOKEN" "" "Earnings history"

# ─────────────────────────────────────────────────────────────
echo ""
echo -e "${B}[4/5] Envíos + tours + alojamientos + experiencias${N}"
# ─────────────────────────────────────────────────────────────
# Las rutas REST de búsqueda son /<resource>/search o /<resource>/my, no GET root
check GET "$API/parcels/my" 200 "$USER_TOKEN" "" "Mis envíos"
check GET "$API/tours/search?q=quito" 200 "$USER_TOKEN" "" "Search tours"
check GET "$API/accommodations/search?q=quito" 200 "$USER_TOKEN" "" "Search accommodations"
check GET "$API/experiences/search?q=quito" 200 "$USER_TOKEN" "" "Search experiences"
USER_ID=$(curl -s "$API/auth/me" -H "Authorization: Bearer $USER_TOKEN" | python -c "import sys,json; print(json.load(sys.stdin).get('userId',''))" 2>/dev/null)
check GET "$API/notifications/user/$USER_ID" 200 "$USER_TOKEN" "" "Mis notifications"

# ─────────────────────────────────────────────────────────────
echo ""
echo -e "${B}[5/5] Admin endpoints${N}"
# ─────────────────────────────────────────────────────────────
if [ -n "$ADMIN_TOKEN" ]; then
  check GET "$API/auth/admin/stats" 200 "$ADMIN_TOKEN" "" "Admin: KPIs"
  check GET "$API/auth/admin/users?limit=5" 200 "$ADMIN_TOKEN" "" "Admin: list users"
  check GET "$API/auth/admin/stats" 403 "$USER_TOKEN" "" "Admin endpoint rejects user role"
fi

# ─────────────────────────────────────────────────────────────
echo ""
echo -e "${B}[6/6] CORS preflight desde origen webapp${N}"
# ─────────────────────────────────────────────────────────────
CORS_HEADER=$(curl -s -i --max-time 5 -X OPTIONS \
  -H "Origin: https://app.goingec.com" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: content-type,authorization" \
  "$API/rides/request" 2>&1 | grep -i "access-control-allow-origin" | head -1 || echo "")
if echo "$CORS_HEADER" | grep -qi "app.goingec.com"; then
  echo -e "  ${G}✓${N} OPTIONS /rides/request preflight returns CORS for app.goingec.com"
  PASS=$((PASS+1))
else
  echo -e "  ${R}✗${N} OPTIONS preflight missing access-control-allow-origin"
  FAIL=$((FAIL+1))
fi

# ─────────────────────────────────────────────────────────────
echo ""
echo -e "${B}========================================================${N}"
TOTAL=$((PASS + FAIL + WARN))
echo -e "  ${G}PASS: $PASS${N}  ${Y}WARN: $WARN${N}  ${R}FAIL: $FAIL${N}  (total: $TOTAL)"
echo -e "${B}========================================================${N}"

[ "$FAIL" -eq 0 ] && exit 0 || exit 1
