# Voice Call Service (Uyari) — Smoke Test Runbook

> **Servicio:** voice-call-service (kichwa "uyari" = escuchar/oír)
> **URL prod:** https://voice-call-service-lw44cnhdeq-uc.a.run.app
> **Número EC:** +593 2 401 8841 (activo post-ARCOTEL approval)
> **Owner:** Going Ecuador / Thorn AI Technologies
> **Cuándo usar:** primera llamada real post-aprobación regulatoria, o cualquier
> deploy que toque `realtime-bridge`, `twilio-media-stream.gateway`, o webhook.

---

## 1. Pre-flight — checklist antes de la primera llamada

Ejecutar **en orden** desde la máquina del operador (PowerShell o bash):

### 1.1. Bundle regulatorio aprobado
- Twilio Console → Regulatory Compliance → Bundles → el bundle `THORN AI - Going Voice EC Local` debe estar en estado **`twilio-approved`** Y el número +593 2 401 8841 debe aparecer asociado.
- Si está `pending-review` o `twilio-rejected`, **NO continuar**.

### 1.2. Número activo y webhook cableado
- Console → Phone Numbers → Active Numbers → +593 2 401 8841 → click → tab **Voice Configuration**:
  - **A call comes in**: Webhook
  - **URL**: `https://voice-call-service-lw44cnhdeq-uc.a.run.app/twilio/voice-webhook`
  - **HTTP**: POST
  - **Primary handler fails**: (vacío por ahora — agregar fallback URL en v2)
- Click **Save configuration**.

### 1.3. Cloud Run hot
```bash
curl -i https://voice-call-service-lw44cnhdeq-uc.a.run.app/health
# Esperado: HTTP/2 200, body con { status: "ok" }
```
Si 503 o cold start > 5s, el `min-instances=1` no está aplicado. Verificar:
```bash
gcloud run services describe voice-call-service --region us-central1 \
  --format='value(spec.template.metadata.annotations["autoscaling.knative.dev/minScale"])'
# Esperado: 1
```

### 1.4. Env vars correctas en revision activa
```bash
gcloud run services describe voice-call-service --region us-central1 \
  --format='value(spec.template.spec.containers[0].env)' | tr ';' '\n'
```
Verificar que **existen y NO son placeholder**:
- `TWILIO_VOICE_NUMBER=+59324018841` (el real, no el de prueba)
- `TWILIO_WEBHOOK_PUBLIC_URL=https://voice-call-service-lw44cnhdeq-uc.a.run.app`
- `VOICE_CALL_PUBLIC_BASE_URL=https://voice-call-service-lw44cnhdeq-uc.a.run.app`
- `VOICE_REALTIME_DEFAULT_VOICE=shimmer`
- `VOICE_REALTIME_DEFAULT_LANG=es`
- `HANDOFF_OPERATOR_PHONE=+59398923988` (Claro de Going — si vacío, handoff cae a modo callback)
- `CEREBRO_PUBLISH_ENABLED=false` (lo activamos cuando Pacha esté consumiendo)

Secrets (mostrarán solo nombre, no valor — eso es correcto):
- `TWILIO_ACCOUNT_SID` → secret `TWILIO_ACCOUNT_SID:latest`
- `TWILIO_AUTH_TOKEN` → secret `TWILIO_AUTH_TOKEN:latest`
- `OPENAI_API_KEY` → secret `OPENAI_API_KEY:latest`
- `TELEGRAM_BOT_TOKEN` → secret `TELEGRAM_BOT_TOKEN:latest`
- `OPERATOR_TELEGRAM_CHAT_IDS` → secret `OPERATOR_TELEGRAM_CHAT_IDS:latest`

### 1.5. Pre-smoke sin teléfono (validar webhook + HMAC)
Ver script `scripts/voice-smoke-curl.js` (sección 5 más abajo). Ejecutarlo y confirmar:
- Status `200 OK`
- Content-Type `text/xml` o `application/xml`
- Body es TwiML válido con `<Connect><Stream url="wss://.../twilio/media-stream">`

### 1.6. Telegram alert pipeline
- Mandar mensaje de test al bot:
  ```bash
  curl -X POST https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/sendMessage \
    -d chat_id=$OPERATOR_TELEGRAM_CHAT_ID \
    -d text='[smoke-prep] verificando canal alertas voice-call'
  ```
