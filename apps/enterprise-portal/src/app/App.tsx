import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { EnterpriseAuthProvider, useEnterpriseAuth } from './EnterpriseAuthContext';
import { EnterpriseLayout } from './EnterpriseLayout';
import EnterpriseDashboard from '../features/EnterpriseDashboard';
import EnterpriseLogin from '../features/EnterpriseLogin';
import EnterpriseReports from '../features/EnterpriseReports';
import EnterpriseUsers from '../features/EnterpriseUsers';
import EnterpriseTrips from '../features/EnterpriseTrips';
import EnterpriseShipments from '../features/EnterpriseShipments';
import EnterpriseRequest from '../features/EnterpriseRequest';
import EnterpriseBilling from '../features/EnterpriseBilling';
import EnterpriseAdminSettings from '../features/EnterpriseAdminSettings';
import MobilityDashboard from './features/mobility/MobilityDashboard';
import LogisticsDashboard from './features/logistics/LogisticsDashboard';
import StaysDashboard from './features/stays/StaysDashboard';
import ToursDashboard from './features/tours/ToursDashboard';
import ActivitiesDashboard from './features/activities/ActivitiesDashboard';

// Protected route for enterprise
function EnterpriseProtected({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useEnterpriseAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-enterprise-blue"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

// Admin-only route guard
function AdminOnly({ children }: { children: React.ReactNode }) {
  const { isAdmin } = useEnterpriseAuth();
  
  if (!isAdmin) {
    return <Navigate to="/e/dashboard" replace />;
  }
  
  return <>{children}</>;
}

export default function App() {
  return (
    <EnterpriseAuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<EnterpriseLogin />} />

          {/* Protected Enterprise Routes with Layout */}
          <Route path="/e" element={
            <EnterpriseProtected>
              <EnterpriseLayout />
            </EnterpriseProtected>
          }>
            {/* Dashboard */}
            <Route index element={<Navigate to="/e/dashboard" replace />} />
            <Route path="dashboard" element={<EnterpriseDashboard />} />
            
            {/* 5 Verticals */}
            <Route path="mobility" element={<MobilityDashboard />} />
            <Route path="shipments" element={<LogisticsDashboard />} />
            <Route path="stays" element={<StaysDashboard />} />
            <Route path="tours" element={<ToursDashboard />} />
            <Route path="activities" element={<ActivitiesDashboard />} />
            
            {/* Billing & Reports */}
            <Route path="billing" element={<EnterpriseBilling />} />
            <Route path="reports" element={<EnterpriseReports />} />
            
            {/* Admin Only */}
            <Route path="admin/users" element={
              <AdminOnly><EnterpriseUsers /></AdminOnly>
            } />
            <Route path="admin/policies" element={
              <AdminOnly><EnterpriseAdminSettings section="policies" /></AdminOnly>
            } />
          </Route>

          {/* Default redirects */}
          <Route path="/" element={<Navigate to="/e/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/e/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </EnterpriseAuthProvider>
  );
}
