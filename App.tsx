
import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth, UserRole } from './hooks/useAuth';
import Layout from './components/layout/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import LeavePage from './pages/LeavePage';
import ApproveLeavePage from './pages/ApproveLeavePage';
import ShiftRotaPage from './pages/ShiftRotaPage';
import ShiftSwapPage from './pages/ShiftSwapPage';
import AccountTrackerPage from './pages/AccountTrackerPage';
import AdminPage from './pages/AdminPage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import ReportsPage from './pages/ReportsPage';
import AuditLogPage from './pages/AuditLogPage';
import NotFoundPage from './pages/NotFoundPage';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-brand-bg-light">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-brand-primary"></div>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(currentUser.role)) {
    // Redirect to a more appropriate page or show an "Access Denied" component within the layout
    return <Navigate to="/dashboard" replace />; 
  }

  return <>{children}</>;
};


const AppRoutes: React.FC = () => {
  const { currentUser } = useAuth();
  return (
    <Routes>
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/leave" element={<LeavePage />} />
      <Route path="/profile" element={<ProfilePage />} />
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="/account-tracker" element={<AccountTrackerPage />} />
      <Route path="/shift-swaps" element={<ProtectedRoute allowedRoles={[UserRole.VAR_SHIFT, UserRole.VAR_BAU]}><ShiftSwapPage /></ProtectedRoute>} />
      
      <Route path="/manager/approve-leave" element={<ProtectedRoute allowedRoles={[UserRole.MANAGER]}><ApproveLeavePage /></ProtectedRoute>} />
      <Route path="/manager/shift-rota" element={<ProtectedRoute allowedRoles={[UserRole.MANAGER, UserRole.ADMIN]}><ShiftRotaPage /></ProtectedRoute>} />
      <Route path="/manager/reports" element={<ProtectedRoute allowedRoles={[UserRole.MANAGER, UserRole.ADMIN]}><ReportsPage /></ProtectedRoute>} />

      <Route path="/admin" element={<ProtectedRoute allowedRoles={[UserRole.ADMIN]}><AdminPage /></ProtectedRoute>} />
      <Route path="/admin/audit-log" element={<ProtectedRoute allowedRoles={[UserRole.ADMIN]}><AuditLogPage /></ProtectedRoute>} />
      
      <Route path="/" element={<Navigate to={currentUser ? "/dashboard" : "/login"} replace />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <HashRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route 
          path="/*"
          element={
            <ProtectedRoute>
              <Layout>
                <AppRoutes />
              </Layout>
            </ProtectedRoute>
          } 
        />
      </Routes>
    </HashRouter>
  );
};

export default App;