- El mensaje debe llegar al chat del operador en < 3s.

### 1.7. Operador disponible
- Confirmar que la persona designada como "operador de fallback" (el que recibe handoff) tiene:
  - Telegram abierto en el chat configurado
  - Teléfono al alcance (+593 98 923 9988 = Claro de Going)
  - 15 min libres para atender la llamada de prueba

### 1.8. Tail de logs abierto en otra ventana
```bash
gcloud run services logs tail voice-call-service --region us-central1
```
Deja esto corriendo. Vas a necesitar verlo en tiempo real durante la llamada.

---

## 2. Scenario A — Conversación básica (greeting + Q&A simple)

**Objetivo:** validar el path feliz end-to-end (Twilio → WS → OpenAI Realtime → WS → Twilio → audio).

### Pasos
1. Desde **+593 98 403 7949** (WhatsApp/Telegram oficial de Going — o cualquier móvil EC) marcá a **+593 2 401 8841**.
2. Cronometrá con el reloj del celular:
   - **t0** = momento que apretás "Llamar"
   - **t1** = momento que escuchás el primer audio del bot
   - **t2** = momento que terminás de hablar tu primer prompt
   - **t3** = momento que el bot empieza a responder

3. Prompts a usar (en este orden):
   - "Hola"  → debería responder con greeting de Going
   - "Quiero saber cuánto cuesta un viaje del aeropuerto al centro de Quito"  → debería usar tool `get_quote_phone` y dar precio
   - "¿Y si vamos cuatro personas?"  → debería seguir el contexto

4. Colgá la llamada después del 3er turno (no hagas handoff en este scenario).

### Métricas a registrar
| Métrica | Target | Cómo medir |
|---|---|---|
| t1 − t0 (connect → first audio) | < 3.0s | cronómetro |
| t3 − t2 (silencio → respuesta) | < 1.5s | cronómetro |
| Calidad audio | sin clipping, sin robotización | oído |
| Idioma | español Ecuador | oído |
| Voz | "shimmer" (femenina, neutra) | oído |
| Coherencia | responde lo preguntado | oído |

### Logs esperados (en el tail de Cloud Run)
Buscar en este orden — prefijos reales del código:
1. `[twilio] incoming call CallSid=CA... from=+593... to=+59324018841`  ← webhook recibido
2. `[call-initiated] callId=... from=+593... runId=...`  ← VoiceCallService creó el registro
3. `[twilio-stream]` lines  ← gateway WS levantó la stream
4. `[bridge] session ready callId=... streamSid=...`  ← OpenAI Realtime conectado
5. `[realtime] WS abierto → gpt-4o-realtime-...`  ← adapter OpenAI confirmó
6. `[bridge] user said: "..."`  ← STT del usuario (debug level)
7. `[bridge] assistant said: "..."`  ← TTS del asistente (debug level)
8. `[twilio] status callback CallSid=... status=completed duration=Xs`  ← post-hangup
9. `[realtime] WS cerrado code=1000 clean=true`  ← sesión Realtime liberada

Para ver los `debug` (user said / assistant said) necesitás `LOG_LEVEL=debug` o equivalente
en Cloud Run. Por default solo se ven `log/warn/error`.

---

## 3. Scenario B — Handoff a operador humano

**Objetivo:** validar el path de transfer PSTN (la promesa de Twilio Calls.update funcionando).

### Pasos
1. Hacer nueva llamada a **+593 2 401 8841**.
2. Después del greeting, decir literalmente:
   - "**Necesito hablar con una persona, por favor**"
3. El bot debería:
   a. Reconocer la intención (tool `request_handoff_phone`)
   b. Decir una frase tipo "Te paso con un operador, un momento por favor"
   c. **Telegram alert al operador** debe llegar en < 5s con: CallSid, From, motivo, hora
4. Twilio recibe `Calls(CallSid).update({ url: ".../twilio/handoff-twiml", method: 'GET' })`
5. La WS se cierra del lado Twilio
6. El nuevo TwiML ejecuta `<Dial>+59398923988</Dial>` (Claro de Going)
7. El operador atiende su celular y queda conectado **con el llamante original**, sin que el llamante cuelgue.

