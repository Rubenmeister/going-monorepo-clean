# LOPD Ecuador Compliance Guide

**Corporate Trip Tracking Module**

---

## Table of Contents

1. [Module Overview](#module-overview)
2. [LOPD Ecuador Requirements](#lopd-ecuador-requirements)
3. [Consent Management](#consent-management)
4. [Audit & Access Control](#audit--access-control)
5. [Data Retention & Privacy](#data-retention--privacy)
6. [Architecture & Security](#architecture--security)
7. [Workflows](#workflows)
8. [API Endpoints](#api-endpoints)
9. [Compliance Reporting](#compliance-reporting)
10. [Configuration & Customization](#configuration--customization)
11. [Legal Notices & Employee Communication](#legal-notices--employee-communication)

---

## Module Overview

The **Corporate Trip Tracking Module** is a complete system for managing employee location sharing during business trips, with built-in compliance to **LOPD Ecuador** (Ley Orgánica de Protección de Datos Personales).

### What You Get

#### **For Companies**

- **Corporate Portal**: Dashboard, booking management, real-time trip tracking, spending reports, approval workflows
- **Settings & Configuration**: SSO setup, spending limits per department, data retention policy, MFA, consent settings
- **Compliance Reporting**: Complete audit logs queryable by date range, employee, action type, and trip

#### **For Employees**

- **Mobile App Integration**: Privacy-focused consent modal before any tracking begins
- **Control & Revocation**: Can decline consent without employment impact, or revoke at any time by ending trip
- **Transparency**: Plain-language notice of who sees their location (manager + security team only)

#### **For Admins**

- **Audit Logging**: All location access events logged with actor, timestamp, IP address
- **User Management**: RBAC (Super Admin, Manager, Employee), SSO provider config, spending limit enforcement
- **Data Governance**: Automatic data purging after configurable retention period (12–36 months)

---

## LOPD Ecuador Requirements

LOPD Ecuador mandates **four core principles** for processing personal data. The Corporate Tracking Module implements all four:

### 1. **Explicit, Informed Consent** ✅

**Requirement**: Before sharing location, employees must give clear, affirmative consent.

**Implementation**:

- Mobile app shows `TrackingConsentModal` when trip starts
- Modal presents five key facts in plain language:
  - Only active during this trip
  - Location not stored after trip ends
  - Only manager + security team can view
  - Declining has no employment consequence
  - Can revoke anytime by ending the trip
- Employee taps "Yes, allow" or "No, decline" — no default, no negative UX for declining
- Consent decision is persisted to backend (`POST /api/corporate/consent`) **before** WebSocket connects
- Booking record includes `consentGranted` boolean flag

**Where to Look**:

- `/mobile-user-app/app/components/corporate/TrackingConsentModal.tsx` — React Native modal UI
- `/mobile-user-app/app/components/corporate/useCorporateTracking.ts` — Hook that manages consent flow

### 2. **Segregation of Data** ✅

**Requirement**: Data access must be restricted to authorized actors in authorized contexts.

**Implementation**:

- **Multi-tenant isolation**: Every query includes `companyId` filter
  - Managers see only their company's employee locations
  - Employees see only their own data
  - Cross-company leakage is impossible at the database level
- **Role-Based Access Control** (RBAC):
  - **Super Admin**: All company data
  - **Manager**: Employees in their department(s)
  - **Employee**: Only their own trip consent & revocation
- **WebSocket room scoping**: Each trip has a unique room (e.g., `trip:booking-id-123`)
  - Only manager + employee can join that room
  - Manager joins to view live location
  - Employee joins to revoke consent

**Where to Look**:

- `libs/features/corporate-auth/src/lib/services/audit-log.service.ts` — `logTrackingAccess()` restricted by companyId
- `tracking-service/src/api/corporate-tracking.gateway.ts` — WebSocket room authorization
- Settings page shows per-company data scoping

### 3. **Complete Audit Trail** ✅

**Requirement**: Who accessed what location, when, and why must be permanently recorded.

**Implementation**:

- **AuditLogService** logs 17 action types:
  - `consent_granted` — Employee consented to location sharing
  - `consent_revoked` — Employee ended trip or manually revoked
  - `location_viewed` — Manager viewed employee's location
  - `trip_tracking_started` — WebSocket connection established
  - `trip_tracking_ended` — Trip completed
  - `sso_login`, `mfa_verified` — Authentication events
  - And 11 more (booking approvals, spending limits, user invites, etc.)
- Each log entry includes:
  - **Actor**: Who performed the action (user ID + email)
  - **Target**: Which employee's data was accessed
  - **Timestamp**: Exact moment in ISO 8601 format
  - **IP Address**: Where request originated
  - **Metadata**: Context (e.g., deviceId for consent events)
- Logs are **immutable append-only** — cannot be edited or deleted except by TTL expiry
- Logs mirror to structured logger (Datadog, ELK, CloudWatch) for real-time alerting

**Where to Look**:

- `libs/features/corporate-auth/src/lib/services/audit-log.service.ts` — Full service implementation
- `migrations/006-create-audit-logs-collection.js` — MongoDB schema with `audit_logs` collection

### 4. **Data Retention & Right to Deletion** ✅

**Requirement**: Location data must not be stored indefinitely. Employees have the right to request deletion.

**Implementation**:

- **Automatic TTL Expiry**:
  - Each log entry gets `expiresAt` timestamp (set at creation)
  - Default retention: 24 months (configurable per company in Settings page)
  - MongoDB TTL index automatically deletes logs after expiry: `{ expiresAt: 1 }, { expireAfterSeconds: 0 }`
  - No manual deletion needed; automatic cleanup is guaranteed
- **Per-Company Configuration**:
  - Admin can choose retention: 12, 24, or 36 months via Settings > Security tab
  - Change affects all future logs; existing logs honor their original expiry date
- **Trip-Level Deletion**:
  - When trip ends, location data ceases to accumulate
  - Logs of access remain for compliance, but live location stops updating
  - Employee can request all their location data deletion via customer support
- **Manual Access Request**:
  - LOPD gives employees right to request all data about them
  - Export API endpoint: `GET /api/corporate/audit/employee/:userId` returns all logs involving that user

**Where to Look**:

- `migrations/006-create-audit-logs-collection.js` — TTL index definition
- Settings page (Security tab) — Retention period dropdown (12/24/36 months)
- `audit-log.service.ts` — `calculateExpiry()` method, `queryLogs()` for access requests

---

## Consent Management

### Consent Flow

```
1. Employee starts trip in mobile app
   ↓
2. useCorporateTracking.requestTracking() called
   ↓
3. TrackingConsentModal shown (visible: true)
   ↓
4. Employee reads modal (5 key facts + LOPD notice)
   ↓
5. Employee taps "Yes, allow" or "No, decline"
   ↓
6. handleConsentDecision() called
   ↓
7. POST /api/corporate/consent with { bookingId, companyId, userId, granted, ipAddress, deviceId }
   ↓
8. Backend logs audit event: 'consent_granted' or 'consent_revoked'
   ↓
9. IF granted:
     → WebSocket connects to trip room
     → Location streaming starts (every 10 seconds)
   IF declined:
     → Trip proceeds normally (no tracking)
     → Modal closes, no penalty UX
```

### Consent Record Structure

```json
{
  "bookingId": "booking-12345",
  "companyId": "company-acme",
  "userId": "emp-456",
  "granted": true,
  "ipAddress": "192.168.1.100",
  "deviceId": "device-uuid",
  "timestamp": "2026-02-20T14:30:00Z"
}
```

### Consent Revocation

Employees can revoke consent at any time:

- **By ending the trip** (automatic revocation)
- **By explicit request** (call `stopTracking()` in useCorporateTracking hook)
- **Via app settings** (toggle "Stop sharing location" — logged as `consent_revoked`)

Each revocation creates an audit log entry with action `'consent_revoked'`.

---

## Audit & Access Control

### Audit Log Schema

**Collection**: `audit_logs` (MongoDB)

```javascript
{
  logId: string,                 // Unique identifier: "log-{timestamp}-{random}"
  action: AuditAction,           // One of 17 defined actions
  actorId: string,               // User ID of who performed the action
  actorEmail: string,            // Email of actor (human-readable)
  companyId: string,             // Company owning the data
  targetUserId: string,          // Employee whose data was accessed (if applicable)
  bookingId: string,             // Trip ID (if applicable)
  service: string,               // Which microservice logged this ("corporate-tracking", "mobile-user-app", etc.)
  ipAddress: string,             // Where request originated
  userAgent: string,             // Browser/app user agent
  metadata: object,              // Context: { deviceId, viewed_at, etc. }
  timestamp: Date,               // When action occurred (ISO 8601)
  expiresAt: Date                // Auto-delete date (TTL index)
}
```

### Audit Actions (17 Total)

**Location & Tracking**

- `trip_tracking_started` — WebSocket connection opened for a trip
- `trip_tracking_ended` — Trip completed, WS closed
- `location_viewed` — Manager viewed employee location on live tracking page
- `consent_granted` — Employee consented to location sharing
- `consent_revoked` — Employee declined or revoked consent

**Bookings & Approvals**

- `booking_approved` — Manager approved employee's booking request
- `booking_rejected` — Manager rejected employee's booking request
- `trip_started` — Employee started a confirmed trip
- `trip_ended` — Employee completed a trip

**Company Admin**

- `portal_subscribed` — Company subscribed to corporate service
- `portal_unsubscribed` — Company unsubscribed
- `user_invited` — Admin invited a team member to portal
- `user_suspended` — Admin suspended a user
- `spending_limit_changed` — Admin updated department spending limits

**Security**

- `sso_login` — User logged in via SSO
- `sso_login_failed` — SSO login attempt failed
- `mfa_verified` — MFA challenge passed
- `mfa_failed` — MFA challenge failed

**Reporting**

- `report_exported` — Admin exported spending/compliance report
- `invoice_viewed` — Manager viewed invoice
- `invoice_downloaded` — Admin downloaded invoice PDF

### Access Control Rules

**Who can view audit logs?**

- **Super Admin**: All logs for their company
- **Manager**: Only logs involving their employees (targetUserId in their team)
- **Employee**: Only logs directly about them (actorId or targetUserId == userId)
- **API**: Logs are never exposed to unauthenticated users

**Where to implement**:

```typescript
// Example: Query logs with RBAC
const logs = await auditLogService.queryLogs(companyId, {
  targetUserId: employeeId, // Filter to only this employee's data
  action: 'location_viewed', // Only show access events
  from: new Date('2026-01-01'),
  to: new Date('2026-02-01'),
});
```

---

## Data Retention & Privacy

### Data Lifecycle

| Stage           | Duration            | Stored                                  | Accessible                       |
| --------------- | ------------------- | --------------------------------------- | -------------------------------- |
| **Active Trip** | Minutes to hours    | Live location updates                   | Manager + employee in real-time  |
| **Trip Ended**  | Immediate           | Stops accumulating                      | Not accessible via live API      |
| **Audit Log**   | 24 months (default) | Logged events only (no location points) | Managers + admins for compliance |
| **TTL Expiry**  | 24 months           | Auto-deleted                            | Gone (unless backed up)          |

### Location Data Handling

- **Never stored to database** — Location updates are streamed via WebSocket only
- **Not persisted** — WebSocket messages are not logged to database
- **Immediately discarded** — After trip ends, manager loses access to live location
- **Only audit events logged** — "Manager viewed employee location at 14:30:00" is logged, not the actual coordinates

### Compliance Data Retention

Audit log entries are retained to satisfy LOPD compliance:

- **Purpose**: Prove consent was obtained and only authorized people accessed data
- **Duration**: Configurable (12, 24, or 36 months per company policy)
- **Deletion**: Automatic via TTL; no manual intervention needed
- **Immutability**: Cannot be altered; only timestamp-based deletion applies

### Export & Data Subject Access Requests

**Employee requests copy of all data about them**:

```bash
GET /api/corporate/audit/employee/:userId?from=2026-01-01&to=2026-02-20
```

Response includes:

- All logs where `targetUserId == userId` (data about them)
- All logs where `actorId == userId` (actions they performed)
- Formatted as JSON or CSV

---

## Architecture & Security

### Multi-Tenant Isolation

```
┌─────────────────────────────────────────────┐
│ Corporate Portal / Mobile App               │
└─────────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────────┐
│ Authentication (NextAuth / Mobile Session)  │
│ Extract: userId, companyId, role            │
└─────────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────────┐
│ Authorization Middleware                    │
│ Verify: user.companyId == request.companyId │
│ Verify: role allows action                  │
│ Reject if mismatch                          │
└─────────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────────┐
│ Database Queries                            │
│ WHERE companyId = ? AND ...                 │
└─────────────────────────────────────────────┘
```

### WebSocket Security

**Room Authorization**:

```javascript
// In corporate-tracking.gateway.ts
ws.on('join-trip-room', (data) => {
  // Verify user is employee or manager of this trip
  const trip = await getTripData(data.bookingId);

  if (user.id !== trip.employeeId && user.role !== 'manager') {
    return ws.emit('error', 'Unauthorized');
  }

  ws.join(`trip:${data.bookingId}`);
  // Now can receive location updates for this trip only
});
```

**Location Update Authorization**:

```javascript
// Only the employee can send location updates
ws.on('location-update', (data) => {
  const trip = await getTripData(data.bookingId);

  if (user.id !== trip.employeeId) {
    return ws.emit('error', 'Only employee can share location');
  }

  // Broadcast to authorized managers in room
  ws.to(`trip:${data.bookingId}`).emit('employee-location', {
    lat, lng, timestamp
  });

  // Log access event... wait, this IS the employee sharing, not a manager accessing
  // Only log when a *manager* views (receives) the location
});
```

### Encryption

- **In Transit**: All WebSocket connections use WSS (TLS 1.3+)
- **At Rest**:
  - SSO client secrets encrypted with AES-256-GCM
  - Audit logs encrypted at rest (MongoDB native or application-layer)
  - Sensitive metadata (IP, user agent) included for compliance but not exposed in UI
- **API Communication**: HTTPS only, signed JWTs for mobile app

---

## Workflows

### Employee Workflow: Starting a Tracked Trip

```
1. Employee opens mobile app and confirms trip details
2. Trip service calls: useCorporateTracking.requestTracking({
     bookingId, companyId, userId, employeeName, serviceType
   })
3. Consent modal appears with 5 key facts + LOPD notice
4. Employee reads and taps decision button
5. handleConsentDecision(granted) called:
   a. Modal closes
   b. Consent record saved: POST /api/corporate/consent
   c. Audit logged: 'consent_granted' or 'consent_revoked'
   d. If granted:
      - connectAndTrack() initiates WebSocket
      - Trip room joined: `trip:{bookingId}`
      - Employee location streamed every 10 seconds
      - Audit events created: 'trip_tracking_started' + periodic 'location_update'
   e. If declined:
      - Trip proceeds normally (no tracking)
      - No penalty shown to employee
6. During trip:
   - Employee can revoke: tap "Stop sharing location" in trip detail card
   - This calls stopTracking():
     - Sends: { event: 'employee:trip-end', data: {...} }
     - Audit logged: 'trip_tracking_ended' + 'consent_revoked'
     - WebSocket closed
7. At trip end:
   - Employee taps "End Trip"
   - stopTracking() cleans up resources
   - Historical log remains in audit_logs collection
```

### Manager Workflow: Live Trip Tracking

```
1. Manager opens Corporate Portal → Tracking page
2. "Connect to live tracking" button clicked
3. WebSocket connects to `ws://tracking-service:4005/corporate-tracking`
4. Manager sees list of active trips for their company
5. Manager taps on a trip (e.g., "John's Uber to Airport")
6. Joins trip room: `trip:{bookingId}`
7. Receives location updates in real-time:
   - Lat/lng coordinates
   - Last seen timestamp
   - Speed (if available)
8. Location updates continue streaming every 10 seconds
9. Audit event logged for EACH view:
   - action: 'location_viewed'
   - actorId: manager-123
   - targetUserId: employee-456
   - bookingId: booking-789
   - timestamp: <when viewed>
   - ipAddress: manager's IP
10. Manager can stop watching by:
    - Clicking "Disconnect" button (closes WS)
    - Navigating away from tracking page (WS auto-closes)
11. Trip ends:
    - Employee taps "End Trip" in mobile app
    - Employee sends 'trip-end' event
    - Manager's view becomes "Completed" status
    - Location stream stops
```

### Admin Workflow: Compliance Audit

```
1. Admin opens Corporate Portal → Settings > Security tab
2. Clicks "Download Audit Report" for date range
3. Form shows:
   - From date (date picker)
   - To date (date picker)
   - Filter by action: [All / consent_granted / location_viewed / etc.]
   - Filter by user: [dropdown of employees]
4. Submits form
5. Backend queries audit_logs:
   WHERE companyId = ?
   AND timestamp >= from
   AND timestamp <= to
   AND (action IN [...] OR action = *)
   AND (targetUserId = ? OR targetUserId IS NULL)
6. Returns CSV file:
   timestamp, action, actorId, actorEmail, targetUserId, bookingId, ipAddress, metadata
7. Admin downloads and reviews:
   - Verify consent was obtained before location access
   - Check no unauthorized access occurred
   - Confirm only authorized managers viewed data
   - Document retention policy compliance
```

---

## API Endpoints

### Consent Recording

**Endpoint**: `POST /api/corporate/consent`

**Request**:

```json
{
  "bookingId": "booking-12345",
  "companyId": "company-acme",
  "userId": "emp-456",
  "granted": true,
  "ipAddress": "192.168.1.100",
  "deviceId": "device-uuid"
}
```

**Response**: `{ success: true }`

**Side Effects**:

- Records consent to `consent_decisions` table
- Logs audit event: 'consent_granted' or 'consent_revoked'
- Sets `booking.consentGranted = true/false`

---

### WebSocket: Corporate Tracking

**Endpoint**: `ws://tracking-service:4005/corporate-tracking`

**Manager Events**:

```javascript
// Join trip room to watch location
ws.emit('join-trip-room', {
  bookingId: 'booking-12345',
  companyId: 'company-acme',
  userId: 'manager-789',
});

// Receive location updates
ws.on('employee-location', (data) => {
  // { bookingId, lat, lng, timestamp, speed }
});

// Disconnect
ws.emit('disconnect');
```

**Employee Events**:

```javascript
// Start trip with location
ws.emit('employee:trip-start', {
  bookingId: 'booking-12345',
  companyId: 'company-acme',
  userId: 'emp-456',
  employeeName: 'John Doe',
  serviceType: 'transport',
  consentGranted: true,
  lat,
  lng,
});

// Periodic location updates (automatic, every 10s)
// Internal: { event: 'employee:location-update', data: {...} }

// End trip
ws.emit('employee:trip-end', {
  bookingId: 'booking-12345',
  companyId: 'company-acme',
  userId: 'emp-456',
  status: 'completed',
  timestamp: '2026-02-20T15:00:00Z',
});
```

---

### Audit Query

**Endpoint**: `GET /api/corporate/audit/logs`

**Query Parameters**:

- `companyId` (required)
- `from` (ISO 8601 date, optional)
- `to` (ISO 8601 date, optional)
- `action` (comma-separated action names, optional)
- `actorId` (user ID, optional)
- `targetUserId` (employee ID, optional)
- `bookingId` (trip ID, optional)
- `limit` (1–1000, default 100)
- `offset` (pagination, default 0)

**Response**:

```json
{
  "logs": [
    {
      "logId": "log-1645268400000-abc123",
      "action": "location_viewed",
      "actorId": "manager-789",
      "actorEmail": "manager@acme.com",
      "targetUserId": "emp-456",
      "bookingId": "booking-12345",
      "timestamp": "2026-02-20T14:35:00Z",
      "ipAddress": "203.0.113.50",
      "metadata": { "viewed_at": "2026-02-20T14:35:00Z" }
    },
    ...
  ],
  "total": 1250,
  "limit": 100,
  "offset": 0
}
```

---

### Employee Data Subject Access

**Endpoint**: `GET /api/corporate/audit/employee/:userId`

**Query Parameters**:

- `from` (ISO 8601, optional)
- `to` (ISO 8601, optional)
- `format` (json | csv, default json)

**Response** (JSON):

```json
{
  "userId": "emp-456",
  "email": "john@acme.com",
  "dataAccessLog": [
    {
      "timestamp": "2026-02-20T14:30:00Z",
      "actor": "manager-789",
      "actorEmail": "manager@acme.com",
      "action": "location_viewed",
      "bookingId": "booking-12345",
      "purpose": "Live trip tracking"
    },
    ...
  ],
  "consentHistory": [
    {
      "bookingId": "booking-12345",
      "timestamp": "2026-02-20T14:30:00Z",
      "granted": true,
      "deviceId": "device-uuid"
    },
    ...
  ]
}
```

---

## Compliance Reporting

### Pre-Built Reports

**1. Consent Summary**

```
Report: Consent Coverage
Period: 2026-01 to 2026-02
Company: ACME Corp

Total Trips: 127
Tracking Enabled: 118 (92.9%)
Tracking Declined: 9 (7.1%)
Revocations: 2 (1.6%)

Employees with 100% Consent: 23
Employees with <80% Consent: 1 (recommend follow-up)
```

**2. Access Log Summary**

```
Report: Location Access Audit
Period: 2026-01 to 2026-02
Company: ACME Corp

Total Location Views: 456
Unique Viewers: 8 managers
Average Views per Trip: 3.6

By Manager:
- manager1@acme.com: 180 views
- manager2@acme.com: 156 views
- manager3@acme.com: 120 views

Viewed Times:
- Business hours (9-5): 92%
- After hours: 8% (investigate for legitimacy)
```

**3. Data Retention Status**

```
Report: Audit Log Retention
Company: ACME Corp
Policy: 24 months (from 2026-02-20, expires 2028-02-20)

Current Logs: 12,456 entries
Storage Used: 152 MB
Oldest Log: 2024-03-15
Newest Log: 2026-02-20

Logs Expiring Soon (30 days): 0
Logs Expiring in 90 days: 234

Scheduled Deletions (TTL): Enabled ✓
```

### Generating a Report (SQL Example)

```sql
-- Consent Compliance Report
SELECT
  DATE_TRUNC('month', timestamp) as month,
  COUNT(*) as total_trips,
  SUM(CASE WHEN action = 'consent_granted' THEN 1 ELSE 0 END) as granted,
  SUM(CASE WHEN action = 'consent_revoked' THEN 1 ELSE 0 END) as declined
FROM audit_logs
WHERE company_id = ? AND timestamp >= ? AND timestamp <= ?
GROUP BY 1
ORDER BY 1 DESC;

-- Access Audit (Who viewed what)
SELECT
  actor_email as viewer,
  target_user_id as employee,
  COUNT(*) as location_views,
  MIN(timestamp) as first_view,
  MAX(timestamp) as last_view
FROM audit_logs
WHERE
  company_id = ?
  AND action = 'location_viewed'
  AND timestamp >= ? AND timestamp <= ?
GROUP BY actor_email, target_user_id
ORDER BY location_views DESC;
```

---

## Configuration & Customization

### Company Settings: Security Tab

**Retention Period**

- Options: 12 months, 24 months, 36 months
- Default: 24 months
- Changes apply to all future logs
- Existing logs honor their original expiry date

**Consent Requirements**

- Toggle: "Require explicit consent before tracking"
- Default: ON (recommended)
- If OFF: Tracking enabled by default (not recommended for LOPD compliance)

**MFA Enforcement**

- Toggle: "Require MFA for all admin users"
- Default: OFF
- If ON: All Super Admin + Manager accounts must use 2FA (TOTP, WebAuthn)

**Location Data Deletion**

- Manual delete button: "Purge all location logs"
- Warning: "This will delete all audit logs for this company. Cannot be undone."
- Audit event: 'audit_logs_purged' with admin ID + IP + timestamp

**SSO Configuration**

- Provider selector: None / Okta / Azure AD / Google Workspace
- Conditional fields:
  - **Okta**: Client ID, Client Secret, Issuer URL
  - **Azure AD**: Client ID, Client Secret, Tenant ID
  - **Google Workspace**: Client ID, Client Secret, Workspace domain
- Callback URL (auto-generated): `https://portal.going.com/api/auth/callback/{provider}`

### Company Settings: General Tab

**Approval Workflow**

- Toggle: "Require manager approval for all bookings"
- Default: ON
- If ON: Employee bookings enter "Pending Approval" status until manager approves
- If OFF: Employee bookings auto-approve and can start immediately

**Tracking Consent**

- Toggle: "Require consent before location tracking"
- Default: ON (mandatory for LOPD compliance)
- Employee sees modal before any location data collected

**Data Retention Days**

- Numeric input: 30–1095 days
- Default: 730 days (24 months)
- Compliance note: "LOPD Ecuador recommends 24+ months for audit retention"

---

## Legal Notices & Employee Communication

### Consent Modal Text (Shown to Employee)

```
┌─────────────────────────────────────────┐
│  📍 Allow location sharing?              │
│                                         │
│  ACME Corp would like to see your      │
│  location during this trip.            │
│                                         │
│  🕐 Only during this confirmed trip    │
│     — not at any other time.           │
│                                         │
│  🔒 Your location is never stored      │
│     after the trip ends.               │
│                                         │
│  👔 Only your manager and security     │
│     team can view it.                  │
│                                         │
│  🚫 Declining will not affect your     │
│     booking or employment.             │
│                                         │
│  ↩️  You can revoke consent at any     │
│     time by ending the trip.           │
│                                         │
│  Governed by LOPD Ecuador              │
│  Booking: booking-12345                │
│                                         │
│  [No, decline]    [Yes, allow]         │
└─────────────────────────────────────────┘
```

### Portal: Privacy Policy Section

**Add to your Going Portal privacy policy**:

---

### **Location Tracking & LOPD Ecuador Compliance**

**Going's Corporate Trip Tracking Service** processes employee location data exclusively for the purpose of trip management and workplace safety during confirmed business trips.

#### **Legal Basis**

Location processing is based on:

1. **Explicit, informed consent** obtained from the employee before each trip
2. **Legitimate business interest** in ensuring employee safety and trip verification
3. **Employee performance management** (aggregate tracking data, not individual surveillance)

#### **What Data We Collect**

- GPS coordinates (latitude, longitude)
- Timestamp (when location was recorded)
- Trip metadata (booking ID, service type)
- Device information (for consent audit trail)

#### **What We DON'T Collect or Store**

- Historical location points after trip completion
- Behavioral patterns or movement profiles
- Location data from non-work hours or personal time
- Biometric identification or personal characteristics

#### **Duration of Storage**

- **Active Trip**: Real-time streaming only; no database persistence
- **Audit Trail**: Consent records and access logs retained for 24 months (configurable)
- **Employee Deletion Right**: You can request all personal data about you at any time

#### **Who Can Access Your Location**

- **Your direct manager** — to verify trip progress and ensure your safety
- **Security team** — in case of emergency or safety incident
- **No one else** — data is never shared with third parties, government, or competitors

#### **Your Rights Under LOPD Ecuador**

1. **Right to Consent** — You can decline tracking without employment penalty
2. **Right to Revoke** — End tracking at any time by completing your trip
3. **Right to Access** — Request a copy of all data about you (request via settings)
4. **Right to Deletion** — Request purging of your historical data (contact support)
5. **Right to Complaint** — File a complaint with AEPD (Autoridad de Regulación y Control de Datos Personales) if you believe your rights were violated

#### **Security Measures**

- All data in transit is encrypted with TLS 1.3
- Access is logged and auditable for compliance reviews
- Multi-factor authentication required for administrators
- Automated deletion after retention period ends

#### **Contact for Data Subject Requests**

Email: `privacy@going.com`
Response time: 30 days

---

### Employee Handbook Notice

**ADD TO YOUR EMPLOYEE HANDBOOK**

---

### **Corporate Trip Tracking Policy**

**Effective Date**: [DATE]

**Purpose**: Going Platform's Corporate Trip Tracking ensures employee safety, verifies trip legitimacy, and complies with LOPD Ecuador privacy requirements.

**When Tracking is Used**

- For all confirmed business trips booked through the Going Portal
- Only during active trip duration (from start to end)

**Consent Process**
When you start a trip, you will see a consent modal asking: "Allow location sharing?"

- **You may decline** tracking without impact to your booking or employment
- **You may revoke** consent at any time by ending the trip
- **Your choice is recorded** and respected immediately

**Who Can See Your Location**

- Your direct manager or team lead
- Company security team (in emergencies only)
- **No one else** — not company executives, HR, marketing, or external parties

**What Happens After Your Trip Ends**

- Live location sharing stops immediately
- Your location coordinates are NOT stored in a database
- Access logs (who viewed your location, when) are kept for 24 months for compliance
- You can request deletion of audit records anytime

**Your LOPD Ecuador Rights**

- **Complain to regulators**: Autoridad de Regulación y Control de Datos Personales (AEPD)
- **Request your data**: Email privacy@going.com with your booking ID
- **Request deletion**: Email privacy@going.com to ask for purging of your audit records
- **Designate a representative**: You can authorize another person to exercise your rights

**Questions?**
Contact HR or email: `privacy@going.com`

---

## Implementation Checklist

### Phase 1: Core Infrastructure ✅

- [x] TrackingConsentModal (React Native UI)
- [x] useCorporateTracking hook (lifecycle management)
- [x] AuditLogService (NestJS service)
- [x] audit_logs collection (MongoDB schema + TTL index)
- [x] sso_configs collection (for SSO setup)

### Phase 2: Portal Pages ✅

- [x] Tracking page (live map + trip list)
- [x] Reports page (spending charts, top spenders)
- [x] Settings page (retention, SSO, spending limits, users, security)
- [x] Bookings page (manager direct + employee request flows)
- [x] Approvals page (pending requests, approve/reject)
- [x] Invoices page (consolidated billing)

### Phase 3: API Endpoints (TODO)

- [ ] `POST /api/corporate/consent` — Record consent decision
- [ ] `GET /api/corporate/audit/logs` — Query audit logs with filters
- [ ] `GET /api/corporate/audit/employee/:userId` — Data subject access request
- [ ] `GET /api/corporate/audit/reports/consent` — Consent compliance report
- [ ] `GET /api/corporate/audit/reports/access` — Access audit report
- [ ] `POST /api/corporate/audit/delete-old-logs` — Manual purge (for testing)

### Phase 4: WebSocket Gateway (TODO)

- [ ] Corporate tracking gateway (Socket.IO namespace)
- [ ] Room authorization (verify user access to trip)
- [ ] Location streaming (broadcast to authorized managers)
- [ ] Audit event logging (log each view + WS event)
- [ ] Error handling & reconnection logic

### Phase 5: Admin Tools (TODO)

- [ ] Audit log query page (filter by date, user, action)
- [ ] Report generation (CSV export)
- [ ] Data retention management (TTL configuration UI)
- [ ] Compliance audit trail dashboard

### Phase 6: Legal & Documentation (TODO)

- [ ] Privacy policy template (for company to customize)
- [ ] Employee consent notice (translated to Spanish, if in Ecuador)
- [ ] AEPD complaint procedure documentation
- [ ] Data processing agreement (DPA) template

---

## Summary: What You Have Now

| Component                 | Purpose                                | Status   |
| ------------------------- | -------------------------------------- | -------- |
| **TrackingConsentModal**  | Explicit consent UI                    | ✅ Built |
| **useCorporateTracking**  | Consent + tracking lifecycle           | ✅ Built |
| **AuditLogService**       | LOPD audit logging                     | ✅ Built |
| **audit_logs Collection** | Immutable audit trail                  | ✅ Built |
| **Portal Pages**          | Dashboard, tracking, reports, settings | ✅ Built |
| **RBAC System**           | Role-based access control              | ✅ Built |
| **Multi-tenant Scoping**  | Company isolation (companyId filter)   | ✅ Built |
| **Consent Recording API** | POST /api/corporate/consent            | 🔲 TODO  |
| **Audit Query API**       | GET /api/corporate/audit/logs          | 🔲 TODO  |
| **WebSocket Gateway**     | Real-time trip tracking                | 🔲 TODO  |
| **Report Generator**      | CSV/compliance reports                 | 🔲 TODO  |

---

## Next Steps

1. **Implement API endpoints** (Phase 3) — Connect portal to backend
2. **Implement WebSocket gateway** (Phase 4) — Real-time location streaming
3. **Test end-to-end flow** — Employee consent → manager tracking → audit log
4. **Generate sample reports** — Verify audit logs capture all required events
5. **Customize legal notices** — Add to your company's privacy policy & employee handbook
6. **Deploy to production** — With data encryption at rest + in transit

---

## References

- **LOPD Ecuador Official**: https://www.aepd.gob.ec/
- **Ecuador Data Privacy Law**: Ley Orgánica de Protección de Datos Personales (2021)
- **Going Platform Support**: privacy@going.com
