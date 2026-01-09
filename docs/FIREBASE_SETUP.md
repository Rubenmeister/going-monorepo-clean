# Firebase Setup Guide for Going Superapp

This guide walks you through setting up Firebase for push notifications and phone authentication in the Going Superapp.

## Prerequisites

- Google Cloud account (same as your GCP project)
- Access to Firebase Console: https://console.firebase.google.com/
- Access to both mobile app source code

---

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"**
3. Enter project name: `going-superapp` (or link to existing GCP project)
4. Enable Google Analytics (recommended)
5. Select your Analytics account or create new one
6. Click **"Create project"**

> **Tip:** If you already have a GCP project, you can link Firebase to it for unified billing.

---

## Step 2: Add Android App

1. In Firebase Console, click **"Add app"** → **Android**
2. Enter the Android package name:
   - For user app: `com.going.userapp`
   - For driver app: `com.going.driverapp`
3. Enter app nickname: `Going User App` / `Going Driver App`
4. (Optional) Enter SHA-1 for Google Sign-In later
5. Click **"Register app"**

### Download and Install Config

1. Download `google-services.json`
2. Place it in:
   ```
   apps/mobile-user-app/android/app/google-services.json
   apps/mobile-driver-app/android/app/google-services.json
   ```

### Add Firebase SDK to Android

The dependencies are already configured if using React Native Firebase. Verify in `android/build.gradle`:

```gradle
buildscript {
    dependencies {
        classpath 'com.google.gms:google-services:4.4.0'
    }
}
```

And in `android/app/build.gradle`:

```gradle
apply plugin: 'com.google.gms.google-services'
```

---

## Step 3: Add iOS App

1. In Firebase Console, click **"Add app"** → **iOS**
2. Enter the iOS bundle ID:
   - For user app: `com.going.userapp`
   - For driver app: `com.going.driverapp`
3. Enter app nickname
4. Click **"Register app"**

### Download and Install Config

1. Download `GoogleService-Info.plist`
2. Place it in:
   ```
   apps/mobile-user-app/ios/GoogleService-Info.plist
   apps/mobile-driver-app/ios/GoogleService-Info.plist
   ```
3. Open Xcode and add the file to your project (drag & drop, ensure "Copy items if needed" is checked)

### Configure iOS for Push Notifications

1. In Xcode, go to **Signing & Capabilities**
2. Click **"+ Capability"**
3. Add **"Push Notifications"**
4. Add **"Background Modes"** and check:
   - Remote notifications
   - Background fetch

---

## Step 4: Generate Service Account Key (Backend)

1. In Firebase Console, go to **Project Settings** → **Service accounts**
2. Click **"Generate new private key"**
3. Download the JSON file
4. **IMPORTANT:** Never commit this file to git!

### Configure Environment Variables

Extract these values from the JSON file and add to your `.env`:

```env
# Firebase Admin SDK Configuration
FIREBASE_PROJECT_ID=going-superapp
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@going-superapp.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n"
```

> **Note:** The `FIREBASE_PRIVATE_KEY` contains newlines. Make sure to wrap it in quotes and keep the `\n` characters.

---

## Step 5: Enable Cloud Messaging

1. In Firebase Console, go to **Engage** → **Messaging**
2. Firebase Cloud Messaging is enabled by default
3. Note your **Server Key** (for testing via API)

### Configure APNs for iOS

1. Go to **Project Settings** → **Cloud Messaging** → **Apple app configuration**
2. Upload your APNs Authentication Key:
   - Go to [Apple Developer Portal](https://developer.apple.com/account/resources/authkeys/list)
   - Create a new key with "Apple Push Notifications service (APNs)" enabled
   - Download the `.p8` file
   - Upload to Firebase with your Key ID and Team ID

---

## Step 6: Enable Phone Authentication (Optional)

If using Firebase Phone Auth instead of Twilio for OTP:

1. Go to **Authentication** → **Sign-in method**
2. Enable **Phone**
3. Add test phone numbers for development:
   - +1 555-555-1234 → 123456 (test verification code)
   - +593 99-999-9999 → 123456 (Ecuador test number)

---

## Step 7: Install React Native Firebase

Run these commands in your monorepo root:

```bash
# Install Firebase packages
npm install @react-native-firebase/app @react-native-firebase/messaging

# For iOS, install pods
cd apps/mobile-user-app/ios && pod install && cd ../../..
cd apps/mobile-driver-app/ios && pod install && cd ../../..
```

---

## Step 8: Test Push Notifications

### From Firebase Console

1. Go to **Engage** → **Messaging**
2. Click **"Create your first campaign"** → **"Firebase Notification messages"**
3. Enter a test title and body
4. Target your app
5. Click **"Send test message"**
6. Enter your device's FCM token (from app logs)

### From Backend API

```bash
# Register a device token
curl -X POST http://localhost:3000/device-tokens \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user-123",
    "token": "YOUR_FCM_TOKEN_FROM_APP",
    "platform": "ANDROID"
  }'
```

---

## Environment Variables Summary

Add these to your production environment:

```env
# Firebase Admin SDK
FIREBASE_PROJECT_ID=going-superapp
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@going-superapp.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Existing services
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_FROM_NUMBER=+1234567890

RESEND_API_KEY=your_resend_api_key

META_WA_PHONE_NUMBER_ID=your_phone_number_id
META_WA_ACCESS_TOKEN=your_access_token
```

---

## Troubleshooting

### Token not registering

1. Check that Firebase is initialized correctly
2. Check internet connectivity
3. Check that the API URL is correct in the app

### Notifications not appearing on iOS

1. Verify APNs configuration in Firebase
2. Check that Push Notifications capability is added in Xcode
3. Test on a real device (simulators don't receive push)

### Notifications not appearing on Android

1. Verify `google-services.json` is in the correct location
2. Check that the notification channel is created (Android 8+)
3. Check battery optimization settings

---

## Cost Estimate

| Service             | Free Tier    | Estimated Monthly Cost   |
| ------------------- | ------------ | ------------------------ |
| Firebase FCM        | Unlimited    | **$0**                   |
| Firebase Phone Auth | 10,000/month | **$0** (under free tier) |
| Firebase Analytics  | Unlimited    | **$0**                   |

**Total: $0/month** for messaging and authentication! 🎉
