# academy-service

Going Academy — progreso de cursos, insignias y niveles Aliado (Bronce/Plata/Oro).
Microservicio Cloud Run standalone (patrón corporate-service: package.json
autocontenido, sin `@going-platform/*`, guard JWT replicado local).

## Modelo

- Colección Mongo `academy_progress` (DB `going-academy`), 1 doc por `userId`.
- Catálogo de reglas (21 cursos, escuelas, insignias, umbrales de nivel) en
  `src/catalog.ts` — **los courseIds deben coincidir** con el frontend
  (`frontend-webapp/src/app/academy`).
- Nivel Aliado derivado de cursos completados:
  - **Bronce**: Tronco Común completo (tc1, tc2, tc3).
  - **Plata**: Bronce + ≥3 cursos de especialización.
  - **Oro**: todos los cursos.

## Endpoints (prefijo `/academy`)

| Método | Ruta | Auth | Uso |
|---|---|---|---|
| GET  | `/academy/progress` | JWT (usuario) | Progreso propio |
| POST | `/academy/lessons/complete` | JWT | Marca una lección vista |
| POST | `/academy/courses/:id/complete` | JWT | Registra quiz → insignia + nivel |
| POST | `/academy/levels` | X-Internal-Token | Niveles batch (S2S, ranking) |
| GET  | `/health` | — | Healthcheck |

El api-gateway rutea `/academy/*` con JWT (`guard('academy', svc.academy)`) y
**borra** `x-internal-token` en el borde: `/academy/levels` solo es alcanzable
S2S por VPC.

## Secrets / env (Cloud Run)

- `JWT_SECRET`, `MONGO_URL`, `RS256_PUBLIC_KEY` (base del cloudbuild).
- `INTERNAL_SERVICE_TOKEN` (para `/academy/levels`).
- `MONGO_DB_NAME=going-academy` (opcional; default en código).

## Build & deploy

```bash
# Construir + desplegar a Cloud Run (us-central1), patrón del monorepo:
gcloud builds submit . \
  --config=cloudbuild-microservices.yaml \
  --substitutions='_SERVICE_NAME=academy-service,_EXTRA_SECRETS=INTERNAL_SERVICE_TOKEN=INTERNAL_SERVICE_TOKEN:latest' \
  --project=going-5d1ae

# Apuntar el api-gateway al nuevo servicio (re-aplicar env sin resetear otras):
#   gcloud run services describe academy-service --region us-central1 --format='value(status.url)'
gcloud run services update api-gateway --region us-central1 \
  --update-env-vars="^|^ACADEMY_SERVICE_URL=https://<academy-service-url>"
```

## Activar el ranking por nivel (opcional, cuando haya datos)

El factor "más nivel = más reservas" vive en `transport-service`
(`driver-scoring.ts` + `driver-assignment.service.ts`), **apagado por defecto**.
Para encenderlo, en transport-service:

```bash
gcloud run services update transport-service --region us-central1 \
  --update-env-vars="^|^ACADEMY_RANKING_ENABLED=true|ACADEMY_SERVICE_URL=https://<academy-service-url>" \
  --update-secrets="INTERNAL_SERVICE_TOKEN=INTERNAL_SERVICE_TOKEN:latest"
```

Fail-open: si academy-service no responde en 1.5s, el scorer ignora el factor
(no degrada la asignación).
