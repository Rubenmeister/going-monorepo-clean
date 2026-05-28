/**
 * Loader del Centro de Información Going.
 *
 * Lee los archivos del directorio `knowledge-base/` al startup y los
 * cachea en memoria como un `KnowledgeBaseSnapshot` inmutable.
 *
 * Diseño:
 *   - SÍNCRONO: se llama una vez al startup del servicio.
 *   - Errores no fatales: archivos faltantes se loggean como warnings pero
 *     no rompen el servicio. Un campo faltante = el caller decide cómo
 *     manejar (probablemente handoff a humano).
 *   - Path resolution: busca `knowledge-base/` empezando desde cwd y
 *     subiendo hasta la raíz. Override con `basePath` explícito.
 */
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import {
  KnowledgeBaseSnapshot,
  RouteEntry,
  ProductDoc,
  RawDoc,
  LugarInfo,
} from './types';

// ─── Cache singleton ──────────────────────────────────────────────────

let _cached: KnowledgeBaseSnapshot | null = null;

/**
 * Inicializa (o reinicializa) el knowledge base. Llamar UNA VEZ al startup
 * del servicio. Llamadas posteriores con `force: false` devuelven el cache.
 *
 * @returns Snapshot inmutable del KB.
 */
export function initKnowledgeBase(opts: {
  basePath?: string;
  force?: boolean;
} = {}): KnowledgeBaseSnapshot {
  if (_cached && !opts.force) {
    return _cached;
  }

  const basePath = opts.basePath ?? resolveBasePath();
  const warnings: string[] = [];

  // Helper para parsear YAML — devuelve null si el archivo no existe
  const readYaml = <T>(relative: string): T | null => {
    const fullPath = path.join(basePath, relative);
    if (!fs.existsSync(fullPath)) {
      warnings.push(`Missing YAML: ${relative}`);
      return null;
    }
    try {
      const raw = fs.readFileSync(fullPath, 'utf8');
      return yaml.load(raw) as T;
    } catch (e) {
      warnings.push(`Parse error in ${relative}: ${(e as Error).message}`);
      return null;
    }
  };

  // Helper para leer MD como texto crudo
  const readMd = (relative: string): string | null => {
    const fullPath = path.join(basePath, relative);
    if (!fs.existsSync(fullPath)) {
      warnings.push(`Missing MD: ${relative}`);
      return null;
    }
    return fs.readFileSync(fullPath, 'utf8');
  };

  // Helper para leer todos los MD/YAML de una carpeta
  const readDir = (
    relative: string,
    ext: '.md' | '.yaml',
  ): Array<{ filename: string; content: string }> => {
    const fullPath = path.join(basePath, relative);
    if (!fs.existsSync(fullPath)) {
      warnings.push(`Missing directory: ${relative}`);
      return [];
    }
    return fs
      .readdirSync(fullPath)
      .filter((f) => f.endsWith(ext) && f !== 'README.md')
      .map((filename) => ({
        filename,
        content: fs.readFileSync(path.join(fullPath, filename), 'utf8'),
      }));
  };

  // ── 1) Estructurados (YAML) ──
  const fleet = readYaml<KnowledgeBaseSnapshot['fleet']>('fleet.yaml') ?? {
    fleet: [],
    restrictions: {},
  };

  const coverage = readYaml<KnowledgeBaseSnapshot['coverage']>('coverage.yaml') ?? {
    active_cities: [],
    coming_soon: [],
  };

  const contact = readYaml<KnowledgeBaseSnapshot['contact']>('contact.yaml') ?? {
    contact: { whatsapp: { number: '', label: '' }, email: '' },
    websites: { public: '' },
    apps: { android: { available: false }, ios: { available: false } },
    company: { legal_name: '', brand: 'Going', country: 'Ecuador', city: '', tagline: '' },
  };

  // ── 2) Pricing v2 ──
  const vehiclesRaw = readYaml<{
    vehicles: KnowledgeBaseSnapshot['vehicles'];
    premium_variants?: KnowledgeBaseSnapshot['premium_variants'];
    restrictions?: unknown;
  }>('pricing/vehicles.yaml');

  const zonesRaw = readYaml<{
    zones: KnowledgeBaseSnapshot['zones'];
  }>('pricing/zones.yaml');

  const surchargesRaw = readYaml<KnowledgeBaseSnapshot['dynamicSurcharges']>(
    'pricing/dynamic-surcharges.yaml',
  );

  const clientTypesRaw = readYaml<{
    client_types: KnowledgeBaseSnapshot['clientTypes'];
  }>('pricing/client-types.yaml');

  const envios = readYaml<KnowledgeBaseSnapshot['envios']>('pricing/envios.yaml') ?? {
    package_types: [],
    tarifas_urbanas: { por_ciudad: {} },
    tarifas_interurbanas: { modelo: 'unknown' },
    recargos: {},
    no_transportamos: [],
  };

  // ── 3) Rutas (consolidar 3 corredores) ──
  const rutas: RouteEntry[] = [];
  const corredores = ['sierra-norte', 'sierra-centro', 'costa-noroeste', 'amazonia'];
  for (const corredor of corredores) {
    const corredorData = readYaml<{
      corredor?: string;
      rutas: RouteEntry[];
    }>(`pricing/rutas/${corredor}.yaml`);
    if (!corredorData?.rutas) continue;
    for (const r of corredorData.rutas) {
      rutas.push({ ...r, corredor: corredorData.corredor ?? corredor });
    }
  }

  // ── 4) Lugares ──
  const lugaresRaw = readDir('lugares', '.yaml');
  const lugares: LugarInfo[] = [];
  for (const { filename, content } of lugaresRaw) {
    try {
      const data = yaml.load(content) as LugarInfo;
      if (data && typeof data === 'object' && data.id) {
        lugares.push(data);
      }
    } catch (e) {
      warnings.push(`Parse error in lugares/${filename}: ${(e as Error).message}`);
    }
  }

  // ── 5) Documentos MD ──
  const about = readMd('about.md') ?? '';

  const productsRaw = readDir('products', '.md');
  const products: ProductDoc[] = productsRaw.map((p) => ({
    id: p.filename.replace(/\.md$/, ''),
    filename: p.filename,
    raw: p.content,
  }));

  const toRawDocs = (rel: string): RawDoc[] =>
    readDir(rel, '.md').map((d) => ({
      id: d.filename.replace(/\.md$/, ''),
      filename: d.filename,
      raw: d.content,
    }));

  const policies = toRawDocs('policies');
  const faq = toRawDocs('faq');
  const guiasUso = toRawDocs('guias-uso');
  const legal = toRawDocs('legal');

  // ── 6) Identidad ──
  const identity: KnowledgeBaseSnapshot['identity'] = {
    tono: readMd('identity/tono.md') ?? '',
    no_decir: readMd('identity/no-decir.md') ?? '',
    brand_voice: readMd('identity/brand-voice.md') ?? '',
  };

  // ── Compose snapshot ──
  _cached = {
    loadedAt: new Date(),
    basePath,
    fleet,
    coverage,
    contact,
    vehicles: vehiclesRaw?.vehicles ?? ({} as KnowledgeBaseSnapshot['vehicles']),
    premium_variants: vehiclesRaw?.premium_variants,
    zones: zonesRaw?.zones ?? {},
    dynamicSurcharges: surchargesRaw ?? {
      hora_del_dia: [],
      dia_de_la_semana: [],
      feriado: { privado_multiplier: 1, compartido_multiplier: 1 },
    },
    clientTypes: clientTypesRaw?.client_types ?? [],
    rutas,
    envios,
    lugares,
    about,
    products,
    policies,
    faq,
    guiasUso,
    legal,
    identity,
    warnings,
  };

  return _cached;
}

