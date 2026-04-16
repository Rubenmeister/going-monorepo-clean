# ⚡ Quick Reference Cards

**Use these quick reference cards while reading**

---

## 📋 DEPLOYMENT GUIDE Quick Ref

### File: `GCP_STAGING_DEPLOYMENT.md`

#### Prerequisites Checklist

```
Required:
☐ GCP Account with billing enabled
☐ gcloud CLI installed
☐ kubectl installed
☐ Docker installed
☐ PostgreSQL client (psql)
☐ jq (JSON processor)

Required Credentials:
☐ GCP Project ID
☐ Service Account JSON key
☐ Domain name (staging-app.going.com)
```

#### Key Commands

```bash
# Set environment variables
export GCP_PROJECT="your-project-id"
export GCP_REGION="us-central1"
export GCP_ZONE="us-central1-a"

# Run deployment
bash scripts/deploy-gcp-staging.sh

# Check deployment status
kubectl get pods -n going-staging
kubectl get services -n going-staging
```

#### 8 Validation Points

```
1. ✅ Health Check
   GET https://api-staging.going.com/health
   Expected: 200 OK

2. ✅ Swagger Docs
   GET https://api-staging.going.com/docs
   Expected: HTML swagger page

3. ✅ Authentication
   POST https://api-staging.going.com/auth/login
   Expected: JWT token returned

4. ✅ CORS Headers
   GET https://staging-app.going.com/
   Expected: 200 OK with CORS headers

5. ✅ WebSocket Connection
   ws://api-staging.going.com/socket.io
   Expected: Connected message

6. ✅ Database Query
   GET https://api-staging.going.com/api/bookings
   Expected: JSON array returned

7. ✅ Cloud Logging
   Check: Cloud Logging console
   Expected: Logs appearing in real-time

8. ✅ Frontend Load
   GET https://staging-app.going.com/
   Expected: Next.js app loads
```

#### Time Estimates

```
Setup:           30 minutes
Deployment:      30 minutes
Validation:      15 minutes
Troubleshooting: 15-45 minutes (as needed)
TOTAL:           ~2 hours
```

#### Common Issues & Fixes

```
Issue: Pod won't start
Fix: kubectl logs -f deployment/going-api -n going-staging

Issue: Service not accessible
Fix: kubectl port-forward svc/going-api 8000:8000 -n going-staging

Issue: Database connection fails
Fix: Check Cloud SQL proxy is running
     Check VPC networking

Issue: Frontend won't load
Fix: Check Next.js build completed
     Check environment variables
     Check CORS configuration
```

---

## 🎨 FRONTEND UX/UI Quick Ref

### File: `FRONTEND_UX_UI_DESIGN_ANALYSIS.md`

#### Current Pages Summary

```
1. 🔐 Login Page (/auth/login)
   - Email/password form
   - SSO options (Okta, Azure, Google)
   - Responsive, centered layout

2. 📊 Dashboard (/dashboard)
   - 4 KPI cards (blue, green, orange, purple)
   - Quick action buttons
   - Recent activity section

3. 📋 Bookings (/bookings)
   - Create new bookings
   - Filter by status & type
   - Data table with badges
   - 3 mock bookings

4. ✅ Approvals (/approvals)
   - Badge shows "3" pending
   - [To be implemented]

5. 📍 Tracking (/tracking)
   - Mapbox GL integration
   - Real-time tracking
   - [To be implemented]

6. 📈 Reports (/reports)
   - Analytics & insights
   - [To be implemented]

7. 🧾 Invoices (/invoices)
   - Billing management
   - [To be implemented]

8. ⚙️ Settings (/settings)
   - User preferences
   - [To be implemented]
```

#### Design System Reference

```
PRIMARY COLORS:
- Blue (#2563EB) - Primary actions
- Blue-700 (#1D4ED8) - Hover
- Blue-50 (#EFF6FF) - Light bg

SEMANTIC COLORS:
- Green (#16A34A) - Success/positive
- Orange (#EA580C) - Warning/pending
- Red (#DC2626) - Error/critical
- Purple (#9333EA) - Special/trips

BACKGROUNDS:
- White (#FFFFFF) - Cards
- Gray-50 (#F9FAFB) - Pages
- Gray-100 (#F3F4F6) - Sections
- Gray-900 (#111827) - Sidebar

SPACING:
px: 3, 4, 5, 6 (horizontal)
py: 2, 2.5, 3, 4 (vertical)
gap: 3, 4 (between items)
mb: 2, 4, 6, 8 (margins)

RADIUS:
rounded-lg: 0.5rem (buttons)
rounded-xl: 0.75rem (cards)
rounded-full: 9999px (avatars)

SHADOWS:
shadow: Medium shadow
shadow-sm: Small shadow
none: Flat design
```

#### Current Strengths ✅

