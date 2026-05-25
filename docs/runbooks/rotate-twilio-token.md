# Runbook — Rotar TWILIO_AUTH_TOKEN

**Cuándo usar**:
- **Rotación programada** (cada 90 días, calendar reminder)
- **Post-smoke inicial** de voice-call-service (el token estuvo en chat durante setup → debe rotarse apenas se valide el flujo end-to-end)
- **Sospecha de leak** (commit accidental a git público, screenshot compartido, ex-empleado con acceso)
- **Cambio de proveedor de hosting** (si migramos Cloud Run a otra cosa)

**Tiempo total**:
- Rotación normal: **8–12 min** (planeada, sin downtime)
- Rotación de emergencia: **3–5 min** (acepta segundos de downtime de webhook)

**Pre-requisitos**:
- Acceso a Twilio Console como **Owner** o **Admin** de la cuenta `AC...` (subaccounts no sirven — el Auth Token es de la cuenta principal)
- Acceso a `gcloud` con proyecto `going-5d1ae` y permisos:
  - `roles/secretmanager.admin` (para `secrets versions add`)
  - `roles/run.admin` (para `run services update`)
- `scripts/voice-smoke-curl.js` funcional en tu máquina (para verificar post-rotate)
- Twilio Console abierto en la pestaña: **Account → API keys & tokens**

---

## Pasos (rotación normal, sin downtime)

### 1. Snapshot del estado actual (1 min)

Para poder hacer rollback si algo sale mal:

```bash
# Anotar revision activa del voice-call-service
gcloud run services describe voice-call-service --region us-central1 \
  --format='value(status.latestReadyRevisionName)' \
  --project=going-5d1ae
# Ejemplo output: voice-call-service-00003-n8p
# GUARDÁ ESTE VALOR — es tu punto de rollback
```

```bash
# Anotar version actual del secret TWILIO_AUTH_TOKEN
gcloud secrets versions list TWILIO_AUTH_TOKEN \
  --project=going-5d1ae --limit=3
# La que diga STATE=ENABLED es la que está siendo usada.
# Anotar el número (ej: 4)
```

```bash
# Verificar que el webhook responde OK con el token actual (smoke baseline)
$env:TWILIO_AUTH_TOKEN = (gcloud secrets versions access latest --secret=TWILIO_AUTH_TOKEN --project=going-5d1ae)
$env:TWILIO_ACCOUNT_SID = (gcloud secrets versions access latest --secret=TWILIO_ACCOUNT_SID --project=going-5d1ae)
node scripts/voice-smoke-curl.js
# Esperado: ✅ PASS — webhook respondió TwiML con <Connect><Stream>
# Si falla acá, NO sigas con la rotación — primero arreglá lo que está roto.
```

### 2. Generar token nuevo en Twilio Console (2 min)

Twilio permite **2 Auth Tokens activos simultáneamente** (primary + secondary), justamente para rotaciones sin downtime. Esa es la ventana que vamos a usar.

1. Abrí https://console.twilio.com → Account → **API keys & tokens**
2. En la sección **Auth Tokens**, click en **+ Create secondary Auth Token**
3. Confirmá. Twilio genera un token nuevo y lo muestra **una sola vez**.
4. **Copialo inmediatamente** al portapapeles (no lo cierres hasta haber completado el paso 3)
5. Ahora hay 2 tokens activos:
   - **Primary** = el viejo (actualmente en uso por Cloud Run)
   - **Secondary** = el nuevo (vamos a usarlo en breve)

⚠️ **Importante**: durante esta ventana Twilio firma webhooks con el primary, pero ACEPTA ambos cuando vos firmás requests salientes (REST API). Pero la firma del webhook entrante es siempre con el primary. Por eso el flujo es: subir secondary a Secret Manager → promover secondary a primary → redeploy → desactivar viejo.

### 3. Subir token nuevo a Secret Manager (1 min)

```powershell
# PowerShell
$NEW_TOKEN = "PEGA_EL_TOKEN_NUEVO_AQUI"
$NEW_TOKEN | Out-File -NoNewline -Encoding ascii temp_token.txt
gcloud secrets versions add TWILIO_AUTH_TOKEN `
  --data-file=temp_token.txt `
  --project=going-5d1ae
Remove-Item temp_token.txt
```

```bash
# bash (alternativa, si trabajás en CloudShell)
NEW_TOKEN="PEGA_EL_TOKEN_NUEVO_AQUI"
echo -n "$NEW_TOKEN" | gcloud secrets versions add TWILIO_AUTH_TOKEN \
  --data-file=- \
  --project=going-5d1ae
unset NEW_TOKEN
```

Verificar que la nueva versión se creó:
```bash
gcloud secrets versions list TWILIO_AUTH_TOKEN --project=going-5d1ae --limit=3
# La nueva version debe aparecer con STATE=ENABLED y número incrementado
# (ej: si antes estaba en 4, ahora hay version 5 ENABLED + version 4 ENABLED)
```

### 4. Promover el token nuevo a Primary en Twilio (1 min)

