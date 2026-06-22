import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Outlet, Navigate, useNavigate } from 'react-router-dom';

// Layout Components
import TopNavBar from './components/layout/TopNavBar';
import SideNavBar from './components/layout/SideNavBar';
import NotificationContainer from './components/NotificationContainer';
import { NotificationProvider, InAppNotificationProvider } from './context/NotificationContext';
import { ThemeProvider } from './context/ThemeContext';
import FallingPetals from './components/FallingPetals';
import CursorPetals from './components/CursorPetals';

// Auth
import {
  getCurrentSession,
  isAdminUser,
  isFieldOfficer as checkIsFieldOfficer,
  signOutCurrentUser,
  subscribeToAuthChanges,
} from './lib/authService';

// Public Pages
import LandingPage from './pages/LandingPage';
import PublicServicePage from './pages/PublicServicePage';
import LoginPage from './pages/LoginPage';

// Dashboard Pages
import DashboardPage from './pages/DashboardPage';
import ActiveReportsPage from './pages/ActiveReportsPage';
import AssetManagementPage from './pages/AssetManagementPage';
import MaintenanceTaskPage from './pages/MaintenanceTaskPage';
import PreventiveSchedulePage from './pages/PreventiveSchedulePage';
import FieldOfficersPage from './pages/FieldOfficersPage';
import FieldOfficerTasksPage from './pages/FieldOfficerTasksPage';
import MasterDataPage from './pages/MasterDataPage';
import AIAnalyticsPage from './pages/AIAnalyticsPage';
import ExportPage from './pages/ExportPage';
import AssetDetailPage from './pages/AssetDetailPage';
import ProfileSettingsPage from './pages/ProfileSettingsPage';
import BudgetMonitoringPage from './pages/BudgetMonitoringPage';
import NotificationsPage from './pages/NotificationsPage';
import InventoryPage from './pages/InventoryPage';
import InventoryHistoryPage from './pages/InventoryHistoryPage';

// ============================================================
// Auth Context (simple module-level state shared via props)
// ============================================================

function useAuth() {
  const [session, setSession] = useState(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function bootstrap() {
      try {
        const existingSession = await getCurrentSession();
        if (isMounted) setSession(existingSession);
      } catch (err) {
        console.error('Auth bootstrap error:', err);
      } finally {
        if (isMounted) setIsBootstrapping(false);
      }
    }

    bootstrap();

    const {
      data: { subscription },
    } = subscribeToAuthChanges((nextSession) => {
      setSession(nextSession);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const currentUser = session?.user || null;
  const isAdmin = isAdminUser(currentUser);
  const isOfficer = checkIsFieldOfficer(currentUser);

  const logout = async () => {
    try {
      await signOutCurrentUser();
      setSession(null);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  return { session, currentUser, isAdmin, isOfficer, isBootstrapping, logout };
}

// ============================================================
// Layouts
// ============================================================

function PublicLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <TopNavBar />
      <Outlet />
    </div>
  );
}

function DashboardLayout({ currentUser, isAdmin, isOfficer, isBootstrapping, logout }) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  // Show loading while checking auth
  if (isBootstrapping) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <span className="material-symbols-outlined text-5xl text-primary animate-spin">progress_activity</span>
          <p className="text-on-surface-variant font-medium">Memuat sesi...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen flex bg-background">
      <SideNavBar
        currentUser={currentUser}
        isAdmin={isAdmin}
        isFieldOfficer={isOfficer}
        onLogout={handleLogout}
      />
      <main className="flex-1 md:ml-64 transition-all">
        <Outlet />
      </main>
    </div>
  );
}

// ============================================================
// App
// ============================================================

export default function App() {
  const auth = useAuth();

  return (
    <ThemeProvider>
      <FallingPetals />
      <CursorPetals />
      <NotificationProvider>
        <InAppNotificationProvider>
          <BrowserRouter>
            <Routes>
              {/* Public Routes */}
              <Route element={<PublicLayout />}>
                <Route path="/" element={<LandingPage />} />
                <Route path="/layanan" element={<PublicServicePage />} />
              </Route>

              {/* Login (full screen, no layout) */}
              <Route path="/login" element={<LoginPage />} />

              {/* Dashboard Routes (protected) */}
              <Route
                path="/dashboard"
                element={
                  <DashboardLayout
                    currentUser={auth.currentUser}
                    isAdmin={auth.isAdmin}
                    isOfficer={auth.isOfficer}
                    isBootstrapping={auth.isBootstrapping}
                    logout={auth.logout}
                  />
                }
              >
                <Route index element={auth.isOfficer ? <Navigate to="/dashboard/my-tasks" replace /> : <DashboardPage />} />
                <Route path="reports" element={<ActiveReportsPage />} />
                <Route path="assets" element={<AssetManagementPage />} />
                <Route path="assets/:id" element={<AssetDetailPage />} />
                <Route path="maintenance" element={<MaintenanceTaskPage />} />
                <Route path="preventive" element={<PreventiveSchedulePage />} />
                <Route path="budgets" element={<BudgetMonitoringPage />} />
                <Route path="officers" element={<FieldOfficersPage />} />
                <Route path="master-data" element={<MasterDataPage />} />
                <Route path="inventory" element={<InventoryPage />} />
                <Route path="inventory/history" element={<InventoryHistoryPage />} />
                <Route path="ai-analytics" element={<AIAnalyticsPage />} />
                <Route path="exports" element={<ExportPage />} />
                <Route path="my-tasks" element={<FieldOfficerTasksPage />} />
                <Route path="profile" element={<ProfileSettingsPage />} />
                <Route path="notifications" element={<NotificationsPage />} />
              </Route>

              {/* Catch-all → redirect to landing */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>

            <NotificationContainer />
          </BrowserRouter>
        </InAppNotificationProvider>
      </NotificationProvider>
    </ThemeProvider>
  );
}
