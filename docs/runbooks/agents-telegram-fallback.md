# Runbook — Agentes corren sin Telegram

**Cuándo usar**: si Telegram está caído o tu cuenta tiene problemas para
recibir mensajes de los bots de los agentes.

**Importante**: los agentes (going-agent, ops-agent, financial-agent,
content-agent, marketing-agent, customer-support-service) corren
INDEPENDIENTEMENTE de Telegram. Cuando Telegram falla, los agentes:
- Siguen ejecutando su ciclo (cron en Cloud Run Jobs)
- Siguen leyendo y escribiendo a MongoDB
- Solo pierden la **notificación** del resultado a tu Telegram

Tus datos NO se pierden. Solo la visibilidad temporal.

---

## Cómo ver outputs de los agentes mientras Telegram está caído

### Opción 1: Cloud Logging (más rápido, lo que ya tienes)

Cada agente logea su run completo a Cloud Logging. Para ver el último
ciclo de ops-agent:

```bash
gcloud logging read 'resource.type="cloud_run_revision"
  resource.labels.service_name="ops-agent"
  severity>=INFO' \
  --project=going-5d1ae --limit=50 --freshness=2h \
  --format='value(timestamp,textPayload)'
```

Cambia `ops-agent` por:
- `going-agent`
- `financial-agent`
- `content-agent`
- `marketing-agent`
- `customer-support-service`

### Opción 2: Console de Cloud Run (visual)

1. Ir a https://console.cloud.google.com/run?project=going-5d1ae
2. Click en el servicio del agente que quieras inspeccionar
3. Tab **Logs** → ver los últimos runs

### Opción 3: MongoDB directamente

Cada agente persiste su output en su collection. Puedes consultar
directo:

```bash
# Conexión a Atlas
mongosh "mongodb+srv://rubenmeister_db_user:***REMOVED-CREDENTIAL***@going-cluster.vy28mpj.mongodb.net/going-ops"

# Ver últimos runs de ops-agent
db.opsRunReports.find({}).sort({createdAt:-1}).limit(5)
```

Collections por agente:
- `going-ops` → ops_run_reports
- `going-financial` → financial_run_reports, payouts_log
- `going-content` → content_published_log
- `going-marketing` → marketing_campaigns_log
- `going-going-agent` → agent_run_history

---

## Reactivar Telegram cuando se solucione

Cuando puedas instalar Telegram en al menos un dispositivo:

1. Abre Telegram con tu número
2. Busca cada bot:
   - @GoingOpsBot
   - @GoingFinancialBot
   - @GoingContentBot
   - etc.
3. Toca **Start** en cada uno (esto registra tu chat ID al bot)
4. Si los bots están configurados con TELEGRAM_CHAT_ID fijo (no por user),
   no necesitas hacer nada — Telegram los recibe automáticamente cuando
   te conectas.

Verificar que TELEGRAM_BOT_TOKEN y TELEGRAM_CHAT_ID estén seteados en
Cloud Run para cada agente:

```bash
for svc in going-agent ops-agent financial-agent content-agent marketing-agent; do
  echo "=== $svc ==="
  gcloud run jobs describe $svc --region=us-central1 --project=going-5d1ae \
    --format="value(spec.template.spec.template.spec.containers[0].env)" 2>/dev/null \
    | tr ';' '\n' | grep -iE "TELEGRAM" | head -3
done
```

Si faltan, setealos:

```bash
gcloud run jobs update ops-agent \
  --region=us-central1 \
  --project=going-5d1ae \
  --update-secrets="TELEGRAM_BOT_TOKEN=TELEGRAM_BOT_TOKEN:latest,TELEGRAM_CHAT_ID=TELEGRAM_CHAT_ID:latest"
```

---

## Plan B: alertas por email (si Telegram queda crítico)

Si Telegram sigue down >24h y necesitas un canal alternativo, el más
rápido es agregar un fallback a email vía la cuenta Gmail que ya está
configurada en Cloud Run (`GMAIL_APP_PASSWORD` secret).

Implementación pendiente — solicitar a Claude Code en sesión nueva:

> "En cada agente, después de enviar a Telegram, si la respuesta es 4xx/5xx
> o timeout, hacer fallback a email usando GMAIL_APP_PASSWORD. Destinatario
> en env var FALLBACK_EMAIL (default rubentorcob@gmail.com). Implementar
> como utilidad compartida en `libs/shared-notification/`."

Tiempo estimado: 1 día de implementación + tests.

---

## Diagnóstico rápido

```bash
# ¿Cuántos runs de cada agente en últimas 24h?
for svc in ops-agent financial-agent content-agent marketing-agent going-agent; do
  count=$(gcloud logging read "resource.type=\"cloud_run_revision\"
    resource.labels.service_name=\"$svc\"
    textPayload:\"Run completed\"" \
    --project=going-5d1ae --freshness=24h --format='value(timestamp)' 2>/dev/null \
    | wc -l)
  echo "$svc: $count runs"
done
```

Si un agente tiene 0 runs cuando debería tener 24+, hay un problema más
grave que Telegram. Revisar Cloud Run job status:

```bash
gcloud run jobs executions list --job=ops-agent \
  --region=us-central1 --project=going-5d1ae --limit=5
```

Si hay execution con status FAILED reciente, ahí está el problema real.
