# Fichas de Play Store — Going (Conductor + Pasajero)

> Metadata lista para copiar-pegar y completar el track **cerrado (alpha)** y, después, **Producción**.
> Estado al 17-jun-2026: builds en alpha (Conductor vc 65 borrador; Pasajero vc 77 pendiente de permiso del service account).
> Lenguaje inclusivo siempre (conductoras y conductores, viajeras y viajeros).

---

## 0) Acciones inmediatas en Play Console (las que NO puedo hacer por vos)

1. **Pasajero — permiso del service account** (esto frena el submit):
   - Play Console → **Usuarios y permisos** → buscar `eas-play-publish@going-5d1ae.iam.gserviceaccount.com`
   - Editar → **Permisos de apps → Agregar app → "Going - Pasajero"** → marcar release/testing (o Administrador) → Guardar.
   - Avisame y reintento el submit del vc 77.

2. **Conductor — completar la ficha** (esto frena la publicación a testers):
   - Usar los textos de abajo en **Dashboard / Ficha de Play Store**, **Clasificación de contenido**, **Seguridad de los datos**, **Público objetivo**.

3. **Publicar el release de alpha** (arranca el reloj de 14 días):
   - Cuando la ficha esté completa: **Pruebas → Prueba cerrada → Versiones → editar el borrador → Revisar y publicar**.
   - El reloj corre desde que los testers están unidos e instalan.

---

## Cuentas de prueba para "Acceso a la app" (Conductor)

Creadas 17-jun vía `POST /auth/register` (roles:['driver']) — verificadas en prod:
- `rubenmeister+gtest@gmail.com`
- `rubenmeister+gtest2@gmail.com`
- `rubenmeister+gtest3@gmail.com`

Son alias "+": cuentas distintas en el backend de Going, NO son cuentas de
Google → no exponen la cuenta personal. La contraseña la fijó Rubén al crearlas
(no está acá por seguridad). Para "Acceso a la app" usar UNA (email + esa clave).
No requieren aprobación de documentos para iniciar sesión y ver la app.

## 1) Ficha de tienda (Store listing)

### Going - Pasajero  (`com.going.userapp`)
- **Nombre (≤30):** `Going — Viajes y Envíos`
- **Descripción corta (≤80):**
  `Viajes compartidos, privados y envíos en Ecuador. Pide, viaja y paga fácil.`
- **Descripción completa (≤4000):**
```
Going es la app de movilidad de Ecuador para viajeras y viajeros.

• Viaje compartido: viajá entre ciudades pagando solo tu asiento.
• Viaje privado: vehículo exclusivo para vos cuando lo necesites.
• Envíos: mandá paquetes de punto a punto, rápido y seguro.

Cómo funciona:
1. Elegí origen y destino.
2. Mirá el precio antes de confirmar — sin sorpresas.
3. Seguí a tu conductora o conductor en tiempo real hasta tu destino.
4. Calificá tu viaje al final.

Pago en efectivo disponible hoy; pagos digitales muy pronto.

Seguridad primero: código de recogida, viaje protegido y soporte cuando lo
necesites. Going opera en las principales ciudades del Ecuador.
```

### Going Conductor  (`com.going.conductor`)
- **Nombre (≤30):** `Going Conductor`
- **Descripción corta (≤80):**
  `Maneja con Going: aceptá viajes y envíos, y generá ingresos en Ecuador.`
- **Descripción completa (≤4000):**
```
Going Conductor es la app para conductoras y conductores de Going en Ecuador.

• Recibí solicitudes de viajes y envíos cerca tuyo.
• Navegación en tiempo real hasta cada punto.
• Verificación de pasajera/o con código de recogida.
• Tus ganancias, claras y al día.

Tu seguridad primero:
• Botón SOS y compartir tu viaje con un contacto de confianza.
• RideCheck: si el viaje queda detenido demasiado tiempo, te preguntamos si
  estás bien.
• Aviso de zonas de riesgo según tu ubicación.
• Por tu seguridad y la de quien viaja, ante una alerta se graba un clip.

Sumate a la red de movilidad de Going y manejá cuando quieras.
```

> Inglés (en-US) opcional: traducir literal. No es obligatorio para publicar en Ecuador.

---

## 2) Clasificación de contenido (cuestionario IARC)

