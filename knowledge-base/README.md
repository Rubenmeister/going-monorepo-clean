# Centro de Información Going

Esta carpeta es la **fuente única de verdad** sobre Going. Todo lo que vive acá
alimenta a los agentes (chat web, voice telefónico Uyari, going-agent) y a la
documentación pública de la empresa.

## Filosofía

- **Si está acá, los agentes lo pueden afirmar.**
- **Si no está acá, los agentes NO lo inventan.** Cuando un cliente pregunte algo
  no documentado, el agente debe decir "déjame verificar" o pasar a un humano.
- **Una sola fuente.** El chat, el voice y el agente operativo leen lo mismo.
  Si cambia acá, cambia en todos.

## Quién puede editar

Cualquiera del equipo Going con acceso al repo puede editar archivos `.md` y
`.yaml` desde la UI web de GitHub. No requiere saber programar.

**Antes de un cambio crítico** (precios, política de cancelación, identidad de
marca), idealmente revisar con Rubén.

## Cómo se actualiza la producción

1. Editas un archivo y haces commit (UI de GitHub: botón "Commit changes")
2. Vercel y Cloud Run **redeployan automáticamente** los servicios afectados
3. En ~5 minutos los agentes del sitio público hablan con la info nueva

## Mapa de la carpeta

```
knowledge-base/
├── README.md                ← este archivo
├── about.md                 ← Quiénes somos Going (visión, misión, identidad ecuatoriana)
│
├── products/                ← Qué vende Going (productos ACTIVOS)
│   ├── viaje-compartido.md  ← Carpooling entre ciudades, paga solo tu asiento
│   ├── viaje-privado.md     ← Auto/SUV/VAN/Minibús/Bus exclusivo
│   └── envios.md            ← Paquetes puerta a puerta
│
├── fleet.yaml               ← Tipos de vehículo + capacidades (SUV/VAN/Bus)
├── coverage.yaml            ← Ciudades cubiertas + ciudades próximamente
│
├── pricing/                 ← Tarifas reales por corredor (a llenar con datos finales)
│   ├── ruta-norte.yaml          ← Quito ↔ Cayambe ↔ Otavalo ↔ Ibarra
│   ├── ruta-sierra-centro.yaml  ← Quito ↔ Latacunga ↔ Ambato ↔ Riobamba
│   └── ruta-costa.yaml          ← Quito ↔ Santo Domingo ↔ La Concordia ↔ El Carmen
│
├── policies/                ← Reglas del servicio
│   ├── cancelacion.md
│   ├── mascotas.md
│   ├── reembolsos.md
│   └── corporativo.md
│
├── faq/                     ← Preguntas frecuentes (formato Q&A)
│   ├── general.md
│   ├── pagos.md
│   └── seguridad.md
│
├── identity/                ← Cómo HABLA Going (voz de marca)
│   ├── tono.md              ← Español Ecuador, "tú", cálido, directo
│   ├── no-decir.md          ← Cosas que el agente NO debe decir nunca
│   └── brand-voice.md       ← Personalidad, ejemplos buenos vs malos
│
└── contact.yaml             ← WhatsApp, email, websites, redes
```

## Formato de archivos

### `.md` (Markdown) — texto narrativo

Para contenido humano-legible: políticas, FAQs, "about", identidad.

Estructura típica:

```markdown
# Título

Párrafo de introducción.

## Subsección

- Lista
- De
- Puntos

**Negrita** para énfasis, *cursiva* para citas.

### Cuándo aplica

Texto detallado.
```

### `.yaml` (YAML) — datos estructurados

Para datos que los agentes necesitan exactos (capacidades, precios, listas).

Estructura típica:

```yaml
# Comentario explicativo
campo: valor
lista:
  - item 1
  - item 2
objeto:
  sub_campo: 123
  otro: "texto entre comillas si tiene caracteres especiales"
```

## Reglas críticas

1. **Nunca pongas precios estimados, redondeados o "más o menos".** Si una tarifa
   real es $13.50, pon `13.50`. Si no sabes la tarifa, deja el campo vacío con un
   comentario `# PENDIENTE: confirmar con operaciones`.

2. **Nunca prometas servicios que no existen aún.** Tours, alojamiento,
   experiencias = "próximamente". Cuando se lancen, los movemos a `products/`.

3. **No pongas el teléfono personal del fundador.** El WhatsApp Going es
   +593 98 403 7949. Cualquier otro número es restringido.

4. **No copies texto de competidores.** Going es ecuatoriana, nuestra voz es
   propia (ver `identity/brand-voice.md`).

## Próximo paso técnico (Fase B — para el equipo dev)

Implementar `libs/going-kb` que:
- Parsea esta carpeta al iniciar cada servicio
- Expone los datos como objetos tipados en TypeScript
- Hace que `customer-support-service`, `voice-call-service` y `going-agent` la
  consuman en lugar de tener sus copias hardcoded
- Tests que validen el schema YAML/MD en CI

Ver task #114 en el sistema de tracking interno.
