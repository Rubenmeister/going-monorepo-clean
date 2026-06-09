#!/bin/bash
# deploy-monorepo-fast.sh
#
# Deploy masivo del monorepo a Cloud Run optimizando el upload:
# en vez de subir el tarball de 400 MB N veces (una por build), lo
# sube UNA SOLA VEZ a GCS y todos los builds apuntan al mismo objeto.
#
# Wall clock comparado con submit individual:
#   Vanilla:   ~3 min upload × 20 builds = ~50-60 min wall clock
#   Optimized: ~3 min upload + ~10 min builds concurrentes = ~13 min
#
# Uso:
#   bash scripts/deploy-monorepo-fast.sh [services|agents|all]
#
# Default: all. Submits los 13 servicios + 7 agentes con cloudbuild
# correspondiente, --async, monitor + reporte al final.
#
# Pre-requisitos:
#   - gcloud auth login + project going-5d1ae
#   - Permisos: roles/cloudbuild.builds.editor + roles/storage.objectAdmin
#     sobre gs://going-5d1ae_cloudbuild
#
# Riesgos:
#   - Todos los builds usan EL MISMO source. Si committeás algo entre
#     uploads, el segundo lote no lo verá. Hacé `git pull` ANTES de correr.
#   - Si la cuenta tiene quota de Cloud Build concurrente baja (default 10),
#     los builds 11+ esperan en queue — el script igual maneja la espera.

set -uo pipefail

PROJECT=going-5d1ae
REGION=us-central1
TARGET=${1:-all}

# ── Servicios + min-instances (preservar config crítica) ──────────────
declare -a SERVICES=(
  "transport-service|0"
  "api-gateway|1"
  "user-auth-service|0"
  "booking-service|1"
  "payment-service|0"
  "notifications-service|0"
  "tours-service|0"
  "tracking-service|0"
  "envios-service|0"
  "anfitriones-service|0"
  "experiencias-service|0"
  "billing-service|0"
  "analytics-service|0"
  "cerebro-service|0"
  "mycortex-service|0"
  "orchestrator-service|0"
  "agent-bridge-service|0"
  "customer-support-service|0"
  "emergency-service|0"
  "voice-call-service|1"
)

declare -a AGENTS=(
  "ops-agent"
  "financial-agent"
  "content-agent"
  "marketing-agent"
  "going-agent"
  "mobile-agent"
  "frontend-agent"
)

# ── Paso 1: subir tarball ÚNICO a GCS ───────────────────────────────
TIMESTAMP=$(date +%s)
TARBALL="going-monorepo-$TIMESTAMP.tgz"
GCS_PATH="gs://${PROJECT}_cloudbuild/source/$TARBALL"

echo "=== Paso 1: tar + upload del source a GCS ==="
echo "  → tar local..."
tar --exclude='node_modules' --exclude='.nx' --exclude='dist' --exclude='.next' \
    --exclude='.expo' --exclude='.claude' --exclude='*.log' \
    -czf "/tmp/$TARBALL" .
SIZE=$(du -h "/tmp/$TARBALL" | cut -f1)
echo "  → tarball local: /tmp/$TARBALL ($SIZE)"

echo "  → upload a $GCS_PATH"
gsutil -q cp "/tmp/$TARBALL" "$GCS_PATH"
rm "/tmp/$TARBALL"
echo "  → upload OK"
echo ""

# ── Paso 2: lanzar builds en paralelo, todos apuntando al mismo source ──
declare -a BUILD_IDS=()

submit_service() {
  local svc=$1
  local min=$2
  local out
  out=$(gcloud builds submit \
    --config=cloudbuild-microservices.yaml \
    --substitutions="_SERVICE_NAME=$svc,_MIN_INSTANCES=$min" \
    --project=$PROJECT \
    --async \
    "$GCS_PATH" 2>&1 | tail -3)
  local bid
  bid=$(echo "$out" | grep -oE '[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}' | head -1)
  if [ -n "$bid" ]; then
    BUILD_IDS+=("$bid|$svc|service")
    echo "  ✓ $svc → $bid"
  else
    echo "  ✗ $svc submit fallo"
  fi
}

submit_agent() {
  local agent=$1
  local out
  out=$(gcloud builds submit \
    --config="$agent/cloudbuild.yaml" \
    --project=$PROJECT \
    --async \
    "$GCS_PATH" 2>&1 | tail -3)
  local bid
  bid=$(echo "$out" | grep -oE '[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}' | head -1)
  if [ -n "$bid" ]; then
    BUILD_IDS+=("$bid|$agent|agent")
    echo "  ✓ $agent → $bid"
  else
    echo "  ✗ $agent submit fallo"
  fi
}

if [ "$TARGET" = "services" ] || [ "$TARGET" = "all" ]; then
  echo "=== Paso 2a: submit ${#SERVICES[@]} services ==="
  for entry in "${SERVICES[@]}"; do
    IFS='|' read -r svc min <<< "$entry"
    submit_service "$svc" "$min"
  done
  echo ""
fi

if [ "$TARGET" = "agents" ] || [ "$TARGET" = "all" ]; then
  echo "=== Paso 2b: submit ${#AGENTS[@]} agents ==="
  for agent in "${AGENTS[@]}"; do
    submit_agent "$agent"
  done
  echo ""
fi

# ── Paso 3: monitor builds hasta completar ──────────────────────────
echo "=== Paso 3: esperando ${#BUILD_IDS[@]} builds ==="
START=$(date +%s)

while true; do
  pending=0
  for entry in "${BUILD_IDS[@]}"; do
    IFS='|' read -r bid name kind <<< "$entry"
    status=$(gcloud builds describe "$bid" --project=$PROJECT --format='value(status)' 2>/dev/null)
    if [ "$status" = "WORKING" ] || [ "$status" = "QUEUED" ]; then
      pending=$((pending + 1))
    fi
  done
  ELAPSED=$(($(date +%s) - START))
  if [ $pending -eq 0 ]; then break; fi
  printf "  [%02dm%02ds] pending=%d / %d\n" $((ELAPSED / 60)) $((ELAPSED % 60)) $pending ${#BUILD_IDS[@]}
  sleep 20
done

# ── Paso 4: reporte final ───────────────────────────────────────────
echo ""
echo "=== Resultado final ==="
SUCCESS=0
FAILURE=0
for entry in "${BUILD_IDS[@]}"; do
  IFS='|' read -r bid name kind <<< "$entry"
  status=$(gcloud builds describe "$bid" --project=$PROJECT --format='value(status)' 2>/dev/null)
  if [ "$status" = "SUCCESS" ]; then
    echo "  ✓ $name ($kind): $status"
    SUCCESS=$((SUCCESS + 1))
  else
    echo "  ✗ $name ($kind): $status  → https://console.cloud.google.com/cloud-build/builds/$bid?project=$PROJECT"
    FAILURE=$((FAILURE + 1))
  fi
done

ELAPSED=$(($(date +%s) - START))
echo ""
echo "=== Resumen ==="
echo "  Tiempo total: $((ELAPSED / 60))m $((ELAPSED % 60))s"
echo "  SUCCESS: $SUCCESS"
echo "  FAILURE: $FAILURE"
echo "  Source tarball usado: $GCS_PATH"
echo ""
echo "Para borrar el tarball ahora (no necesario, Cloud Build hace cleanup):"
echo "  gsutil rm $GCS_PATH"

exit $FAILURE