### Métricas
| Métrica | Target |
|---|---|
| "necesito hablar con persona" → Telegram alert | < 5s |
| Telegram alert → ringtone en celular operador | < 8s |
| Operador descuelga → audio bidireccional | < 2s |
| Llamante no perdió la conexión (no "tono ocupado" intermedio) | sí |

### Failure modes
- **Operador no recibe Telegram**: revisar `OPERATOR_TELEGRAM_CHAT_IDS`. Probar manual con curl (paso 1.6).
- **Telegram OK pero celular no suena**: el `HANDOFF_OPERATOR_PHONE` env var no es +593 98 923 9988 o no está en formato E.164. Verificar:
  ```bash
  gcloud run services describe voice-call-service --region us-central1 \
    --format='value(spec.template.spec.containers[0].env)' | grep HANDOFF_OPERATOR_PHONE
  ```
  Si está vacío → handoff cae a **modo callback** (TwiML dice "te llamamos en breve" + cuelga), no es bug, es comportamiento intencional cuando no hay operador on-call configurado.
- **Celular suena pero el llamante escucha "Application Error"**: el endpoint `/twilio/handoff-twiml/:callId` está roto o devuelve XML inválido. Test con un callId real del log:
  ```bash
  # Tomar CallSid de un log reciente y pegarlo en la URL
  curl -i 'https://voice-call-service-lw44cnhdeq-uc.a.run.app/twilio/handoff-twiml/CAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
  # Esperado: 200, Content-Type text/xml, body con <Response><Dial>+59398923988</Dial></Response>
  # Si HANDOFF_OPERATOR_PHONE vacío → body con <Say>...te llamamos...</Say><Hangup/>
  ```

---

## 4. Scenario C — Anti-spoof (negativo, debe fallar)

**Objetivo:** verificar que el endpoint rechaza requests sin signature válido.

```bash
# Request SIN X-Twilio-Signature header
curl -i -X POST https://voice-call-service-lw44cnhdeq-uc.a.run.app/twilio/voice-webhook \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -d 'CallSid=CAfake&From=%2B593999999999&To=%2B59324018841&CallStatus=ringing'

# Esperado: 403 Forbidden, body { error: "invalid_signature" }
```

```bash
# Request con signature CALCULADO CON TOKEN INCORRECTO
curl -i -X POST https://voice-call-service-lw44cnhdeq-uc.a.run.app/twilio/voice-webhook \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -H 'X-Twilio-Signature: ZmFrZXNpZ25hdHVyZQ==' \
  -d 'CallSid=CAfake&From=%2B593999999999&To=%2B59324018841&CallStatus=ringing'

# Esperado: 403 Forbidden
```

Si CUALQUIERA de los dos devuelve 200, el anti-spoof está roto → **stop everything, no exponer el número hasta arreglar.**

---

## 5. Pre-smoke con curl (script reusable)

Crear `scripts/voice-smoke-curl.js` (no committeado, usa secrets locales):

