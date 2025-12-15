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
            
            {/* Request Services */}
            <Route path="request" element={<EnterpriseRequest />} />
            <Route path="request/ride" element={<EnterpriseRequest type="ride" />} />
            <Route path="request/shipment" element={<EnterpriseRequest type="shipment" />} />
            
            {/* Activity */}
            <Route path="trips" element={<EnterpriseTrips />} />
            <Route path="trips/:id" element={<EnterpriseTrips />} />
            <Route path="shipments" element={<EnterpriseShipments />} />
            <Route path="shipments/:id" element={<EnterpriseShipments />} />
            
            {/* Billing & Reports */}
            <Route path="billing" element={<EnterpriseBilling />} />
            <Route path="billing/invoices" element={<EnterpriseBilling view="invoices" />} />
            <Route path="billing/payments" element={<EnterpriseBilling view="payments" />} />
            <Route path="reports" element={<EnterpriseReports />} />
            
            {/* Admin Only */}
            <Route path="admin/users" element={
              <AdminOnly><EnterpriseUsers /></AdminOnly>
            } />
            <Route path="admin/cost-centers" element={
              <AdminOnly><EnterpriseAdminSettings section="cost-centers" /></AdminOnly>
            } />
            <Route path="admin/policies" element={
              <AdminOnly><EnterpriseAdminSettings section="policies" /></AdminOnly>
            } />
          </Route>

          {/* Legacy routes redirect */}
          <Route path="/reports" element={<Navigate to="/e/reports" replace />} />
          <Route path="/users" element={<Navigate to="/e/admin/users" replace />} />

          {/* Default redirects */}
          <Route path="/" element={<Navigate to="/e/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/e/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </EnterpriseAuthProvider>
  );
}
