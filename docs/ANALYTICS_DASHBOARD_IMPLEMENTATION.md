# 📊 Analytics Dashboard Implementation Guide

## Overview

Web-based business intelligence dashboard for monitoring ride metrics, driver performance, and platform analytics.

---

## Dashboard Structure

### 1. Overview Dashboard (`/dashboard/overview`)

Displays 7-day summary metrics

**Components:**

```typescript
<OverviewDashboard>
  <MetricsCard
    title="Total Rides"
    value={7500}
    change="+12%"
    icon={<RideIcon />}
  />
  <MetricsCard
    title="Revenue"
    value="$125,400"
    change="+8.5%"
    icon={<MoneyIcon />}
  />
  <MetricsCard
    title="Active Drivers"
    value={450}
    change="+5%"
    icon={<DriverIcon />}
  />
  <MetricsCard
    title="Completion Rate"
    value="94.2%"
    change="-0.3%"
    icon={<CheckIcon />}
  />

  <TopDriversCard drivers={topDrivers} />
  <RideDistributionChart data={peakHours} />
  <CancellationAnalysis data={cancellationReasons} />
</OverviewDashboard>
```

**API Endpoint:**

```
GET /api/analytics/dashboard/overview?days=7
```

**Response:**

```json
{
  "date": "2024-02-15",
  "totalRides": 7500,
  "completedRides": 7065,
  "cancelledRides": 435,
  "totalRevenue": 125400,
  "platformRevenue": 37620,
  "driverEarnings": 87780,
  "peakHourRides": {
    "8": 450,
    "12": 580,
    "18": 720,
    "20": 685
  },
  "topDrivers": [
    {
      "driverId": "D001",
      "name": "John Doe",
      "earnings": 4500,
      "rides": 125,
      "rating": 4.9
    }
  ],
  "cancellationRateByReason": {
    "driver_cancelled": 200,
    "user_cancelled": 150,
    "system_cancelled": 85
  }
}
```

---

### 2. Rides Analytics (`/dashboard/rides`)

Time-series analysis of ride metrics

**Components:**

```typescript
<RidesDashboard>
  <DateRangeSelector
    onDateChange={(start, end) => fetchRideMetrics(start, end)}
  />

  <LineChart title="Daily Ride Volume" data={dailyRides} metric="totalRides" />

  <BarChart
    title="Ride Status Breakdown"
    data={ridesByStatus}
    categories={['completed', 'cancelled', 'noShow']}
  />

  <PieChart title="Cancellation Reasons" data={cancellationReasons} />

  <MetricsTable
    columns={['Date', 'Total Rides', 'Revenue', 'Avg Duration']}
    data={dailyMetrics}
  />
</RidesDashboard>
```

**API Endpoints:**

```
# Single day
GET /api/analytics/rides/daily/:date

# Date range
GET /api/analytics/rides/range?start=2024-02-01&end=2024-02-28

# Last N days
GET /api/analytics/rides/latest?days=30
```

---

### 3. Driver Performance (`/dashboard/drivers`)

Individual driver metrics and rankings

**Components:**

```typescript
<DriversDashboard>
  <DriverSearch onSelect={(driverId) => loadDriverMetrics(driverId)} />

  <DriverCard
    name="John Doe"
    rating={4.9}
    earnings={4500}
    rides={125}
    completionRate={98.4}
  />

  <DriverMetricsGrid>
    <Metric title="30-Day Earnings" value="$12,450" />
    <Metric title="Total Rides" value="350" />
    <Metric title="Avg Rating" value="4.85" />
    <Metric title="Cancellation Rate" value="1.2%" />
  </DriverMetricsGrid>

  <DriverComparisonChart driverId="D001" metric="earnings" period="weekly" />

  <TopDriversLeaderboard period="monthly" />
</DriversDashboard>
```

**API Endpoints:**