```
1. ✅ Consistent design system
   - Uses Tailwind CSS
   - Semantic colors
   - Clear spacing rules

2. ✅ Responsive design
   - Mobile-first approach
   - md: and lg: breakpoints
   - Touch-friendly buttons

3. ✅ Accessibility
   - sr-only labels
   - Semantic HTML
   - Focus indicators

4. ✅ User feedback
   - Loading states
   - Error messages
   - Status badges

5. ✅ Clear navigation
   - 7-item sidebar
   - Active highlighting
   - Emoji icons

6. ✅ Data presentation
   - Table format
   - Summary cards
   - Filters
```

#### Areas for Improvement 🎯

```
HIGH PRIORITY:
1. Form validation & feedback
2. Data table interactions (sort, paginate)
3. Modal improvements
4. Notification system

MEDIUM PRIORITY:
5. Empty/loading states
6. Advanced filtering
7. Data export

LOW PRIORITY:
8. Dark mode
9. Advanced analytics (charts)
10. Real-time collaboration
```

#### Phase 1 Components to Build

```
WEEK 1: Foundation Components
- Button.tsx (primary, secondary, danger)
- Card.tsx (with variants)
- Badge.tsx (status variants)
- Alert.tsx (error, success, warning, info)

WEEK 2: Form Improvements
- Input.tsx (with validation)
- Form.tsx (wrapper)
- BookingFormModal improvements
- Validation feedback

WEEK 3: Data Table
- Table.tsx (sortable, paginated)
- Pagination.tsx
- Search/Filter components
- Mobile card fallback

WEEK 4: Polish & Testing
- Empty state components
- Loading skeletons
- Accessibility audit
- Performance optimization
```

#### Key Metrics

```
Current Status:
- Pages: 8 total (3 implemented, 5 stubs)
- Components: 3 (Layout, BookingFormModal, TrackingConsentBadge)
- Reusability: Low (inline styles)
- Test Coverage: Minimal
- Accessibility: Good baseline

After Phase 1:
- Components: 12+ reusable
- Reusability: High (props-based)
- Test Coverage: Medium (unit tests)
- Accessibility: WCAG 2.1 AAA
```

---

## 🔄 Integration Quick Ref

### Running Both in Parallel

```
TIMELINE:
Week 1:   Deployment prep + Component library foundation
Week 2:   Staging deployment + Form improvements
Week 3:   Validation & monitoring + Data table
Week 4:   Production readiness + Polish & testing
```

### Team Structure (Optional)

```
IF TEAM OF 2:
- Person A: DevOps/Deployment (GCP, Kubernetes)
- Person B: Frontend/Design (React, Components)

IF SOLO:
- Monday-Tuesday: Deployment
- Rest of week: Frontend development
- Validate together in staging
```

### Checkpoint Process

```
Daily:
- Run npm run dev (frontend works)
- Check deployment status (pods running)
- Quick sync on blockers

Weekly:
- Deploy components to staging
- Run validation tests
- Gather feedback
- Plan next week

Bi-weekly:
- Review progress on both tracks
- Identify and resolve blockers
- Plan production approach
```

### Success Criteria

```
DEPLOYMENT:
✅ All 8 validation checks pass
✅ No errors in logs for 1 hour
✅ Can scale pods up/down
✅ Database queries working
✅ Frontend loads in staging

FRONTEND:
✅ Component library complete (Phase 1)
✅ All components have tests
✅ 90%+ Lighthouse score
✅ Accessible (WCAG 2.1)
✅ Mobile responsive (tested)
```

---

## 📱 On This Machine

### Open These Files:

```
# Deployment Guide
open GCP_STAGING_DEPLOYMENT.md

# Frontend Guide
open FRONTEND_UX_UI_DESIGN_ANALYSIS.md

# Reading Guide
open READING_GUIDE.md (this one!)

# Quick Reference
open QUICK_REFERENCE.md (you are here!)
```

### Key Scripts:

```
# Start frontend dev
cd apps/corporate-portal
npm run dev        # Runs on http://localhost:3001

# Build components
npm run build      # Test build

# Run tests
npm test           # Jest tests

# Lint code
npm run lint       # ESLint
```

### Development URLs:

```
Local Frontend:    http://localhost:3001
Local Backend API: http://localhost:8000 (when running)
Staging Frontend:  https://staging-app.going.com
Staging API:       https://api-staging.going.com
```

---

## ✨ Next Step Actions

### Immediate (Before you read):

- [ ] Make sure you have text editor open
- [ ] Make sure you have both guides available
- [ ] Have GCP credentials handy (if deploying)
- [ ] Have Node.js/npm installed (for frontend)

### During Reading:

- [ ] Take notes on key points
- [ ] Answer questions in reading guide
- [ ] Create your own checklist
- [ ] Identify any blockers

### After Reading:

- [ ] Meet with team (if applicable)
- [ ] Finalize timeline
- [ ] Assign tasks
- [ ] Start with Phase 1 tasks

---

**Generated:** Feb 23, 2026
**Status:** Ready to use while reading
**Update frequency:** As needed
