#!/bin/bash
#
# 🧠 CEREBRO — Pub/Sub Topics Bootstrap
#
# Provisiona los 6 topics que los agentes usan para reportar al cerebro,
# las 6 subscriptions que cerebro-service consume, y los IAM bindings
# necesarios. Idempotente: re-ejecutar es seguro, no duplica recursos.
#
# Topics:
#   agent.ops.events
#   agent.financial.events
#   agent.content.events
#   agent.marketing.events
#   agent.going.events
#   agent.customer-support.events
#
# Roles aplicados:
#   - Service account de los agentes (going-agent-sa) → roles/pubsub.publisher
#     en cada topic.
#   - Service account del cerebro-service (cerebro-service-sa) →
#     roles/pubsub.subscriber en cada subscription.

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Defaults — override con flags o env
GCP_PROJECT=${GCP_PROJECT:-"going-5d1ae"}
PUBLISHER_SA=${PUBLISHER_SA:-"going-agent-sa@${GCP_PROJECT}.iam.gserviceaccount.com"}
SUBSCRIBER_SA=${SUBSCRIBER_SA:-"cerebro-service-sa@${GCP_PROJECT}.iam.gserviceaccount.com"}

while [[ $# -gt 0 ]]; do
  case $1 in
    --project)        GCP_PROJECT="$2"; shift 2 ;;
    --publisher-sa)   PUBLISHER_SA="$2"; shift 2 ;;
    --subscriber-sa)  SUBSCRIBER_SA="$2"; shift 2 ;;
    -h|--help)
      cat <<EOF
Uso:
  bash scripts/cerebro/bootstrap-pubsub.sh [--project ID] [--publisher-sa SA] [--subscriber-sa SA]

Defaults:
  --project        ${GCP_PROJECT}
  --publisher-sa   ${PUBLISHER_SA}
  --subscriber-sa  ${SUBSCRIBER_SA}

Idempotente: re-ejecutar es seguro.
EOF
      exit 0
      ;;
    *)
      echo -e "${RED}Opción desconocida: $1${NC}"; exit 1 ;;
  esac
done

print_header() {
  echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
  echo -e "${BLUE}  $1${NC}"
  echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
  echo ""
}
print_step()    { echo -e "${YELLOW}📋 $1${NC}"; }
print_success() { echo -e "${GREEN}✅ $1${NC}"; }
print_error()   { echo -e "${RED}❌ $1${NC}"; }
print_skip()    { echo -e "  ${BLUE}↪︎  $1${NC}"; }

print_header "🧠 CEREBRO — Pub/Sub Bootstrap"

echo -e "${YELLOW}Configuración:${NC}"
echo "  GCP Project:   $GCP_PROJECT"
echo "  Publisher SA:  $PUBLISHER_SA  (los 6 agentes)"
echo "  Subscriber SA: $SUBSCRIBER_SA  (cerebro-service)"
echo ""

# ── Pre-flight ─────────────────────────────────────────────────────────────
if ! command -v gcloud &> /dev/null; then
  print_error "gcloud CLI no encontrado. Instalar: https://cloud.google.com/sdk/docs/install"
  exit 1
fi

# Asegurar que pubsub.googleapis.com está habilitada (idempotente).
print_step "Step 0: Habilitar Pub/Sub API"
gcloud services enable pubsub.googleapis.com --project="$GCP_PROJECT" 2>&1 | grep -v "already" || true
print_success "Pub/Sub API habilitada"
echo ""

# ── Topics + subscriptions ─────────────────────────────────────────────────
TOPICS=(
  "agent.ops.events"
  "agent.financial.events"
  "agent.content.events"
  "agent.marketing.events"
  "agent.going.events"
  "agent.customer-support.events"
)

print_step "Step 1: Crear 6 topics + subscriptions cerebro-{topic}"
for topic in "${TOPICS[@]}"; do
  if gcloud pubsub topics describe "$topic" --project="$GCP_PROJECT" &>/dev/null; then
    print_skip "topic $topic ya existe"
  else
    gcloud pubsub topics create "$topic" --project="$GCP_PROJECT" >/dev/null
    print_success "topic $topic creado"
  fi

  sub_name="cerebro-${topic}"
  if gcloud pubsub subscriptions describe "$sub_name" --project="$GCP_PROJECT" &>/dev/null; then
    print_skip "subscription $sub_name ya existe"
  else
    # ack-deadline 60s alcanza para el handler (write a Mongo + log).
    # message-retention 7d permite recuperar eventos si cerebro-service
    # estuvo caído un fin de semana.
    gcloud pubsub subscriptions create "$sub_name" \
      --topic="$topic" \
      --ack-deadline=60 \
      --message-retention-duration=7d \
      --project="$GCP_PROJECT" >/dev/null
    print_success "subscription $sub_name creada"
  fi
