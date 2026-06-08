#!/usr/bin/env bash
# Smoke test de Atención al Cliente (texto) contra producción.
# Uso:
#   API=https://api.goingec.com ./scripts/smoke-support.sh
# Requisitos: curl, jq (opcional, solo para formato bonito).
#
# Qué prueba:
#   1) Chat público (sin login): POST /support/public/message → debe responder
#      con { reply, state, priority }. Si OPENAI_API_KEY está bien, 'reply' es
#      una respuesta de la IA; si no, un mensaje de fallback (igual 200).
#   2) Persistencia: manda 3 mensajes casi simultáneos del MISMO userId nuevo
#      (verifica el fix de race-condition: ninguno debe perderse / 500).
#
# Voz: la prueba real es llamar al número de Twilio. Para auditar llamadas:
#   GET /voice-calls (requiere JWT admin) — lista las llamadas registradas.

set -uo pipefail
API="${API:-https://api.goingec.com}"
UID_BASE="web_anon_smoke_$(date +%s)"

say() { printf '\n\033[1m%s\033[0m\n' "$*"; }
post() {
  curl -sS -m 25 -X POST "$API/support/public/message" \
    -H 'Content-Type: application/json' \
    -d "{\"userId\":\"$1\",\"message\":\"$2\"}" \
    -w '\n[HTTP %{http_code} | %{time_total}s]\n'
}

say "API = $API"

say "1) Chat público — una pregunta simple"
post "$UID_BASE" "Hola, ¿qué tipos de vehículo ofrece Going App y cómo pido un viaje?"

say "2) Race-condition — 3 mensajes simultáneos del mismo userId NUEVO"
RID="${UID_BASE}_race"
post "$RID" "Mensaje A (simultáneo)" &
post "$RID" "Mensaje B (simultáneo)" &
post "$RID" "Mensaje C (simultáneo)" &
wait
echo "→ Los 3 deben devolver 200 (ninguno 5xx). En el panel de operadores la"
echo "  conversación $RID debe tener los 3 mensajes, sin pérdidas."

say "3) (opcional) Voz — listar llamadas registradas (requiere JWT admin)"
echo "  curl -H \"Authorization: Bearer \$ADMIN_JWT\" $API/voice-calls"
echo
echo "La prueba real de voz es llamar al número de Twilio configurado y"
echo "verificar que conteste la IA; si la IA no estuviera disponible, la llamada"
echo "debe cerrar limpio (no silencio) y aparecer como 'failed_technical'."
