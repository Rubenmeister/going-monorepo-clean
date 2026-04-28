"""
Build Ecuador geography dataset from GADM (which sources INEC/SENPLADES).

Output: libs/domains/geography/data/ecuador-parishes.json
Schema:
{
  "generated_at": "...",
  "source": "GADM 4.1 (INEC-derived)",
  "totals": { "provinces": N, "cantons": M, "parishes": K },
  "parishes": [
    {
      "ine_code": "GADM CC_3 if present, else synthesized",
      "parroquia": "Cumbayá",
      "canton":    "Quito",
      "provincia": "Pichincha",
      "centroid":  { "lat": -0.205, "lng": -78.428 },
      "altitude_m": null,    // GADM no incluye, se completa después
      "area_km2":   26.8,
      "population": null,    // INEC censo, se completa después
      "neighbors": [],       // se calcula en pase 2
      "aliases":   [],
      "history":   "",
      "tourism":   { "highlights": [], "climate": "", "best_season": "" }
    },
    ...
  ]
}
"""
import json
import os
import re
import sys
import zipfile
from datetime import datetime
from io import BytesIO

import requests
from shapely.geometry import shape


# Mapeo de nombres GADM (sin tildes, CamelCase) a nombres oficiales en español.
# Las provincias canónicas se mapean explícitamente. Los demás nombres se
# reconstruyen separando CamelCase.
PROVINCE_CANONICAL = {
    "Azuay":                     "Azuay",
    "Bolivar":                   "Bolívar",
    "Canar":                     "Cañar",
    "Cañar":                "Cañar",  # por si GADM ya trajo eñe
    "Carchi":                    "Carchi",
    "Chimborazo":                "Chimborazo",
    "Cotopaxi":                  "Cotopaxi",
    "ElOro":                     "El Oro",
    "Esmeraldas":                "Esmeraldas",
    "Galapagos":                 "Galápagos",
    "Galápagos":            "Galápagos",
    "Guayas":                    "Guayas",
    "Imbabura":                  "Imbabura",
    "Loja":                      "Loja",
    "LosRios":                   "Los Ríos",
    "Manabi":                    "Manabí",
    "MoronaSantiago":            "Morona Santiago",
    "Napo":                      "Napo",
    "Orellana":                  "Orellana",
    "Pastaza":                   "Pastaza",
    "Pichincha":                 "Pichincha",
    "SantaElena":                "Santa Elena",
    "SantoDomingodelosTsachilas":"Santo Domingo de los Tsáchilas",
    "Sucumbios":                 "Sucumbíos",
    "Tungurahua":                "Tungurahua",
    "ZamoraChinchipe":           "Zamora Chinchipe",
}


def _split_camel(s: str) -> str:
    """`CamiloPonceEnriquez` -> `Camilo Ponce Enriquez`. Idempotente."""
    if not s or s == "NA":
        return s
    # Insertar espacio entre minúscula→mayúscula y entre mayúscula→Mayúscula+minúscula
    s = re.sub(r"([a-z])([A-Z])", r"\1 \2", s)
    s = re.sub(r"([A-Z])([A-Z][a-z])", r"\1 \2", s)
    return s


def _canonicalize(name: str, mapping: dict | None = None) -> str:
    if not name or name == "NA":
        return name
    if mapping and name in mapping:
        return mapping[name]
    return _split_camel(name)


def _clean_alias(parr: str, varname) -> list:
    if not varname or varname == "NA" or varname == parr:
        return []
    return [varname]

GADM_URL = "https://geodata.ucdavis.edu/gadm/gadm4.1/json/gadm41_ECU_3.json.zip"
OUT_PATH = "libs/domains/geography/data/ecuador-parishes.json"


def _download_geojson() -> dict:
    print(f"--> downloading {GADM_URL}")
    r = requests.get(GADM_URL, timeout=120)
    r.raise_for_status()
    print(f"  {len(r.content)/1024/1024:.1f} MB descargados")
    z = zipfile.ZipFile(BytesIO(r.content))
    name = next(n for n in z.namelist() if n.endswith(".json"))
    print(f"  extrayendo {name}")
    return json.loads(z.read(name).decode("utf-8"))


