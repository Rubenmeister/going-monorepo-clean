# Guía de hardening de operaciones — Going (Bloque B)

> Ítems de seguridad que se operan en Consola/CLI (no son código). Proyecto GCP
> `going-5d1ae`, región `us-central1`. Preferencia: `gcloud` cuando se pueda.
> Stack autorizada: Cloud Run + Atlas + Redis Labs + Secret Manager + Cloud
> Monitoring (nada de GKE/Prometheus/Grafana — ver CLAUDE.md).

---

## 1. Alertas (Cloud Monitoring)

Objetivo: enterarse ANTES que el usuario cuando algo se cae o se degrada. Los
servicios críticos a vigilar: **api-gateway, user-auth-service, payment-service,
transport-service, booking-service**.

### 1a. Canal de notificación (una vez)
Consola → **Monitoring → Alerting → Edit notification channels**
`https://console.cloud.google.com/monitoring/alerting/notifications?project=going-5d1ae`
- Añadir **Email** (rubentorcob@gmail.com) y, si quieres, **SMS**.
- (Ya recibes alertas del CD por GitHub; esto es para runtime de Cloud Run.)

### 1b. Uptime check del gateway (health público)
Consola → **Monitoring → Uptime checks → Create**
`https://console.cloud.google.com/monitoring/uptime?project=going-5d1ae`
| Campo | Valor |
|---|---|
| Protocol | HTTPS |
| Hostname | `api.goingec.com` |
| Path | `/health` |
| Frequency | 1 min |
| Alert | activar, threshold 2 regiones fallando |

### 1c. Políticas de alerta recomendadas (por servicio)
Consola → **Monitoring → Alerting → Create policy** → metric `Cloud Run Revision`:
| Alerta | Métrica | Condición | Servicios |
|---|---|---|---|
| Error 5xx alto | `run.googleapis.com/request_count` (response_code_class=5xx) | > 5% de requests por 5 min | gateway, payment, user-auth |
| Latencia p95 | `request_latencies` | p95 > 3000 ms por 5 min | gateway, transport, booking |
| Container crashloop | `container/instance_count` con restarts | > 3 restarts / 10 min | todos los críticos |
| Sin instancias (caído) | `container/instance_count` | == 0 por 5 min (los que tienen min=1) | gateway, payment, transport |

> Nota: min-instances=1 en los servicios con cron/websocket (gateway, transport,
> booking) — verificar con `gcloud run services describe <svc> --format="value(spec.template.metadata.annotations)"`.

---

## 2. Backups / DR

### 2a. MongoDB Atlas (el dato vive acá)
Atlas → cluster `going-cluster` → **Backup**
`https://cloud.mongodb.com/` → Project → Clusters → going-cluster → Backup
- Verificar **Continuous Cloud Backups** ACTIVO (no solo snapshots).
- **Point-in-Time Recovery (PITR)**: activar, ventana ≥ 7 días.
- Snapshot schedule recomendado: cada 6 h, retención 7 días + 1 semanal (4 sem) + 1 mensual (12 m).
- **Probar un restore** a un cluster temporal 1×/trimestre (un backup sin restore probado no es backup).
- Las bases legacy ya se limpiaron (backup `test-backup-20260611`); las vivas son `going-*`.

### 2b. Redis Labs (Redis)
- Redis es **cache + estado efímero** (rate-limit, tracking, sockets, idempotencia
  de corto plazo). NO es la fuente de verdad → su pérdida es tolerable.
- Aun así: en el panel de Redis Labs verificar **persistence = AOF every second**
  y que el plan tenga replicación. No requiere PITR.

### 2c. Secret Manager
- Los secretos ya viven versionados en Secret Manager (backup implícito).
- Export de emergencia (guardar cifrado, fuera de línea):
  `gcloud secrets versions access latest --secret=<NAME> --project=going-5d1ae`

---

## 3. Rotación de secrets (procedimiento SIN romper auth)

⚠️ Lo más delicado. Hoy `JWT_SECRET` no rota; `RS256_*` se rotó 1 vez (v2 en par).
Rotar mal = todas las sesiones nuevas fallan (lo vimos hoy con un token truncado).

### 3a. Regla de oro
La firma la hace **user-auth** (privada); la verificación la hacen **todos** los
servicios (pública/secreto). Nunca cambiar el firmante sin que los verificadores
acepten AMBAS claves durante una ventana de solapamiento ≥ TTL del token
(access token dura ~7 días → ventana ≥ 7 días).

### 3b. Rotar el par RS256 (recomendado, con solapamiento)
1. Generar par nuevo:
   `openssl genrsa -out priv.pem 2048 && openssl rsa -in priv.pem -pubout -out pub.pem`
2. Subir como **versión nueva** (no reemplazar la vieja):
   `gcloud secrets versions add RS256_PRIVATE_KEY --data-file=priv.pem --project=going-5d1ae`
   `gcloud secrets versions add RS256_PUBLIC_KEY  --data-file=pub.pem  --project=going-5d1ae`
3. **Primero** desplegar los VERIFICADORES aceptando la pública nueva (todos los
   servicios ya leen `RS256_PUBLIC_KEY:latest` → un redeploy los actualiza). Idealmente
   soportar 2 públicas a la vez (mejora futura del `base-jwt.strategy`); mientras
   tanto, aceptar un breve corte de sesiones viejas.
4. **Después** desplegar user-auth firmando con la privada nueva.
5. Verificar: `curl -s .../auth/register` → token nuevo → probar contra un servicio
   (ej. `/tours/mine`) → 200/[].
6. A los ≥7 días (expiraron los tokens viejos): `gcloud secrets versions disable 1 --secret=RS256_PUBLIC_KEY`.
   Borrar `priv.pem`/`pub.pem` locales.

### 3c. INTERNAL_SERVICE_TOKEN (S2S)
- Rotarlo requiere actualizar el secreto y **redeploy de TODOS** los servicios que
  lo usan (emisores y receptores) juntos → coordinar en una ventana (hay corte S2S
  de segundos). Verificar cableado con:
  `for s in <servicios>; do gcloud run services describe $s --format="value(...env...)"; done`

### 3d. Cadencia sugerida
| Secreto | Cadencia | Riesgo si se omite |
|---|---|---|
| RS256 keypair | anual o ante sospecha de fuga | firma comprometida |
| INTERNAL_SERVICE_TOKEN | semestral | S2S spoofing |
| JWT_SECRET (HS256 legacy) | al completar flip RS256 se puede retirar | superficie doble |

---

## Estado (10-jul-2026)
- ✅ Código: NoSQL-injection, ownership publish, billing cross-tenant, guards S2S,
  redacción PII en logs — cerrados y desplegados.
- 🔎 RS256: par en sync, sin auto-rotación (sano). JWT_SECRET sin rotación.
- ⏳ Pendiente (esta guía): alertas, PITR Atlas, cadencia de rotación, LOPDP.
