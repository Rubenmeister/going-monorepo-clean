# Going Superapp: API Keys & Troubleshooting Guide

This guide provides instructions on how to obtain the necessary API keys for Going Superapp and how to resolve common build issues encountered in the monorepo environment.

## 🔑 External Providers & API Keys

### 1. Clerk (Authentication)

Clerk is used for user authentication and securing the API Gateway.

- **Console**: [dashboard.clerk.com](https://dashboard.clerk.com/)
- **Required Keys**:
  - `CLERK_SECRET_KEY`: Found in **API Keys** section.
  - `CLERK_PUBLISHABLE_KEY`: Found in **API Keys** section.
- **Config Loc**: `apps/api-gateway/.env` or root `config/.env.production`

### 2. Stripe (Payments)

Stripe handles all payment processing.

- **Console**: [dashboard.stripe.com](https://dashboard.stripe.com/)
- **Required Keys**:
  - `STRIPE_SECRET_KEY`: Found in **Developers > API Keys**.
  - `STRIPE_WEBHOOK_SECRET`: Obtained after creating a webhook endpoint in **Developers > Webhooks**.
- **Config Loc**: `apps/payment-service/.env`

### 3. Twilio (SMS & OTP)

Used for sending SMS notifications and OTP codes.

- **Console**: [twilio.com/console](https://www.twilio.com/console)
- **Required Keys**:
  - `TWILIO_ACCOUNT_SID`
  - `TWILIO_AUTH_TOKEN`
  - `TWILIO_FROM_NUMBER`
- **Config Loc**: `apps/notifications-service/.env`

### 4. Resend (Email)

Handles transactional emails.

- **Console**: [resend.com/overview](https://resend.com/overview)
- **Required Keys**:
  - `RESEND_API_KEY`
- **Config Loc**: `apps/notifications-service/.env`

### 5. Meta/WhatsApp (Messaging)

Used for WhatsApp notifications.

- **Console**: [developers.facebook.com](https://developers.facebook.com/)
- **Required Keys**:
  - `META_WA_PHONE_NUMBER_ID`
  - `META_WA_ACCESS_TOKEN`
- **Config Loc**: `apps/notifications-service/.env`

### 6. Firebase (Mobile & Push)

Essential for push notifications and mobile authentication.

- **Console**: [console.firebase.google.com](https://console.firebase.google.com/)
- **Setup**: Follow the detailed [FIREBASE_SETUP.md](file:///c:/Users/USER1/going-monorepo-clean/docs/FIREBASE_SETUP.md) for step-by-step instructions.
- **Required Files**: `google-services.json` (Android) and `GoogleService-Info.plist` (iOS).

### 7. Google Maps (Geolocation)

Used for maps and tracking in mobile apps.

- **Console**: [console.cloud.google.com/google/maps-apis](https://console.cloud.google.com/google/maps-apis)
- **Required Keys**:
  - `GOOGLE_MAPS_API_KEY`: Create a key with Maps SDK for Android/iOS, Places API, and Directions API enabled.

---

## 🛠 Troubleshooting Build Problems

If you encounter errors like **"A project with the name ... already exists"** or **"Missing Gradle project configuration folder: .settings"**, follow these steps:

### 1. Clean Java Language Server Cache

This is the most effective fix for "Duplicate root element" or path mismatch errors in VS Code.

1. Open the Command Palette (`Ctrl+Shift+P`).
2. Type and select: **`Java: Clean Java Language Server Workspace`**.
3. Select **`Restart and delete`** when prompted.

### 2. Verify Android Settings

Ensure your `settings.gradle` files (in `apps/mobile-user-app/android` and `apps/mobile-driver-app/android`) point correctly to the root `node_modules`.

```gradle
// Correct relative path for mobile apps in the monorepo
includeBuild("../../../node_modules/react-native/node_modules/@react-native/gradle-plugin")
```

### 3. Gradle Sync

If paths seem incorrect (e.g., missing `apps/`), perform a fresh Gradle sync:

1. Open the **Gradle** view in the VS Code sidebar.
2. Click the **Refresh** icon (Reload All Projects).

### 4. Remove Stale Metadata

If problems persist, you can safely remove local IDE metadata and let the extensions regenerate them:

```powershell
# In the monorepo root
Remove-Item -Recurse -Force .idea
Remove-Item -Recurse -Force .vscode/.settings  # If exists
```

> [!TIP]
> Always use `npx nx build-android mobile-user-app` for building, as Nx handles the complex monorepo pathing automatically.