def _polygon_to_summary(geom) -> dict:
    """Centroid + area en km² usando una proyección equal-area aproximada (cilíndrica)."""
    poly = shape(geom)
    centroid = poly.centroid
    # Earth radius m: 6_371_008. Convert lat/lng degrees to meters.
    # Use a simple equirectangular projection at the centroid latitude for area.
    import math
    lat_rad = math.radians(centroid.y)
    m_per_deg_lat = 111_320.0
    m_per_deg_lng = 111_320.0 * math.cos(lat_rad)
    # Project polygon coordinates to meters via an affine transform (cheap; OK for parish-size areas)
    from shapely.affinity import scale as shp_scale
    projected = shp_scale(poly, xfact=m_per_deg_lng, yfact=m_per_deg_lat, origin=(centroid.x, centroid.y))
    area_km2 = projected.area / 1_000_000.0
    return {
        "lat": round(centroid.y, 6),
        "lng": round(centroid.x, 6),
        "area_km2": round(area_km2, 2),
    }


def _make_ine_code(prov: str, cant: str, parr: str, idx: int) -> str:
    """GADM no expone INEC code consistentemente. Generamos un slug estable."""
    # Usar el HASCID/CC_3 si está disponible, sino slug
    return f"GADM-{idx:04d}"


def build():
    data = _download_geojson()
    features = data.get("features", [])
    print(f"--> {len(features)} parroquias en GeoJSON")

    parishes = []
    provinces = set()
    cantons = set()

    for idx, feat in enumerate(features):
        props = feat["properties"]
        geom = feat["geometry"]
        prov_raw = props.get("NAME_1") or props.get("VARNAME_1") or "—"
        cant_raw = props.get("NAME_2") or "—"
        parr_raw = props.get("NAME_3") or props.get("VARNAME_3") or "—"
        # GADM rellena con "NA" cuando un campo no aplica — tratamos como vacío
        cc3_raw = props.get("CC_3")
        hasc_raw = props.get("HASC_3")
        cc3 = (cc3_raw if cc3_raw and cc3_raw != "NA" else None) \
            or (hasc_raw if hasc_raw and hasc_raw != "NA" else None) \
            or _make_ine_code(prov_raw, cant_raw, parr_raw, idx)

        prov = _canonicalize(prov_raw, PROVINCE_CANONICAL)
        cant = _canonicalize(cant_raw)
        parr = _canonicalize(parr_raw)

        summary = _polygon_to_summary(geom)
        parishes.append({
            "ine_code":   cc3,
            "parroquia":  parr,
            "canton":     cant,
            "provincia":  prov,
            "centroid":   { "lat": summary["lat"], "lng": summary["lng"] },
            "altitude_m": None,
            "area_km2":   summary["area_km2"],
            "population": None,
            "neighbors":  [],
            "aliases":    _clean_alias(parr, _canonicalize(props.get("VARNAME_3"))),
            "history":    "",
            "tourism":    { "highlights": [], "climate": "", "best_season": "" },
        })
        provinces.add(prov)
        cantons.add((prov, cant))

    # Pase 2: vecinos. Dos parroquias son vecinas si sus polígonos comparten algún punto.
    # Para ahorrar tiempo en N²=1M comparaciones, usamos el bounding box como pre-filtro.
    print("--> calculando vecinos (con bounding box pre-filter)...")
    polys = [(idx, shape(feat["geometry"])) for idx, feat in enumerate(features)]
    bboxes = [(idx, p.bounds) for idx, p in polys]
    for i, p1 in polys:
        nbrs = []
        b1 = polys[i][1].bounds
        for j, p2 in polys:
            if i == j:
                continue
            b2 = polys[j][1].bounds
            # bounding box overlap test (cheap)
            if b1[2] < b2[0] or b1[0] > b2[2] or b1[3] < b2[1] or b1[1] > b2[3]:
                continue
            # full geometry test (caro pero ya filtramos los obvios)
            if p1.touches(p2) or p1.intersects(p2):
                nbrs.append(parishes[j]["ine_code"])
        parishes[i]["neighbors"] = sorted(nbrs)

    out = {
        "generated_at": datetime.utcnow().isoformat() + "Z",
        "source":       "GADM 4.1 (derived from INEC/SENPLADES)",
        "totals": {
            "provinces": len(provinces),
            "cantons":   len(cantons),
            "parishes":  len(parishes),
        },
        "parishes": parishes,
    }

    os.makedirs(os.path.dirname(OUT_PATH), exist_ok=True)
    with open(OUT_PATH, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=2)

    size_mb = os.path.getsize(OUT_PATH) / 1024 / 1024
    print(f"OK generado {OUT_PATH} ({size_mb:.2f} MB)")
    print(f"  provincias: {out['totals']['provinces']}")
    print(f"  cantones:   {out['totals']['cantons']}")
    print(f"  parroquias: {out['totals']['parishes']}")


if __name__ == "__main__":
    try:
        build()
    except Exception as e:
        print(f"ERROR: {e}", file=sys.stderr)
        sys.exit(1)
