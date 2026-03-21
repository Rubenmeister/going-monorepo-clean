# 🧪 Integration Testing Guide

Complete guide for running and validating all integration tests for mobile apps, analytics dashboard, and notification systems.

---

## Prerequisites

```bash
# Install global dependencies
npm install -g jest @testing-library/react @testing-library/react-native

# Install service dependencies
cd /home/user/going-monorepo-clean
npm install

# Verify all services can start
npm run start:all
```

---

## Test Suites Overview

### 1. Mobile Apps Testing

- **Location**: `mobile-user-app/`, `mobile-driver-app/`, `mobile/`
- **Framework**: Jest, React Testing Library, Expo Testing Library
- **Coverage**: Component rendering, navigation, state management, API integration

### 2. Analytics Dashboard Testing

- **Location**: `analytics-dashboard/` (to be created)
- **Framework**: Jest, React Testing Library
- **Coverage**: Data fetching, charts, filtering, pagination

### 3. Notification Channels Testing

- **Location**: `notifications-service/test/`
- **Framework**: Jest, Socket.io client, Axios
- **Coverage**: Push (FCM), Email (SendGrid), SMS (Twilio), Chat (WebSocket)

---

## Running Tests Locally

### Step 1: Start All Microservices

```bash
cd /home/user/going-monorepo-clean

# Terminal 1: Start all services in parallel
npm run start:all

# Or start individually:
npm run start:transport-service      # Port 3001
npm run start:notifications-service  # Port 3002
npm run start:tracking-service       # Port 3003
npm run start:analytics-service      # Port 3010
npm run start:ratings-service        # Port 3011
```

### Step 2: Setup Test Environment

```bash
# Create .env.test file
cat > .env.test << EOF
# API Configuration
REACT_APP_API_URL=http://localhost:3000
REACT_APP_NOTIFICATIONS_URL=http://localhost:3002
REACT_APP_ANALYTICS_URL=http://localhost:3010

# Firebase Configuration (optional for tests)
GOOGLE_APPLICATION_CREDENTIALS=""

# SendGrid Configuration (optional for tests)
SENDGRID_API_KEY=""
SENDGRID_FROM_EMAIL=""

# Twilio Configuration (optional for tests)
TWILIO_ACCOUNT_SID=""
TWILIO_AUTH_TOKEN=""
TWILIO_PHONE_NUMBER=""

# Test User IDs
TEST_USER_ID="test-user-123"
TEST_DRIVER_ID="test-driver-456"
TEST_RIDE_ID="test-ride-789"
EOF
```

### Step 3: Run Notification Tests

```bash
cd notifications-service

# Run all notification tests
npm run test

# Run specific test file
npm run test -- notification-channels.integration.test.ts

# Run with coverage
npm run test -- --coverage

# Run WebSocket chat tests with verbose output
npm run test -- chat.e2e.test.ts --verbose

# Run tests in watch mode (auto-rerun on changes)
npm run test -- --watch
```

**Expected Output**:

```
PASS  test/notification-channels.integration.test.ts
  Notification Channels Integration Tests
    Push Notifications (Firebase Cloud Messaging)
      ✓ should send push notification successfully (45ms)
      ✓ should handle multiple device tokens (multicast) (52ms)
      ✓ should remove invalid device tokens (38ms)
      ✓ should support platform-specific options (41ms)
      ✓ should track push notification delivery status (1023ms)
      ✓ should handle FCM errors gracefully (35ms)
    Email Notifications (SendGrid)
      ✓ should send email notification successfully (67ms)
      ✓ should generate HTML email with tracking (89ms)
      ✓ should validate email address (32ms)
      ... (30 more tests)
    Real-time Chat (WebSocket via Socket.io)
      ✓ should join ride chat room (145ms)
      ✓ should send message to ride chat (287ms)
      ... (8 more tests)

Test Suites: 1 passed, 1 total
Tests: 45 passed, 45 total
Coverage: 87.2% lines, 84.1% functions, 88.3% branches
```

---

### Step 4: Run Mobile App Tests

```bash
# User App
cd mobile-user-app
npm run test

# Driver App
cd mobile-driver-app
npm run test

# Shared Mobile
cd mobile
npm run test

# Run all mobile tests with coverage
npm run test -- --coverage
```

---

### Step 5: Run Analytics Dashboard Tests

```bash
cd analytics-dashboard

# Install dependencies (if new)
npm install

# Run all tests
npm run test

# Run with coverage report
npm run test -- --coverage

# Generate HTML coverage report
npm run test -- --coverage --coverageReporters=html
# Open: coverage/index.html
```

