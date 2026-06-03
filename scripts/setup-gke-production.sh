#!/usr/bin/env bash
# ══════════════════════════════════════════════════════════════════
# Going Platform — GKE Production Setup
#
# Prerequisitos:
#   1. gcloud CLI instalado y autenticado (gcloud auth login)
#   2. kubectl instalado
#   3. helm instalado (v3+)
#   4. Proyecto GCP con billing habilitado
#
# Uso:
#   chmod +x scripts/setup-gke-production.sh
#   ./scripts/setup-gke-production.sh
#
# El script es idempotente — puedes ejecutarlo múltiples veces
# sin romper nada. Si un recurso ya existe, lo salta.
# ══════════════════════════════════════════════════════════════════
set -euo pipefail

# ── CONFIG ────────────────────────────────────────────────────────
PROJECT="${GCP_PROJECT_ID:-going-5d1ae}"
REGION="${GCP_REGION:-us-central1}"
CLUSTER_NAME="${GKE_CLUSTER_NAME:-going-production}"
MACHINE_TYPE="${GKE_MACHINE_TYPE:-e2-standard-2}"
MIN_NODES="${GKE_MIN_NODES:-2}"
MAX_NODES="${GKE_MAX_NODES:-5}"
REPO_URL="https://github.com/rubenmeister/going-monorepo-clean.git"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log()   { echo -e "${GREEN}[✓]${NC} $1"; }
warn()  { echo -e "${YELLOW}[!]${NC} $1"; }
info()  { echo -e "${BLUE}[→]${NC} $1"; }
err()   { echo -e "${RED}[✗]${NC} $1"; exit 1; }

# ── PREFLIGHT ─────────────────────────────────────────────────────
check_tool() {
  command -v "$1" >/dev/null 2>&1 || err "$1 no está instalado. Instálalo primero."
}

preflight() {
  info "Verificando herramientas..."
  check_tool gcloud
  check_tool kubectl
  check_tool helm

  info "Verificando autenticación de GCP..."
  ACCOUNT=$(gcloud auth list --filter=status:ACTIVE --format="value(account)" 2>/dev/null || true)
  if [ -z "$ACCOUNT" ]; then
    err "No hay cuenta GCP activa. Ejecuta: gcloud auth login"
  fi
  log "Autenticado como: $ACCOUNT"

  info "Verificando proyecto: $PROJECT"
  gcloud projects describe "$PROJECT" --format="value(projectId)" >/dev/null 2>&1 \
    || err "No se puede acceder al proyecto $PROJECT. Verifica que existe y tienes permisos."
  gcloud config set project "$PROJECT" --quiet
  log "Proyecto configurado: $PROJECT"
}

# ── STEP 1: ENABLE APIs ──────────────────────────────────────────
enable_apis() {
  info "Habilitando APIs de GCP necesarias..."
  APIS=(
    container.googleapis.com
    containerregistry.googleapis.com
    compute.googleapis.com
    iam.googleapis.com
    iamcredentials.googleapis.com
    cloudresourcemanager.googleapis.com
  )
  for api in "${APIS[@]}"; do
    if gcloud services list --enabled --filter="name:$api" --format="value(name)" 2>/dev/null | grep -q "$api"; then
      log "API ya habilitada: $api"
    else
      gcloud services enable "$api" --quiet
      log "API habilitada: $api"
    fi
  done
}

# ── STEP 2: CREATE GKE CLUSTER ───────────────────────────────────
create_cluster() {
  info "Verificando cluster GKE: $CLUSTER_NAME..."

  if gcloud container clusters describe "$CLUSTER_NAME" --region "$REGION" --format="value(name)" 2>/dev/null; then
    log "Cluster '$CLUSTER_NAME' ya existe"
    gcloud container clusters get-credentials "$CLUSTER_NAME" --region "$REGION" --quiet
    return
  fi

  warn "Creando cluster GKE (esto toma 5-10 minutos)..."
  echo ""
  echo "  Configuración:"
  echo "    Nombre:     $CLUSTER_NAME"
  echo "    Región:     $REGION"
  echo "    Máquina:    $MACHINE_TYPE (2 vCPU, 8 GB RAM)"
  echo "    Nodos:      $MIN_NODES - $MAX_NODES (autoscaling)"
  echo "    Costo est.: ~\$70-150/mes con carga baja"
  echo ""
  read -rp "¿Continuar? (y/N): " CONFIRM
  if [[ ! "$CONFIRM" =~ ^[yYsS]$ ]]; then
    warn "Cancelado por el usuario"
    exit 0
  fi

  gcloud container clusters create "$CLUSTER_NAME" \
    --region "$REGION" \
    --machine-type "$MACHINE_TYPE" \
    --num-nodes 1 \
    --min-nodes "$MIN_NODES" \
    --max-nodes "$MAX_NODES" \
    --enable-autoscaling \
    --enable-autorepair \
    --enable-autoupgrade \
    --enable-network-policy \
    --enable-ip-alias \
    --workload-pool="${PROJECT}.svc.id.goog" \
    --release-channel regular \
    --disk-type pd-standard \
    --disk-size 50 \
    --metadata disable-legacy-endpoints=true \
    --no-enable-basic-auth \
    --quiet

  log "Cluster creado exitosamente"
  gcloud container clusters get-credentials "$CLUSTER_NAME" --region "$REGION" --quiet
  log "kubectl configurado para $CLUSTER_NAME"
}

