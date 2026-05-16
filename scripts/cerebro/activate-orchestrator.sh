#!/bin/bash
#
# 🎯 ORCHESTRATOR — activación gradual (Etapa A del roadmap)
#
# Cambia el orchestrator-service de modo dormant (todo se persiste pero
# nada se ejecuta) a activación gradual por safety level.
#
# Uso:
#   bash scripts/cerebro/activate-orchestrator.sh <level>
#
#   level = 0 → desactivar todo (master switch off)
#   level = 1 → solo Cat 1 (info-only, log_anomaly) — Etapa A1
#   level = 2 → Cat 1 + Cat 2 (reversibles) — Etapa A2
#   level = 3 → Cat 1 + Cat 2 + Cat 3 (Cat 3 sigue Telegram-ack) — Etapa A3
#
# Ejemplos:
#   bash scripts/cerebro/activate-orchestrator.sh 1   # arrancar Cat 1
#   bash scripts/cerebro/activate-orchestrator.sh 0   # apagar todo (rollback)
#
# Validar después:
#   curl https://orchestrator-service-780842550857.us-central1.run.app/orchestrator/decisions?limit=10
#   abrir https://admin.goingec.com/cerebro/decisions

set -euo pipefail

LEVEL="${1:-}"
GCP_PROJECT="${GCP_PROJECT:-going-5d1ae}"
GCP_REGION="${GCP_REGION:-us-central1}"
SERVICE="orchestrator-service"

if [[ -z "$LEVEL" ]]; then
  echo "Uso: $0 <0|1|2|3>"
  exit 1
fi

if [[ ! "$LEVEL" =~ ^[0-3]$ ]]; then
  echo "❌ Level inválido: $LEVEL — debe ser 0, 1, 2 o 3"
  exit 1
fi

if [[ "$LEVEL" == "0" ]]; then
  EXEC=false
  echo "📴 Desactivando orchestrator (modo dormant total)..."
else
  EXEC=true
  echo "🎯 Activando orchestrator hasta Cat $LEVEL..."
fi

gcloud run services update "$SERVICE" \
  --region="$GCP_REGION" \
  --project="$GCP_PROJECT" \
  --update-env-vars="ORCHESTRATOR_EXECUTE_ENABLED=$EXEC,ORCHESTRATOR_MAX_AUTO_LEVEL=$LEVEL"

echo ""
echo "✅ Done. Verificación:"
echo ""
echo "  # Confirmar env vars"
echo "  gcloud run services describe $SERVICE --region=$GCP_REGION --project=$GCP_PROJECT \\"
echo "    --format='value(spec.template.spec.containers[0].env)'"
echo ""
echo "  # Trigger un poll inmediato + ver decisiones"
echo "  curl -X POST https://orchestrator-service-780842550857.us-central1.run.app/orchestrator/poll-now"
echo "  curl https://orchestrator-service-780842550857.us-central1.run.app/orchestrator/decisions?limit=10"
echo ""
echo "  # Logs del service"
echo "  gcloud run services logs tail $SERVICE --region=$GCP_REGION --project=$GCP_PROJECT"
echo ""
echo "  # UI"
echo "  open https://admin.goingec.com/cerebro/decisions"