```javascript
// Uso:
//   $env:TWILIO_AUTH_TOKEN="..."  (PowerShell)
//   $env:TWILIO_ACCOUNT_SID="AC..."
//   node scripts/voice-smoke-curl.js
//
// Genera un curl válido con HMAC-SHA1 X-Twilio-Signature para testear
// el webhook /twilio/voice-webhook sin gastar minutos reales en Twilio.

const crypto = require('crypto');

const authToken = process.env.TWILIO_AUTH_TOKEN;
const accountSid = process.env.TWILIO_ACCOUNT_SID;
if (!authToken || !accountSid) {
  console.error('Falta TWILIO_AUTH_TOKEN o TWILIO_ACCOUNT_SID en env');
  process.exit(1);
}

const url = 'https://voice-call-service-lw44cnhdeq-uc.a.run.app/twilio/voice-webhook';
const params = {
  CallSid: 'CA' + 'a'.repeat(32),
  AccountSid: accountSid,
  From: '+593984037949',  // Going oficial — simula llamada entrante
  To: '+59324018841',
  CallStatus: 'ringing',
  Direction: 'inbound',
  ApiVersion: '2010-04-01',
};

// Twilio signature: HMAC-SHA1(url + sortedKeys.map(k => k + params[k]).join(''))
const sortedKeys = Object.keys(params).sort();
const data = url + sortedKeys.map(k => k + params[k]).join('');
const signature = crypto.createHmac('sha1', authToken).update(data).digest('base64');
const formBody = Object.entries(params)
  .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
  .join('&');

console.log(`# Esperado: 200, Content-Type text/xml, body con <Connect><Stream>`);
console.log();
console.log(`curl -i -X POST '${url}' \\`);
console.log(`  -H 'Content-Type: application/x-www-form-urlencoded' \\`);
console.log(`  -H 'X-Twilio-Signature: ${signature}' \\`);
console.log(`  -d '${formBody}'`);
```

Ejecutar:
```powershell
$env:TWILIO_AUTH_TOKEN = (gcloud secrets versions access latest --secret=TWILIO_AUTH_TOKEN --project=going-5d1ae)
$env:TWILIO_ACCOUNT_SID = (gcloud secrets versions access latest --secret=TWILIO_ACCOUNT_SID --project=going-5d1ae)
node scripts/voice-smoke-curl.js | Invoke-Expression
```

---

## 6. Failure modes — diagnóstico rápido

| Síntoma del llamante | Causa probable | Verificación |
|---|---|---|
| "Application Error" voz robótica | Webhook devuelve 5xx o XML inválido | `curl /twilio/voice-webhook` con HMAC válido |
| Silencio absoluto después de connect | WS upgrade falla o NestJS WS adapter no levantó | logs: buscar `WS upgrade` ausente |
| Tono ocupado al marcar | Número no comprado, bundle no asociado, o webhook no configurado | Console → Phone Numbers → verificar |
| Audio choppy / cortado | Frame ordering bug o backpressure WS | logs: `seq=N` saltado o `WS buffer full` |
| Bot habla en inglés | `VOICE_REALTIME_DEFAULT_LANG` no es `es` o el system prompt está cacheado mal | env vars + revision activa |
| Voz masculina (no shimmer) | `VOICE_REALTIME_DEFAULT_VOICE` no es `shimmer` | env vars |
| Latencia > 5s en respuesta | Cold start (min-instances=0) o OpenAI Realtime queue | `min-instances=1` + status.openai.com |
| Handoff dispara pero llamante se queda en silencio | `Calls.update` falla — token de Twilio rotado o permisos | logs: `[twilio-rest] redirectCall fallo` |
| Handoff sin operador (modo callback) cuando esperábamos PSTN | `HANDOFF_OPERATOR_PHONE` vacío en revision | `gcloud run services describe ... grep HANDOFF_OPERATOR_PHONE` |
| Anti-spoof rechaza requests reales de Twilio | `TWILIO_AUTH_TOKEN` desincronizado entre Twilio y Secret Manager | rotar token con playbook |

---

## 7. Evidence capture (post-call)

Para cada llamada de smoke, archivar en `~/voice-smokes/YYYY-MM-DD/CALLSID/`:

1. **Cloud Run logs** del rango de la llamada:
   ```bash
   gcloud logging read 'resource.type="cloud_run_revision"
     AND resource.labels.service_name="voice-call-service"
     AND timestamp >= "2026-XX-XXTHH:MM:00Z"
     AND timestamp <= "2026-XX-XXTHH:MM:00Z"' \
     --project=going-5d1ae --format=json > logs.json
   ```

2. **Twilio call details**:
   - Console → Monitor → Logs → Calls → click en el CallSid → Save HTML page
   - Anotar: duration, price, status, error code (si hubo)

3. **Screenshot del Telegram alert** (si fue scenario B)

4. **Audio recording** (opcional, requiere habilitar grabación en Twilio TwiML):
   - **Privacy**: si grabamos, hay que avisar al llamante con `<Say>Esta llamada puede ser grabada...</Say>` antes del `<Connect>`. Decisión de producto: por ahora **NO grabar** hasta tener política aprobada.

5. **Métricas medidas** (t1-t0, t3-t2, etc.) en `metrics.csv`:
   ```csv
   call_sid,scenario,connect_ms,first_response_ms,total_duration_s,handoff_triggered,handoff_success,notes
   CAabc...,A,1850,1200,42,false,n/a,greeting OK
   CAdef...,B,1900,1400,68,true,true,handoff a operador en 4.2s
   ```

---

## 8. Rollback

Si CUALQUIER scenario falla de forma que el llamante recibe error o experiencia degradada:

### Rollback inmediato (1 minuto)
Console → Phone Numbers → +593 2 401 8841 → Voice Configuration:
- Cambiar **Webhook URL** a vacío
- O reemplazar con TwiML stub: `https://twimlets.com/message?Message%5B0%5D=Estamos%20en%20mantenimiento.%20Por%20favor%20escr%C3%ADbenos%20por%20WhatsApp%20al%20%2B593%2098%20403%207949.&`
- Save

