# Voice Call Service (Uyari) — Monitoring & Alerts

> **Service:** voice-call-service
> **Project:** going-5d1ae
> **Region:** us-central1
> **Service URL:** https://voice-call-service-lw44cnhdeq-uc.a.run.app

Complementa `voice-call-service/RUNBOOK.md`. El runbook explica **qué hacer** en cada
falla; este doc explica **cómo te enterás** de las fallas.

---

## Qué monitoreamos y por qué

| Categoría | Por qué importa | Cómo se detecta |
|-----------|----------------|-----------------|
| **Tráfico** | Saber cuántas llamadas entran y cuándo (capacity planning, anomalías) | Logs `[twilio] incoming call` + Cloud Run request count |
| **Errores** | Bugs en código que rompen la experiencia del llamante | Cloud Run 5xx + logs ERROR |
| **Seguridad** | Detectar intentos de spoofing del webhook o callers maliciosos | Log-based metric `voice_call_hmac_failures` + `[suspicious-caller]` |
| **Latencia** | El producto vive o muere por la latencia (target < 1.5s respuesta) | Cloud Run `request_latencies` + logs `[bridge] session ready` timing |
| **Handoffs** | Si el handoff a operador falla, la promesa "24/7 con humano de respaldo" se rompe | Logs `[bridge] dispatching handoff` vs `[twilio-rest] redirectCall fallo` |
| **OpenAI Realtime** | Es la dependencia más cara y más frágil del stack | Logs `[realtime] WS error` + `[realtime] WS cerrado code≠1000` |

---

## 1. Live tail (durante un incidente)

Cuando algo se está rompiendo en vivo, abrí esto en una terminal aparte:

```bash
gcloud run services logs tail voice-call-service --region us-central1
```

Tail con filtro por severidad (solo warn/error):
```bash
gcloud run services logs tail voice-call-service --region us-central1 --log-filter='severity>=WARNING'
```

Tail con grep visual (PowerShell):
```powershell
gcloud run services logs tail voice-call-service --region us-central1 | Select-String -Pattern '\[bridge\]|\[twilio\]|ERROR'
```

---

## 2. Cloud Logging — Saved Queries

Las copiás y pegás en https://console.cloud.google.com/logs/query?project=going-5d1ae,
o las guardás como "Saved queries" para acceso rápido.

### Q1 — Tráfico: todas las llamadas entrantes (últimas 24h)

```
resource.type="cloud_run_revision"
resource.labels.service_name="voice-call-service"
textPayload =~ "\\[twilio\\] incoming call CallSid="
timestamp >= "2026-XX-XXT00:00:00Z"
```
**Lee como**: cada línea = 1 llamada recibida. Útil para gráfico de volumen por hora.

### Q2 — Llamadas exitosas vs colgadas (completas)

```
resource.type="cloud_run_revision"
resource.labels.service_name="voice-call-service"
textPayload =~ "\\[twilio\\] status callback CallSid="
```
**Lee como**: cada línea incluye `status=completed|failed|busy|no-answer` + `duration=Xs`.

### Q3 — Handoffs disparados

```
resource.type="cloud_run_revision"
resource.labels.service_name="voice-call-service"
textPayload =~ "\\[bridge\\] dispatching handoff redirect"
```

### Q4 — Handoffs FALLIDOS (urgente — degrada experiencia)

```
resource.type="cloud_run_revision"
resource.labels.service_name="voice-call-service"
(textPayload =~ "\\[bridge\\] redirectCall fallido"
  OR textPayload =~ "\\[twilio-rest\\] redirectCall fallo"
  OR textPayload =~ "\\[bridge\\] handoff\\.notify fallo")
```
**Lee como**: cada línea = handoff que cayó a modo callback (Telegram al operador en vez
de transfer PSTN). Si ves más de 2/día, hay algo roto.

### Q5 — Seguridad: requests sin firma válida (intentos spoof)

```
resource.type="cloud_run_revision"
resource.labels.service_name="voice-call-service"
(textPayload =~ "\\[twilio\\] webhook sin X-Twilio-Signature"
  OR textPayload =~ "\\[twilio\\] webhook payload inválido")
```
**Lee como**: requests que NO vienen de Twilio (o vienen mal formados). Spike repentino =
alguien escaneó el endpoint público.

### Q6 — Suspicious callers (rate-limit triggered)

```
resource.type="cloud_run_revision"
resource.labels.service_name="voice-call-service"
textPayload =~ "\\[suspicious-caller\\]"
```
**Lee como**: el mismo `From` llamó N veces en X segundos y se le rechazó. Tail útil
durante posibles ataques de fuzzing al voicebot.