done
echo ""

# ── IAM: publisher SA ──────────────────────────────────────────────────────
print_step "Step 2: Grant roles/pubsub.publisher a $PUBLISHER_SA en cada topic"
for topic in "${TOPICS[@]}"; do
  gcloud pubsub topics add-iam-policy-binding "$topic" \
    --member="serviceAccount:$PUBLISHER_SA" \
    --role="roles/pubsub.publisher" \
    --project="$GCP_PROJECT" \
    --condition=None \
    >/dev/null 2>&1 || true
done
print_success "publisher binding aplicado a los 6 topics"
echo ""

# ── IAM: subscriber SA ─────────────────────────────────────────────────────
print_step "Step 3: Grant roles/pubsub.subscriber a $SUBSCRIBER_SA en cada subscription"

# Crear el SA si no existe (idempotente). El nombre del SA va sin sufijo
# de proyecto en el create.
sa_name=$(echo "$SUBSCRIBER_SA" | cut -d@ -f1)
if ! gcloud iam service-accounts describe "$SUBSCRIBER_SA" --project="$GCP_PROJECT" &>/dev/null; then
  echo "  Creando SA $sa_name..."
  gcloud iam service-accounts create "$sa_name" \
    --display-name="Cerebro Service Subscriber" \
    --project="$GCP_PROJECT" >/dev/null
  print_success "SA $sa_name creado"

  # Grant rol de Secret Manager para que pueda leer MONGO_URL-prod.
  gcloud projects add-iam-policy-binding "$GCP_PROJECT" \
    --member="serviceAccount:$SUBSCRIBER_SA" \
    --role="roles/secretmanager.secretAccessor" \
    --condition=None >/dev/null 2>&1 || true
  print_success "secretmanager.secretAccessor concedido a $sa_name"
else
  print_skip "SA $sa_name ya existe"
fi

for topic in "${TOPICS[@]}"; do
  sub_name="cerebro-${topic}"
  gcloud pubsub subscriptions add-iam-policy-binding "$sub_name" \
    --member="serviceAccount:$SUBSCRIBER_SA" \
    --role="roles/pubsub.subscriber" \
    --project="$GCP_PROJECT" \
    --condition=None \
    >/dev/null 2>&1 || true
done
print_success "subscriber binding aplicado a las 6 subscriptions"
echo ""

# ── Verificación final ─────────────────────────────────────────────────────
print_header "✅ BOOTSTRAP COMPLETO"

echo -e "${YELLOW}Topics provisionados:${NC}"
for topic in "${TOPICS[@]}"; do
  echo "  • $topic  →  cerebro-$topic"
done
echo ""

echo -e "${YELLOW}Próximos pasos:${NC}"
echo ""
echo "1️⃣  Activar publishers en cada agente (cuando cerebro-service esté arriba):"
echo "    gcloud run jobs update ops-agent      --update-env-vars CEREBRO_PUBLISH_ENABLED=true --project=$GCP_PROJECT --region=us-central1"
echo "    gcloud run jobs update financial-agent --update-env-vars CEREBRO_PUBLISH_ENABLED=true ..."
echo "    gcloud run jobs update content-agent   --update-env-vars CEREBRO_PUBLISH_ENABLED=true ..."
echo "    gcloud run jobs update marketing-agent --update-env-vars CEREBRO_PUBLISH_ENABLED=true ..."
echo "    gcloud run jobs update going-agent     --update-env-vars CEREBRO_PUBLISH_ENABLED=true ..."
echo "    gcloud run services update customer-support-service --update-env-vars CEREBRO_PUBLISH_ENABLED=true ..."
echo ""
echo "2️⃣  Verificar que los eventos llegan:"
echo "    gcloud pubsub subscriptions pull cerebro-agent.ops.events --project=$GCP_PROJECT --auto-ack --limit=5"
echo ""
