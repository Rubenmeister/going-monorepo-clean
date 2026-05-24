/**
 * Identidad cultural de los servicios y agentes de la plataforma Going.
 *
 * Cada servicio técnico tiene un nombre Quichua que refleja su rol. Estos
 * nombres son para humanos (logs estructurados, dashboards, narrativa,
 * conversación interna) — los IDs técnicos (cerebro-service, etc.) siguen
 * siendo los que aparecen en deploys, env vars y rutas.
 *
 * Por qué Quichua: Going se construye desde Ecuador y la plataforma habla
 * 5 idiomas incluyendo kichwa (qu-PE). Los nombres refuerzan identidad
 * ecuatoriana en cada interacción técnica.
 *
 * Cómo usar:
 *   - Logs estructurados:  `${ID.displayName} (${ID.serviceId}) — ...`
 *   - Dashboards:           título del card = ID.displayName
 *   - Conversación humana:  "qué dice Wayra?" → orchestrator-service
 *   - Cerebro logs:         WorldSnapshot etiqueta agents con displayName
 */

export interface ServiceIdentity {
  /** ID técnico del servicio (Cloud Run service name, env var prefix, etc.) */
  serviceId: string;
  /** Nombre Quichua para humanos. */
  displayName: string;
  /** Significado del término Quichua. */
  meaning: string;
  /** Capa arquitectónica del servicio. */
  layer: 'cognitive' | 'aggregator' | 'orchestration' | 'adapter' | 'agent';
  /** Resumen de 1 línea del rol del servicio. */
  role: string;
}

/**
 * Las 4 capas centrales del cerebro distribuido de Going.
 *
 *   Pacha   (cerebro)        — mundo/tiempo: world model agregado
 *   Yachay  (mycortex)       — sabiduría: única capa cognitiva con LLM
 *   Wayra   (orchestrator)   — viento: ejecuta intenciones con safety gates
 *   Chaski  (agent-bridge)   — mensajero Inca: rutea comandos a Cloud Run Jobs
 */
export const BRAIN_LAYERS: Record<string, ServiceIdentity> = {
  'cerebro-service': {
    serviceId:   'cerebro-service',
    displayName: 'Pacha',
    meaning:     'mundo, tiempo, universo',
    layer:       'aggregator',
    role:        'World model agregador — agrega eventos de los agentes y produce WorldSnapshots',
  },
  'mycortex-service': {
    serviceId:   'mycortex-service',
    displayName: 'Yachay',
    meaning:     'conocimiento, sabiduría',
    layer:       'cognitive',
    role:        'Capa cognitiva — única que usa Claude para razonar y proponer Intentions',
  },
  'orchestrator-service': {
    serviceId:   'orchestrator-service',
    displayName: 'Wayra',
    meaning:     'viento, movimiento',
    layer:       'orchestration',
    role:        'Ejecuta intenciones de Yachay con safety gates (Cat 1/2/3)',
  },
  'agent-bridge-service': {
    serviceId:   'agent-bridge-service',
    displayName: 'Chaski',
    meaning:     'mensajero del imperio Inca',
    layer:       'adapter',
    role:        'Adapter stateless — rutea comandos a Cloud Run Jobs o HTTP services',
  },
  'voice-call-service': {
    serviceId:   'voice-call-service',
    displayName: 'Uyari',
    meaning:     'escuchar, oír (kichwa) — el que atiende cuando alguien habla',
    layer:       'adapter',
    role:        'Atención de llamadas telefónicas 24/7 — bridge Twilio Voice ↔ OpenAI Realtime, publica eventos al cerebro',
  },
};

/**
 * Los 7 agentes (Cloud Run Jobs, triggered por cron o por Wayra).
 *
 *   Rumi    (ops)        — piedra: defensor de la operación
 *   Inti    (financial)  — sol: fuente de valor
 *   Killa   (content)    — luna: narradora del tiempo
 *   Sumak   (marketing)  — bueno/hermoso (Sumak Kawsay = buen vivir)
 *   Sacha   (going)      — selva/naturaleza: el agente del producto core
 *   Quinde  (mobile)     — colibrí: rápido, va de un punto a otro
 *   Kuntur  (frontend)   — cóndor: el que vuela alto y se ve desde lejos
 */
export const AGENTS: Record<string, ServiceIdentity> = {
  'ops-agent': {
    serviceId:   'ops-agent',
    displayName: 'Rumi',
    meaning:     'piedra (de Rumiñahui, guerrero defensor de Quito ante los conquistadores)',
    layer:       'agent',
    role:        'Defensor — monitorea producción, detecta anomalías, alerta incidentes',
  },
  'financial-agent': {
    serviceId:   'financial-agent',
    displayName: 'Inti',
    meaning:     'sol — fuente de valor y luz en la cosmovisión andina',
    layer:       'agent',
    role:        'Finanzas — Datafast, reconciliación, reportes contables',
  },
  'content-agent': {
    serviceId:   'content-agent',
    displayName: 'Killa',
    meaning:     'luna — narradora del paso del tiempo',
    layer:       'agent',
    role:        'Genera contenido, narrativa, blog posts, copy',
  },
  'marketing-agent': {
    serviceId:   'marketing-agent',
    displayName: 'Sumak',
    meaning:     'bueno, hermoso — del concepto "Sumak Kawsay" = buen vivir',
    layer:       'agent',
    role:        'Campañas, mensajes, segmentación de usuarios',
  },
  'going-agent': {
    serviceId:   'going-agent',
    displayName: 'Sacha',
    meaning:     'selva, naturaleza — el todo del que somos parte',
    layer:       'agent',
    role:        'Agente del producto core — rides, transport, growth',
  },
  'mobile-agent': {
    serviceId:   'mobile-agent',
    displayName: 'Quinde',
    meaning:     'colibrí — rápido, pequeño, va de un lugar a otro',
    layer:       'agent',
    role:        'Mobile — APK builds, releases, monitor crashes',
  },
  'frontend-agent': {
    serviceId:   'frontend-agent',
    displayName: 'Kuntur',
    meaning:     'cóndor — el que vuela alto y se ve desde lejos',
    layer:       'agent',
    role:        'Frontend — Vercel deploys, web vitals, monitor de la cara pública',
  },
};

/** Union completa: capas + agentes. */
export const SERVICE_IDENTITY: Record<string, ServiceIdentity> = {
  ...BRAIN_LAYERS,
  ...AGENTS,
};

/**
 * Lookup por serviceId. Devuelve null si el ID no es conocido.
 * Útil cuando se loguea desde cualquier servicio sin importar identidad fija.
 */
export function whoami(serviceId: string): ServiceIdentity | null {
  return SERVICE_IDENTITY[serviceId] ?? null;
}

/**
 * Formato pretty para logs estructurados.
 *
 *   formatIdentity('orchestrator-service')
 *   → 'Wayra (orchestrator-service)'
 *
 * Si el serviceId no es conocido, devuelve el ID raw.
 */
export function formatIdentity(serviceId: string): string {
  const id = whoami(serviceId);
  return id ? `${id.displayName} (${id.serviceId})` : serviceId;
}
