# Going Monorepo

## Descripción

Monorepo para la plataforma de transporte **Going**, construido con **Nx**, **NestJS** (DDD), **React** (Vite + Next.js), y **React Native**.

---

## 🚀 Despliegue en Producción

### Prerrequisitos

- Docker & Docker Compose
- Node.js 18+
- Git

### Pasos para Desplegar (Windows)

1. **Configurar Variables de Entorno**
   Crea un archivo `.env` en la raíz (puedes usar `.env.example` como base) y asegura que las contraseñas de producción sean seguras.

2. **Ejecutar Script de Instalación**

   ```powershell
   ./deploy.ps1
   ```

   Este script:

   - Compila las imágenes Docker de los 10 microservicios y el gateway.
   - Levanta la base de datos MongoDB.
   - Inicia todos los contenedores en segundo plano via Docker Compose.

3. **Verificación**
   - **Frontend**: http://localhost:80
   - **Admin Dashboard**: http://localhost:4201
   - **API Gateway**: http://localhost:3000

---

## 📱 Aplicaciones Móviles

### Android

Para generar el APK firmado:

```bash
cd apps/mobile-user-app/android
./gradlew assembleRelease
```

El APK estará en `apps/mobile-user-app/android/app/build/outputs/apk/release/`.

### iOS

Abrir el proyecto en Xcode (`apps/mobile-user-app/ios`) y usar la opción **Product > Archive**.

---

## 🏗️ Arquitectura del Sistema

### Backend (Microservicios)

- **User Auth**: Autenticación JWT.
- **Transport**: Gestión de viajes y conductores.
- **Parcel**: Logística de envíos.
- **Payment**: Integración Stripe.
- **Notifications**: Email/Push.
- **Booking**: Motor de reservas.
- **Tours**: Catálogo de tours.
- **Experience**: Experiencias locales.
- **Tracking**: Geolocalización en tiempo real.
- **Host**: Gestión de anfitriones.

### Frontend

- **Web App**: Portal de usuarios (React + Vite).
- **Admin Dashboard**: Panel administrativo (Next.js).
- **Mobile User**: App nativa para pasajeros (React Native).
- **Mobile Driver**: App nativa para conductores (React Native).

---

## 🛠️ Desarrollo Local

1. Instalar dependencias: `npm install`
2. Levantar DB local: `docker-compose up -d mongo`
3. Iniciar todo: `nx run-many --target=serve --all`

---

**Going Inc. &copy; 2025**
