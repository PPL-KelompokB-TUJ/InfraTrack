import { useEffect, useMemo, useState } from 'react';
import { Lock, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import AssetManagementPage from './pages/AssetManagementPage';
import MaintenanceTaskPage from './pages/MaintenanceTaskPage';
import MasterDataPage from './pages/MasterDataPage';
import ReportDamagePage from './pages/ReportDamagePage';
import TrackDamageReportPage from './pages/TrackDamageReportPage';
import FieldOfficersPage from './pages/FieldOfficersPage';
import DashboardPage from './pages/DashboardPage';
import AIAnalyticsPage from './pages/AIAnalyticsPage';
import ActiveReportsPage from './pages/ActiveReportsPage';
import FieldOfficerTasksPage from './pages/FieldOfficerTasksPage';
import NotificationContainer from './components/NotificationContainer';
import Sidebar from './components/Sidebar';
import { NotificationProvider } from './context/NotificationContext';
import {
  getCurrentSession,
  isAdminUser,
  isFieldOfficer,
  extractUserRole,
  signIn,
  signInAdmin,
  signOutCurrentUser,
  subscribeToAuthChanges,
} from './lib/authService';

const modules = [
  {
    key: 'officer-tasks',
    label: 'Penugasan Saya',
    requiresAdmin: false,
    requiresFieldOfficer: true,
  },
  {
    key: 'dashboard',
    label: 'Dashboard',
    requiresAdmin: true,
  },
  {
    key: 'active-reports',
    label: 'Laporan Aktif',
    requiresAdmin: true,
  },
  {
    key: 'maintenance-task',
    label: 'Penugasan Pemeliharaan',
    requiresAdmin: true,
  },
  {
    key: 'field-officers',
    label: 'Manajemen Petugas',
    requiresAdmin: true,
  },
  {
    key: 'asset-management',
    label: 'Manajemen Aset',
    requiresAdmin: true,
  },
  {
    key: 'report-damage',
    label: 'Lapor Kerusakan',
    requiresAdmin: false,
  },
  {
    key: 'track-damage',
    label: 'Lacak Laporan',
    requiresAdmin: false,
  },
  {
    key: 'master-data',
    label: 'Master Data Referensi',
    requiresAdmin: true,
  },
  {
    key: 'ai-analytics',
    label: 'Analitik AI',
    requiresAdmin: true,
  },
];

function AdminAccessLocked({ onOpenLogin }) {
  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <section className="glass-panel fade-slide-in rounded-3xl p-8 text-center">
        <div className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-100 text-cyan-700">
          <Lock size={24} />
        </div>
        <h1 className="text-2xl font-extrabold text-slate-800">Fitur Khusus Admin</h1>
        <p className="mx-auto mt-2 max-w-xl text-sm text-slate-600">
          Modul ini hanya dapat diakses oleh akun admin. Silakan login menggunakan akun
          dengan role admin untuk melanjutkan.
        </p>
        <button
          type="button"
          onClick={onOpenLogin}
          className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-teal-500 px-5 py-3 text-sm font-semibold text-white shadow-glow transition hover:brightness-110"
        >
          <ShieldCheck size={16} />
          Login Admin
        </button>
      </section>
    </main>
  );
}

