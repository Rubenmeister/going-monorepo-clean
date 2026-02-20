# Corporate Portal

B2B SaaS portal for managing corporate travel and accommodations for the Going Platform.

## Features

### Phase 1: Authentication & Authorization (Current)

- **SSO Integration**: Support for SAML 2.0 and OIDC providers
  - Okta
  - Azure AD
  - Google Workspace
- **RBAC**: Role-Based Access Control
  - Super Admin: Full system access
  - Manager: Team management and approvals
  - Employee: Personal booking management
- **MFA**: Multi-Factor Authentication (TOTP)
  - Mandatory for administrators
  - Optional for employees

### Phase 2: Bookings & Payments (In Progress)

- Manager booking flows
- Employee booking with approval workflow
- Consolidated monthly invoicing
- Department spending limits
- Corporate credit payment method

### Phase 3: Real-Time Tracking (Planned)

- Live GPS tracking during trips
- Privacy-first design
- Employee consent management
- Interactive map dashboard
- Audit logging

### Phase 4: Compliance & Launch (Planned)

- Security audit
- Penetration testing
- Beta pilot onboarding

## Project Structure

```
apps/corporate-portal/
├── pages/                      # Next.js pages/routes
│   ├── auth/                   # Authentication pages
│   │   └── login.tsx           # Login page with SSO
│   ├── dashboard.tsx           # Main dashboard
│   ├── bookings.tsx            # Booking management
│   ├── approvals.tsx           # Approval workflows
│   ├── tracking.tsx            # Real-time tracking
│   ├── reports.tsx             # Reports & analytics
│   ├── settings.tsx            # Company settings
│   ├── _app.tsx                # App wrapper
│   └── _document.tsx           # HTML document
├── components/                 # React components
│   ├── Layout.tsx              # Main layout
│   ├── BookingForm.tsx         # Booking creation
│   ├── ApprovalList.tsx        # Approval workflows
│   ├── TrackingMap.tsx         # Map component
│   └── ReportGenerator.tsx     # Report generation
├── lib/                        # Utilities & helpers
│   ├── api.ts                  # API client
│   ├── auth.ts                 # Auth utilities
│   └── hooks.ts                # Custom React hooks
├── styles/                     # Stylesheets
│   └── globals.css             # Global styles
├── public/                     # Static assets
└── next.config.js              # Next.js configuration
```

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm or npm
- MongoDB (for corporate_db)

### Environment Setup

1. Copy environment template:

```bash
cp .env.example .env.local
```

2. Configure SSO providers in `.env.local`:

```env
OKTA_CLIENT_ID=your-client-id
OKTA_CLIENT_SECRET=your-secret
OKTA_ISSUER=https://your-domain.okta.com
```

### Installation

```bash
# Install dependencies
pnpm install

# Run development server
pnpm run dev

# Build for production
pnpm run build

# Start production server
pnpm start
```

The portal will be available at `http://localhost:3001`

## Authentication Flow

### Email/Password (Non-SSO)

1. User enters email and password
2. Server validates credentials
3. If MFA enabled, prompt for TOTP code
4. Issue JWT tokens (access + refresh)

### SAML 2.0 (Okta, Azure AD)

1. Redirect to SSO provider
2. User authenticates with provider
3. Provider returns SAML assertion
4. Validate assertion signature and claims
5. Create/sync user in corporate_users collection
6. Issue JWT tokens

### OIDC (Google Workspace, Okta, Azure AD)

1. Redirect to provider's authorization endpoint
2. User authenticates and consents
3. Provider redirects back with authorization code
4. Exchange code for ID token and access token
5. Extract user info from ID token
6. Create/sync user in corporate_users collection
7. Issue JWT tokens

## API Integration

The portal communicates with backend services:

- **User Auth Service**: User authentication and token management
- **Booking Service**: Trip and booking management with corporate extensions
- **Payment Service**: Corporate payment methods and invoicing
- **Tracking Service**: Real-time GPS tracking with WebSockets
- **API Gateway**: Request routing and rate limiting

## Compliance & Privacy

### LOPD (Ecuador)

- User consent for location tracking
- Data segregation between companies
- Audit logging for all access
- Right to be forgotten implementation
- Data retention policies

### Security

- HTTPS only
- CORS configuration
- CSRF protection
- SQL injection prevention
- XSS protection
- Rate limiting
- Input validation

## Database Schema

See [Migration 004](../../migrations/004-create-corporate-entities-collections.js) for complete schema:

### Collections

- `companies`: Company information and settings
- `corporate_users`: Team members with roles
- `corporate_bookings`: Travel bookings
- `approval_workflows`: Multi-level approvals
- `department_spending_limits`: Budget controls
- `consolidated_invoices`: Monthly consolidated billing
- `tracking_consents`: Employee tracking permissions

## Testing

```bash
# Run unit tests
pnpm run test

# Run tests in watch mode
pnpm run test:watch

# Run E2E tests
pnpm run e2e

# Run linting
pnpm run lint
```

## Deployment

### Docker

```bash
# Build image
docker build -t going-corporate-portal:latest .

# Run container
docker run -p 3001:3001 going-corporate-portal:latest
```

### Environment-specific config

- Development: `http://localhost:3001`
- Staging: `https://staging-portal.going.com`
- Production: `https://portal.going.com`

## Common Issues

### CORS Errors

Ensure API gateway is properly configured for the portal's origin.

### SSO Provider Configuration

Each provider has unique setup requirements. See [SSO Setup Guide](../../docs/SSO_SETUP.md)

### Database Connection

Verify `CORPORATE_DB_URI` in environment variables.

## Architecture Decisions

### Technology Stack

- **Framework**: Next.js 14 (React 18)
- **Authentication**: NextAuth.js + JWT
- **State Management**: Zustand
- **Data Fetching**: React Query
- **Mapping**: Mapbox GL
- **Styling**: Tailwind CSS
- **Database**: MongoDB

### Why Next.js?

- Built-in SSR for better performance
- API routes for serverless backend
- Superior developer experience
- Great TypeScript support
- Automatic code splitting

### Why NextAuth.js?

- Battle-tested authentication library
- Support for multiple SSO providers
- JWT and session-based strategies
- CSRF protection built-in
- Easy integration with Next.js

## Contributing

See [CONTRIBUTING.md](../../CONTRIBUTING.md)

## License

Proprietary - Going Platform
