# frontend-agent

Cloud Run Job que monitorea las 3 web apps de Going en Vercel:
- frontend-webapp (app.goingec.com)
- admin-dashboard (admin.goingec.com)
- corporate-portal (empresas.goingec.com)

## Qué hace

Cada 6h:
1. Lee deploys recientes de cada proyecto desde Vercel REST API
2. Detecta deploys de producción en ERROR
3. Detecta deploys colgados en BUILDING > 10min
4. Calcula tasa de error sistémica (>50% en la ventana = critical)

## Anomalías

| Type                       | Severity | Cuándo                                                   |
|----------------------------|----------|----------------------------------------------------------|
| `vercel_prod_deploy_failed`| critical | Deploy a `target=production` en estado ERROR             |
| `vercel_deploy_hung`       | warning  | Deploy en BUILDING/INITIALIZING/QUEUED > 10min           |
| `vercel_high_error_rate`   | critical | >50% de deploys en error en la ventana de 6h             |
| `config_missing`           | info     | VERCEL_TOKEN no seteado (modo idle)                      |

## Acciones propuestas

| Type                         | Urgency | Cuándo                                              |
|------------------------------|---------|-----------------------------------------------------|
| `investigate_failed_deploy`  | 0.9     | Cualquier prod deploy en ERROR                      |
| `redeploy_previous_version`  | 0.8     | Último prod ERROR + previo READY (rollback simple)  |

## Setup (one-time)

### 1. Crear Personal Access Token en Vercel

1. Ir a [vercel.com/account/tokens](https://vercel.com/account/tokens)
2. Crear token con scope **Read** (lectura de deployments y projects)
3. Anotar el token

### 2. Si la cuenta es team, encontrar el TEAM_ID

```bash
curl -s -H "Authorization: Bearer <TOKEN>" "https://api.vercel.com/v2/teams"
```

Anotar el `id` del team correspondiente (o el slug — ambos sirven).

### 3. Configurar frontend-agent en GCP

```bash
gcloud secrets create VERCEL_TOKEN --project=going-5d1ae
echo -n "<TOKEN>" | gcloud secrets versions add VERCEL_TOKEN --data-file=-

gcloud run jobs update frontend-agent \
  --region=us-central1 \
  --project=going-5d1ae \
  --update-env-vars="VERCEL_PROJECTS=frontend-webapp,admin-dashboard,corporate-portal,VERCEL_TEAM_ID=<TEAM_ID>" \
  --update-secrets="VERCEL_TOKEN=VERCEL_TOKEN:latest"
```

Si no es cuenta team, omitir `VERCEL_TEAM_ID`.

### 4. Validar end-to-end

Disparar manual:
```bash
gcloud run jobs execute frontend-agent --region=us-central1 --project=going-5d1ae
```

Confirmar AgentRunEvent en cerebro:
```bash
gcloud pubsub subscriptions pull cerebro-agent.frontend.events \
  --auto-ack --limit=5 --project=going-5d1ae
```

## Modo idle (sin Vercel todavía)

Si `VERCEL_TOKEN` no está, el agent corre exit 0 publicando una anomaly
`config_missing`. Permite tener el job deployado y schedulado mientras
el operador no haya creado el token.

## Métricas publicadas

```typescript
{
  projectsAnalyzed: number, // 0..3
  projectsExpected: 3,      // solo en modo idle
  totalDeploys:     number,
  prodDeploys:      number,
  errorDeploys:     number,
  readyDeploys:     number,
  lookbackHours:    6,
}
```

## Limitaciones (lo que NO ve)

- **Errores JS runtime en cliente**: para esto se necesita Sentry/Bugsnag
  embebido en cada app + un endpoint adicional. Plan para Fase 5.
- **Core Web Vitals (LCP/INP/CLS)**: requiere Vercel Pro plan + Web Analytics API.
  Cuando tenga sentido, agregar `monitors/web-vitals.monitor.ts`.
- **Bounce rate / conversión**: territorio de Plausible/PostHog/GA — no es Vercel API.

## Costo

- Vercel API: gratis (parte del plan, no consume nada)
- Cloud Run Job: ~$0.10/mes
- Pub/Sub: insignificante
