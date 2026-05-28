# Going Ecuador — Smoke Test Manual (QA pre-launch)

> Script paso a paso para verificar que los flujos críticos funcionan end-to-end con un conductor real y un pasajero real.
>
> Tiempo total estimado: **2-3 horas** con un dispositivo Android real + un emulador.

---

## Preparación

### Dispositivos
- **Pasajero**: dispositivo Android real (o emulador Pixel 6+) con Google Play
- **Conductor**: emulador Pixel 6 con Google Play services + GPS mock o dispositivo Android real

### Cuentas
- Crear 2 cuentas Gmail nuevas (1 para pasajero, 1 para conductor) — NO usar cuentas existentes para no contaminar datos
- Tener el `seed-synthetic-drivers` ejecutado de antemano para tener visibilidad de drivers cercanos

### Variables a verificar
- `EXPO_PUBLIC_API_URL=https://api.goingec.com` (no localhost)
- `EXPO_PUBLIC_MAPBOX_TOKEN` válido

---

## Flujo 1 — Registro pasajero (~5 min)

1. Instalar APK Internal Testing de Going Pasajero
2. Abrir → Splash Going (rojo + amarillo correctos)
3. Pantalla login → tap "Crear cuenta"
4. Ingresar: nombre, apellido, email, teléfono `+593 9XX XXX XXX`, contraseña
5. ✅ Verificar email recibe OTP
6. Ingresar OTP → Home aparece
7. **Validar:**
   - Hero con dirección detectada (Quito)
   - Botones grandes: Compartido / Privado / Envíos
   - Footer con servicios disponibles

**Falla esperada si:** `EXPO_PUBLIC_API_URL` apunta a algo distinto de producción.

---

## Flujo 2 — Solicitar viaje compartido intracity (~10 min)

1. En Home → tap "Compartido"
2. Seleccionar pickup → debería usar GPS actual (Quito)
3. Seleccionar destino → buscar "Aeropuerto Tababela"
4. ✅ Aparecen opciones con precios:
   - Quito Sur → Tababela: $30 privado
   - Quito Norte → Tababela: $22 privado
   - **NO debería aparecer carpool al aeropuerto** (regla de seguridad)
5. Tap opción → ConfirmRide aparece con tarifa real + medios de pago
6. Seleccionar Datafast → ingresar tarjeta de prueba
7. Confirmar → estado "Buscando conductor..."
8. **Validar:**
   - Tarifa = $22-$30 según zona
   - Mapa muestra ruta
   - Conductor asignado en menos de 60 s (si hay synthetic + activo)

---

## Flujo 3 — Solicitar viaje interurbano (Quito → Ambato) (~10 min)

1. Home → tap "Privado"
2. Pickup Quito centro → Destino Ambato centro
3. ✅ Tarifa esperada: **$60 privado** o **$15 por asiento si compartido**
4. Si compartido: seleccionar 1-3 asientos
5. Confirmar
6. **Validar:**
   - Tarifa coincide con tabla canónica (KB tarifas)
   - Tipo de vehículo = SUV (mínimo)
   - Tiempo estimado coherente (~2:30 h)

---

## Flujo 4 — Función SOS durante viaje activo (~5 min)

1. Con viaje activo iniciado (paso 2 o 3)
2. En ActiveRideScreen → tap botón rojo "SOS"
3. Aparece modal con opciones
4. **Validar:**
   - Modal cubre toda la pantalla (no se puede ignorar)
   - Botones: "Llamar al 911", "Compartir ubicación", "Cancelar"
   - Llamada a 911 abre marcador del teléfono
   - Ubicación compartida envía push a contactos de confianza

---

## Flujo 5 — Crear envío + tracking + OTP (~10 min)

1. Home → tap "Envíos"
2. Origen Quito centro → Destino Cumbayá
3. Seleccionar tamaño paquete: Mediano ($8)
4. Ingresar destinatario: nombre + teléfono
5. Confirmar → estado "Buscando mensajero"
6. Una vez aceptado → tracking en mapa
7. Al recoger: conductor sube foto
8. En entrega: conductor pide OTP al pasajero destinatario
9. **Validar:**
   - Solo vehículos SUV/SUVXL toman envíos (regla de matching)
   - OTP 4 dígitos visible al destinatario
   - Foto de entrega se guarda

