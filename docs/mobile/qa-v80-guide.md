# Guía QA — probar los APKs v80 en dispositivo (viajes compartidos)

> Objetivo: instalar los builds actuales en un Android real y verificar el flujo
> de **viaje compartido** end-to-end contra prod. Los **10 conductores virtuales**
> ya están sembrados en las 3 rutas de arranque → vas a ver salidas reales.
>
> Apps (Expo account `rubenmeister`):
> - **Comprador**: `going-mobile` · v2.0.0 · versionCode **80** · `com.going.userapp` · projectId `429b7296-34cd-43bb-a927-1e85d4c00eae`
> - **Conductor**: `going-driver-app` · `com.going.conductor` · projectId `9b75df0a-5470-45f1-86e8-e4463bcd1f63`
> - Ambos APKs apuntan a **https://api.goingec.com** (prod).

---

## 1. Conseguir el APK v80 (perfil `preview` = APK)

**Opción A — ya existe el build (lo más probable):**
En la terminal, dentro de `mobile-user-app/`:
```
eas build:list --platform android --profile preview --limit 5
```
Busca el de **versionCode 80** → copia su **link de descarga** (o ábrelo en el
dashboard: https://expo.dev/accounts/rubenmeister/projects/going-mobile/builds).

**Opción B — no existe / quieres uno fresco:**
```
cd mobile-user-app
eas build -p android --profile preview
```
(~10-20 min. Al terminar da un link de descarga del `.apk`.)

Para el **conductor** repite en `mobile-driver-app/`.

---

## 2. Instalar en el teléfono

**Vía link (sin cable):**
1. Abre el link de descarga del APK **en el navegador del teléfono**.
2. Descarga → toca el `.apk` → Android pedirá permitir **"instalar apps desconocidas"** para ese navegador → actívalo → **Instalar**.

**Vía USB (con cable + adb):**
```
adb install ruta/al/going-mobile-v80.apk
```
(Activa "Depuración USB" en Opciones de desarrollador del teléfono.)

> Si ya tienes una versión vieja instalada y falla por firma distinta,
> desinstala la anterior primero (`adb uninstall com.going.userapp`).

---

## 3. Probar el flujo de VIAJE COMPARTIDO (comprador)

Con los conductores virtuales sembrados, este flujo debe funcionar YA:

1. **Abre "Going App - Pasajero"** → regístrate (correo + contraseña ≥12) o entra.
2. En **Home** toca **"Viaje Compartido"** ("Paga solo tu asiento").
3. **¿Dónde te recogemos?** → elige un origen de las 3 rutas de arranque:
   - **Ibarra** (ruta sierra_norte)  ·  **Riobamba** (sierra_centro)  ·  **Santo Domingo** (costa_quito)
4. **¿A dónde vas?** → **Quito**.
5. Elige **programado** y una **fecha/hora** (las agendas cubren todos los días, 04:00–20:00).
6. Deberías ver **varias salidas** con **conductor, hora, asientos y precio**:
   - Ibarra→Quito y Sto.Domingo→Quito ≈ **$15/asiento** · Riobamba→Quito ≈ **$20/asiento**.
7. Elige una → **Reservar asiento** → confirma (opcional: asiento delantero +$3, grupo).
8. **Pago** → elige **Efectivo** (Datafast/DeUna están deshabilitados hasta las credenciales) → confirmar.
9. La reserva queda **confirmada** (cupo asegurado — la "certeza").

### ✔️ Checklist QA (los 9 requisitos)
- [ ] **Compartido es lo primero** en Home; **Privado NO aparece** (flag OFF).
- [ ] Registro pide credenciales **una sola vez**; el resto de datos se piden con el uso.
- [ ] Al fijar origen/destino se ve **la lista de precios de compartidos** (no la de privado).
- [ ] **Envíos** es un flujo aparte.
- [ ] El pago muestra **Efectivo** (y Datafast/DeUna deshabilitados con nota).
- [ ] Tras reservar, la tarjeta del viaje muestra **conductor + salida + asientos**.
- [ ] Idioma **neutro de Ecuador** (sin "vos"): "tú", "carga/envía".
- [ ] Textos e imágenes cargan bien (sin cajas rotas).

*(Las alertas de proximidad 10min/3min/"llegó" y la llamada conductor↔pasajero
requieren un viaje próximo a la salida — se prueban mejor con el carril tiempo-real
o acercando la hora de salida.)*

---

## 4. (Opcional) App conductor
Instala **going-driver-app** (v80), regístrate, y en **Mi agenda**
(`DriverScheduleScreen`) publica rutas/días/horas. Sirve para probar el registro
del conductor real (los virtuales ya cubren la búsqueda del comprador).

---

## Notas
- Los conductores virtuales (`VSCHED_*`) y compradores de prueba (`buyer-e2e-*`)
  quedan en prod para más pruebas (Rubén pidió mantenerlos). **Limpiar antes del
  go-live real** para no mezclarlos con conductores reales
  (job `seed-virtual-drivers` con `--clean`).
- Si una salida no aparece: confirma que buscas **programado** (no inmediato) y una
  de las 3 rutas de arranque; el backend materializa las salidas al buscar.
- Reporta cualquier fallo con: pantalla, ruta probada, y screenshot.
