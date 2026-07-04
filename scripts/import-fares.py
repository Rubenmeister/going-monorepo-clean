#!/usr/bin/env python3
"""
FUENTE ÚNICA de tarifas GOING.

Lee el Excel (hoja editable por Rubén) y REGENERA todos los consumidores:
  · knowledge-base/pricing/going-fares.json        (canónico)
  · frontend-webapp/.../canonicalFares.ts           (webapp)
  · libs/pricing/src/lib/fares.ts                    (copia libs)
  · knowledge-base/pricing/rutas/matriz-going-v1.yaml (asistente)

Cambiar precios:  editar el Excel  ->  `python scripts/import-fares.py`  ->  deploy.
"""
import json
import re
import unicodedata
from pathlib import Path

import openpyxl

ROOT = Path(__file__).resolve().parent.parent
XLSX = ROOT / "knowledge-base/pricing/source/Going_Matriz_Precios_Limpia.xlsx"
JSON_OUT = ROOT / "knowledge-base/pricing/going-fares.json"
WEBAPP_TS = ROOT / "frontend-webapp/src/app/services/ride/canonicalFares.ts"
LIBS_TS = ROOT / "libs/pricing/src/lib/fares.ts"
MATRIZ = ROOT / "knowledge-base/pricing/rutas/matriz-going-v1.yaml"

VEH = ["suv", "suv_xl", "van", "van_xl", "minibus", "bus", "bus_40"]
NO_SHARED = {("aeropuerto", "cuenca")}  # aeropuerto→Cuenca: no hay compartido (Rubén 4-jul)


def norm(name: str) -> str:
    s = name.strip().lower()
    s = "".join(c for c in unicodedata.normalize("NFD", s) if unicodedata.category(c) != "Mn")
    s = re.sub(r"[^a-z0-9\s]", "", s).strip()
    if s.startswith("aeropuerto"):
        return "aeropuerto"
    return re.sub(r"\s+", "_", s)


def num(v):
    if v is None or v == "":
        return None
    try:
        f = float(v)
        return int(f) if f == int(f) else f
    except (TypeError, ValueError):
        return None


def read_routes():
    wb = openpyxl.load_workbook(XLSX, data_only=True)
    ws = wb.active
    routes = []
    for r in list(ws.iter_rows(values_only=True))[1:]:
        if not r[0] or not r[1]:
            continue
        o_name, d_name = str(r[0]).strip(), str(r[1]).strip()
        o, d = norm(o_name), norm(d_name)
        shared = num(r[2])
        if (o, d) in NO_SHARED or (d, o) in NO_SHARED:
            shared = None
        private = {v: num(r[3 + i]) for i, v in enumerate(VEH) if num(r[3 + i]) is not None}
        routes.append({"origin": o, "destination": d, "originName": o_name,
                       "destinationName": d_name, "shared": shared, "private": private})
    return routes


def write_json(routes):
    with_shared = sum(1 for x in routes if x["shared"] is not None)
    JSON_OUT.write_text(json.dumps({
        "_comment": "FUENTE ÚNICA de tarifas GOING. Generado desde el Excel por scripts/import-fares.py. NO editar a mano.",
        "source": "Going_Matriz_Precios_Limpia.xlsx",
        "routeCount": len(routes), "sharedCount": with_shared, "routes": routes,
    }, ensure_ascii=False, indent=2), encoding="utf-8")
    return with_shared