---

## Flujo 6 — Programar viaje futuro (~5 min)

1. Home → tap "Programar"
2. Fecha mañana, 10:00 AM
3. Origen Quito → Destino Latacunga
4. Confirmar
5. Ir a tab "Mis viajes" → debe aparecer en "Próximos"
6. **Validar:**
   - Tarifa pre-confirmada ($12 compartido)
   - Recordatorio push 1 h antes (esperar mañana o usar mock time)

---

## Flujo 7 — Driver app: registro + ir online + aceptar viaje (~30 min)

### Setup conductor
1. Instalar APK Internal Testing de Going Conductor
2. Crear cuenta con 2do email
3. Onboarding: licencia, cédula, SOAT, matrícula (usar PDFs de prueba)
4. ✅ Verificar que el sistema bloquea login si falta algún doc

### Ir online
5. Pantalla principal → tap "Conectarse"
6. Pedir permiso ubicación → "Permitir todo el tiempo"
7. Estado cambia a "En línea" (badge verde)
8. **Validar:**
   - Mapa muestra ubicación actual
   - Bottom sheet con stats del día (viajes, ganancias)

### Recibir viaje (en paralelo desde el pasajero)
9. Pasajero solicita viaje (Flujo 2)
10. Conductor recibe push + ringtone + RideRequestScreen
11. Aceptar dentro de 15 s
12. **Validar:**
    - Navegación con Mapbox al pickup
    - Botón "Llegué" disponible al estar < 100m
    - Verificación con el pasajero (código de 4 dígitos)

### Completar viaje
13. Iniciar viaje → ActiveRideScreen
14. Navegar al destino
15. Tap "Finalizar"
16. Calificar pasajero
17. **Validar:**
    - Ganancia se suma a Wallet
    - Conductor vuelve a estado "Buscando viaje"

---

## Flujo 8 — Pagos (~15 min)

### Datafast tarjeta
1. Pasajero crea viaje
2. En ConfirmRide → seleccionar tarjeta
3. Ingresar tarjeta de prueba Datafast: `4111 1111 1111 1111`
4. CVV 123, exp 12/30
5. Confirmar
6. **Validar:**
   - Redirección a 3DSecure (sandbox)
   - Vuelta a la app con estado "Pago aprobado"

### DeUna QR
1. Pasajero crea viaje
2. En ConfirmRide → seleccionar DeUna
3. Aparece QR
4. Escanear con DeUna app de prueba
5. **Validar:**
   - Pago confirma en backend
   - Estado del viaje cambia a "Pagado"

---

## Flujo 9 — Wellness Guard del conductor (~20 min)

> Difícil de probar sin modificar tiempo. Solo verificar UI.

1. Conductor en línea por > 4 horas continuas (mock time)
2. **Validar:**
   - Aparece notificación "Has manejado 4h continuas. Descanso forzado 15 min"
   - Bloqueo automático en aceptar nuevos viajes
   - Pasados 15 min, puede volver

---

## Flujo 10 — Centro Legal (~5 min)

### Mobile-user-app
1. Profile → Configuración → "Centro Legal"
2. **Validar:**
   - 12 documentos visibles (4 obligatorios + 8 complementarios)
   - Tarjeta SOS destacada arriba
   - Links abren en navegador del sistema
   - Pie con razón social Thorn AI Technologies S.A.S.

### Mobile-driver-app
1. Profile → tap "Centro Legal" (nuevo item)
2. **Validar:**
   - 10 docs (5 obligatorios + 5 complementarios)
   - Wellness Guard explicado arriba
   - Links abren `app.goingec.com/legal/*`

---

## Resultados esperados

✅ **PASS si:** los 10 flujos completan sin crashes y los datos persisten.
🔴 **FAIL si:** cualquier flujo crítico (1, 2, 3, 4, 7, 8) crashea o pierde datos.

Reportar a `soporte@goingec.com` con:
- Flujo + paso exacto
- Screenshot
- Logs (si tenés acceso a `eas device logs`)
- versionCode del APK probado