### Q7 — OpenAI Realtime errors (la dependencia más frágil)

```
resource.type="cloud_run_revision"
resource.labels.service_name="voice-call-service"
(textPayload =~ "\\[realtime\\] WS error"
  OR textPayload =~ "\\[realtime\\] error parsing event"
  OR textPayload =~ "\\[bridge\\] OpenAI error"
  OR (textPayload =~ "\\[realtime\\] WS cerrado" AND NOT textPayload =~ "code=1000"))
```
**Lee como**: cualquier desconexión no-limpia o error de la API de OpenAI Realtime.
Si ves spike → revisar status.openai.com antes de mover código.

### Q8 — Latencia de bridge (session.ready desde call init)

```
resource.type="cloud_run_revision"
resource.labels.service_name="voice-call-service"
textPayload =~ "\\[bridge\\] session ready callId="
```
**Lee como**: cuándo el bridge OpenAI Realtime estuvo listo para responder. Cruzar con
`[twilio] incoming call` del mismo callId para sacar latencia connect → ready.

---

## 3. Log-based metrics (prerrequisito para alerts)

Cloud Monitoring no puede alertar directo sobre texto de logs — primero hay que
convertir cada query en un **log-based counter metric**.

Aplicar UNA SOLA VEZ desde `gcloud`:

### M1 — Webhook spoofing attempts
```bash
gcloud logging metrics create voice_call_hmac_failures \
  --description="Requests al webhook sin firma X-Twilio-Signature válida" \
  --log-filter='resource.type="cloud_run_revision"
    AND resource.labels.service_name="voice-call-service"
    AND (textPayload =~ "\\[twilio\\] webhook sin X-Twilio-Signature"
      OR textPayload =~ "\\[twilio\\] webhook payload inválido")' \
  --project=going-5d1ae
```

### M2 — Handoff failures
```bash
gcloud logging metrics create voice_call_handoff_failures \
  --description="Handoffs que cayeron a modo callback (PSTN redirect falló)" \
  --log-filter='resource.type="cloud_run_revision"
    AND resource.labels.service_name="voice-call-service"
    AND (textPayload =~ "\\[bridge\\] redirectCall fallido"
      OR textPayload =~ "\\[twilio-rest\\] redirectCall fallo")' \
  --project=going-5d1ae
```

### M3 — OpenAI Realtime errors
```bash
gcloud logging metrics create voice_call_openai_errors \
  --description="Errores de la sesión WebSocket con OpenAI Realtime" \
  --log-filter='resource.type="cloud_run_revision"
    AND resource.labels.service_name="voice-call-service"
    AND (textPayload =~ "\\[realtime\\] WS error"
      OR textPayload =~ "\\[bridge\\] OpenAI error")' \
  --project=going-5d1ae
```

### M4 — Suspicious callers blocked
```bash
gcloud logging metrics create voice_call_suspicious_callers \
  --description="Callers bloqueados por rate-limit (mismo From llamando N veces)" \
  --log-filter='resource.type="cloud_run_revision"
    AND resource.labels.service_name="voice-call-service"
    AND textPayload =~ "\\[suspicious-caller\\]"' \
  --project=going-5d1ae
```

### M5 — Incoming calls (para volumen)
```bash
gcloud logging metrics create voice_call_incoming \
  --description="Llamadas entrantes recibidas (webhook validado)" \
  --log-filter='resource.type="cloud_run_revision"
    AND resource.labels.service_name="voice-call-service"
    AND textPayload =~ "\\[twilio\\] incoming call CallSid="' \
  --project=going-5d1ae
```

Verificar que se crearon:
```bash
gcloud logging metrics list --project=going-5d1ae --filter="name:voice_call_*"
```

---

## 4. Cloud Monitoring — Alert Policies

### Pre-requisito: notification channel

Cada alert necesita un canal de notificación (email, Slack, Telegram, etc.). Si no
tenés ninguno configurado para el equipo de voice:

```bash
# Email channel
gcloud alpha monitoring channels create \
  --display-name="Voice Ops Email" \
  --type=email \
  --channel-labels=email_address=goingappecuador@gmail.com \
  --project=going-5d1ae

# Anotar el output: name='projects/going-5d1ae/notificationChannels/123...'
# Lo necesitás para los policies abajo
```

Para Telegram (recomendado para alertas urgentes), usar webhook channel a un bot
intermediario — Cloud Monitoring no soporta Telegram nativo.

### A1 — Spoofing burst (CRÍTICO)

> "Más de 5 requests sin firma válida en 5 minutos"
> → puede indicar scan masivo del endpoint o token rotated mal.

