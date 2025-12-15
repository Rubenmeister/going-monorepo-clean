import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider } from '../contexts';
import { ErrorBoundary } from '../components/error';
import { ProtectedRoute, RequireRole } from '../components/routing';
import { LoginForm } from '../features/auth/LoginForm';
import { RegisterForm } from '../features/auth/RegisterForm';
import { HomeScreen } from '../features/home/HomeScreen';
import { Dashboard } from './Dashboard';
import { SplashScreen } from '../screens/SplashScreen';
import { LandingPage } from '../pages/LandingPage';

// Lazy load service detail pages
const PrivateRidesPage = React.lazy(() => import('../pages/services/PrivateRidesPage'));
const SharedRidesPage = React.lazy(() => import('../pages/services/SharedRidesPage'));
const ShipmentsPage = React.lazy(() => import('../pages/services/ShipmentsPage'));
const ComingSoonPage = React.lazy(() => import('../pages/services/ComingSoonPage'));

// Lazy load role-specific sections
const CustomerDashboard = React.lazy(async () => ({ default: (await import('../features/customer/CustomerDashboard')).CustomerDashboard }));
const CustomerTrips = React.lazy(async () => ({ default: (await import('../features/customer/CustomerTrips')).CustomerTrips }));
const ProviderDashboard = React.lazy(() => import('../features/provider/ProviderDashboard'));
const ProviderTours = React.lazy(() => import('../features/provider/ProviderTours'));

// Loading fallback
const Loading = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-red"></div>
  </div>
);

export function App() {
  const [showSplash, setShowSplash] = React.useState(true);

  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <React.Suspense fallback={<Loading />}>
            <Routes>
              {/* ============================================ */}
              {/* PUBLIC ROUTES */}
              {/* ============================================ */}
              <Route path="/login" element={<LoginForm />} />
              <Route path="/register" element={<RegisterForm />} />
              
              {/* ============================================ */}
              {/* CUSTOMER ROUTES (/c/*) */}
              {/* Roles: customer, provider, driver */}
              {/* ============================================ */}
              <Route path="/c" element={
                <RequireRole roles={['customer', 'provider', 'driver', 'ops_admin', 'super_admin']}>
                  <Outlet />
                </RequireRole>
              }>
                <Route index element={<CustomerDashboard />} />
                <Route path="trips" element={<CustomerTrips />} />
                <Route path="trips/:id" element={<CustomerTrips />} />
                <Route path="bookings" element={<CustomerDashboard />} />
                <Route path="profile" element={<Dashboard />} />
              </Route>

              {/* ============================================ */}
              {/* PROVIDER ROUTES (/p/*) */}
              {/* Roles: provider, ops_admin, super_admin */}
              {/* ============================================ */}
              <Route path="/p" element={
                <RequireRole roles={['provider', 'ops_admin', 'super_admin']}>
                  <Outlet />
                </RequireRole>
              }>
                <Route index element={<ProviderDashboard />} />
                <Route path="tours" element={<ProviderTours />} />
                <Route path="tours/:id" element={<ProviderTours />} />
                <Route path="earnings" element={<ProviderDashboard />} />
                <Route path="settings" element={<Dashboard />} />
              </Route>

              {/* ============================================ */}
              {/* LEGACY/GENERAL PROTECTED ROUTES */}
              {/* ============================================ */}
              <Route path="/home" element={
                <ProtectedRoute>
                  <HomeScreen />
                </ProtectedRoute>
              } />
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } />
              
              {/* ============================================ */}
              {/* SERVICE DETAIL PAGES (Public) */}
              {/* ============================================ */}
              <Route path="/services/private" element={<PrivateRidesPage />} />
              <Route path="/services/shared" element={<SharedRidesPage />} />
              <Route path="/services/shipments" element={<ShipmentsPage />} />
              <Route path="/services/tours" element={<ComingSoonPage />} />
              <Route path="/services/experiences" element={<ComingSoonPage />} />
              <Route path="/services/accommodation" element={<ComingSoonPage />} />
              
              {/* ============================================ */}
              {/* LANDING PAGE (Public) */}
              {/* ============================================ */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/unauthorized" element={
                <div className="flex items-center justify-center min-h-screen bg-gray-100">
                  <div className="text-center p-8 bg-white rounded-lg shadow-md">
                    <h1 className="text-2xl font-bold text-red-600 mb-4">Acceso Denegado</h1>
                    <p className="text-gray-600 mb-4">No tienes permisos para acceder a esta página.</p>
                    <a href="/home" className="text-blue-600 hover:underline">Volver al inicio</a>
                  </div>
                </div>
              } />
              <Route path="*" element={<Navigate to="/home" replace />} />
            </Routes>
          </React.Suspense>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
