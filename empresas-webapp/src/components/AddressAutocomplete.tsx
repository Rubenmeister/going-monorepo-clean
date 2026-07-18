/**
 * AddressAutocomplete — input de dirección con AYUDA + MEMORIA para el panel
 * corporativo (origen / destino / recogida / entrega).
 *
 * Antes eran <input> de texto pelados: sin sugerencias ni historial. Este
 * componente agrega, sin cambiar el modelo de datos (sigue siendo texto):
 *   1. MEMORIA — direcciones usadas recientemente (localStorage por empresa).
 *   2. AYUDA   — lugares curados de Ecuador (aeropuerto, ciudades, zonas de
 *      Quito) + autocompletado real de Mapbox si hay NEXT_PUBLIC_MAPBOX_TOKEN.
 *
 * El texto libre SIEMPRE se respeta: puedes escribir una dirección exacta que
 * no esté en ninguna lista y se guarda igual. Las sugerencias solo ayudan.
 */

"use client";

import { useState, useEffect, useRef, useCallback } from "react";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";
const RECENT_KEY = "empresas_recent_addresses";
const MAX_RECENT = 8;

/* Lugares frecuentes de Ecuador — ayuda inmediata sin depender de la red. */
const CURATED: string[] = [
  "Aeropuerto Internacional Mariscal Sucre (Quito)",
  "Aeropuerto José Joaquín de Olmedo (Guayaquil)",
  "Quito — Centro Norte",
  "Quito — La Carolina",
  "Quito — González Suárez",
  "Quito — Cumbayá",
  "Quito — Sur",
  "Guayaquil — Centro",
  "Guayaquil — Urdesa",
  "Guayaquil — Samborondón",
  "Cuenca — Centro",
  "Ambato", "Latacunga", "Riobamba", "Ibarra", "Otavalo",
  "Santo Domingo", "Manta", "Portoviejo", "Machala", "Loja",
  "Esmeraldas", "Salinas", "Baños de Agua Santa", "Tena", "Puyo",
];

/* ── Memoria (localStorage) ─────────────────────────────────────────────── */

export function loadRecentAddresses(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(RECENT_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

/** Guarda una dirección usada al frente del historial (dedup, tope MAX_RECENT). */
export function rememberAddress(address: string) {
  if (typeof window === "undefined") return;
  const clean = address.trim();
  if (clean.length < 3) return;
  try {
    const prev = loadRecentAddresses().filter(
      (a) => a.toLowerCase() !== clean.toLowerCase(),
    );
    const next = [clean, ...prev].slice(0, MAX_RECENT);
    window.localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    /* almacenamiento no disponible — se ignora */
  }
}

/* ── Mapbox Geocoding (una llamada, solo texto) ─────────────────────────── */

async function searchMapbox(query: string, signal: AbortSignal): Promise<string[]> {
  if (!MAPBOX_TOKEN) return [];
  const url =
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json` +
    `?country=ec&language=es&limit=5&types=place,locality,neighborhood,address,poi` +
    `&access_token=${MAPBOX_TOKEN}`;
  const res = await fetch(url, { signal });
  if (!res.ok) return [];
  const json = await res.json();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ((json.features as any[]) ?? []).map((f: any) => f.place_name as string);
}

/* ── Componente ─────────────────────────────────────────────────────────── */

interface Props {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
  id?: string;
}

interface Suggestion {
  text: string;
  kind: "recent" | "curated" | "mapbox";
}

export default function AddressAutocomplete({
  value,
  onChange,
  placeholder,
  required,
  className,
  id,
}: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [remote, setRemote] = useState<string[]>([]);
  const [recent, setRecent] = useState<string[]>([]);
  const wrapRef = useRef<HTMLDivElement>(null);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => setRecent(loadRecentAddresses()), []);

  /* Cerrar al hacer clic fuera */
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const runSearch = useCallback((q: string) => {
    if (abortRef.current) abortRef.current.abort();
    if (q.trim().length < 3 || !MAPBOX_TOKEN) {
      setRemote([]);
      setLoading(false);
      return;
    }
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setLoading(true);
    searchMapbox(q, ctrl.signal)
      .then((r) => setRemote(r))
      .catch(() => setRemote([]))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    onChange(v);
    setOpen(true);
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => runSearch(v), 350);
  };

  const pick = (text: string) => {
    onChange(text);
    setOpen(false);
    setRemote([]);
  };

  useEffect(() => () => {
    if (debounce.current) clearTimeout(debounce.current);
    if (abortRef.current) abortRef.current.abort();
  }, []);

  /* Construir lista visible: recientes (si vacío o coinciden) + curados + Mapbox */
  const q = value.trim().toLowerCase();
  const seen = new Set<string>();
  const add = (arr: Suggestion[], text: string, kind: Suggestion["kind"]) => {
    const key = text.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    arr.push({ text, kind });
  };

  const list: Suggestion[] = [];
  recent
    .filter((r) => !q || r.toLowerCase().includes(q))
    .slice(0, 5)
    .forEach((r) => add(list, r, "recent"));
  CURATED.filter((c) => q.length >= 1 && c.toLowerCase().includes(q))
    .slice(0, 5)
    .forEach((c) => add(list, c, "curated"));
  remote.forEach((r) => add(list, r, "mapbox"));

  const icon = (k: Suggestion["kind"]) =>
    k === "recent" ? "🕘" : k === "curated" ? "⭐" : "📍";

  return (
    <div ref={wrapRef} className="relative">
      <input
        id={id}
        className={className}
        value={value}
        onChange={handleChange}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        required={required}
        autoComplete="off"
      />
      {loading && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <div className="w-4 h-4 border-2 border-slate-200 border-t-blue-500 rounded-full animate-spin" />
        </div>
      )}

      {open && list.length > 0 && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden max-h-72 overflow-y-auto">
          {list.map((s, i) => (
            <button
              key={`${s.kind}-${i}`}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => pick(s.text)}
              className="w-full text-left px-3 py-2 hover:bg-slate-50 transition-colors flex items-center gap-2.5"
            >
              <span className="text-sm flex-shrink-0">{icon(s.kind)}</span>
              <span className="text-sm text-slate-700 truncate">{s.text}</span>
              {s.kind === "recent" && (
                <span className="ml-auto text-[10px] uppercase tracking-wide text-slate-400 flex-shrink-0">
                  reciente
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
