# CLAUDE.md — Going monorepo

> Este archivo lo lee TODO agente Claude que abra este repo. Lo que está acá
> NO se discute, NO se "completa", NO se "mejora". Si una tarea entra en
> conflicto con estas reglas, PARÁ y preguntá al usuario.

## Stack autorizada en GCP project `going-5d1ae`

- **Compute**: Cloud Run, region `us-central1` (43 services). NADA más.
- **Datos**: MongoDB Atlas (`going-cluster.vy28mpj.mongodb.net`) + Redis Labs.
- **Red**: VPC connector `going-connector` en network `default` + GLB
  `going-api-ip` (`34.117.66.49`) → `api.goingec.com`.
- **Secrets**: GCP Secret Manager.
- **Logs/Métricas**: Cloud Logging + Cloud Monitoring nativos.

## Prohibido sin OK EXPLÍCITO del usuario (Rubén Torres Cobos)

NO crear, NO mergear, NO ejecutar trabajo de:

- **GKE / Kubernetes / k8s manifests / Helm / Sealed Secrets** — Cloud Run
  cumple el caso. Cualquier `k8s/`, `helm/`, `*.yaml` con `kind: Deployment`
  es señal de agente paralelo desinformado.
- **VPC connectors adicionales** — solo `going-connector` existe.
- **Networks adicionales** — solo `default`.
- **Cloud SQL / Postgres / MySQL gestionado** — el dato vive en Atlas.
- **Elasticsearch / Logstash / Kibana / Grafana / Prometheus** auto-hosteados
  — Cloud Monitoring cubre el caso.
- **Nginx Ingress / ModSecurity / cert-manager** — GLB ya lo hace.

Si un task suena a "completar infra" o "migrar a X", primero verificá que
NO está pisando esta lista. En duda, preguntá.

## Por qué esta regla existe

El 2-jun-2026 un agente Claude paralelo mergeó el commit `268f9f8a`
"feat(k8s): complete production GKE infrastructure" (2862 líneas de YAML).
Otro agente o script corrió el setup y prendió cluster GKE `going-production`
(3× e2-medium 24/7) + VPC connector duplicado `vpc-conn-prod` en network
`vite-vpc-prod` + Cloud SQL `turismo-db`. Esto disparó el costo cloud de
~$3/día a ~$14/día *sin servir tráfico real* — `api.goingec.com` siguió
yendo a Cloud Run. La limpieza se hizo el 9-jun-2026.

Rubén NUNCA pidió migrar a GKE. Lo había rechazado por costos antes de eso.

## Cómo deployar

- **Microservicios Going**: `gcloud builds submit . --config=cloudbuild-microservices.yaml --substitutions=_SERVICE_NAME=<name> --project=going-5d1ae`
- **Deploy masivo**: `bash scripts/deploy-monorepo-fast.sh [services|agents|all]`
- **Limpieza periódica gcr.io**: `bash scripts/cleanup-gcr-images.sh [KEEP=10]`
- **Después de `--image`**: re-aplicar env vars con `--update-env-vars="^|^KEY=val|..."` — el `--image` puede resetearlas.

## Identidad Quichua de servicios

Definida en `libs/cerebro-contracts/src/service-identity.ts`. Capas centrales:
**Pacha** = cerebro, **Yachay** = mycortex, **Wayra** = orchestrator,
**Chaski** = agent-bridge. Agentes Cloud Run Jobs: **Rumi** = ops,
**Inti** = financial, **Killa** = content, **Sumak** = marketing,
**Sacha** = going, **Quinde** = mobile, **Kuntur** = frontend.

## Lenguaje

Rubén habla español. **Acento NEUTRO de Ecuador — NUNCA rioplatense/voseo**:
usar "tú" (no "vos"), imperativos estándar ("carga/envía/revisa", no "cargá/
enviá/revisá"), "tienes/puedes" (no "tenés/podés"); tras preposición "ti" (no
"tú"). Inclusivo siempre: "conductora o conductor", "anfitrionas y anfitriones",
"viajeras y viajeros".
