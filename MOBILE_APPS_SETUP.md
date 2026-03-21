# 📱 Mobile Apps Development Guide

## Quick Start

### Prerequisites

```bash
# Required tools
- Node.js 18+ with npm
- Expo CLI: npm install -g expo-cli
- Xcode (macOS for iOS)
- Android Studio (for Android emulator)
- Git
```

### Installation & Setup

```bash
# 1. Install monorepo dependencies
cd /home/user/going-monorepo-clean
npm install

# 2. Install mobile app dependencies (if needed)
cd mobile-user-app && npm install
cd ../mobile-driver-app && npm install
cd ../mobile && npm install
```

---

## Development Servers

### User App (Passenger)

```bash
cd mobile-user-app

# Start Expo development server
npm start

# Run on specific platform:
npm run android    # Android emulator
npm run ios        # iOS simulator
npm run web        # Web browser (http://localhost:8081)
```

### Driver App

```bash
cd mobile-driver-app

# Start Expo development server
npm start

# Run on specific platform:
npm run android
npm run ios
npm run web
```

### Shared Base Mobile App

```bash
cd mobile

npm start
npm run android
npm run ios
npm run web
```

---

## Configuration

### API Connection

**File**: `src/api/apiClient.ts`

```typescript
// Default configuration - UPDATE based on environment
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

// For mobile testing, update to your local IP:
// const API_BASE_URL = 'http://192.168.1.X:3000'
```

### Environment Setup

Create `.env.local` in each app root:

```env
# API Configuration
REACT_APP_API_URL=http://localhost:3000
REACT_APP_TRACKING_URL=http://localhost:3003
REACT_APP_NOTIFICATIONS_URL=http://localhost:3002
REACT_APP_ANALYTICS_URL=http://localhost:3010

# Feature Flags
REACT_APP_ENABLE_PUSH=true
REACT_APP_ENABLE_CHAT=true
REACT_APP_ENABLE_OFFLINE=true

# Map Configuration
REACT_APP_GOOGLE_MAPS_KEY=your_key_here
```

---

## Testing Mobile Apps Locally

### 1. Run All Services

```bash
# Terminal 1: Start all microservices
cd /home/user/going-monorepo-clean
npm run start:all

# This starts:
# - transport-service:3001
# - notifications-service:3002
# - tracking-service:3003
# - analytics-service:3010
# - ratings-service:3011
```

### 2. Start Mobile App Development

```bash
# Terminal 2: User app
cd mobile-user-app
npm start

# Terminal 3: Driver app
cd mobile-driver-app
npm start
```

### 3. Connect Emulator/Device

```bash
# Android
adb reverse tcp:3000 tcp:3000  # Forward port to localhost

# iOS: Navigate to IP address in app (adjust apiClient.ts)
```

---

## Feature Testing

### Authentication Flow

```
1. Launch app
2. Login screen appears
3. Enter credentials (from backend test data)
4. Token persisted in AsyncStorage
5. Bottom tab navigation loads
```

### Real-time Features

```
Tracking Service (Geolocation):
├── Home screen shows nearby drivers/rides
├── Live map with locations
└── Real-time updates via WebSocket

Notifications Service:
├── Push notifications from FCM
├── Real-time chat with driver/passenger
└── SMS delivery status

Analytics Service:
└── Driver statistics visible in Profile tab
```

### Offline Support

```
1. Enable airplane mode
2. Previous screens cached via AsyncStorage
3. Actions queued locally
4. Sync when connection restored
```

---

## Debugging

### Expo DevTools

```bash
# Open Expo DevTools in browser while running:
# Press 'w' in terminal for web debugger
# Press 'j' for React DevTools
# Press 'r' for reload
# Press 'o' to open on device
```

### Logs

```bash
# View app logs in terminal
# Real-time error messages display
# Use console.log for debugging

# Navigate to screens and check logs:
# - Auth flow logs
# - API request logs
# - AsyncStorage events
# - WebSocket connection logs
```

### React Navigation

```typescript
// Debug navigation state:
// Enable via navigationRef in app

// See state in logs when navigating between tabs
```

---

## Build & Deployment

### Web Build

```bash
cd mobile-user-app
npm run build:web

# Output: dist/ folder
# Deploy to: Netlify, Vercel, AWS S3
```

### Android Build

```bash
expo build:android --release-channel=production
# Download APK from expo.dev
# Install on device: adb install app.apk
```

### iOS Build

```bash
expo build:ios --release-channel=production
# Download IPA from expo.dev
# Upload to App Store via Transporter
```

---

## Architecture

### Navigation Structure

```
App.tsx
├── Auth Stack (unauthenticated)
│   ├── LoginScreen
│   └── RegisterScreen
└── Tab Navigation (authenticated)
    ├── HomeScreen (ride request/browsing)
    ├── SearchScreen (search interface)
    ├── BookingsScreen (past/active rides)
    └── ProfileScreen (user profile & settings)
```

### State Management

```typescript
// Zustand stores:
import { useAuthStore } from '@/stores/authStore';

// Access anywhere without props drilling:
const { user, token, login, logout } = useAuthStore();
```

### API Integration

```typescript
// Axios client:
import apiClient from '@/api/apiClient';

// Usage:
const response = await apiClient.get('/api/transport/rides');
const ride = await apiClient.post('/api/transport/rides', rideData);
```

---

## Troubleshooting

### Issue: App crashes on startup

```
Solution:
1. Clear Expo cache: npm cache clean --force
2. Clear app cache: CMD+Shift+K (iOS) or Settings > Apps > Clear Cache (Android)
3. Reinstall node_modules: rm -rf node_modules && npm install
4. Restart Expo server: npm start --clear
```

### Issue: API calls fail

```
Solution:
1. Verify microservices are running
2. Check API URL in .env.local
3. Use IP address instead of localhost for physical devices
4. Check network tab in DevTools for actual error
```

### Issue: Maps not showing

```
Solution:
1. Add Google Maps API key to .env
2. Verify location permissions granted in app
3. Check device has location enabled
4. Review react-native-maps configuration
```

### Issue: AsyncStorage not persisting

```
Solution:
1. Ensure app has storage permissions
2. Check AsyncStorage is initialized before use
3. Verify no app cache clear between runs
4. Check device storage isn't full
```

### Issue: WebSocket chat not connecting

```
Solution:
1. Verify notifications-service running on port 3002
2. Check Socket.io namespace: /chat
3. Verify room format: ride:{rideId}
4. Check browser console for WebSocket errors
5. Review CORS configuration
```

---

## Performance Tips

1. **Lazy Load Components**: Use React.lazy for screen components
2. **Optimize Lists**: FlatList with keyExtractor for large lists
3. **Cache Images**: Pre-load maps and avatars
4. **Reduce Rerender**: Use useCallback, useMemo, React.memo
5. **Monitor Bundle Size**: `npx expo prebuild --clean`

---

## Links & Resources

- [Expo Documentation](https://docs.expo.dev)
- [React Native Docs](https://reactnative.dev)
- [React Navigation](https://reactnavigation.org)
- [Zustand](https://github.com/pmndrs/zustand)
- [Axios](https://axios-http.com)