# ── STEP 3: CREATE NAMESPACE ─────────────────────────────────────
create_namespace() {
  info "Creando namespace going-production..."
  if kubectl get namespace going-production >/dev/null 2>&1; then
    log "Namespace going-production ya existe"
  else
    kubectl apply -f k8s/production/namespace.yaml
    log "Namespace creado con ResourceQuota y LimitRange"
  fi
}

# ── STEP 4: INSTALL INGRESS-NGINX ────────────────────────────────
install_ingress_nginx() {
  info "Instalando ingress-nginx..."

  helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx 2>/dev/null || true
  helm repo update ingress-nginx 2>/dev/null || true

  if helm status ingress-nginx -n ingress-nginx >/dev/null 2>&1; then
    log "ingress-nginx ya está instalado"
    return
  fi

  kubectl create namespace ingress-nginx 2>/dev/null || true

  helm install ingress-nginx ingress-nginx/ingress-nginx \
    --namespace ingress-nginx \
    --set controller.replicaCount=2 \
    --set controller.metrics.enabled=true \
    --set controller.podAnnotations."prometheus\.io/scrape"="true" \
    --set controller.podAnnotations."prometheus\.io/port"="10254" \
    --set controller.config.use-forwarded-headers="true" \
    --set controller.config.proxy-body-size="50m" \
    --set controller.config.enable-modsecurity="true" \
    --set controller.config.enable-owasp-modsecurity-crs="true" \
    --wait --timeout 5m

  log "ingress-nginx instalado"

  info "Esperando IP externa del LoadBalancer..."
  for i in $(seq 1 30); do
    EXTERNAL_IP=$(kubectl get svc ingress-nginx-controller -n ingress-nginx -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null || true)
    if [ -n "$EXTERNAL_IP" ]; then
      log "IP externa del Ingress: $EXTERNAL_IP"
      echo ""
      warn "IMPORTANTE: Apunta estos DNS a $EXTERNAL_IP:"
      echo "    going.app         → $EXTERNAL_IP"
      echo "    api.going.app     → $EXTERNAL_IP"
      echo "    dashboard.going.app → $EXTERNAL_IP"
      echo ""
      return
    fi
    sleep 10
  done
  warn "No se obtuvo IP externa aún. Verifica con: kubectl get svc -n ingress-nginx"
}

# ── STEP 5: INSTALL CERT-MANAGER ────────────────────────────────
install_cert_manager() {
  info "Instalando cert-manager..."

  helm repo add jetstack https://charts.jetstack.io 2>/dev/null || true
  helm repo update jetstack 2>/dev/null || true

  if helm status cert-manager -n cert-manager >/dev/null 2>&1; then
    log "cert-manager ya está instalado"
  else
    kubectl create namespace cert-manager 2>/dev/null || true

    helm install cert-manager jetstack/cert-manager \
      --namespace cert-manager \
      --set crds.enabled=true \
      --set prometheus.enabled=true \
      --wait --timeout 5m

    log "cert-manager instalado"
  fi

  info "Creando ClusterIssuer de Let's Encrypt..."
  kubectl apply -f - <<'ISSUER'
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: rubenmeister@gmail.com
    privateKeySecretRef:
      name: letsencrypt-prod-key
    solvers:
      - http01:
          ingress:
            class: nginx
ISSUER
  log "ClusterIssuer letsencrypt-prod configurado"
}