function AdminLoginModal({
  isOpen,
  authError,
  credentials,
  selectedRole,
  isSubmitting,
  onClose,
  onChange,
  onRoleChange,
  onSubmit,
}) {
  const [showPassword, setShowPassword] = useState(false);

  if (!isOpen) {
    return null;
  }

  const roleConfig = {
    admin: {
      title: '👤 Login Admin',
      description: 'Akses modul manajemen aset, master data, dan petugas',
      buttonLabel: 'Masuk sebagai Admin',
    },
    field_officer: {
      title: '🚗 Login Petugas Lapangan',
      description: 'Kelola penugasan pemeliharaan dan verifikasi laporan',
      buttonLabel: 'Masuk sebagai Petugas',
    },
    citizen: {
      title: '👥 Login Masyarakat',
      description: 'Laporkan kerusakan infrastruktur dan lacak status laporan',
      buttonLabel: 'Masuk sebagai Masyarakat',
    },
  };

  const config = roleConfig[selectedRole] || roleConfig.citizen;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm px-4 py-6">
      <div className="glass-panel fade-slide-in w-full max-w-md rounded-2xl p-6 bg-white border border-slate-200 shadow-2xl">
        <h2 className="text-2xl font-bold text-slate-900">{config.title}</h2>
        <p className="mt-2 text-sm text-slate-600">{config.description}</p>

        {/* Role Selector */}
        <div className="mt-5 grid grid-cols-3 gap-2">
          {['admin', 'field_officer', 'citizen'].map((role) => (
            <button
              key={role}
              type="button"
              onClick={() => onRoleChange(role)}
              className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                selectedRole === role
                  ? 'bg-cyan-500 text-white ring-2 ring-cyan-300'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {role === 'admin' && '👤 Admin'}
              {role === 'field_officer' && '🚗 Petugas'}
              {role === 'citizen' && '👥 Publik'}
            </button>
          ))}
        </div>

        {authError ? (
          <div className="mt-4 rounded-lg border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {authError}
          </div>
        ) : null}



        <form onSubmit={onSubmit} className="mt-5 space-y-4">
          <label className="block text-sm font-semibold text-slate-700">
            Email
            <input
              type="email"
              value={credentials.email}
              onChange={(event) => onChange('email', event.target.value)}
              className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
              autoComplete="email"
              required
            />
          </label>

          <label className="block text-sm font-semibold text-slate-700">
            Password
            <div className="mt-1.5 relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={credentials.password}
                onChange={(event) => onChange('password', event.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                placeholder="Masukkan password"
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 transition"
              >
                {showPassword ? (
                  <EyeOff size={18} />
                ) : (
                  <Eye size={18} />
                )}
              </button>
            </div>
          </label>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-70"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-gradient-to-r from-cyan-500 to-teal-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-70"
            >
              {isSubmitting ? 'Memproses...' : config.buttonLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function App() {
  const [activeModule, setActiveModule] = useState(null);
  const [pendingModule, setPendingModule] = useState('');

  const [session, setSession] = useState(null);
  const [isAuthBootstrapping, setIsAuthBootstrapping] = useState(true);

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [selectedRole, setSelectedRole] = useState('citizen');
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [authError, setAuthError] = useState('');

  const currentUser = session?.user || null;
  const isAdmin = isAdminUser(currentUser);

  const activeModuleConfig = useMemo(
    () => modules.find((module) => module.key === activeModule),
    [activeModule]
  );

  useEffect(() => {
    let isMounted = true;

    async function bootstrapSession() {
      try {
        const existingSession = await getCurrentSession();
        if (isMounted) {
          setSession(existingSession);
        }
      } catch (error) {
        if (isMounted) {
          setAuthError(error.message || 'Gagal membaca sesi login.');
        }
      } finally {
        if (isMounted) {
          setIsAuthBootstrapping(false);
        }
      }
    }

    bootstrapSession();

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

  useEffect(() => {
    if (activeModule === null) {
      setActiveModule(isAdmin ? 'dashboard' : 'report-damage');
    }
  }, [isAdmin]);

  useEffect(() => {
    if (isAdmin && pendingModule) {
      setActiveModule(pendingModule);
      setPendingModule('');
    }
  }, [isAdmin, pendingModule]);

  const handleOpenLoginModal = () => {
    setIsLoginModalOpen(true);
    setAuthError('');
  };

  const handleCloseLoginModal = () => {
    if (isSigningIn) {
      return;
    }

    setIsLoginModalOpen(false);
    setAuthError('');
  };

  const handleModuleClick = (module) => {
    if (module.requiresAdmin && !isAdmin) {
      setPendingModule(module.key);
      handleOpenLoginModal();
      return;
    }

    setActiveModule(module.key);
  };

  async function handleAdminLogin(event) {
    event.preventDefault();
    setIsSigningIn(true);
    setAuthError('');

    try {
      let user;
      if (selectedRole === 'admin') {
        user = await signInAdmin(credentials);
      } else {
        user = await signIn(credentials);
        // Verify role matches what was selected
        const userRole = extractUserRole(user);
        console.log('Login verification:', { selectedRole, userRole, hasAppMetadata: !!user?.app_metadata, hasUserMetadata: !!user?.user_metadata });
        
        if (userRole !== selectedRole) {
          await signOutCurrentUser();
          throw new Error(`Akun ini memiliki role "${userRole}", bukan "${selectedRole}". Pastikan Anda memilih role yang benar di login modal.`);
        }
      }

      setIsLoginModalOpen(false);
      setCredentials({ email: '', password: '' });
      setSelectedRole('citizen');
    } catch (error) {
      console.error('Login error:', error);
      setAuthError(error.message || 'Login gagal. Periksa email dan password Anda.');
    } finally {
      setIsSigningIn(false);
    }
  }

  async function handleLogout() {
    setAuthError('');

    try {
      await signOutCurrentUser();
      setActiveModule('report-damage');
      setPendingModule('');
    } catch (error) {
      setAuthError(error.message || 'Gagal logout.');
    }
  }

  const renderPage = () => {
    const handleNavigateToModule = (module) => {
      setActiveModule(module);
    };

    switch (activeModule) {
      case null:
        return isAdmin ? <DashboardPage onNavigateToModule={handleNavigateToModule} /> : <ReportDamagePage />;
      case 'dashboard':
        return isAdmin ? <DashboardPage onNavigateToModule={handleNavigateToModule} /> : <AdminAccessLocked onOpenLogin={handleOpenLoginModal} />;
      case 'active-reports':
        return isAdmin ? (
          <ActiveReportsPage onBackToDashboard={() => setActiveModule('dashboard')} />
        ) : (
          <AdminAccessLocked onOpenLogin={handleOpenLoginModal} />
        );
      case 'master-data':
        return isAdmin ? <MasterDataPage /> : <AdminAccessLocked onOpenLogin={handleOpenLoginModal} />;
      case 'field-officers':
        return isAdmin ? <FieldOfficersPage /> : <AdminAccessLocked onOpenLogin={handleOpenLoginModal} />;
      case 'ai-analytics':
        return isAdmin ? <AIAnalyticsPage /> : <AdminAccessLocked onOpenLogin={handleOpenLoginModal} />;
      case 'report-damage':
        // Redirect admin to dashboard - hide this feature for admin
        if (isAdmin) {
          setActiveModule('dashboard');
          return <DashboardPage onNavigateToModule={handleNavigateToModule} />;
        }
        return <ReportDamagePage />;
      case 'track-damage':
        return <TrackDamageReportPage />;
      case 'maintenance-task':
        return isAdmin ? (
          <MaintenanceTaskPage />
        ) : (
          <AdminAccessLocked onOpenLogin={handleOpenLoginModal} />
        );
      case 'officer-tasks':
        return isFieldOfficer(currentUser) ? (
          <FieldOfficerTasksPage />
        ) : (
          <AdminAccessLocked onOpenLogin={handleOpenLoginModal} />
        );
      case 'asset-management':
      default:
        return isAdmin ? (
          <AssetManagementPage />
        ) : (
          <AdminAccessLocked onOpenLogin={handleOpenLoginModal} />
        );
    }
  };

  return (
    <NotificationProvider>
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <Sidebar
          modules={modules}
          activeModule={activeModule}
          isAdmin={isAdmin}
          currentUser={currentUser}
          isAuthBootstrapping={isAuthBootstrapping}
          onModuleClick={handleModuleClick}
          onOpenLoginModal={handleOpenLoginModal}
          onLogout={handleLogout}
          onLogoClick={() => setActiveModule(isAdmin ? 'dashboard' : 'report-damage')}
        />

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto lg:ml-0">
          {renderPage()}
        </main>
      </div>

      {authError ? (
        <div className="fixed bottom-4 right-4 max-w-sm rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 shadow-lg">
          {authError}
        </div>
      ) : null}

      <AdminLoginModal
        isOpen={isLoginModalOpen}
        authError={authError}
        credentials={credentials}
        selectedRole={selectedRole}
        isSubmitting={isSigningIn}
        onClose={handleCloseLoginModal}
        onChange={(field, value) =>
          setCredentials((prev) => ({
            ...prev,
            [field]: value,
          }))
        }
        onRoleChange={setSelectedRole}
        onSubmit={handleAdminLogin}
      />

      <NotificationContainer />
    </NotificationProvider>
  );
}
