#!/bin/bash
# update-gateway-urls.sh
#
# Descubre las URLs de todos los microservicios en Cloud Run
# y actualiza las variables de entorno del api-gateway en vivo.
#
# Uso:
#   chmod +x scripts/update-gateway-urls.sh
#   ./scripts/update-gateway-urls.sh
#
# Requiere: gcloud CLI autenticado con permisos de Cloud Run Admin

set -euo pipefail

PROJECT_ID=$(gcloud config get-value project 2>/dev/null)
REGION="us-central1"

if [ -z "$PROJECT_ID" ]; then
  echo "ERROR: No hay proyecto GCP configurado. Ejecuta: gcloud config set project PROYECTO_ID"
  exit 1
fi

echo "Proyecto: $PROJECT_ID"
echo "Región  : $REGION"
echo ""

get_url() {
  gcloud run services describe "$1" \
    --region "$REGION" --platform managed \
    --format 'value(status.url)' 2>/dev/null || echo ""
}

echo "Descubriendo URLs de microservicios..."
USER_AUTH_URL=$(get_url user-auth-service)
TRANSPORT_URL=$(get_url transport-service)
PAYMENT_URL=$(get_url payment-service)
TOURS_URL=$(get_url tours-service)
ANFITRIONES_URL=$(get_url anfitriones-service)
EXPERIENCIAS_URL=$(get_url experiencias-service)
ENVIOS_URL=$(get_url envios-service)
NOTIFICATIONS_URL=$(get_url notifications-service)
TRACKING_URL=$(get_url tracking-service)
BOOKING_URL=$(get_url booking-service)
ANALYTICS_URL=$(get_url analytics-service)
RATINGS_URL=$(get_url ratings-service)
SOCIAL_URL=$(get_url social-service)
CORPORATE_URL=$(get_url corporate-service)
EMERGENCY_URL=$(get_url emergency-service)
VOICE_CALL_URL=$(get_url voice-call-service)

echo ""
echo "=== URLs encontradas ==="
echo "  user-auth-service    : ${USER_AUTH_URL:-NOT DEPLOYED}"
echo "  transport-service    : ${TRANSPORT_URL:-NOT DEPLOYED}"
echo "  payment-service      : ${PAYMENT_URL:-NOT DEPLOYED}"
echo "  tours-service        : ${TOURS_URL:-NOT DEPLOYED}"
echo "  anfitriones-service  : ${ANFITRIONES_URL:-NOT DEPLOYED}"
echo "  experiencias-service : ${EXPERIENCIAS_URL:-NOT DEPLOYED}"
echo "  envios-service       : ${ENVIOS_URL:-NOT DEPLOYED}"
echo "  notifications-service: ${NOTIFICATIONS_URL:-NOT DEPLOYED}"
echo "  tracking-service     : ${TRACKING_URL:-NOT DEPLOYED}"
echo "  booking-service      : ${BOOKING_URL:-NOT DEPLOYED}"
echo "  analytics-service    : ${ANALYTICS_URL:-NOT DEPLOYED}"
echo "  ratings-service      : ${RATINGS_URL:-NOT DEPLOYED}"
echo "  social-service       : ${SOCIAL_URL:-NOT DEPLOYED}"
echo "  corporate-service    : ${CORPORATE_URL:-NOT DEPLOYED}"
echo "  emergency-service    : ${EMERGENCY_URL:-NOT DEPLOYED}"
echo "  voice-call-service   : ${VOICE_CALL_URL:-NOT DEPLOYED}"
echo "========================"
echo ""

echo "Actualizando variables de entorno del api-gateway..."

gcloud run services update api-gateway \
  --region "$REGION" \
  --platform managed \
  --update-env-vars "^|^CORS_ORIGINS=https://app.goingec.com,https://admin.goingec.com,https://empresas.goingec.com|USER_AUTH_SERVICE_URL=${USER_AUTH_URL}|TRANSPORT_SERVICE_URL=${TRANSPORT_URL}|PAYMENT_SERVICE_URL=${PAYMENT_URL}|TOURS_SERVICE_URL=${TOURS_URL}|ANFITRIONES_SERVICE_URL=${ANFITRIONES_URL}|EXPERIENCIAS_SERVICE_URL=${EXPERIENCIAS_URL}|ENVIOS_SERVICE_URL=${ENVIOS_URL}|NOTIFICATIONS_SERVICE_URL=${NOTIFICATIONS_URL}|TRACKING_SERVICE_URL=${TRACKING_URL}|BOOKING_SERVICE_URL=${BOOKING_URL}|ANALYTICS_SERVICE_URL=${ANALYTICS_URL}|RATINGS_SERVICE_URL=${RATINGS_URL}|SOCIAL_SERVICE_URL=${SOCIAL_URL}|CORPORATE_SERVICE_URL=${CORPORATE_URL}|EMERGENCY_SERVICE_URL=${EMERGENCY_URL}|VOICE_CALL_SERVICE_URL=${VOICE_CALL_URL}"

echo ""
echo "✓ api-gateway actualizado con las URLs reales de los microservicios."
echo ""
echo "Verifica con:"
echo "  curl https://api.goingec.com/health"
echo "  gcloud run services describe api-gateway --region $REGION --format 'value(spec.template.spec.containers[0].env)'"