# ── STEP 6: INSTALL SEALED SECRETS ──────────────────────────────
install_sealed_secrets() {
  info "Instalando Sealed Secrets..."

  helm repo add sealed-secrets https://bitnami-labs.github.io/sealed-secrets 2>/dev/null || true
  helm repo update sealed-secrets 2>/dev/null || true

  if helm status sealed-secrets -n kube-system >/dev/null 2>&1; then
    log "Sealed Secrets ya está instalado"
    return
  fi

  helm install sealed-secrets sealed-secrets/sealed-secrets \
    --namespace kube-system \
    --set fullnameOverride=sealed-secrets-controller \
    --wait --timeout 5m

  log "Sealed Secrets instalado"
  echo ""
  info "Ahora puedes sellar tus secrets con:"
  echo "    ./scripts/seal-production-secrets.sh"
  echo ""
}

# ── STEP 7: INSTALL ARGOCD ──────────────────────────────────────
install_argocd() {
  info "Instalando ArgoCD..."

  helm repo add argo https://argoproj.github.io/argo-helm 2>/dev/null || true
  helm repo update argo 2>/dev/null || true

  kubectl create namespace argocd 2>/dev/null || true

  if helm status argocd -n argocd >/dev/null 2>&1; then
    log "ArgoCD ya está instalado"
  else
    helm install argocd argo/argo-cd \
      --namespace argocd \
      --set server.extraArgs="{--insecure}" \
      --set controller.metrics.enabled=true \
      --set server.metrics.enabled=true \
      --set configs.params."server\.insecure"=true \
      --wait --timeout 5m

    log "ArgoCD instalado"
  fi

  info "Aplicando configuración de ArgoCD (project + applications)..."
  kubectl apply -f argocd/project.yaml -n argocd
  kubectl apply -f argocd/applications.yaml -n argocd
  log "ArgoCD configurado con going-staging y going-production"

  ARGOCD_PASS=$(kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath='{.data.password}' 2>/dev/null | base64 -d || echo "ya-eliminado")

  echo ""
  log "Acceso a ArgoCD:"
  echo "    kubectl port-forward svc/argocd-server -n argocd 8080:443"
  echo "    URL:      https://localhost:8080"
  echo "    Usuario:  admin"
  echo "    Password: $ARGOCD_PASS"
  echo ""
  warn "Cambia el password de admin después del primer login"
}

# ── STEP 8: APPLY K8S CONFIGS ───────────────────────────────────
apply_configs() {
  info "Aplicando configuración de producción..."

  kubectl apply -f k8s/production/namespace.yaml
  kubectl apply -f k8s/production/production-configmap.yaml
  kubectl apply -f k8s/production/rbac.yaml
  kubectl apply -f k8s/production/network-policies.yaml

  log "ConfigMap, RBAC, y Network Policies aplicados"
  warn "Los Deployments NO se aplicaron directamente — ArgoCD los sincronizará desde git"
  warn "Los Secrets requieren ser sellados primero. Ejecuta: ./scripts/seal-production-secrets.sh"
}