Esto hace que toda llamada entrante reciba un mensaje cordial y NO entre al servicio roto.

### Rollback de revision (5 minutos)
Si el bug está en código:
```bash
gcloud run services update-traffic voice-call-service \
  --region us-central1 \
  --to-revisions=voice-call-service-00002-xyz=100
# Donde -00002 sea la revision previa estable
```

### Notificación
- Telegram al operador: "Servicio Uyari rolled back, llamadas a webhook stub. ETA fix: X horas."
- Si el número está siendo promocionado en website/marketing, postear update en banner.

---

## 9. Cost expectations

| Componente | Costo/min | 5-min call | 100 calls/mes |
|---|---|---|---|
| Twilio EC local incoming | ~$0.013 | $0.07 | $7 |
| Twilio fee fijo número | $34/mes | – | $34 |
| OpenAI Realtime API (audio in + out) | ~$0.15 | $0.75 | $75 |
| OpenAI tool calls (function calling) | ~$0.01 | $0.05 | $5 |
| Cloud Run compute (min-instances=1) | ~$15/mes | – | $15 |
| **Total por llamada de 5 min** | | **~$0.82** | |
| **Total mensual (100 llamadas)** | | | **~$136** |

**Volumen para alarma:**
- Si en 24h > 50 llamadas: revisar logs por bot/spam (alguien descubrió el número).
- Si en 1h > 10 llamadas del mismo `From`: trigger rate-limit (TODO en backlog).

---

## 10. Post-smoke checklist (después de validar)

- [ ] Llenar `metrics.csv` con números reales medidos
- [ ] Si scenario B funcionó: actualizar landing page con "atención telefónica 24/7"
- [ ] Si latencias OK: documentar baseline en `docs/architecture/voice-latency-baseline.md`
- [ ] **Rotar `TWILIO_AUTH_TOKEN`** (estuvo en chat durante setup) — ver `docs/runbooks/rotate-twilio-token.md`
- [ ] Activar `CEREBRO_PUBLISH_ENABLED=true` cuando Pacha esté consumiendo eventos de voz
- [ ] Crear alerta Cloud Monitoring: latencia p95 webhook > 2s OR error rate > 5% en 5 min
- [ ] Programar smoke recurrente: cada lunes 9am EC, llamada automática vía Twilio test API

---

## Anexo A — URLs y SIDs útiles

| Recurso | Valor |
|---|---|
| Cloud Run service | `voice-call-service` |
| Cloud Run URL | https://voice-call-service-lw44cnhdeq-uc.a.run.app |
| Webhook voice | `/twilio/voice-webhook` |
| Media Stream WS | `/twilio/media-stream` |
| Handoff TwiML | `/twilio/handoff-twiml` |
| Health | `/health` |
| Twilio Console | https://console.twilio.com |
| Bundle Console | https://console.twilio.com/us1/develop/phone-numbers/regulatory-compliance/bundles |
| Logs URL | https://console.cloud.google.com/run/detail/us-central1/voice-call-service/logs?project=going-5d1ae |
| GCP project | `going-5d1ae` |
| Region | `us-central1` |
| Bundle friendly name | `THORN AI - Going Voice EC Local Quito +59324018841` (renombrar en Console si quedó con timestamp) |

## Anexo B — Contactos durante smoke

| Rol | Nombre | Contacto |
|---|---|---|
| Operador handoff | (por designar) | Telegram chat + celular Going +593 98 923 9988 |
| Owner técnico | Rubén | Going WhatsApp +593 98 403 7949 |
| Going Ops inbox | – | goingappecuador@gmail.com |
| DPO / Compliance | – | privacidad@goingec.com |
| Twilio Support | – | https://www.twilio.com/console/support/tickets |
