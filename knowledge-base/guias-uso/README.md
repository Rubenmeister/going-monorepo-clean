# Guías de uso Going

**Tutoriales paso a paso** para que pasajeras/pasajeros y conductoras/
conductores usen Going sin fricciones. Estos textos alimentan:

- El **chat de soporte** (cuando un usuario pregunta "¿cómo reservo?")
- La **sección de Ayuda** dentro de la app
- Las páginas públicas de tutoriales en el sitio web
- El **onboarding** de la app (nuevos usuarios)

## Filosofía

- Cada guía resuelve **una sola pregunta concreta**.
- Lenguaje paso a paso, con números (1, 2, 3...).
- Sin tecnicismos.
- Incluir capturas de pantalla cuando ayude (próximamente — cuando UI esté
  estable).
- Una guía buena es la que **un usuario nuevo entiende de la primera lectura**.

## Mapa de guías (pasajeros)

```
guias-uso/
├── README.md                       ← este archivo
│
├── primeros-pasos/
│   ├── descargar-app.md            ← Cómo bajar la app desde Play Store
│   ├── crear-cuenta.md             ← Registrarse + verificar SMS
│   └── configurar-pago.md          ← Agregar tarjeta / Datafast / DeUna
│
├── viajes/
│   ├── reservar-viaje.md           ← Pedir tu primer viaje
│   ├── programar-viaje.md          ← Reservar para más tarde
│   ├── viajar-compartido.md        ← Cómo funciona el carpooling intercity
│   ├── viajar-privado.md           ← Cuándo elegir privado
│   ├── cancelar-viaje.md           ← Cómo cancelar sin costo
│   └── seguir-conductor.md         ← Ver el tracking + compartir con familia
│
├── envios/
│   ├── enviar-paquete.md           ← Cotizar y reservar un envío
│   └── recibir-paquete.md          ← Recibir con código OTP de entrega
│
├── pagos/
│   ├── metodos-pago.md             ← Qué medios acepta Going
│   ├── facturas.md                 ← Cómo descargar tu factura
│   └── promociones.md              ← Aplicar cupones / códigos referido
│
└── soporte/
    ├── contactar-soporte.md        ← Cómo escribirle al equipo Going
    ├── reportar-problema.md        ← Quejas, conductor llegó tarde, etc.
    └── usar-sos.md                 ← Cuándo y cómo usar el botón de emergencia
```

> Todas las guías arriba son **plantillas vacías o pendientes** de redacción.
> Conforme se redactan, se reemplaza la línea "PENDIENTE: redactar" por el
> contenido real.

## Mapa de guías (conductoras/conductores)

Las guías para conductoras/conductores viven en su propia sección — son
diferentes en tono y profundidad (son trabajadores Going, no consumidores).
La mayor parte del onboarding ya vive en **Academia Going** (`/academy/*`).

## Cómo redactar una guía

### Plantilla recomendada

```markdown
# Cómo [hacer la cosa]

**Tiempo estimado:** [1-2 min]
**Necesitás:** [cuenta Going + método de pago configurado]

## Pasos

1. Abre la app Going.
2. Presiona [...].
3. [...].

## Casos especiales

- **Si X pasa:** [qué hacer].
- **Si Y pasa:** [qué hacer].

## Errores comunes

- [Error A]: cómo resolver.

## Si todo falla

Contactanos por WhatsApp +593 98 403 7949 o `soporte@goingec.com`.
```

### Reglas de estilo

- Verbos en imperativo ecuatoriano: "abre", "presiona", "elige", "confirma"
  (NO "abrí", "presioná", "elegí").
- Máximo 7 pasos por flujo principal. Si son más, dividir en sub-guías.
- Indicar qué pantalla aparece después de cada acción ("verás un mapa
  centrado en tu ubicación").
- Capturas: nombrar como `guias-uso/_assets/[guia]/[NN]-[descripcion].png`
  (carpeta `_assets/` por crear cuando empecemos a generar imágenes).
