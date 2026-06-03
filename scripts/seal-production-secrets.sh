#!/usr/bin/env bash
# ══════════════════════════════════════════════════════════════════
# Going Platform — Seal Production Secrets
#
# Prerequisito: Sealed Secrets controller instalado en el cluster
#   (lo instala setup-gke-production.sh automáticamente)
#
# Uso:
#   chmod +x scripts/seal-production-secrets.sh
#   ./scripts/seal-production-secrets.sh
#
# El script te pide cada secret interactivamente, genera el
# SealedSecret, y lo aplica al cluster. Los valores nunca
# se guardan en disco ni en git.
# ══════════════════════════════════════════════════════════════════
set -euo pipefail

NAMESPACE="going-production"
SECRET_NAME="going-secrets"
SEALED_OUTPUT="k8s/production/sealed-secrets.yaml"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log()  { echo -e "${GREEN}[✓]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }
info() { echo -e "${BLUE}[→]${NC} $1"; }
err()  { echo -e "${RED}[✗]${NC} $1"; exit 1; }

# ── PREFLIGHT ─────────────────────────────────────────────────────
check_prerequisites() {
  command -v kubectl >/dev/null 2>&1 || err "kubectl no está instalado"
  command -v kubeseal >/dev/null 2>&1 || {
    echo ""
    warn "kubeseal no está instalado. Instálalo:"
    echo ""
    echo "  macOS:   brew install kubeseal"
    echo "  Linux:   wget https://github.com/bitnami-labs/sealed-secrets/releases/download/v0.27.3/kubeseal-0.27.3-linux-amd64.tar.gz"
    echo "           tar xzf kubeseal-*.tar.gz && sudo mv kubeseal /usr/local/bin/"
    echo ""
    err "Instala kubeseal y vuelve a ejecutar"
  }

  kubectl get deployment sealed-secrets-controller -n kube-system >/dev/null 2>&1 \
    || err "Sealed Secrets controller no encontrado en el cluster. Ejecuta setup-gke-production.sh primero"

  log "Prerequisitos verificados"
}

# ── READ SECRET ───────────────────────────────────────────────────
read_secret() {
  local prompt="$1"
  local var_name="$2"
  local required="${3:-true}"

  echo -en "${BLUE}[→]${NC} $prompt: "
  read -rs value
  echo ""

  if [ -z "$value" ] && [ "$required" = "true" ]; then
    err "Este valor es obligatorio"
  fi

  eval "$var_name='$value'"
}

read_secret_visible() {
  local prompt="$1"
  local var_name="$2"
  local default="${3:-}"

  if [ -n "$default" ]; then
    echo -en "${BLUE}[→]${NC} $prompt [$default]: "
  else
    echo -en "${BLUE}[→]${NC} $prompt: "
  fi
  read -r value
  value="${value:-$default}"

  eval "$var_name='$value'"
}

# ── MAIN ──────────────────────────────────────────────────────────
main() {
  echo ""
  echo "══════════════════════════════════════════════════════════"
  echo "  Going Platform — Sellar Secrets de Producción"
  echo "══════════════════════════════════════════════════════════"
  echo ""
  echo "  Los valores que ingreses se sellan con la llave pública"
  echo "  del cluster y NUNCA se guardan en texto plano en disco."
  echo ""
  echo "  Secrets que se omitan se quedarán vacíos — puedes"
  echo "  volver a ejecutar este script para actualizarlos."
  echo ""

  check_prerequisites

  echo ""
  echo "── Base de datos ──────────────────────────────────────────"
  read_secret "MongoDB URI (mongodb://user:pass@host:27017/going-production)" MONGODB_URI
  read_secret_visible "Database URL (si es diferente de MongoDB URI, Enter para usar la misma)" DATABASE_URL "$MONGODB_URI"

  echo ""
  echo "── Cache ──────────────────────────────────────────────────"
  read_secret "Redis URL (redis://:password@host:6379/0)" REDIS_URL

  echo ""
  echo "── Autenticación ──────────────────────────────────────────"
  read_secret "JWT Secret (string largo y aleatorio, mín 32 chars)" JWT_SECRET

  echo ""
  echo "── Observabilidad ─────────────────────────────────────────"
  read_secret "Sentry DSN (https://xxx@sentry.io/xxx, Enter para omitir)" SENTRY_DSN false

  echo ""
  echo "── Pagos (Stripe LIVE) ────────────────────────────────────"
  warn "Estos son keys LIVE de Stripe. Verifica que sean los correctos."
  read_secret "Stripe Secret Key (sk_live_...)" STRIPE_SECRET_KEY
  read_secret_visible "Stripe Publishable Key (pk_live_...)" STRIPE_PUBLISHABLE_KEY
  read_secret "Stripe Webhook Secret (whsec_...)" STRIPE_WEBHOOK_SECRET

  echo ""
  echo "── Notificaciones ─────────────────────────────────────────"
  read_secret "Twilio Account SID" TWILIO_ACCOUNT_SID false
  read_secret "Twilio Auth Token" TWILIO_AUTH_TOKEN false
  read_secret "SendGrid API Key" SENDGRID_API_KEY false

  echo ""
  echo "── Elasticsearch ──────────────────────────────────────────"
  read_secret_visible "Elasticsearch Node URL (http://elasticsearch:9200)" ELASTICSEARCH_NODE "http://elasticsearch:9200"
  read_secret "Elasticsearch Password" ELASTIC_PASSWORD false

  echo ""
  info "Generando Secret de Kubernetes..."

  TEMP_SECRET=$(mktemp)
  trap 'rm -f "$TEMP_SECRET"' EXIT

  cat > "$TEMP_SECRET" <<YAML
apiVersion: v1
kind: Secret
metadata:
  name: $SECRET_NAME
  namespace: $NAMESPACE
type: Opaque
stringData:
  DATABASE_URL: "$DATABASE_URL"
  MONGODB_URI: "$MONGODB_URI"
  REDIS_URL: "$REDIS_URL"
  JWT_SECRET: "$JWT_SECRET"
  SENTRY_DSN: "${SENTRY_DSN:-}"
  STRIPE_SECRET_KEY: "$STRIPE_SECRET_KEY"
  STRIPE_PUBLISHABLE_KEY: "$STRIPE_PUBLISHABLE_KEY"
  STRIPE_WEBHOOK_SECRET: "$STRIPE_WEBHOOK_SECRET"
  TWILIO_ACCOUNT_SID: "${TWILIO_ACCOUNT_SID:-}"
  TWILIO_AUTH_TOKEN: "${TWILIO_AUTH_TOKEN:-}"
  SENDGRID_API_KEY: "${SENDGRID_API_KEY:-}"
  ELASTICSEARCH_NODE: "$ELASTICSEARCH_NODE"
  ELASTIC_PASSWORD: "${ELASTIC_PASSWORD:-}"
YAML

  info "Sellando con la llave pública del cluster..."
  kubeseal --format yaml \
    --controller-name sealed-secrets-controller \
    --controller-namespace kube-system \
    < "$TEMP_SECRET" \
    > "$SEALED_OUTPUT"

  rm -f "$TEMP_SECRET"
  log "SealedSecret generado en: $SEALED_OUTPUT"

  echo ""
  read -rp "¿Aplicar el SealedSecret al cluster ahora? (y/N): " APPLY
  if [[ "$APPLY" =~ ^[yYsS]$ ]]; then
    kubectl apply -f "$SEALED_OUTPUT"
    log "SealedSecret aplicado al cluster"
    log "El controller lo desencriptará y creará el Secret '$SECRET_NAME' en '$NAMESPACE'"
  else
    info "Para aplicar después: kubectl apply -f $SEALED_OUTPUT"
  fi

  echo ""
  echo "══════════════════════════════════════════════════════════"
  echo "  Secrets sellados exitosamente"
  echo "══════════════════════════════════════════════════════════"
  echo ""
  echo "  El archivo $SEALED_OUTPUT es SEGURO para git."
  echo "  Solo el cluster con esta llave puede desencriptarlo."
  echo ""
  echo "  Para actualizar un secret individual:"
  echo "    echo -n 'nuevo-valor' | kubectl create secret generic $SECRET_NAME"
  echo "      --from-literal=KEY=valor --dry-run=client -o yaml |"
  echo "      kubeseal --merge-into $SEALED_OUTPUT"
  echo ""
}

main "$@"
