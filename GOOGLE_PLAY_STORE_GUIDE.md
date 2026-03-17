# Google Play Store — Guía de Publicación

> **Estado actual (Marzo 2026)**
>
> Las apps están preparadas en código. El API URL ya apunta a `https://api.goingec.com`.
> Faltan los pasos externos (cuentas, credenciales, archivos de config) descritos aquí.

---

## Apps a publicar

| App | Paquete | Directorio |
|-----|---------|------------|
| Going - Pasajero | `com.going.userapp` | `mobile-user-app/` |
| Going - Conductor | `com.going.driverapp` | `mobile-driver-app/` |

---

## Paso 1 — Cuenta de Google Play Developer

1. Crear cuenta en https://play.google.com/console (costo único: $25 USD)
2. Aceptar acuerdos de desarrollador
3. Completar perfil de cuenta

---

## Paso 2 — Firebase (para push notifications y analytics)

Ambas apps usan Firebase para push notifications (FCM) y analytics.
**Cada app necesita su propio `google-services.json`.**

### 2a. Crear proyecto Firebase

1. Ir a https://console.firebase.google.com
2. Crear proyecto "Going Ecuador" (o usar uno existente)

### 2b. Registrar las apps Android

**Para mobile-user-app:**
1. En Firebase Console → Agregar app → Android
2. Package name: `com.going.userapp`
3. Descargar `google-services.json`
4. Colocarlo en: `mobile-user-app/google-services.json`

**Para mobile-driver-app:**
1. En Firebase Console → Agregar app → Android
2. Package name: `com.going.driverapp`
3. Descargar `google-services.json`
4. Colocarlo en: `mobile-driver-app/google-services.json`

### 2c. Habilitar servicios en Firebase

- Authentication → Habilitar Email/Password
- Cloud Messaging → está habilitado por defecto

---

## Paso 3 — EAS (Expo Application Services)

EAS Build compila los APKs/AABs en la nube sin necesitar Android Studio.

### 3a. Instalar EAS CLI e iniciar sesión

```bash
npm install -g eas-cli
eas login
```

### 3b. Registrar cada app con EAS

```bash
# Para la app de pasajero
cd mobile-user-app
eas init
# Esto reemplaza "REPLACE_WITH_EAS_PROJECT_UUID" en app.json con el UUID real

# Para la app de conductor
cd ../mobile-driver-app
eas init
```

Después del `eas init`, el campo `extra.eas.projectId` en `app.json` tendrá un UUID real
(formato: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`).

---

## Paso 4 — Service Account para Google Play

EAS Submit necesita una Service Account Key para subir automáticamente a Play Store.

1. En Google Play Console → Configuración → Acceso a la API → Crear service account
2. Seguir el link a Google Cloud Console
3. Crear cuenta de servicio con rol "Service Account User"
4. Descargar JSON de credenciales
5. Guardar como `going-monorepo-clean/google-service-account.json`
   (fuera de los directorios de las apps — el `eas.json` ya apunta a `../google-service-account.json`)
6. En Play Console → otorgar permisos a la service account (al menos "Release manager")

---

## Paso 5 — Instalar dependencias

```bash
cd mobile-user-app
npm install

cd ../mobile-driver-app
npm install
```

---

## Paso 6 — Build de producción

### Opción A: AAB para Play Store (recomendado)

```bash
# App de pasajero
cd mobile-user-app
eas build --platform android --profile production

# App de conductor
cd ../mobile-driver-app
eas build --platform android --profile production
```

EAS Build genera el AAB firmado listo para Play Store.
La primera vez pedirá crear o subir un keystore de firma — dejarlo que EAS lo genere automáticamente
(lo guarda en sus servidores de forma segura).

### Opción B: APK para pruebas internas

```bash
eas build --platform android --profile preview
```

---

## Paso 7 — Subir a Play Store

### Opción A: Con EAS Submit (automático)

```bash
# Después del build exitoso:
cd mobile-user-app
eas submit --platform android --latest

cd ../mobile-driver-app
eas submit --platform android --latest
```

### Opción B: Manual en Play Console

1. Descargar el AAB del dashboard de EAS (https://expo.dev)
2. En Play Console → Crear nueva app → Subir AAB
3. Completar ficha de la app: descripción, screenshots, icono de 512px

---

## Paso 8 — Ficha de la app en Play Store

Cada app necesita (en Play Console):

- **Nombre de la app**: "Going - Pasajero" / "Going - Conductor"
- **Descripción corta** (80 caracteres)
- **Descripción larga** (4000 caracteres)
- **Icono**: 512x512 px PNG (ya existe en `assets/icon.png` — verificar que sea 512x512)
- **Gráfico de funciones**: 1024x500 px
- **Screenshots**: mínimo 2 por tipo de dispositivo (teléfono)
- **Categoría**: Mapas y navegación / Transporte y logística
- **Clasificación de contenido**: rellenar cuestionario
- **Política de privacidad**: URL requerida

---

## Checklist rápido

- [ ] Cuenta Google Play Developer ($25)
- [ ] Proyecto Firebase creado
- [ ] `mobile-user-app/google-services.json` colocado
- [ ] `mobile-driver-app/google-services.json` colocado
- [ ] `eas login` completado
- [ ] `eas init` en cada app (actualiza projectId en app.json)
- [ ] `npm install` en cada app
- [ ] `google-service-account.json` en raíz del monorepo
- [ ] `eas build --platform android --profile production` exitoso para ambas apps
- [ ] Fichas completas en Play Console
- [ ] `eas submit --platform android` o subida manual del AAB

---

## Notas importantes

- **API URL**: Ya está configurado como `https://api.goingec.com` en `eas.json` y código fuente.
- **Versión**: Ambas apps están en `version: "2.0.0"`, `versionCode: 2`. EAS con `autoIncrement: true` incrementará automáticamente el versionCode en cada build de producción.
- **Firma**: EAS gestiona el keystore automáticamente. Guardar el keystore exportado de EAS como respaldo.
- **Background location** (driver app): Requiere justificación adicional en Play Console para el permiso `ACCESS_BACKGROUND_LOCATION`. Preparar texto explicando por qué el conductor necesita ubicación en segundo plano.
- **Maps**: Las apps usan Mapbox (`@rnmapbox/maps`). No requiere Google Maps API key para Android.
