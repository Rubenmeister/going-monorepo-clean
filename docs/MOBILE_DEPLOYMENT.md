# Mobile Deployment Guide

This guide outlines the steps to build and upload the **Going** mobile applications to Firebase App Distribution (for testing) and the Apple App Store / Google Play Store (for production).

## Prerequisites

- **Android**: Updated `google-services.json` in `android/app/`.
- **iOS**: Updated `GoogleService-Info.plist` and valid Apple Developer Program membership.
- **Firebase**: A project created in the [Firebase Console](https://console.firebase.google.com/).

---

## 1. Android Deployment (Firebase & Play Store)

### Generate Release Bundle (AAB)
The Android App Bundle (.aab) is the required format for the Play Store.

1. Open a terminal in `apps/mobile-user-app/android` (or `mobile-driver-app`).
2. Run the following command:
   ```bash
   ./gradlew bundleRelease
   ```
3. The output file will be at `app/build/outputs/bundle/release/app-release.aab`.

### Upload to Firebase App Distribution
1. Go to **Release & Monitor > App Distribution** in the Firebase Console.
2. Select your Android app from the dropdown.
3. Drag and drop the `.aab` (or `.apk`) file.
4. Add testers and click **Distribute**.

---

## 2. iOS Deployment (Apple App Store & TestFlight)

### Archive the App in Xcode
1. Open `ios/MobileUserApp.xcworkspace` in Xcode.
2. Select **Product > Scheme > MobileUserApp** and set the destination to **Any iOS Device (arm64)**.
3. Select **Product > Archive**.
4. Once the archive is complete, the **Organizer** window will open.

### Distribute to App Store Connect
1. In the Organizer window, select your archive and click **Distribute App**.
2. Choose **App Store Connect** (for TestFlight or App Store) or **Ad Hoc** (for Firebase).
3. Follow the prompts to sign the app with your Distribution Certificate and Provisioning Profile.
4. Click **Upload**.

### Upload to Firebase App Distribution (Optional)
1. If you chose **Ad Hoc** and exported an `.ipa` file:
2. Go to the Firebase Console > App Distribution.
3. Select the iOS app and upload the `.ipa`.

---

## 3. Automation with Fastlane (Recommended)

To automate these steps and avoid manual Xcode archiving, we recommend setting up **fastlane**.

1. Install fastlane: `brew install fastlane`
2. Run `fastlane init` in the `ios` and `android` directories.
3. You can then use simple commands like:
   ```bash
   fastlane beta  # Upload to TestFlight/Firebase
   fastlane deploy # Upload to App Store
   ```

> [!IMPORTANT]
> **Code Signing**: For iOS, ensure you have a "Distribution" certificate. For Android, ensure your `key.properties` and keystore are correctly configured in `android/app/build.gradle`.