---

## Manual API Testing

### Using cURL

```bash
# Test Push Notification endpoint
curl -X POST http://localhost:3002/api/notifications/send \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user-123",
    "channels": ["push"],
    "title": "Test Notification",
    "body": "This is a test",
    "metadata": {
      "deviceTokens": ["your_fcm_token"]
    }
  }'

# Test Email Notification endpoint
curl -X POST http://localhost:3002/api/notifications/send \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user-123",
    "channels": ["email"],
    "title": "Ride Receipt",
    "body": "Your ride is complete",
    "metadata": {
      "recipientEmail": "user@example.com",
      "rideId": "test-ride-789"
    }
  }'

# Test SMS Notification endpoint
curl -X POST http://localhost:3002/api/notifications/send \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user-123",
    "channels": ["sms"],
    "title": "Arrival",
    "body": "Driver is 2 minutes away",
    "metadata": {
      "phoneNumber": "+1234567890",
      "rideId": "test-ride-789"
    }
  }'

# Get notification history
curl http://localhost:3002/api/notifications/user/test-user-123
```

### Using Postman

1. Create new Postman collection
2. Import test endpoints:

```json
{
  "name": "Going Platform API Tests",
  "item": [
    {
      "name": "Send Push Notification",
      "request": {
        "method": "POST",
        "url": "http://localhost:3002/api/notifications/send",
        "body": {
          "userId": "test-user-123",
          "channels": ["push"],
          "title": "Test",
          "body": "Test notification"
        }
      }
    },
    {
      "name": "Get Notification History",
      "request": {
        "method": "GET",
        "url": "http://localhost:3002/api/notifications/user/test-user-123"
      }
    }
  ]
}
```

---

## WebSocket Testing

### Using WebSocket Client (Node.js)

```bash
cd notifications-service

# Create test script: test-websocket.js
cat > test-websocket.js << 'EOF'
const io = require('socket.io-client');

const socket = io('http://localhost:3002', {
  transports: ['websocket'],
});

socket.on('connect', () => {
  console.log('✓ Connected to server');

  // Join a ride chat
  socket.emit('chat:join', { rideId: 'test-ride-789' }, (response) => {
    console.log('✓ Joined room:', response.room);
    console.log('✓ Participants:', response.participantCount);

    // Send a message
    socket.emit('chat:message:send', {
      rideId: 'test-ride-789',
      message: 'Hello from test!',
    });
  });
});

socket.on('chat:message:received', (data) => {
  console.log('✓ Received message:', data.message);
  console.log('✓ From:', data.senderName);
  console.log('✓ Timestamp:', data.timestamp);
});

socket.on('disconnect', () => {
  console.log('✓ Disconnected');
  process.exit(0);
});

// Cleanup after 10 seconds
setTimeout(() => {
  socket.disconnect();
}, 10000);
EOF

# Run the test
node test-websocket.js
```

### Using websocat CLI

```bash
# Install websocat (if not installed)
# macOS: brew install websocat
# Linux: cargo install websocat

# Connect to WebSocket server
websocat ws://localhost:3002/socket.io/?transport=websocket

# Send message (in WebSocket connection):
# {"type":"chat:join","rideId":"test-ride-789"}
```

---

## Load Testing

### Using Apache JMeter

```bash
# Create test plan for notifications
cat > load-test.jmx << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<jmeterTestPlan version="1.2">
  <hashTree>
    <TestPlan guiclass="TestPlanGui">
      <elementProp name="TestPlan.user_defined_variables" .../>
      <stringProp name="TestPlan.name">Notification Load Test</stringProp>
    </TestPlan>
    <hashTree>
      <ThreadGroup guiclass="ThreadGroupGui">
        <stringProp name="ThreadGroup.num_threads">50</stringProp>
        <stringProp name="ThreadGroup.ramp_time">10</stringProp>
        <stringProp name="ThreadGroup.duration">60</stringProp>
      </ThreadGroup>
      <hashTree>
        <HTTPSamplerProxy guiclass="HttpTestSampleGui">
          <stringProp name="HTTPSampler.path">/api/notifications/send</stringProp>
          <stringProp name="HTTPSampler.domain">localhost</stringProp>
          <stringProp name="HTTPSampler.port">3002</stringProp>
          <stringProp name="HTTPSampler.method">POST</stringProp>
        </HTTPSamplerProxy>
      </hashTree>
    </hashTree>
  </hashTree>
</jmeterTestPlan>
EOF

# Run load test
jmeter -n -t load-test.jmx -l results.jtl -j jmeter.log
```