```
# Driver stats
GET /api/analytics/drivers/:driverId/stats

# Period-specific
GET /api/analytics/drivers/:driverId/daily?date=2024-02-15
GET /api/analytics/drivers/:driverId/weekly?date=2024-02-15
GET /api/analytics/drivers/:driverId/monthly?date=2024-02-01

# Top drivers
GET /api/analytics/drivers/top/daily?date=2024-02-15
GET /api/analytics/drivers/top/weekly
GET /api/analytics/drivers/top/monthly

# Individual driver dashboard
GET /api/analytics/dashboard/drivers/:driverId?period=daily&days=30
```

---

## Implementation Guide

### Step 1: Create Dashboard React App

```bash
# Create dashboard in monorepo
cd /home/user/going-monorepo-clean

# Create Nx app
nx generate @nx/react:app analytics-dashboard

# Or use standard React:
npx create-react-app analytics-dashboard
```

### Step 2: Install Dependencies

```bash
cd analytics-dashboard

npm install \
  axios \
  react-router-dom \
  recharts \
  @react-icons/all-files \
  zustand \
  dayjs \
  classnames
```

### Step 3: Create API Client

**File**: `src/api/analyticsClient.ts`

```typescript
import axios from 'axios';

const client = axios.create({
  baseURL: process.env.REACT_APP_ANALYTICS_API || 'http://localhost:3010',
  timeout: 30000,
});

export const analyticsApi = {
  // Overview
  getOverview: (days = 7) =>
    client.get(`/api/analytics/dashboard/overview?days=${days}`),

  // Rides
  getRidesByDate: (date: string) =>
    client.get(`/api/analytics/rides/daily/${date}`),
  getRidesByRange: (start: string, end: string) =>
    client.get(`/api/analytics/rides/range?start=${start}&end=${end}`),
  getRecentRides: (days = 30) =>
    client.get(`/api/analytics/rides/latest?days=${days}`),

  // Drivers
  getDriverStats: (driverId: string) =>
    client.get(`/api/analytics/drivers/${driverId}/stats`),
  getDriverByPeriod: (driverId: string, period: string, date?: string) =>
    client.get(
      `/api/analytics/drivers/${driverId}/${period}${
        date ? `?date=${date}` : ''
      }`
    ),
  getTopDrivers: (period: string) =>
    client.get(`/api/analytics/drivers/top/${period}`),
  getDriverDashboard: (driverId: string, params?: any) =>
    client.get(`/api/analytics/dashboard/drivers/${driverId}`, { params }),
};

export default client;
```

### Step 4: Create State Management

**File**: `src/stores/analyticsStore.ts`

```typescript
import create from 'zustand';
import { analyticsApi } from '../api/analyticsClient';

interface AnalyticsState {
  overview: any;
  rides: any[];
  drivers: any[];
  selectedDriver: any;
  loading: boolean;
  error: string | null;

  // Actions
  fetchOverview: (days?: number) => Promise<void>;
  fetchRidesByRange: (start: string, end: string) => Promise<void>;
  fetchDriverMetrics: (driverId: string, period?: string) => Promise<void>;
  fetchTopDrivers: (period: string) => Promise<void>;
}

export const useAnalyticsStore = create<AnalyticsState>((set) => ({
  overview: null,
  rides: [],
  drivers: [],
  selectedDriver: null,
  loading: false,
  error: null,

  fetchOverview: async (days = 7) => {
    set({ loading: true, error: null });
    try {
      const response = await analyticsApi.getOverview(days);
      set({ overview: response.data, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  fetchRidesByRange: async (start: string, end: string) => {
    set({ loading: true });
    try {
      const response = await analyticsApi.getRidesByRange(start, end);
      set({ rides: response.data, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  fetchDriverMetrics: async (driverId: string, period = 'daily') => {
    set({ loading: true });
    try {
      const response = await analyticsApi.getDriverByPeriod(driverId, period);
      set({ selectedDriver: response.data, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  fetchTopDrivers: async (period: string) => {
    set({ loading: true });
    try {
      const response = await analyticsApi.getTopDrivers(period);
      set({ drivers: response.data, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },
}));
```

### Step 5: Create Dashboard Components

**File**: `src/components/OverviewDashboard.tsx`