Guardar como `alerts/voice-call-hmac-spike.json`:
```json
{
  "displayName": "voice-call: HMAC failures > 5/5min (posible spoof)",
  "documentation": {
    "content": "Webhook recibió requests sin X-Twilio-Signature válida. Ver runbook §4 (Scenario C). Acción: (1) verificar TWILIO_AUTH_TOKEN sincronizado vía script pre-smoke; (2) si confirmado spoof, considerar IP allowlist por Cloud Armor.",
    "mimeType": "text/markdown"
  },
  "conditions": [{
    "displayName": "voice_call_hmac_failures > 5 en 5min",
    "conditionThreshold": {
      "filter": "metric.type=\"logging.googleapis.com/user/voice_call_hmac_failures\" AND resource.type=\"cloud_run_revision\"",
      "aggregations": [{
        "alignmentPeriod": "300s",
        "perSeriesAligner": "ALIGN_DELTA"
      }],
      "comparison": "COMPARISON_GT",
      "thresholdValue": 5,
      "duration": "0s"
    }
  }],
  "combiner": "OR",
  "notificationChannels": ["projects/going-5d1ae/notificationChannels/CHANNEL_ID_AQUI"],
  "alertStrategy": {
    "autoClose": "1800s"
  }
}
```

Aplicar:
```bash
gcloud alpha monitoring policies create --policy-from-file=alerts/voice-call-hmac-spike.json --project=going-5d1ae
```

### A2 — Handoff failures (DEGRADACIÓN UX)

> "Más de 2 handoffs fallidos en 10 minutos"
> → la promesa "24/7 con humano" se está rompiendo silenciosamente.

`alerts/voice-call-handoff-failures.json`:
```json
{
  "displayName": "voice-call: handoffs PSTN fallidos > 2/10min",
  "documentation": {
    "content": "Handoff cayó a modo callback (PSTN redirect falló). Operador recibe Telegram pero NO se transfiere la PSTN. Acción: ver logs por '[twilio-rest] redirectCall fallo' → causa típica TWILIO_AUTH_TOKEN inválido para REST API o número de operador en formato no-E.164.",
    "mimeType": "text/markdown"
  },
  "conditions": [{
    "displayName": "voice_call_handoff_failures > 2 en 10min",
    "conditionThreshold": {
      "filter": "metric.type=\"logging.googleapis.com/user/voice_call_handoff_failures\" AND resource.type=\"cloud_run_revision\"",
      "aggregations": [{
        "alignmentPeriod": "600s",
        "perSeriesAligner": "ALIGN_DELTA"
      }],
      "comparison": "COMPARISON_GT",
      "thresholdValue": 2,
      "duration": "0s"
    }
  }],
  "combiner": "OR",
  "notificationChannels": ["projects/going-5d1ae/notificationChannels/CHANNEL_ID_AQUI"]
}
```

### A3 — Cloud Run error rate (sistémico)

> "Tasa de 5xx > 5% en 5 minutos"
> → algo está roto a nivel servicio (no solo edge cases).

Usa la métrica nativa de Cloud Run, **no necesita log-based metric**.

`alerts/voice-call-error-rate.json`:
```json
{
  "displayName": "voice-call: error rate 5xx > 5% / 5min",
  "documentation": {
    "content": "Cloud Run está devolviendo 5xx a más del 5% de requests. Acción inmediata: (1) revisar revision activa con `gcloud run services describe`; (2) si el problema es post-deploy, rollback a revision anterior con `gcloud run services update-traffic --to-revisions=<previous>=100`; (3) ver logs por '[bridge]' y '[realtime]' ERROR.",
    "mimeType": "text/markdown"
  },
  "conditions": [{
    "displayName": "5xx rate > 5%",
    "conditionThreshold": {
      "filter": "metric.type=\"run.googleapis.com/request_count\" AND resource.type=\"cloud_run_revision\" AND resource.label.service_name=\"voice-call-service\" AND metric.label.response_code_class=\"5xx\"",
      "aggregations": [{
        "alignmentPeriod": "300s",
        "perSeriesAligner": "ALIGN_RATE",
        "crossSeriesReducer": "REDUCE_SUM"
      }],
      "denominatorFilter": "metric.type=\"run.googleapis.com/request_count\" AND resource.type=\"cloud_run_revision\" AND resource.label.service_name=\"voice-call-service\"",
      "denominatorAggregations": [{
        "alignmentPeriod": "300s",
        "perSeriesAligner": "ALIGN_RATE",
        "crossSeriesReducer": "REDUCE_SUM"
      }],
      "comparison": "COMPARISON_GT",
      "thresholdValue": 0.05,
      "duration": "300s"
    }
  }],
  "combiner": "OR",
  "notificationChannels": ["projects/going-5d1ae/notificationChannels/CHANNEL_ID_AQUI"]
}
```