### Using K6

```bash
# Create K6 test script
cat > load-test.js << 'EOF'
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 50,          // 50 virtual users
  duration: '5m',   // 5-minute test
  rps: 100,         // 100 requests per second
};

export default function () {
  // Test push notification
  const pushRes = http.post('http://localhost:3002/api/notifications/send', {
    userId: `user-${Math.random()}`,
    channels: ['push'],
    title: 'Load Test',
    body: 'Testing under load',
  });

  check(pushRes, {
    'push notification status 200': (r) => r.status === 200,
  });

  // Test email notification
  const emailRes = http.post('http://localhost:3002/api/notifications/send', {
    userId: `user-${Math.random()}`,
    channels: ['email'],
    title: 'Load Test Email',
    body: 'Testing email under load',
    metadata: {
      recipientEmail: `test-${Math.random()}@example.com`,
    },
  });

  check(emailRes, {
    'email notification status 200': (r) => r.status === 200,
  });

  sleep(1);
}
EOF

# Run K6 load test
k6 run load-test.js
```

---

## CI/CD Integration Testing

### GitHub Actions Workflow

```yaml
name: Integration Tests

on:
  pull_request:
    branches: [main, develop]
  push:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      mongodb:
        image: mongo:6.0
        options: >-
          --health-cmd mongosh
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 27017:27017

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Start microservices
        run: |
          npm run start:notifications-service &
          npm run start:analytics-service &
          sleep 10

      - name: Run notification tests
        working-directory: notifications-service
        run: npm run test

      - name: Run mobile tests
        run: |
          npm run test:mobile-user-app
          npm run test:mobile-driver-app

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
```

---

## Test Coverage Reports

```bash
# Generate coverage for all services
npm run test -- --coverage

# View coverage breakdown
# Coverage will show:
# - Statements covered
# - Branches covered
# - Functions covered
# - Lines covered

# Generate HTML coverage report
npm run test -- --coverage --coverageReporters=html

# Open in browser
open coverage/index.html  # macOS
xdg-open coverage/index.html  # Linux
start coverage/index.html  # Windows
```

---

## Debugging Failed Tests

### Enable Verbose Logging

```bash
# Run tests with debug output
DEBUG=* npm run test

# Or for specific module
DEBUG=notifications-service:* npm run test
```

### Inspect Test Failures

```bash
# Run single test file
npm run test -- notification-channels.integration.test.ts

# Run specific test suite
npm run test -- --testNamePattern="Push Notifications"

# Run with timeout extension (for slow tests)
npm run test -- --testTimeout=10000

# Run with no coverage (faster)
npm run test -- --no-coverage
```

### Common Issues & Solutions

| Issue                    | Solution                                     |
| ------------------------ | -------------------------------------------- | -------------- |
| Tests timeout            | Increase timeout: `--testTimeout=30000`      |
| Port already in use      | Kill process: `lsof -ti:3002                 | xargs kill -9` |
| MongoDB connection fails | Ensure MongoDB is running on port 27017      |
| FCM not available        | Tests mock Firebase when credentials missing |
| Socket connection fails  | Verify Socket.io server is running           |
| Rate limit errors        | Add delays between requests in tests         |

---

## Continuous Testing Setup

### Watch Mode (Auto-rerun on changes)

```bash
npm run test -- --watch

# Watch specific file
npm run test -- notification-channels.integration.test.ts --watch
```

### Test Results Dashboard

```bash
# Generate test results in JSON format
npm run test -- --json --outputFile=test-results.json

# Use test reporting tools:
# - Jest HTML Reporter: jest --json --outputFile=report.json
# - Allure: npm run test -- --reporter=allure-reporter
```

---

## Performance Testing Checklist

- [ ] All 4 notification channels respond < 500ms
- [ ] WebSocket messages deliver < 100ms
- [ ] Message history pagination works
- [ ] 50 concurrent users handled without errors
- [ ] Memory usage stays < 500MB during peak load
- [ ] No memory leaks after 10,000 messages
- [ ] Database queries optimized (< 100ms)
- [ ] API rate limiting works correctly

---

## Next Steps

1. **Run all tests locally** to verify setup
2. **Configure CI/CD** to run tests on each commit
3. **Monitor test coverage** (aim for >80%)
4. **Setup alerts** for failing tests
5. **Document known issues** and workarounds
6. **Schedule regular test runs** (hourly/daily)