/**
 * Devuelve el snapshot cacheado. Lanza error si nunca se inicializó.
 * Útil para uso interno; los consumers deben preferir `initKnowledgeBase()`.
 */
export function getKnowledgeBase(): KnowledgeBaseSnapshot {
  if (!_cached) {
    throw new Error(
      '@going-platform/going-kb: knowledge base not initialized. ' +
        'Call initKnowledgeBase() at service startup.',
    );
  }
  return _cached;
}

/**
 * Para tests: forzar reset del cache.
 */
export function resetKnowledgeBaseCacheForTests(): void {
  _cached = null;
}

// ─── Resolución del basePath ─────────────────────────────────────────

/**
 * Busca el directorio `knowledge-base/` empezando desde cwd y subiendo
 * hasta la raíz del filesystem.
 *
 * Esto sirve para:
 *   - desarrollo local (cwd = root del monorepo)
 *   - Docker (cwd = /app, knowledge-base copiada en /app/knowledge-base)
 *   - tests (cwd = libs/going-kb, sube hasta encontrar)
 */
function resolveBasePath(): string {
  let current = process.cwd();
  for (let i = 0; i < 10; i++) {
    const candidate = path.join(current, 'knowledge-base');
    if (fs.existsSync(candidate) && fs.statSync(candidate).isDirectory()) {
      return candidate;
    }
    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }
  throw new Error(
    '@going-platform/going-kb: could not find knowledge-base/ directory. ' +
      `Searched upward from ${process.cwd()}. Pass { basePath } explicitly.`,
  );
}