Hasta este punto, Cloud Run sigue usando el token viejo (el primary). Para que el webhook firme con el nuevo, hay que **promoverlo**:

1. Volvé a Twilio Console → **API keys & tokens**
2. En la sección **Auth Tokens**, encontrá el secondary token recién creado
3. Click **Promote to primary**
4. Confirmá la advertencia ("This will invalidate requests signed with the previous primary in flight...")
5. Ahora:
   - **Primary** = el token nuevo (Twilio firma webhooks con este)
   - **Secondary** = el viejo (aún acepta requests REST salientes, pero NO firma webhooks)

🕐 **Ventana crítica abierta**: durante los próximos ~2-5 min, Twilio va a firmar webhooks con el NUEVO token, pero Cloud Run sigue validando con el VIEJO (cacheado en la revision activa). Los webhooks van a fallar con 403.

→ **Por eso el paso siguiente debe hacerse INMEDIATAMENTE**, sin pausas.

### 5. Forzar redeploy de voice-call-service para que tome la nueva versión del secret (2 min)

Cloud Run cachea la versión del secret en la revision. Cambiar el secret NO se aplica automáticamente — hay que crear una revision nueva:

```bash
# Forzar nueva revision sin cambiar imagen ni env vars
gcloud run services update voice-call-service \
  --region us-central1 \
  --project=going-5d1ae \
  --update-secrets="TWILIO_AUTH_TOKEN=TWILIO_AUTH_TOKEN:latest"
```

Esto:
- Crea revision `voice-call-service-0000N` con `TWILIO_AUTH_TOKEN:latest` re-resuelto
- Cloud Run hace rolling deploy (gradual traffic shift)
- Las requests en flight con el container viejo terminan, las nuevas van al container nuevo

Tiempo de deploy: ~60–90 segundos (porque min-instances=1, no hay cold start del primer container).

Esperar a que termine:
```bash
gcloud run services describe voice-call-service --region us-central1 \
  --project=going-5d1ae \
  --format='value(status.conditions[?(@.type=="Ready")].status)'
# Esperado: True
```

### 6. Verificar post-rotate con script pre-smoke (1 min)

```powershell
# Recargar el env con el token NUEVO de Secret Manager
$env:TWILIO_AUTH_TOKEN = (gcloud secrets versions access latest --secret=TWILIO_AUTH_TOKEN --project=going-5d1ae)
$env:TWILIO_ACCOUNT_SID = (gcloud secrets versions access latest --secret=TWILIO_ACCOUNT_SID --project=going-5d1ae)
node scripts/voice-smoke-curl.js
```

**Resultado esperado**:
```
✅ PASS — webhook respondió TwiML con <Connect><Stream>
```

Si **PASS** → la rotación funcionó. Seguir al paso 7.

Si **❌ FAIL 403** → el redeploy no tomó la nueva versión del secret. Verificar:
```bash
gcloud run revisions describe $(gcloud run services describe voice-call-service \
  --region us-central1 --project=going-5d1ae \
  --format='value(status.latestReadyRevisionName)') \
  --region us-central1 --project=going-5d1ae \
  --format='value(spec.containers[0].env[?(@.name=="TWILIO_AUTH_TOKEN")].valueFrom.secretKeyRef)'
# Debe mostrar: version=latest, key=TWILIO_AUTH_TOKEN
```

Si version=latest pero igual falla → el redeploy realmente no creó revision nueva. Reejecutar paso 5.

### 7. Desactivar el token viejo en Twilio (1 min)

Solo cuando la verificación pasó:

1. Twilio Console → **API keys & tokens** → sección **Auth Tokens**
2. El token viejo está marcado como **Secondary**
3. Click **Delete secondary Auth Token**
4. Confirmar

Resultado: solo queda el primary (= el nuevo). Cualquier código/servicio que aún use el token viejo va a fallar a partir de ahora.

### 8. Desactivar la version vieja del secret en Secret Manager (1 min)

Para auditoría limpia (cualquier rollback ahora requiere acción consciente):

```bash
# Anotar las versions ENABLED actuales
gcloud secrets versions list TWILIO_AUTH_TOKEN --project=going-5d1ae --limit=5
```

```bash
# Disable las anteriores a la actual (ej. si la actual es 5, disable 4, 3, 2, 1)
gcloud secrets versions disable 4 --secret=TWILIO_AUTH_TOKEN --project=going-5d1ae
gcloud secrets versions disable 3 --secret=TWILIO_AUTH_TOKEN --project=going-5d1ae
# etc — solo las que estaban ENABLED
```

⚠️ **NO uses `destroy`** en lugar de `disable` — destroy es irreversible y perdés la traza histórica. Disable es reversible y queda en el audit log.

### 9. Documentar (1 min)

Agregar entrada al CHANGELOG interno o tabla de rotaciones (`docs/runbooks/_rotations.md`):

```markdown
| Fecha | Secret | Razón | Operador | Revision destino |
|-------|--------|-------|----------|------------------|
| 2026-05-25 | TWILIO_AUTH_TOKEN | post-smoke inicial (token estuvo en chat) | Rubén | voice-call-service-00004-xyz |
```