```typescript
import React, { useEffect } from 'react';
import { useAnalyticsStore } from '../stores/analyticsStore';
import { MetricsCard } from './MetricsCard';
import { TopDriversCard } from './TopDriversCard';
import { ChartsSection } from './ChartsSection';

export const OverviewDashboard: React.FC = () => {
  const { overview, loading, fetchOverview } = useAnalyticsStore();

  useEffect(() => {
    fetchOverview(7);
  }, []);

  if (loading) return <div>Loading...</div>;
  if (!overview) return <div>No data available</div>;

  return (
    <div className="dashboard-container">
      <h1>Platform Overview</h1>

      <div className="metrics-grid">
        <MetricsCard
          title="Total Rides"
          value={overview.totalRides}
          change={((overview.totalRides - 0) / 100) * 100}
        />
        <MetricsCard
          title="Revenue"
          value={`$${overview.totalRevenue.toLocaleString()}`}
          change={((overview.totalRevenue - 0) / 1000) * 10}
        />
        <MetricsCard
          title="Completion Rate"
          value={`${(
            (overview.completedRides / overview.totalRides) *
            100
          ).toFixed(1)}%`}
        />
        <MetricsCard
          title="Platform Revenue"
          value={`$${overview.platformRevenue.toLocaleString()}`}
        />
      </div>

      <TopDriversCard drivers={overview.topDrivers} />
      <ChartsSection data={overview} />
    </div>
  );
};
```

### Step 6: Setup Routes

**File**: `src/App.tsx`

```typescript
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { OverviewDashboard } from './components/OverviewDashboard';
import { RidesDashboard } from './components/RidesDashboard';
import { DriversDashboard } from './components/DriversDashboard';

function App() {
  return (
    <Router>
      <div className="app">
        <nav className="navbar">
          <a href="/">Overview</a>
          <a href="/rides">Rides</a>
          <a href="/drivers">Drivers</a>
        </nav>

        <Routes>
          <Route path="/" element={<OverviewDashboard />} />
          <Route path="/rides" element={<RidesDashboard />} />
          <Route path="/drivers" element={<DriversDashboard />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
```

---

## Key Metrics Displayed

### Financial Metrics

- Total Platform Revenue
- Driver Earnings
- Revenue per Ride
- Peak Revenue Hours

### Operational Metrics

- Total Rides (daily, weekly, monthly)
- Completion Rate
- Cancellation Rate by Reason
- Average Ride Duration/Distance
- Ride Distribution by Hour

### Driver Performance

- Top Drivers by Earnings
- Top Drivers by Rating
- Top Drivers by Volume
- Driver Completion Rate
- Average Rating per Driver

---

## Real-time Updates

### Auto-refresh every 5 minutes:

```typescript
useEffect(() => {
  const interval = setInterval(() => {
    fetchOverview();
  }, 5 * 60 * 1000);

  return () => clearInterval(interval);
}, []);
```

### WebSocket for real-time metrics:

```typescript
useEffect(() => {
  const socket = io('http://localhost:3010', {
    query: { type: 'analytics' },
  });

  socket.on('metrics:update', (data) => {
    updateMetrics(data);
  });

  return () => socket.disconnect();
}, []);
```

---

## Running the Dashboard

```bash
# Development
npm start
# Opens http://localhost:3000

# Build for production
npm run build

# Deploy to Vercel/Netlify
npm run deploy
```

---

## Example Analytics Data Flow

```
User opens Dashboard
    ↓
React Component mounts
    ↓
useEffect calls fetchOverview()
    ↓
analyticsApi.getOverview(7)
    ↓
HTTP GET /api/analytics/dashboard/overview?days=7
    ↓
Analytics Service queries MongoDB
    ↓
Returns aggregated metrics
    ↓
Zustand store updates state
    ↓
Components re-render with new data
    ↓
Charts, cards, and tables display
```

---

## Performance Optimization

1. **Lazy Loading**: Load dashboard sections on demand
2. **Memoization**: Use React.memo for chart components
3. **Virtual Lists**: For large driver tables
4. **API Caching**: Cache 5-minute old data
5. **Bundle Splitting**: Separate dashboard chunks