# ── STEP 9: WORKLOAD IDENTITY (para GitHub Actions CD) ──────────
setup_workload_identity() {
  info "Configurando Workload Identity Federation para GitHub Actions..."

  PROJECT_NUMBER=$(gcloud projects describe "$PROJECT" --format='value(projectNumber)')
  SA_NAME="github-deployer"
  SA_EMAIL="${SA_NAME}@${PROJECT}.iam.gserviceaccount.com"

  if gcloud iam service-accounts describe "$SA_EMAIL" --project="$PROJECT" >/dev/null 2>&1; then
    log "Service Account $SA_NAME ya existe"
  else
    gcloud iam service-accounts create "$SA_NAME" \
      --display-name="GitHub Actions Cloud Run/GKE Deployer" \
      --project="$PROJECT"
    log "Service Account creado: $SA_EMAIL"
  fi

  info "Asignando roles al Service Account..."
  ROLES=(
    "roles/run.admin"
    "roles/storage.admin"
    "roles/iam.serviceAccountUser"
    "roles/container.developer"
  )
  for role in "${ROLES[@]}"; do
    gcloud projects add-iam-policy-binding "$PROJECT" \
      --member="serviceAccount:$SA_EMAIL" \
      --role="$role" \
      --quiet >/dev/null 2>&1
    log "Rol asignado: $role"
  done

  POOL_EXISTS=$(gcloud iam workload-identity-pools describe github-pool \
    --project="$PROJECT" --location=global --format="value(name)" 2>/dev/null || true)

  if [ -n "$POOL_EXISTS" ]; then
    log "Workload Identity Pool ya existe"
  else
    gcloud iam workload-identity-pools create github-pool \
      --project="$PROJECT" --location=global \
      --display-name="GitHub Actions Pool"
    log "Workload Identity Pool creado"
  fi

  PROVIDER_EXISTS=$(gcloud iam workload-identity-pools providers describe github-provider \
    --project="$PROJECT" --location=global \
    --workload-identity-pool=github-pool --format="value(name)" 2>/dev/null || true)

  if [ -n "$PROVIDER_EXISTS" ]; then
    log "OIDC Provider ya existe"
  else
    gcloud iam workload-identity-pools providers create-oidc github-provider \
      --project="$PROJECT" --location=global \
      --workload-identity-pool=github-pool \
      --display-name="GitHub OIDC provider" \
      --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository" \
      --attribute-condition="assertion.repository=='rubenmeister/going-monorepo-clean'" \
      --issuer-uri="https://token.actions.githubusercontent.com"
    log "OIDC Provider creado (bloqueado a rubenmeister/going-monorepo-clean)"
  fi

  gcloud iam service-accounts add-iam-policy-binding "$SA_EMAIL" \
    --project="$PROJECT" \
    --role="roles/iam.workloadIdentityUser" \
    --member="principalSet://iam.googleapis.com/projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/github-pool/attribute.repository/rubenmeister/going-monorepo-clean" \
    --quiet >/dev/null 2>&1

  WIF_PROVIDER=$(gcloud iam workload-identity-pools providers describe github-provider \
    --project="$PROJECT" --location=global \
    --workload-identity-pool=github-pool \
    --format='value(name)')

  echo ""
  log "Workload Identity Federation configurado"
  echo ""
  echo "  ┌────────────────────────────────────────────────────────────┐"
  echo "  │  Agrega estos secrets en GitHub:                          │"
  echo "  │  Repo → Settings → Secrets → Actions → New secret        │"
  echo "  │                                                            │"
  echo "  │  GCP_PROJECT_ID:                                          │"
  echo "  │    $PROJECT"
  echo "  │                                                            │"
  echo "  │  GCP_SERVICE_ACCOUNT:                                     │"
  echo "  │    $SA_EMAIL"
  echo "  │                                                            │"
  echo "  │  GCP_WORKLOAD_IDENTITY_PROVIDER:                          │"
  echo "  │    $WIF_PROVIDER"
  echo "  │                                                            │"
  echo "  └────────────────────────────────────────────────────────────┘"
  echo ""
}

# ── MAIN ──────────────────────────────────────────────────────────
main() {
  echo ""
  echo "══════════════════════════════════════════════════════════"
  echo "  Going Platform — GKE Production Setup"
  echo "══════════════════════════════════════════════════════════"
  echo ""
  echo "  Proyecto:  $PROJECT"
  echo "  Región:    $REGION"
  echo "  Cluster:   $CLUSTER_NAME"
  echo ""

  preflight
  enable_apis
  create_cluster
  create_namespace
  install_ingress_nginx
  install_cert_manager
  install_sealed_secrets
  install_argocd
  apply_configs
  setup_workload_identity

  echo ""
  echo "══════════════════════════════════════════════════════════"
  echo "  Setup completo"
  echo "══════════════════════════════════════════════════════════"
  echo ""
  echo "  Próximos pasos:"
  echo ""
  echo "  1. Sella tus secrets:"
  echo "     ./scripts/seal-production-secrets.sh"
  echo ""
  echo "  2. Agrega los 3 secrets de GitHub Actions (arriba)"
  echo ""
  echo "  3. Apunta tus DNS a la IP del Ingress:"
  echo "     kubectl get svc -n ingress-nginx"
  echo ""
  echo "  4. Crea los environments en GitHub:"
  echo "     Repo → Settings → Environments"
  echo "     - staging (sin protección)"
  echo "     - production (con reviewers requeridos)"
  echo ""
  echo "  5. Push a main para que ArgoCD sincronice:"
  echo "     git checkout main && git merge claude/keen-planck-qFwou"
  echo "     git push origin main"
  echo ""
  echo "  6. Monitorea el deploy en ArgoCD:"
  echo "     kubectl port-forward svc/argocd-server -n argocd 8080:443"
  echo "     Abre https://localhost:8080"
  echo ""
}

main "$@"