### A4 — Volumen anormal (opcional, anti-DDoS)

> "Más de 30 llamadas/hora durante 2 horas seguidas"
> → o spike de ataque, o post-marketing exitoso. En cualquier caso revisar.

```json
{
  "displayName": "voice-call: volumen anormal > 30 calls/h por 2h",
  "documentation": {
    "content": "Spike sostenido de llamadas. Verificar: (1) ¿hay campaña de marketing activa que justifique?; (2) si no, revisar Q1 + Q6 buscando From repetidos.",
    "mimeType": "text/markdown"
  },
  "conditions": [{
    "displayName": "voice_call_incoming > 30/h",
    "conditionThreshold": {
      "filter": "metric.type=\"logging.googleapis.com/user/voice_call_incoming\" AND resource.type=\"cloud_run_revision\"",
      "aggregations": [{
        "alignmentPeriod": "3600s",
        "perSeriesAligner": "ALIGN_DELTA"
      }],
      "comparison": "COMPARISON_GT",
      "thresholdValue": 30,
      "duration": "7200s"
    }
  }],
  "combiner": "OR",
  "notificationChannels": ["projects/going-5d1ae/notificationChannels/CHANNEL_ID_AQUI"]
}
```

Verificar policies creadas:
```bash
gcloud alpha monitoring policies list --project=going-5d1ae --filter="displayName:voice-call*"
```

---

## 5. Dashboard (opcional pero recomendado)

JSON listo para importar en Cloud Monitoring → Dashboards → Create → JSON.

`dashboards/voice-call-overview.json`:
```json
{
  "displayName": "Voice Call Service (Uyari) Overview",
  "mosaicLayout": {
    "columns": 12,
    "tiles": [
      {
        "width": 6, "height": 4, "xPos": 0, "yPos": 0,
        "widget": {
          "title": "Llamadas entrantes / hora",
          "xyChart": {
            "dataSets": [{
              "timeSeriesQuery": {
                "timeSeriesFilter": {
                  "filter": "metric.type=\"logging.googleapis.com/user/voice_call_incoming\" AND resource.type=\"cloud_run_revision\"",
                  "aggregation": {
                    "alignmentPeriod": "3600s",
                    "perSeriesAligner": "ALIGN_DELTA"
                  }
                }
              },
              "plotType": "STACKED_BAR"
            }]
          }
        }
      },
      {
        "width": 6, "height": 4, "xPos": 6, "yPos": 0,
        "widget": {
          "title": "Request latency (p50/p95/p99)",
          "xyChart": {
            "dataSets": [{
              "timeSeriesQuery": {
                "timeSeriesFilter": {
                  "filter": "metric.type=\"run.googleapis.com/request_latencies\" AND resource.type=\"cloud_run_revision\" AND resource.label.service_name=\"voice-call-service\"",
                  "aggregation": {
                    "alignmentPeriod": "300s",
                    "perSeriesAligner": "ALIGN_DELTA",
                    "crossSeriesReducer": "REDUCE_PERCENTILE_95"
                  }
                }
              }
            }]
          }
        }
      },
      {
        "width": 6, "height": 4, "xPos": 0, "yPos": 4,
        "widget": {
          "title": "HMAC failures (spoofing attempts)",
          "xyChart": {
            "dataSets": [{
              "timeSeriesQuery": {
                "timeSeriesFilter": {
                  "filter": "metric.type=\"logging.googleapis.com/user/voice_call_hmac_failures\" AND resource.type=\"cloud_run_revision\"",
                  "aggregation": {
                    "alignmentPeriod": "300s",
                    "perSeriesAligner": "ALIGN_DELTA"
                  }
                }
              }
            }]
          }
        }
      },
      {
        "width": 6, "height": 4, "xPos": 6, "yPos": 4,
        "widget": {
          "title": "Handoff failures",
          "xyChart": {
            "dataSets": [{
              "timeSeriesQuery": {
                "timeSeriesFilter": {
                  "filter": "metric.type=\"logging.googleapis.com/user/voice_call_handoff_failures\" AND resource.type=\"cloud_run_revision\"",
                  "aggregation": {
                    "alignmentPeriod": "600s",
                    "perSeriesAligner": "ALIGN_DELTA"
                  }
                }
              }
            }]
          }
        }
      },
      {
        "width": 6, "height": 4, "xPos": 0, "yPos": 8,
        "widget": {
          "title": "OpenAI Realtime errors",
          "xyChart": {
            "dataSets": [{
              "timeSeriesQuery": {
                "timeSeriesFilter": {
                  "filter": "metric.type=\"logging.googleapis.com/user/voice_call_openai_errors\" AND resource.type=\"cloud_run_revision\"",
                  "aggregation": {
                    "alignmentPeriod": "300s",
                    "perSeriesAligner": "ALIGN_DELTA"
                  }
                }
              }
            }]
          }
        }
      },
      {
        "width": 6, "height": 4, "xPos": 6, "yPos": 8,
        "widget": {
          "title": "Container instance count",
          "xyChart": {
            "dataSets": [{
              "timeSeriesQuery": {
                "timeSeriesFilter": {
                  "filter": "metric.type=\"run.googleapis.com/container/instance_count\" AND resource.type=\"cloud_run_revision\" AND resource.label.service_name=\"voice-call-service\"",
                  "aggregation": {
                    "alignmentPeriod": "60s",
                    "perSeriesAligner": "ALIGN_MEAN"
                  }
                }
              }
            }]
          }
        }
      }
    ]
  }
}
```

