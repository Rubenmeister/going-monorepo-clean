#!/usr/bin/env bash
# ══════════════════════════════════════════════════════════════════
# Going Platform — Setup Redis + MongoDB for production
#
# Redis: StatefulSet dentro del cluster GKE (gratis)
# MongoDB: instrucciones para MongoDB Atlas (free tier M0)
#
# Uso:
#   chmod +x scripts/setup-databases.sh
#   ./scripts/setup-databases.sh
# ══════════════════════════════════════════════════════════════════
set -euo pipefail

NAMESPACE="going-production"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

log()  { echo -e "${GREEN}[✓]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }
info() { echo -e "${BLUE}[→]${NC} $1"; }
err()  { echo -e "${RED}[✗]${NC} $1"; exit 1; }

# ── REDIS (in-cluster StatefulSet) ────────────────────────────────
setup_redis() {
  info "Configurando Redis en el cluster..."

  if kubectl get statefulset redis -n "$NAMESPACE" >/dev/null 2>&1; then
    log "Redis ya está desplegado"
    return
  fi

  # Genera password aleatoria
  REDIS_PASSWORD=$(openssl rand -base64 24)

  kubectl apply -n "$NAMESPACE" -f - <<YAML
apiVersion: v1
kind: Secret
metadata:
  name: redis-credentials
  namespace: $NAMESPACE
type: Opaque
stringData:
  REDIS_PASSWORD: "$REDIS_PASSWORD"
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: redis-config
  namespace: $NAMESPACE
data:
  redis.conf: |
    maxmemory 256mb
    maxmemory-policy allkeys-lru
    appendonly yes
    appendfsync everysec
    save 900 1
    save 300 10
    save 60 10000
    requirepass REDIS_PASSWORD_PLACEHOLDER
    protected-mode yes
    tcp-keepalive 300
    timeout 0
---
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: redis
  namespace: $NAMESPACE
  labels:
    app: redis
spec:
  serviceName: redis
  replicas: 1
  selector:
    matchLabels:
      app: redis
  template:
    metadata:
      labels:
        app: redis
    spec:
      securityContext:
        runAsUser: 999
        runAsGroup: 999
        fsGroup: 999
      containers:
        - name: redis
          image: redis:7-alpine
          ports:
            - containerPort: 6379
              name: redis
          command:
            - sh
            - -c
            - |
              cp /config/redis.conf /tmp/redis.conf
              sed -i "s/REDIS_PASSWORD_PLACEHOLDER/\$REDIS_PASSWORD/" /tmp/redis.conf
              exec redis-server /tmp/redis.conf
          env:
            - name: REDIS_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: redis-credentials
                  key: REDIS_PASSWORD
          resources:
            requests:
              cpu: 100m
              memory: 128Mi
            limits:
              cpu: 250m
              memory: 300Mi
          readinessProbe:
            exec:
              command: ["redis-cli", "-a", "\$(REDIS_PASSWORD)", "ping"]
            initialDelaySeconds: 5
            periodSeconds: 10
          livenessProbe:
            exec:
              command: ["redis-cli", "-a", "\$(REDIS_PASSWORD)", "ping"]
            initialDelaySeconds: 15
            periodSeconds: 20
          volumeMounts:
            - name: redis-data
              mountPath: /data
            - name: config
              mountPath: /config
      volumes:
        - name: config
          configMap:
            name: redis-config
  volumeClaimTemplates:
    - metadata:
        name: redis-data
      spec:
        accessModes: ["ReadWriteOnce"]
        resources:
          requests:
            storage: 2Gi
---
apiVersion: v1
kind: Service
metadata:
  name: redis
  namespace: $NAMESPACE
  labels:
    app: redis
spec:
  type: ClusterIP
  selector:
    app: redis
  ports:
    - port: 6379
      targetPort: 6379
      name: redis
YAML

  log "Redis desplegado en el cluster"
  echo ""
  echo "  Redis URL para tus secrets:"
  echo "  redis://:${REDIS_PASSWORD}@redis.${NAMESPACE}.svc.cluster.local:6379/0"
  echo ""
  echo "  Guardándola en /tmp/redis-url.txt (temporal, NO se commitea)"
  echo "redis://:${REDIS_PASSWORD}@redis.${NAMESPACE}.svc.cluster.local:6379/0" > /tmp/redis-url.txt

  info "Esperando que Redis esté listo..."
  kubectl rollout status statefulset/redis -n "$NAMESPACE" --timeout=120s
  log "Redis está corriendo"
}

# ── MONGODB ATLAS (instrucciones) ─────────────────────────────────
setup_mongodb_instructions() {
  echo ""
  echo "══════════════════════════════════════════════════════════"
  echo "  MongoDB Atlas — Setup (free tier M0)"
  echo "══════════════════════════════════════════════════════════"
  echo ""
  echo "  MongoDB Atlas requiere setup manual en su web (no tiene"
  echo "  CLI para crear clusters gratis). Son ~5 minutos:"
  echo ""
  echo "  1. Ve a https://cloud.mongodb.com"
  echo "     (regístrate gratis si no tienes cuenta)"
  echo ""
  echo "  2. Create Cluster → FREE (M0) → Provider: Google Cloud"
  echo "     Region: us-central1 (Iowa) ← misma que tu cluster GKE"
  echo ""
  echo "  3. Security → Database Access → Add User"
  echo "     Username: going-production"
  echo "     Password: (genera una segura)"
  echo "     Role: Atlas Admin"
  echo ""
  echo "  4. Security → Network Access → Add IP Address"
  echo "     Opción 1: 'Allow Access from Anywhere' (0.0.0.0/0)"
  echo "       → Simple pero menos seguro. OK para empezar."
  echo "     Opción 2: Agrega la IP de tu cluster GKE:"
  EXTERNAL_IP=$(kubectl get svc ingress-nginx-controller -n ingress-nginx -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null || echo "<tu-ip>")
  echo "       kubectl get nodes -o wide  → EXTERNAL-IP de los nodos"
  echo ""
  echo "  5. Database → Connect → Drivers → Copy connection string"
  echo "     Se ve así:"
  echo "     mongodb+srv://going-production:<password>@cluster0.xxxxx.mongodb.net/going-production?retryWrites=true&w=majority"
  echo ""
  echo "  6. Pega esa URI cuando ejecutes:"
  echo "     ./scripts/seal-production-secrets.sh"
  echo ""
  echo "══════════════════════════════════════════════════════════"
  echo ""
}

# ── MAIN ──────────────────────────────────────────────────────────
main() {
  echo ""
  echo "══════════════════════════════════════════════════════════"
  echo "  Going Platform — Setup Bases de Datos"
  echo "══════════════════════════════════════════════════════════"
  echo ""

  # Check kubectl
  command -v kubectl >/dev/null 2>&1 || err "kubectl no está instalado"
  kubectl get namespace "$NAMESPACE" >/dev/null 2>&1 || err "Namespace $NAMESPACE no existe. Ejecuta setup-gke-production.sh primero"

  setup_redis
  setup_mongodb_instructions

  echo ""
  log "Redis: LISTO (corriendo en el cluster)"
  warn "MongoDB: necesitas crear un cluster en Atlas (instrucciones arriba)"
  echo ""
  echo "  Cuando tengas la MongoDB URI, ejecuta:"
  echo "  ./scripts/seal-production-secrets.sh"
  echo ""
  echo "  La Redis URL está guardada en /tmp/redis-url.txt"
  echo ""
}

main "$@"
