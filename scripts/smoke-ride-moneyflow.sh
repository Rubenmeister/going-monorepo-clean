#!/usr/bin/env bash
# smoke-ride-moneyflow.sh
# -----------------------------------------------------------------------------
# Smoke test end-to-end del FLUJO DE DINERO de un viaje en GoingApp, por la vía
# EFECTIVO (no depende de credenciales Datafast/DeUna — sirve para validar el
# pago al conductor mientras llega ese documento).
#
# Recorre: login pasajero + conductor → crear viaje → aceptar → completar →
# leer ganancias/saldo del conductor → intentar retiro. Imprime el status y el
# cuerpo de CADA paso, y al final un resumen PASS/GAP del dinero del conductor.
#
# Uso (contra staging o prod):
#   API=https://api.goingec.com \
#   PASAJERO_EMAIL=... PASAJERO_PASS=... \
#   CONDUCTOR_EMAIL=... CONDUCTOR_PASS=... \
#   bash scripts/smoke-ride-moneyflow.sh
#
# Alternativa: en vez de email/pass, exporta tokens ya emitidos:
#   PASAJERO_TOKEN=eyJ... CONDUCTOR_TOKEN=eyJ...
#
# Requiere: curl, jq.
# -----------------------------------------------------------------------------
set -uo pipefail

API="${API:-https://api.goingec.com}"
PASS_TOTAL=0; GAP_TOTAL=0

command -v jq >/dev/null 2>&1 || { echo "Falta 'jq' (instálalo: choco install jq / apt install jq)"; exit 1; }

say()  { printf "\n\033[1m== %s ==\033[0m\n" "$*"; }
ok()   { printf "  \033[32m✓ %s\033[0m\n" "$*"; PASS_TOTAL=$((PASS_TOTAL+1)); }
gap()  { printf "  \033[31m✗ GAP: %s\033[0m\n" "$*"; GAP_TOTAL=$((GAP_TOTAL+1)); }
info() { printf "  • %s\n" "$*"; }

# req METHOD PATH TOKEN [JSON_BODY]  → imprime status y body; exporta $BODY
req() {
  local method="$1" path="$2" token="${3:-}" body="${4:-}"
  local args=(-sS -X "$method" "${API}${path}" -H "Content-Type: application/json")
  [ -n "$token" ] && args+=(-H "Authorization: Bearer ${token}")
  [ -n "$body" ]  && args+=(-d "$body")
  local resp; resp="$(curl "${args[@]}" -w $'\n%{http_code}' 2>/dev/null)"
  HTTP_CODE="${resp##*$'\n'}"; BODY="${resp%$'\n'*}"
  printf "  [%s %s] → HTTP %s\n" "$method" "$path" "$HTTP_CODE"
  printf "    %s\n" "$(echo "$BODY" | jq -c . 2>/dev/null || echo "$BODY" | head -c 300)"
}

login() { # email pass → echo token
  local email="$1" pass="$2"
  local r; r="$(curl -sS -X POST "${API}/auth/login" -H "Content-Type: application/json" \
        -d "{\"email\":\"${email}\",\"password\":\"${pass}\"}" 2>/dev/null)"
  echo "$r" | jq -r '.accessToken // .token // .access_token // empty' 2>/dev/null
}

# ── 0. Tokens ────────────────────────────────────────────────────────────────
say "0. Autenticación"
PTOKEN="${PASAJERO_TOKEN:-}"; DTOKEN="${CONDUCTOR_TOKEN:-}"
if [ -z "$PTOKEN" ] && [ -n "${PASAJERO_EMAIL:-}" ]; then PTOKEN="$(login "$PASAJERO_EMAIL" "${PASAJERO_PASS:-}")"; fi
if [ -z "$DTOKEN" ] && [ -n "${CONDUCTOR_EMAIL:-}" ]; then DTOKEN="$(login "$CONDUCTOR_EMAIL" "${CONDUCTOR_PASS:-}")"; fi
[ -n "$PTOKEN" ] && ok "token pasajero obtenido" || { gap "sin token de pasajero (define PASAJERO_EMAIL/PASS o PASAJERO_TOKEN)"; exit 1; }
[ -n "$DTOKEN" ] && ok "token conductor obtenido" || { gap "sin token de conductor (define CONDUCTOR_EMAIL/PASS o CONDUCTOR_TOKEN)"; exit 1; }

