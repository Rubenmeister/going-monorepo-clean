# Going Conductor — Justificación ACCESS_BACKGROUND_LOCATION para Play Console

> Texto y video demo requeridos por Google Play para aprobar el permiso de ubicación en segundo plano (regla desde 2021 para apps de movilidad).

---

## 📝 Texto para el formulario "Sensitive permissions" en Play Console

### Pregunta: ¿Por qué tu app necesita acceso a la ubicación en segundo plano?

```
La app "Going Conductor" es la herramienta de trabajo de personas conductoras independientes de la plataforma Going Ecuador (movilidad y envíos). El permiso ACCESS_BACKGROUND_LOCATION es esencial para los siguientes casos de uso operativos:

1. ASIGNACIÓN DE VIAJES EN TIEMPO REAL
Cuando la persona conductora está "en línea" (modo trabajando), la app necesita conocer su ubicación cada 5-15 segundos aunque la app esté en segundo plano. Esto permite:
- Asignar viajes cercanos según proximidad real
- Reducir el tiempo de espera de las personas pasajeras
- Optimizar rutas entre múltiples solicitudes

2. SEGUIMIENTO EN VIAJE ACTIVO
Durante un viaje, la persona pasajera ve la posición del vehículo en su mapa. Si la app del conductor cae a segundo plano (otra app abierta, pantalla bloqueada, navegación con apps externas), el seguimiento debe seguir funcionando — de lo contrario la persona pasajera pierde visibilidad y se afecta su sensación de seguridad.

3. SEGURIDAD DE LA PERSONA PASAJERA — FUNCIÓN SOS
La función SOS de Going comparte la ubicación en tiempo real con contactos de confianza de la persona pasajera y con el equipo de seguridad de Going + ECU 911. Esto debe funcionar incluso si el conductor tiene la app en segundo plano (común en viajes largos donde el conductor usa Google Maps simultáneamente).

4. MODO HÍBRIDO URBANO + INTERURBANO
La plataforma Going opera un sistema de despacho híbrido que mueve automáticamente al conductor entre modo urbano (Quito) y modo interurbano (Quito ↔ Sierra Central) según su ubicación. Sin background location, el conductor pierde acceso a viajes cuando cruza el geofence sin tener la app activa.

CONTROLES DE PRIVACIDAD:
- El permiso solo se solicita cuando la persona conductora activa el modo "En línea" (no al instalar)
- La persona conductora puede pasar a "Fuera de línea" en cualquier momento para detener el tracking
- Las ubicaciones se almacenan solo durante el viaje activo + 30 días de auditoría (cumple LOPDP Ecuador)
- No se comparten datos de ubicación con terceros ajenos al servicio prestado

La app NO usa background location para fines publicitarios, analytics generales ni vinculación con third-party SDKs.
```

---

## 🎬 Video demo (30 segundos)

### Storyboard a grabar:

**Escena 1 (0-5s):** App "Going Conductor" abierta en primer plano. Persona conductora tap "Conectarse" → estado cambia a "En línea" → solicita permiso de ubicación → seleccionar "Permitir siempre".

**Escena 2 (5-12s):** Conductor presiona Home (la app pasa a background). Cambia a Google Maps para iniciar una navegación (típico use case).

**Escena 3 (12-20s):** Volver a la app Going Conductor por la notificación de un viaje. Aceptar el viaje. Mostrar el mapa con la ruta al pickup.

**Escena 4 (20-28s):** Pantalla split (o transición): mostrar la app pasajera con el ícono del conductor moviéndose en tiempo real, demostrando que el tracking sigue funcionando aun con la app del conductor en background.

**Escena 5 (28-30s):** Texto overlay: "Going necesita background location para que las personas pasajeras vean el vehículo en tiempo real, incluso si la app del conductor está en segundo plano."

### Requisitos técnicos del video

| Item | Spec |
|------|------|
| Formato | MP4 (H.264) |
| Resolución | 1920×1080 mínimo |
| Duración | 30 segundos exactos (max permitido por Play) |
| Audio | No requerido, pero opcional voz off en español |
| Tamaño max | 100 MB |
| Subtítulos | Recomendados en español |
| Idioma del UI | Español Ecuador (es-EC) |

### Lugar de subida

Play Console → Going Conductor → **App content** → **Permissions** → **ACCESS_BACKGROUND_LOCATION** → "Add video URL"

Subir el video a YouTube como **No listado** (no público) y pegar el link.

---

## ✅ Checklist antes de submit

- [ ] Justificación texto pegada en Play Console
- [ ] Video grabado con storyboard arriba
- [ ] Video subido a YouTube como No Listado
- [ ] Link de YouTube pegado en Play Console
- [ ] Política de Privacidad publicada en https://goingec.com/privacidad menciona explícitamente:
  - "Recopilamos ubicación precisa en primer plano y segundo plano"
  - "Solo cuando la persona conductora está en modo activo"
  - "Para asignación de viajes y seguridad del servicio"
- [ ] In-app: al activar "En línea", aparece pre-prompt explicando POR QUÉ se necesita el permiso antes del system dialog
- [ ] Toggle visible para que la persona conductora pueda detener el tracking en cualquier momento

---

## 📞 Si Google Play rechaza

Apelaciones típicas:
1. Reforzar que el use case es operativo (no marketing)
2. Mostrar la política de privacidad pública
3. Demostrar control del usuario (toggle de modo en línea)
4. Aclarar que se usa LOPDP del Ecuador como marco regulatorio + cumplimiento

Si reincide, escalar via Play Console → Help → "Appeal a policy decision".
