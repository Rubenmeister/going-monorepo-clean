# Going Ecuador — EAS Build Commands (Android Soft Launch)

> Secuencia exacta de comandos para buildear ambos APKs Android y enviarlos a Play Store Internal Testing.
>
> Asume que ya tenés autenticación EAS configurada (cuenta `rubenmeister`).

---

## Pre-flight (una sola vez)

```powershell
# Verificar versión EAS CLI
eas --version
# Si es < 13, actualizar:
npm install -g eas-cli@latest

# Login (si no estás)
eas login

# Verificar que estás en la cuenta correcta
eas whoami
# Debe decir: rubenmeister
```

---

## Build de mobile-user-app (Going Pasajero)

```powershell
cd C:\Users\USER1\going-monorepo-clean\mobile-user-app

# Verificar config
eas build:configure --platform android

# Build production Android (cloud, ~20 min)
eas build --platform android --profile production --non-interactive

# El comando devuelve una URL del build cuando termina.
# Descarga el AAB (o APK según config) desde esa URL.
```

**Resultado esperado:**
- Build exitoso → AAB firmado en EAS dashboard
- versionCode se incrementa automáticamente (configurado en eas.json)

---

## Build de mobile-driver-app (Going Conductor)

```powershell
cd C:\Users\USER1\going-monorepo-clean\mobile-driver-app

# Build production Android
eas build --platform android --profile production --non-interactive
```

⚠️ Driver-app tiene `credentialsSource: remote` + `prebuildCommand: expo prebuild --clean` en eas.json. El prebuild aplica el plugin Kotlin custom (`./plugins/withKotlinVersion`) — esto puede agregar 2-3 min al build.

---

## Submit a Play Store (Internal Track)

Una vez que ambos builds terminen exitosamente:

```powershell
# User app submit
cd C:\Users\USER1\going-monorepo-clean\mobile-user-app
eas submit --platform android --profile production --latest

# Driver app submit
cd C:\Users\USER1\going-monorepo-clean\mobile-driver-app
eas submit --platform android --profile production --latest
```

Los profiles `submit.production.android` ya están configurados con:
- `track: internal` — va al Internal Testing track (no producción todavía)
- `serviceAccountKeyPath: ../google-service-account.json` — credenciales

Si querés cambiar a track `production` cuando el rollout sea público:

```powershell
# Editar eas.json y cambiar:
#   "track": "internal" → "track": "production"
```

---

## Verificación post-submit

1. Abrir [Play Console](https://play.google.com/console)
2. Seleccionar app **Going Pasajero**
3. Ir a `Testing → Internal Testing`
4. El nuevo release debería aparecer en ~5-10 min en estado "Available to testers"
5. Repetir para **Going Conductor**

---

## Distribución a testers

En Play Console, Internal Testing:
- **Lista de testers:** crear lista con emails de los conductores piloto + Rubén + equipo
- **Opt-in URL:** se genera automáticamente; compartir por WhatsApp

Los testers reciben el link, hacen tap, abren Play Store y descargan la app.

---

## Troubleshooting común

| Error | Solución |
|-------|----------|
| `EAS_PROJECT_NOT_INITIALIZED` | Correr `eas init` |
| `Missing google-service-account.json` | Verificar que existe en raíz del monorepo |
| Build falla con Kotlin version | El plugin custom está; ver `mobile-driver-app/plugins/withKotlinVersion.js` |
| Submit falla con "App not found" | Crear la app primero en Play Console (manualmente la primera vez) |
| `Package name not matching` | Confirmar que app.json y Play Console usan `com.going.userapp` / `com.going.conductor` |
| OAuth verification screen blocking | Listado en Play Console como interno; agregar testers como verificados |

---

## Comandos útiles adicionales

```powershell
# Ver historial de builds
eas build:list

# Ver detalles de un build específico
eas build:view <build-id>

# Cancelar un build en cola
eas build:cancel <build-id>

# Build preview (APK directo, sin Play Store)
eas build --platform android --profile preview --non-interactive

# Ver versionCode actual
cat mobile-user-app/app.json | grep versionCode
cat mobile-driver-app/app.json | grep versionCode
```

---

## Notas finales

- Cada build incrementa el `versionCode` automáticamente (config en eas.json `production.autoIncrement: true`).
- El `versionName` (visible al usuario) se mantiene en `2.0.0` hasta que se decida bumpear semánticamente.
- Si rompés algo y necesitás regenerar credenciales: `eas credentials`.
- **No correr `eas build` desde la raíz del monorepo** — siempre `cd` a la app específica primero. El `eas.json` raíz es un esqueleto vacío.