# ── 1. Estado de ganancias del conductor ANTES ───────────────────────────────
say "1. Ganancias del conductor ANTES del viaje"
req GET "/drivers/me/earnings?period=day" "$DTOKEN"
EARN_BEFORE="$(echo "$BODY" | jq -r '.summary.totalEarnings // 0' 2>/dev/null || echo 0)"
req GET "/drivers/me/wallet" "$DTOKEN"
BAL_BEFORE="$(echo "$BODY" | jq -r '.availableBalance // 0' 2>/dev/null || echo 0)"
info "ganancias(day)=$EARN_BEFORE  saldo=$BAL_BEFORE"

# ── 2. Pasajero crea un viaje (efectivo) ─────────────────────────────────────
say "2. Pasajero solicita viaje (paymentMethod=cash)"
RIDE_BODY='{"origin":{"lat":-0.1807,"lng":-78.4678,"address":"Quito Centro"},"destination":{"lat":-0.1900,"lng":-78.4800,"address":"La Mariscal"},"paymentMethod":"cash","vehicleType":"standard"}'
req POST "/rides/request" "$PTOKEN" "$RIDE_BODY"
RIDE_ID="$(echo "$BODY" | jq -r '.id // .rideId // .ride.id // empty' 2>/dev/null)"
[ -n "$RIDE_ID" ] && ok "viaje creado: $RIDE_ID" || gap "no se pudo crear el viaje (revisa el payload de /rides/request)"

if [ -n "$RIDE_ID" ]; then
  # ── 3. Conductor acepta ────────────────────────────────────────────────────
  say "3. Conductor acepta el viaje"
  req PUT "/rides/${RIDE_ID}/accept" "$DTOKEN" '{"driverName":"Smoke Driver","vehiclePlate":"TEST-001","lat":-0.1807,"lng":-78.4678}'
  [ "$HTTP_CODE" = "200" ] && ok "aceptado" || gap "accept devolvió HTTP $HTTP_CODE"

  # ── 4. Completar el viaje ──────────────────────────────────────────────────
  say "4. Completar el viaje (genera fare + debería acreditar al conductor)"
  req PUT "/rides/${RIDE_ID}/complete" "$DTOKEN" '{"distanceKm":4.2,"durationSeconds":900}'
  [ "$HTTP_CODE" = "200" ] && ok "completado" || gap "complete devolvió HTTP $HTTP_CODE"
  CHARGED="$(echo "$BODY" | jq -r '.chargedAmount // .finalFare // 0' 2>/dev/null || echo 0)"
  info "monto del viaje=$CHARGED"
fi

# ── 5. Ganancias DESPUÉS — esta es la prueba clave ───────────────────────────
say "5. Ganancias del conductor DESPUÉS (¿se acreditó el viaje?)"
sleep 2
req GET "/drivers/me/earnings?period=day" "$DTOKEN"
EARN_AFTER="$(echo "$BODY" | jq -r '.summary.totalEarnings // 0' 2>/dev/null || echo 0)"
TRIPS_AFTER="$(echo "$BODY" | jq -r '.summary.totalTrips // 0' 2>/dev/null || echo 0)"
req GET "/drivers/me/wallet" "$DTOKEN"
BAL_AFTER="$(echo "$BODY" | jq -r '.availableBalance // 0' 2>/dev/null || echo 0)"
info "ganancias(day): $EARN_BEFORE → $EARN_AFTER   viajes=$TRIPS_AFTER   saldo: $BAL_BEFORE → $BAL_AFTER"

if awk "BEGIN{exit !($EARN_AFTER > $EARN_BEFORE)}"; then
  ok "las ganancias del conductor SUBIERON al completar el viaje (flujo de dinero OK)"
else
  gap "las ganancias NO cambiaron: el viaje en efectivo no quedó registrado como Payment del conductor"
fi

# ── 6. Retiro ────────────────────────────────────────────────────────────────
say "6. Intento de retiro del conductor"
req POST "/drivers/me/withdraw" "$DTOKEN" '{"amount":1,"paymentMethod":"bank_account"}'
echo "$BODY" | jq -e '.success == true' >/dev/null 2>&1 && ok "retiro aceptado" || info "retiro no disponible (esperado si el saldo/payout es 0)"

# ── Resumen ──────────────────────────────────────────────────────────────────
say "RESUMEN"
printf "  PASS=%s  GAP=%s\n" "$PASS_TOTAL" "$GAP_TOTAL"
[ "$GAP_TOTAL" -eq 0 ] && echo "  ✅ Flujo de dinero del conductor OK end-to-end." \
                       || echo "  ⚠️  Hay gaps en el flujo de dinero — ver líneas 'GAP' arriba."
exit 0
