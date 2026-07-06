# Lugares — info turística, geográfica e histórica del Ecuador

Esta carpeta tiene una entrada por **ciudad / cantón** donde Going opera o
está por operar. Sirve para que los agentes (chat, voice) puedan ofrecer
contexto útil al usuario:

- Cuando alguien pregunta "¿qué hago en Otavalo?" → el agente arma una
  recomendación corta con la info de `lugares/otavalo.md`.
- Cuando alguien viene de turismo → el agente puede sugerir destinos con
  base real.
- Cuando se lance el producto **Tours y Experiencias**, esta info será la
  base del catálogo.

## Filosofía

- Información **verificada**. Si no estás seguro, deja "PENDIENTE: verificar".
- Tono cálido pero factual. NO marketing exagerado.
- **Identidad ecuatoriana orgullosa**: hablamos de nuestro país con
  conocimiento, no como turistas extranjeros.
- Multilingüe a futuro: por ahora todo en español, pero estructurar el YAML
  permite migrar a campos `_en`, `_fr`, etc. cuando llegue el momento.

## Estructura de cada lugar

Recomiendo usar formato **YAML con campos estructurados**, no MD libre. Razón:
los agentes necesitan poder extraer datos puntuales (altitud, atractivos,
clima) sin parsear texto narrativo.

### Plantilla `[nombre-ciudad].yaml`

```yaml
# Lugar: Otavalo (ejemplo)
id: otavalo
name: Otavalo
province: Imbabura
region: Sierra
canton: Otavalo
is_canton_capital: true

# Datos geográficos
geography:
  altitude_m: 2532
  area_km2: 528
  population: 110461       # aprox. — verificar con censo INEC
  climate:
    zone: andina
    avg_temp_c:
      min: 8
      max: 22
    best_visit_months: [junio, julio, agosto, septiembre, diciembre]
    rainy_months: [febrero, marzo, abril, octubre, noviembre]

# Historia breve (~150 palabras máximo)
history_es: |
  Otavalo es históricamente uno de los centros culturales más importantes
  de la Sierra Norte ecuatoriana. Fundada en territorio kichwa-otavalo,
  la ciudad mantiene viva su identidad indígena en lengua, vestimenta y
  cosmovisión. El pueblo otavaleño es reconocido a nivel mundial por sus
  textiles, tradición que se remonta a tiempos preincaicos.

# Atractivos turísticos principales (lista corta — máx 6)
attractions_es:
  - "Plaza de los Ponchos (mercado artesanal sábado todo el día)"
  - "Cascada de Peguche (15 min de la ciudad)"
  - "Laguna de San Pablo (a los pies del volcán Imbabura)"
  - "Museo Viviente Otavalango"
  - "Parque Cóndor (centro de rescate de aves rapaces)"
  - "Cuicocha (laguna volcánica, ~30 min)"

# Gastronomía local
gastronomy_es:
  - "Yamor — bebida tradicional fermentada de maíz (en festividades)"
  - "Carnes coloradas — plato típico"
  - "Empanadas de morocho"

# Eventos / fiestas
events_es:
  - name: "Yamor"
    when: "Septiembre"
    description: "Fiesta tradicional otavaleña, la más importante del año."
  - name: "Inti Raymi"
    when: "Junio (solsticio)"
    description: "Fiesta del sol, celebración kichwa."

# Cobertura Going
going_coverage:
  active: true
  notes: "Cobertura puerta a puerta. Salidas hacia Quito cada hora pico."
  nearest_hub: "Quito"

# Tags para search / matching
tags: [andina, kichwa, artesanal, textil, mercado, sabado, naturaleza]
```

## Por qué YAML y no MD libre

| Ventaja | Razón |
|---|---|
| Búsqueda estructurada | "Quiero ciudades a < 2000m de altitud" → grep simple en `altitude_m` |
| Multilingüe escalable | Campo `_es`, `_en`, `_fr` por separado |
| Agente puede componer | "Recomiendame 3 lugares para visitar en septiembre" → filtrar por `best_visit_months` |
| Validación automatizable | Schema JSON Schema garantiza completitud |

Cuando un lugar requiere texto largo (>200 palabras), usar campos `_es:` con
bloque YAML (`|`) que preserva saltos de línea.

## Lugares cubiertos hoy

Ver `coverage.yaml` para la lista canónica de ciudades activas.

Por ahora, los archivos `lugares/*.yaml` son **plantillas en proceso**. La
fuente vieja con info parcial vive en
`customer-support-service/src/knowledge-base/ecuador-cantons.ts` — se va a
migrar a esta carpeta en Fase B.

## Lugares por documentar (prioridad alta)

### Ya en cobertura
- Quito · `quito.yaml`
- Otavalo · `otavalo.yaml`
- Ibarra · `ibarra.yaml`
- Cayambe · `cayambe.yaml`
- Atuntaqui · `atuntaqui.yaml`
- Latacunga · `latacunga.yaml`
- Salcedo · `salcedo.yaml`
- Ambato · `ambato.yaml`
- Riobamba · `riobamba.yaml`
- Santo Domingo · `santo-domingo.yaml`
- La Concordia · `la-concordia.yaml`
- El Carmen · `el-carmen.yaml`
- Tabacundo · `tabacundo.yaml`

### Próximamente (mayor demanda turística)
- Baños · `banos.yaml` (cuando se active la ruta)
- Cuenca · `cuenca.yaml` (cuando se active)
- Cotopaxi / Machachi · `cotopaxi.yaml` (atractivo turístico clave)
- Quilotoa · `quilotoa.yaml`
- Mindo · `mindo.yaml`

## Próximo paso

En el **Bloque 0.2** vamos a migrar el contenido que ya existe en
`ecuador-cantons.ts` a archivos `lugares/*.yaml` individuales.
