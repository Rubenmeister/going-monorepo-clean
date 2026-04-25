#!/usr/bin/env bash
# ============================================================
# Going Platform - ArgoCD Bootstrap Script
# ============================================================
set -euo pipefail

ARGOCD_NAMESPACE="argocd"
ARGOCD_VERSION="v2.10.0"
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "🚀 Installing ArgoCD ${ARGOCD_VERSION}..."
kubectl create namespace ${ARGOCD_NAMESPACE} --dry-run=client -o yaml | kubectl apply -f -
kubectl apply -n ${ARGOCD_NAMESPACE} \
  -f "https://raw.githubusercontent.com/argoproj/argo-cd/${ARGOCD_VERSION}/manifests/install.yaml"

echo "⏳ Waiting for ArgoCD components to be ready..."
kubectl wait --for=condition=available --timeout=300s \
  deployment/argocd-server \
  deployment/argocd-repo-server \
  deployment/argocd-application-controller \
  -n ${ARGOCD_NAMESPACE}

echo "📋 Applying Going platform AppProject..."
kubectl apply -f "${REPO_ROOT}/argocd/project.yaml"

echo "📋 Applying Going applications (staging + production)..."
kubectl apply -f "${REPO_ROOT}/argocd/applications.yaml"

echo "🔑 Getting ArgoCD admin password..."
ARGOCD_PASSWORD=$(kubectl -n ${ARGOCD_NAMESPACE} get secret argocd-initial-admin-secret \
  -o jsonpath='{.data.password}' | base64 -d)

echo ""
echo "✅ ArgoCD is ready!"
echo "   UI:       https://localhost:8080  (port-forward: kubectl port-forward svc/argocd-server -n argocd 8080:443)"
echo "   Username: admin"
echo "   Password: ${ARGOCD_PASSWORD}"
echo ""
echo "   Applications:"
echo "   - going-staging  → tracks 'develop' branch → going-staging namespace"
echo "   - going-production → tracks 'main' branch → going-production namespace"
