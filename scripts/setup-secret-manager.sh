#!/usr/bin/env bash
# ══════════════════════════════════════════════════════════════════
# Going Platform — Setup GCP Secret Manager para Cloud Run
#
# Sube los secrets de la app a GCP Secret Manager y le da acceso a:
#   - la service account de runtime de Cloud Run (compute default SA)
#   - la service account de deploy (github-deployer)
#
# Cloud Run los inyecta como env vars vía --set-secrets en el
# workflow cd-cloud-run.yml. Los valores nunca se commitean.
#
# Uso:
#   chmod +x scripts/setup-secret-manager.sh
#   ./scripts/setup-secret-manager.sh
# ══════════════════════════════════════════════════════════════════
set -euo pipefail

PROJECT="${GCP_PROJECT_ID:-going-5d1ae}"
DEPLOYER_SA="github-deployer@${PROJECT}.iam.gserviceaccount.com"

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
command -v gcloud >/dev/null 2>&1 || err "gcloud no está instalado"
gcloud config set project "$PROJECT" >/dev/null 2>&1

info "Habilitando Secret Manager API..."
gcloud services enable secretmanager.googleapis.com --project="$PROJECT" >/dev/null
log "Secret Manager API habilitada"

PROJECT_NUMBER=$(gcloud projects describe "$PROJECT" --format='value(projectNumber)')
RUNTIME_SA="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"

echo ""
echo "  Proyecto:        $PROJECT"
echo "  Runtime SA:      $RUNTIME_SA  (Cloud Run usa esta)"
echo "  Deployer SA:     $DEPLOYER_SA"
echo ""

# ── HELPERS ───────────────────────────────────────────────────────
# create_or_update <secret-id> <value>
create_or_update() {
  local id="$1" value="$2"
  if gcloud secrets describe "$id" --project="$PROJECT" >/dev/null 2>&1; then
    printf '%s' "$value" | gcloud secrets versions add "$id" --project="$PROJECT" --data-file=- >/dev/null
    info "  actualizado: $id"
  else
    printf '%s' "$value" | gcloud secrets create "$id" --project="$PROJECT" \
      --replication-policy=automatic --data-file=- >/dev/null
    info "  creado:      $id"
  fi
  # Acceso para runtime (Cloud Run) y deployer
  gcloud secrets add-iam-policy-binding "$id" --project="$PROJECT" \
    --member="serviceAccount:$RUNTIME_SA" \
    --role="roles/secretmanager.secretAccessor" --condition=None >/dev/null 2>&1 || true
  gcloud secrets add-iam-policy-binding "$id" --project="$PROJECT" \
    --member="serviceAccount:$DEPLOYER_SA" \
    --role="roles/secretmanager.secretAccessor" --condition=None >/dev/null 2>&1 || true
}

read_secret() {   # oculto
  local prompt="$1" var="$2" required="${3:-true}"
  echo -en "${BLUE}[→]${NC} $prompt: "
  read -rs value; echo ""
  if [ -z "$value" ] && [ "$required" = "true" ]; then err "Este valor es obligatorio"; fi
  eval "$var=\$value"
}
read_visible() {  # visible, con default
  local prompt="$1" var="$2" default="${3:-}"
  if [ -n "$default" ]; then echo -en "${BLUE}[→]${NC} $prompt [$default]: "
  else echo -en "${BLUE}[→]${NC} $prompt: "; fi
  read -r value; value="${value:-$default}"
  eval "$var=\$value"
}

# ── MAIN ──────────────────────────────────────────────────────────
echo "══════════════════════════════════════════════════════════"
echo "  Going Platform — Secret Manager (Cloud Run)"
echo "══════════════════════════════════════════════════════════"
echo ""
echo "  Los valores opcionales que dejes vacíos se guardan como"
echo "  'UNSET' (placeholder) para que el deploy no falle. Puedes"
echo "  re-ejecutar este script para actualizarlos cuando los tengas."
echo ""

echo "── Base de datos (requerido) ──────────────────────────────"
read_secret "MongoDB URI (mongodb+srv://...atlas.../going-production)" MONGODB_URI
echo ""
echo "── Redis Upstash (requerido) ──────────────────────────────"
echo "  Crea una DB en https://console.upstash.com → Redis → Create"
echo "  Copia la 'Redis URL' (rediss://default:****@****.upstash.io:6379)"
read_secret "Redis URL (Upstash, rediss://...)" REDIS_URL
echo ""
echo "── Autenticación (requerido) ──────────────────────────────"
read_secret "JWT Secret (mín 32 chars; genera con: openssl rand -base64 48)" JWT_SECRET
echo ""
echo "── Pagos Stripe LIVE (requerido para payment/billing) ─────"
warn "Keys LIVE de Stripe. Verifica que sean los correctos."
read_secret "Stripe Secret Key (sk_live_...)" STRIPE_SECRET_KEY false
read_visible "Stripe Publishable Key (pk_live_...)" STRIPE_PUBLISHABLE_KEY ""
read_secret "Stripe Webhook Secret (whsec_...)" STRIPE_WEBHOOK_SECRET false
echo ""
echo "── Notificaciones (opcional) ──────────────────────────────"
read_secret "Twilio Account SID" TWILIO_ACCOUNT_SID false
read_secret "Twilio Auth Token" TWILIO_AUTH_TOKEN false
read_secret "SendGrid API Key" SENDGRID_API_KEY false

echo ""
info "Subiendo secrets a Secret Manager..."

create_or_update going-mongodb-uri            "$MONGODB_URI"
create_or_update going-redis-url              "$REDIS_URL"
create_or_update going-jwt-secret             "$JWT_SECRET"
create_or_update going-stripe-secret-key      "${STRIPE_SECRET_KEY:-UNSET}"
create_or_update going-stripe-publishable-key "${STRIPE_PUBLISHABLE_KEY:-UNSET}"
create_or_update going-stripe-webhook-secret  "${STRIPE_WEBHOOK_SECRET:-UNSET}"
create_or_update going-twilio-account-sid     "${TWILIO_ACCOUNT_SID:-UNSET}"
create_or_update going-twilio-auth-token      "${TWILIO_AUTH_TOKEN:-UNSET}"
create_or_update going-sendgrid-api-key       "${SENDGRID_API_KEY:-UNSET}"

echo ""
log "Secrets en Secret Manager y permisos asignados"
echo ""
echo "  Cloud Run los inyecta automáticamente en el deploy."
echo "  El workflow cd-cloud-run.yml ya está configurado para usarlos."
echo ""
echo "  Verifica con:"
echo "    gcloud secrets list --project=$PROJECT --filter='name~going-'"
echo ""