Si la rotación fue por **leak**, agregar al final del runbook de incidente.

---

## Verificación final (post-rotación)

Después de 10 minutos de operación con el token nuevo, validar que NO hay errores HMAC en logs:

```bash
gcloud logging read 'resource.type="cloud_run_revision"
  AND resource.labels.service_name="voice-call-service"
  AND textPayload =~ "signature"
  AND timestamp >= "2026-XX-XXTHH:MM:00Z"' \
  --project=going-5d1ae --limit=20 --format=json
# Esperado: 0 resultados (o solo los warnings de webhook sin firma legítimos)
```

Si aparecen errores `[twilio] webhook payload inválido` o `[twilio] signature mismatch`:
- Causa probable: algún servicio externo que cacheaba el token viejo
- Acción: identificar qué cliente está mandando requests con firma vieja, actualizar su config

---

## Rollback (si algo sale mal entre pasos 5 y 7)

Solo aplicable si **NO desactivaste todavía el token viejo en Twilio** (paso 7). Si ya lo eliminaste, ya no hay rollback — tenés que generar otro token y volver a empezar.

### Rollback rápido (2 min)

```bash
# 1. Reversar la promoción en Twilio Console
#    API keys & tokens → click en el token actual (nuevo) → "Demote to secondary"
#    El token viejo vuelve a ser primary y Twilio vuelve a firmar con ese.

# 2. Forzar Cloud Run a usar la version VIEJA del secret
gcloud run services update voice-call-service \
  --region us-central1 \
  --project=going-5d1ae \
  --update-secrets="TWILIO_AUTH_TOKEN=TWILIO_AUTH_TOKEN:N"
# Reemplazar N con el número de la version vieja (la que anotaste en paso 1)

# 3. Verificar
node scripts/voice-smoke-curl.js
# Debe pasar OK con el token viejo
```

Una vez estable, investigar por qué falló la rotación antes de reintentar.

---

## Variante — Rotación de EMERGENCIA (token leaked públicamente)

**Cuándo**: el token actual fue committeado a git público, posteado en chat público, screenshot filtrado, etc.

**Aceptamos 2-3 minutos de downtime del webhook** porque la prioridad es **invalidar el token comprometido YA**.

```bash
# 1. (Twilio Console) Generar token nuevo Y promoverlo a primary INMEDIATAMENTE
#    → el token viejo se mueve a secondary

# 2. (Twilio Console) Eliminar el secondary (= el comprometido) sin esperar
#    → desde este momento, cualquier webhook entrante a Cloud Run FALLA con 403
#    porque Cloud Run sigue validando con el viejo. ESPERADO.

# 3. Subir nuevo a Secret Manager
$NEW_TOKEN = "..." # pegado del paso 1
$NEW_TOKEN | Out-File -NoNewline -Encoding ascii temp_token.txt
gcloud secrets versions add TWILIO_AUTH_TOKEN --data-file=temp_token.txt --project=going-5d1ae
Remove-Item temp_token.txt

# 4. Forzar redeploy
gcloud run services update voice-call-service \
  --region us-central1 \
  --project=going-5d1ae \
  --update-secrets="TWILIO_AUTH_TOKEN=TWILIO_AUTH_TOKEN:latest"

# 5. Verificar
node scripts/voice-smoke-curl.js
```

**Ventana de exposición**: el atacante tuvo acceso al token entre el momento del leak y el paso 2 (= aprox. cuánto tardaste en ejecutar). Auditar en Twilio Console → Monitor → Logs → Calls/Messages/API requests si hubo actividad anormal en esa ventana.

**Post-mortem obligatorio** (≤ 24h): documento describiendo cómo se filtró el token, qué controles fallaron, qué se implementa para que no se repita. Adjuntar al runbook de incidente correspondiente.

---

## Anexo — Otros secrets que conviene rotar junto con TWILIO_AUTH_TOKEN

Si la rotación se hace por leak/sospecha, asumir compromiso de **todos** los secrets que pasaron por el mismo canal (chat, repo, etc.):

| Secret | Cómo rotar |
|--------|-----------|
| `TWILIO_AUTH_TOKEN` | este runbook |
| `OPENAI_API_KEY` | OpenAI dashboard → API keys → revoke + create new → `gcloud secrets versions add OPENAI_API_KEY` + redeploy |
| `TELEGRAM_BOT_TOKEN` | BotFather → `/revoke` + `/newtoken` → re-subir a Secret Manager + redeploy del voice-call-service Y customer-support-service |
| `JWT_SECRET-prod` | generar 64 bytes random → `gcloud secrets versions add` → redeploy de **TODOS** los servicios que validan JWT. **Invalida sesiones activas** — usuarios deberán re-login |
| `MONGO_URL-prod` | Atlas → Database Access → cambiar password del user → re-subir → redeploy |

Para JWT_SECRET en particular hay un sub-runbook propio: `docs/runbooks/rotate-jwt-secret.md` (TODO — escribirlo cuando sea relevante).