Aplicar:
```bash
gcloud monitoring dashboards create --config-from-file=dashboards/voice-call-overview.json --project=going-5d1ae
```

URL del dashboard (después de crearlo):
https://console.cloud.google.com/monitoring/dashboards?project=going-5d1ae

---

## 6. Quick-reference: alertas → runbook

| Alert | Trigger | Acción de runbook |
|-------|---------|------------------|
| A1 — HMAC spike | > 5 spoofs / 5min | RUNBOOK §4 (anti-spoof) + considerar Cloud Armor IP allowlist |
| A2 — Handoff failures | > 2 / 10min | RUNBOOK §3 failure modes (handoff) |
| A3 — Error rate 5xx | > 5% / 5min | RUNBOOK §8 rollback (rollback revision si post-deploy) |
| A4 — Volume anormal | > 30 calls/h por 2h | RUNBOOK §9 cost expectations (volumen) + revisar Q6 |

---

## 7. Setup completo en un solo paso (cuando bundle apruebe)

Script idempotente para aplicar TODO en una sola corrida:

`scripts/voice-call-setup-monitoring.sh` (TODO crear cuando estés listo):
```bash
#!/usr/bin/env bash
set -euo pipefail

PROJECT=going-5d1ae
SERVICE=voice-call-service

# 1. Log-based metrics (idempotente — gcloud falla si ya existe pero seguimos)
for METRIC_DEF in M1 M2 M3 M4 M5; do
  # ... ver sección 3 arriba
done

# 2. Notification channel (chequear si ya existe primero)
CHANNEL=$(gcloud alpha monitoring channels list \
  --filter='displayName="Voice Ops Email"' \
  --format='value(name)' --project=$PROJECT | head -1)

if [ -z "$CHANNEL" ]; then
  CHANNEL=$(gcloud alpha monitoring channels create \
    --display-name="Voice Ops Email" \
    --type=email \
    --channel-labels=email_address=goingappecuador@gmail.com \
    --format='value(name)' --project=$PROJECT)
fi

# 3. Alert policies (reemplazar CHANNEL_ID_AQUI con $CHANNEL en cada JSON)
for ALERT in alerts/voice-call-*.json; do
  sed "s|CHANNEL_ID_AQUI|$(echo $CHANNEL | sed 's|.*/||')|g" $ALERT \
    | gcloud alpha monitoring policies create --policy-from-file=- --project=$PROJECT
done

# 4. Dashboard
gcloud monitoring dashboards create \
  --config-from-file=dashboards/voice-call-overview.json \
  --project=$PROJECT
```

---

## Notas operacionales

- **Costo del monitoring**: log-based metrics + alertas son **gratis dentro del free tier** de Cloud Operations (50 GiB de logs/mes incluido). El dashboard tampoco cuesta. Solo paga si superás el free tier (improbable con tráfico inicial).
- **Retención de logs**: Cloud Run retiene logs 30 días por default. Para incidentes
  que requieran forensia más allá → export sink a BigQuery (TODO si llegamos a ese
  volumen).
- **No alertas excesivas**: arrancamos con 3-4 alerts críticos. Agregar más solo cuando
  veamos un failure mode recurrente que no estamos detectando.
- **Silenciar durante deploys**: si vas a hacer un deploy planificado que va a generar
  errores transitorios, silenciá las policies por 15 min:
  ```bash
  gcloud alpha monitoring policies update POLICY_ID --no-enabled --project=going-5d1ae
  # ... deploy ...
  gcloud alpha monitoring policies update POLICY_ID --enabled --project=going-5d1ae
  ```
