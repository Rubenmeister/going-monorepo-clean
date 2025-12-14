import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { EnterpriseAuthProvider, useEnterpriseAuth } from './EnterpriseAuthContext';
import EnterpriseDashboard from '../features/EnterpriseDashboard';
import EnterpriseLogin from '../features/EnterpriseLogin';
import EnterpriseReports from '../features/EnterpriseReports';
import EnterpriseUsers from '../features/EnterpriseUsers';

// Protected route for enterprise
function EnterpriseProtected({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useEnterpriseAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
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

          {/* Protected Enterprise Routes */}
          <Route path="/" element={
            <EnterpriseProtected>
              <EnterpriseDashboard />
            </EnterpriseProtected>
          } />
          <Route path="/reports" element={
            <EnterpriseProtected>
              <EnterpriseReports />
            </EnterpriseProtected>
          } />
          <Route path="/users" element={
            <EnterpriseProtected>
              <EnterpriseUsers />
            </EnterpriseProtected>
          } />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </EnterpriseAuthProvider>
  );
}