TS_HEADER = """// ⚠️ ARCHIVO GENERADO por scripts/import-fares.py desde el Excel
// (knowledge-base/pricing/source/Going_Matriz_Precios_Limpia.xlsx).
// FUENTE ÚNICA: no editar a mano. Para cambiar un precio: editar el Excel y
// re-correr `python scripts/import-fares.py`.
//
// Precios FIJOS de mercado (compartido y privado explícito por vehículo).
// Sin fórmulas, sin recargo de origen, sin surcharge sobre estos valores.

export interface PrivatePrices {
  suv: number; suv_xl: number; van: number; van_xl: number;
  minibus: number; bus: number; bus_40: number;
}

export const FARES = {
__SHARED__
__PRIVATE__
  vehicles: {
    suv:     { label: 'SUV',     capacity: 4 },
    suv_xl:  { label: 'SUV XL',  capacity: 5 },
    van:     { label: 'VAN',     capacity: 7 },
    van_xl:  { label: 'VAN XL',  capacity: 12 },
    minibus: { label: 'Minibús', capacity: 20 },
    bus:     { label: 'Bus',     capacity: 30 },
    bus_40:  { label: 'Bus 40',  capacity: 40 },
  },
} as {
  shared: Record<string, number>;
  private: Record<string, PrivatePrices>;
  vehicles: Record<string, { label: string; capacity: number }>;
};

function normalize(city: string): string {
  const s = city.split(',')[0].trim().toLowerCase()
    .normalize('NFD').replace(/[\\u0300-\\u036f]/g, '')
    .replace(/[^a-z0-9\\s]/g, '').trim();
  if (s.startsWith('aeropuerto')) return 'aeropuerto';
  // Zonas de Quito colapsan a 'quito' (misma tarifa; la diferencia de zona
  // ya no cobra recargo — precios fijos de mercado).
  if (/^(quito|cumbaya|tumbaco|los chillos|sangolqui|valle)/.test(s)) return 'quito';
  return s.replace(/\\s+/g, '_');
}

function pair(a: string, b: string): string { return `${normalize(a)}-${normalize(b)}`; }

/** Precio compartido/persona (o null si esa ruta NO tiene compartido). */
export function getFare(origin: string, destination: string): number | null {
  return FARES.shared[pair(origin, destination)] ?? FARES.shared[pair(destination, origin)] ?? null;
}

/** Precios privados por vehículo (o null si la ruta no está en la matriz). */
export function getPrivatePrices(origin: string, destination: string): PrivatePrices | null {
  return FARES.private[pair(origin, destination)] ?? FARES.private[pair(destination, origin)] ?? null;
}
"""


def emit_ts(routes):
    sh_lines = ["  shared: {"]
    for r in routes:
        if r["shared"] is not None:
            sh_lines.append(f"    '{r['origin']}-{r['destination']}': {r['shared']},")
    sh_lines.append("  },")
    pv_lines = ["  private: {"]
    for r in routes:
        p = r["private"]
        if p:
            vals = ", ".join(f"{v}: {p.get(v, 0)}" for v in VEH)
            pv_lines.append(f"    '{r['origin']}-{r['destination']}': {{ {vals} }},")
    pv_lines.append("  },")
    ts = TS_HEADER.replace("__SHARED__", "\n".join(sh_lines)).replace("__PRIVATE__", "\n".join(pv_lines))
    WEBAPP_TS.write_text(ts, encoding="utf-8")
    LIBS_TS.write_text(ts, encoding="utf-8")


def matriz_endpoint(city_id):
    if city_id == "aeropuerto":
        return "{ canton: quito, zone: aeropuerto }"
    return f"{{ canton: {city_id} }}"


def emit_matriz(routes):
    out = ["# ⚠️ GENERADO por scripts/import-fares.py desde el Excel. NO editar a mano.",
           "# Fuente única de tarifas del asistente (going-kb).",
           "corredor: matriz-going-v1", "rutas:"]
    for r in routes:
        oid = "quito_aeropuerto" if r["origin"] == "aeropuerto" else r["origin"]
        did = "quito_aeropuerto" if r["destination"] == "aeropuerto" else r["destination"]
        out.append(f"  - id: {oid}_to_{did}")
        out.append(f"    origin:      {matriz_endpoint(r['origin'])}")
        out.append(f"    destination: {matriz_endpoint(r['destination'])}")
        if r["shared"] is not None:
            s = r["shared"]
            out.append(f"    shared:    {{ suv: {s}, suv_xl: {s} }}")
        p = r["private"]
        if p:
            pv = ", ".join(f"{v}: {p.get(v, 0)}" for v in VEH)
            out.append(f"    private:   {{ {pv} }}")
    MATRIZ.write_text("\n".join(out) + "\n", encoding="utf-8")


def main():
    routes = read_routes()
    ws = write_json(routes)
    emit_ts(routes)
    emit_matriz(routes)
    print(f"OK: {len(routes)} rutas | compartido={ws} | privado-solo={len(routes)-ws}")
    print(f"  -> {JSON_OUT.relative_to(ROOT)}")
    print(f"  -> {WEBAPP_TS.relative_to(ROOT)}")
    print(f"  -> {LIBS_TS.relative_to(ROOT)}")
    print(f"  -> {MATRIZ.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