Categoría sugerida para ambas: **"Otra app"** (no juego).
Respuestas típicas para una app de transporte (responder en el cuestionario real):
- ¿Violencia / sangre? **No**
- ¿Contenido sexual? **No**
- ¿Lenguaje obsceno? **No**
- ¿Drogas / alcohol / tabaco? **No**
- ¿Apuestas / juego con dinero real? **No**
- ¿Compras digitales? **No** (el pago del viaje es por servicio, no IAP)
- ¿La app comparte la ubicación del usuario con otros usuarios? **Sí**
  (se comparte la ubicación durante el viaje entre pasajera/o y conductora/o
  para prestar el servicio).
- ¿Permite interacción/comunicación entre usuarios? **Sí** (llamada/chat del
  viaje) — declarar si lo pregunta.

Resultado esperado: apta para todo público / clasificación baja.

---

## 3) Seguridad de los datos (Data Safety)

> Declarar para AMBAS apps. Marcar **cifrado en tránsito: Sí**. **Eliminación de datos: Sí** → URL `https://www.goingec.com/eliminar-cuenta`.

**Datos que se RECOPILAN y para qué (finalidad = funcionalidad de la app / seguridad; NO para publicidad):**

| Dato | Pasajero | Conductor | Finalidad | ¿Se comparte? |
|---|---|---|---|---|
| **Ubicación precisa** | ✓ | ✓ | matching, navegación, seguimiento del viaje | Sí, con la otra parte del viaje |
| **Nombre** | ✓ | ✓ | gestión de cuenta | No |
| **Email** | ✓ | ✓ | gestión de cuenta, inicio de sesión | No |
| **Teléfono** | ✓ | ✓ | contacto del viaje, soporte | No |
| **Historial de la app** (viajes) | ✓ | ✓ | funcionalidad, historial | No |
| **Fotos/Documentos** | — | ✓ | verificación de documentos (licencia, SOAT) | No |
| **Audio y video (dashcam)** | — | ✓ | **seguridad/evidencia** ante alerta (SOS/RideCheck) | No (solo soporte/legal ante incidente) |
| **Info financiera** (cuenta bancaria) | — | ✓ | pago de ganancias | No |

- **Pago con tarjeta:** hoy NO se recopila (pago en efectivo). Cuando entren
  Datafast/DeUna, actualizar esta sección (se procesa por la pasarela, no se
  almacenan datos de tarjeta en la app).
- **Cifrado en tránsito:** Sí (HTTPS).
- **¿El usuario puede pedir borrado?** Sí → `https://www.goingec.com/eliminar-cuenta`.
- **Política de privacidad:** `https://www.goingec.com/privacidad` (✅ 200 verificado; NO usar `/legal/privacy`, que solo existe en app.goingec.com).

> Nota dashcam/LOPDP: declarar audio+video con finalidad de seguridad, acceso
> restringido y retención limitada (bucket privado, borrado a 90 días). Antes de
> ENCENDER la grabación con usuarios reales, validar el texto de consentimiento
> con asesoría legal (COIP art. 178 / LOPDP).

---

## 4) Público objetivo y contenido

- **Grupo de edad objetivo:** **18 y más** (recomendado: es servicio de
  transporte + pagos; evita la política de apps para menores y sus requisitos
  extra). Si se quiere 16+, revisar implicancias.
- **¿Apela a menores?** No.
- **Anuncios:** No contiene anuncios.

---

## 5) Recursos gráficos (esto SÍ lo tenés que aportar vos)

No puedo generarlos; necesito que subas:
- **Ícono** 512×512 PNG (ya lo tenés en la app).
- **Gráfico destacado** 1024×500 PNG.
- **Capturas de teléfono:** mínimo 2 (recomiendo 4–8) — pantallas reales de
  cada app (Home, pedir viaje/recibir viaje, viaje activo, etc.).
- (Opcional) capturas de tablet.

Tip: las capturas se sacan del propio teléfono con la app instalada desde el
test cerrado, así salen reales.

---

## 6) Checklist para arrancar el reloj 12×14

- [ ] Pasajero: permiso del service account → reintentar submit vc 77.
- [ ] Conductor: completar ficha (secciones 1–4 de este doc).
- [ ] Pasajero: completar/revisar ficha (probablemente ya tiene parte).
- [ ] Ambos: subir recursos gráficos (sección 5).
- [ ] Ambos: **publicar** el release de Prueba cerrada (rollout).
- [ ] Lista de testers (≥12 cuentas Google reales) seleccionada en la **cerrada** de ambas apps.
- [ ] Repartir el link de participación; testers aceptan e instalan.
- [ ] Esperar 14 días corridos → aparece "Solicitar acceso a producción".
```
