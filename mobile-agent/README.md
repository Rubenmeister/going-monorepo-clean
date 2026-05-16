# mobile-agent

Cloud Run Job que monitorea las dos apps móviles de Going (mobile-user-app +
mobile-driver-app) leyendo la API de Sentry. Publica al cerebro-service como
cualquier otro agente del ecosistema.

## Qué hace

Cada 6h:

1. Lee top issues no resueltos de cada app desde Sentry (`/issues/?query=is:unresolved`)
2. Lee event counts horarios para detectar spikes (`/stats/?stat=received`)
3. Lee releases recientes para detectar regresiones por versión

Genera anomalías:

| Type                       | Severity      | Cuándo                                                |
|----------------------------|---------------|-------------------------------------------------------|
| `mobile_event_spike`       | warning/critical | última hora > 2× promedio (critical si > 5×)       |
| `mobile_fatal_crash`       | critical      | issue level=fatal — siempre flaggeada                 |
| `mobile_release_regression`| warning/critical | release con ≥3 issues nuevos                       |
| `config_missing`           | info          | `SENTRY_AUTH_TOKEN` no seteado (modo idle)            |
| `app_not_configured`       | info          | `SENTRY_USER_PROJECT` o `SENTRY_DRIVER_PROJECT` falta |

Y proposed actions:

| Type                    | Urgency        | Cuándo                                       |
|-------------------------|----------------|----------------------------------------------|
| `investigate_top_error` | 0.4–0.9        | issue con ≥10 users afectados                |
| `pin_release_rollback`  | 0.75           | release con ≥5 issues nuevos                 |

## Setup (one-time)

### 1. Crear cuenta + proyectos en Sentry

1. Ir a [sentry.io](https://sentry.io) → crear org `going-app` (gratis hasta 10k events/mes)
2. Crear 2 proyectos:
   - `mobile-user-app` (platform: React Native)
   - `mobile-driver-app` (platform: React Native)
3. Anotar el DSN de cada proyecto (los necesitan las apps para enviar errores)

### 2. Crear auth token para el agent

Settings → Account → API → Auth Tokens → Create New Token
- Scopes: `project:read` + `event:read`
- Anotar el token (lo necesita Cloud Run Jobs)

### 3. Configurar mobile-agent en GCP

```bash
# Setear secret + env vars (después del primer deploy)
gcloud secrets create SENTRY_AUTH_TOKEN --project=going-5d1ae
echo -n "<TOKEN>" | gcloud secrets versions add SENTRY_AUTH_TOKEN --data-file=-

gcloud run jobs update mobile-agent \
  --region=us-central1 \
  --project=going-5d1ae \
  --update-env-vars="SENTRY_ORG=going-app,SENTRY_USER_PROJECT=mobile-user-app,SENTRY_DRIVER_PROJECT=mobile-driver-app" \
  --update-secrets="SENTRY_AUTH_TOKEN=SENTRY_AUTH_TOKEN:latest"
```

### 4. Wirear el SDK en cada app móvil

En `mobile-user-app/` y `mobile-driver-app/` (tareas separadas, una por app):

```bash
# Dentro del directorio de cada app
npx expo install @sentry/react-native
npx sentry-wizard -i reactNative   # configura native code automáticamente
```

Luego abrir `src/services/sentry.ts` (creado pre-cocido en este branch),
descomentar el bloque, e importar desde `App.tsx`:

```typescript
// App.tsx — primera línea
import './src/services/sentry';
```

Setear el DSN como secret EAS:
```bash
eas secret:create --scope project --name EXPO_PUBLIC_SENTRY_DSN --value "<DSN>"
```

### 5. Validar end-to-end

Forzar un crash en testing:
```typescript
// en cualquier screen, temporal
import Sentry from '../services/sentry';
Sentry.captureMessage('Smoke test desde dev build');
```

Despues:
1. Ver el evento en Sentry dashboard
2. Esperar al próximo ciclo del mobile-agent (max 6h, o disparar manual:
   `gcloud run jobs execute mobile-agent --region=us-central1`)
3. Confirmar AgentRunEvent en cerebro-service:
   ```bash
   gcloud pubsub subscriptions pull cerebro-agent.mobile.events \
     --auto-ack --limit=5 --project=going-5d1ae
   ```

## Modo idle (sin Sentry todavía)

Si `SENTRY_AUTH_TOKEN` no está configurado, el agent corre exit 0 publicando
un AgentRunEvent con anomaly `config_missing`. Esto es intencional:

- El job queda deployado y schedulado.
- El cerebro tiene visibilidad de que el setup está pendiente.
- Cuando se configure, los runs siguientes lo recogen sin redeploy.

## Métricas publicadas

```typescript
{
  appsAnalyzed:        number, // 0..2
  appsExpected:        2,      // solo en modo idle
  appsConfigured:      number, // solo en modo idle
  totalIssues:         number,
  totalFatalIssues:    number,
  totalUnhandled:      number,
  totalAffectedUsers:  number,
  totalEvents:         number,
  lookbackHours:       6,
}
```

## Costo estimado

- Sentry tier free: 10k events/mes (suficiente hasta ~5k MAU)
- Cloud Run Job: ~$0.10/mes (4 runs/día × ~30s × 256Mi)
- Pub/Sub: insignificante (< 200 messages/mes)
