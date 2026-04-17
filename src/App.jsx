import { useEffect, useMemo, useState } from 'react';
import { LogOut, Lock, ShieldCheck } from 'lucide-react';
import AssetManagementPage from './pages/AssetManagementPage';
import MasterDataPage from './pages/MasterDataPage';
import ReportDamagePage from './pages/ReportDamagePage';
import TrackDamageReportPage from './pages/TrackDamageReportPage';
import {
  getCurrentSession,
  isAdminUser,
  signInAdmin,
  signOutCurrentUser,
  subscribeToAuthChanges,
} from './lib/authService';

const modules = [
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
    key: 'asset-management',
    label: 'Manajemen Aset',
    requiresAdmin: true,
  },
  {
    key: 'master-data',
    label: 'Master Data Referensi',
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
  isSubmitting,
  onClose,
  onChange,
  onSubmit,
}) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 py-6">
      <div className="glass-panel fade-slide-in w-full max-w-md rounded-3xl p-6">
        <h2 className="text-2xl font-extrabold text-slate-800">Login Admin</h2>
        <p className="mt-2 text-sm text-slate-600">
          Masuk dengan akun admin untuk mengakses modul manajemen aset dan master data.
        </p>

        {authError ? (
          <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {authError}
          </div>
        ) : null}

        <form onSubmit={onSubmit} className="mt-5 space-y-4">
          <label className="block text-sm font-semibold text-slate-700">
            Email Admin
            <input
              type="email"
              value={credentials.email}
              onChange={(event) => onChange('email', event.target.value)}
              className="mt-1.5 w-full rounded-xl border border-cyan-100 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-cyan-400"
              placeholder="admin@infratrack.id"
              autoComplete="email"
              required
            />
          </label>

          <label className="block text-sm font-semibold text-slate-700">
            Password
            <input
              type="password"
              value={credentials.password}
              onChange={(event) => onChange('password', event.target.value)}
              className="mt-1.5 w-full rounded-xl border border-cyan-100 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-cyan-400"
              placeholder="Masukkan password"
              autoComplete="current-password"
              required
            />
          </label>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl border border-cyan-200 px-4 py-2 text-sm font-semibold text-cyan-700 transition hover:bg-cyan-50 disabled:opacity-70"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 px-4 py-2 text-sm font-semibold text-white shadow-glow transition hover:brightness-110 disabled:opacity-70"
            >
              {isSubmitting ? 'Memproses...' : 'Masuk sebagai Admin'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function App() {
  const [activeModule, setActiveModule] = useState('report-damage');
  const [pendingModule, setPendingModule] = useState('');

  const [session, setSession] = useState(null);
  const [isAuthBootstrapping, setIsAuthBootstrapping] = useState(true);

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [credentials, setCredentials] = useState({ email: '', password: '' });
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
    if (!isAdmin && activeModuleConfig?.requiresAdmin) {
      setActiveModule('report-damage');
    }
  }, [activeModuleConfig, isAdmin]);

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
      const user = await signInAdmin(credentials);

      if (!isAdminUser(user)) {
        await signOutCurrentUser();
        throw new Error('Akun ini tidak memiliki role admin.');
      }

      setIsLoginModalOpen(false);
      setCredentials({ email: '', password: '' });
    } catch (error) {
      setAuthError(error.message || 'Login admin gagal.');
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
    switch (activeModule) {
      case 'master-data':
        return isAdmin ? <MasterDataPage /> : <AdminAccessLocked onOpenLogin={handleOpenLoginModal} />;
      case 'report-damage':
        return <ReportDamagePage />;
      case 'track-damage':
        return <TrackDamageReportPage />;
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
    <div>
      <header className="mx-auto w-full max-w-7xl px-4 pt-8 sm:px-6 lg:px-8">
        <div className="glass-panel rounded-2xl p-3">
          <div className="mb-3 flex flex-col gap-3 border-b border-cyan-100 pb-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-700">
                InfraTrack / Aplikasi Tunggal
              </p>
              <p className="text-sm text-slate-600">
                Role aktif: <span className="font-semibold text-slate-800">{isAdmin ? 'Admin' : 'Publik'}</span>
              </p>
            </div>

            <div className="flex items-center gap-2">
              {isAuthBootstrapping ? (
                <span className="rounded-xl border border-cyan-100 bg-white px-3 py-2 text-xs font-semibold text-cyan-700">
                  Mengecek sesi...
                </span>
              ) : isAdmin ? (
                <>
                  <span className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
                    Admin: {currentUser?.email}
                  </span>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-white px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-50"
                  >
                    <LogOut size={14} />
                    Logout
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={handleOpenLoginModal}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 px-3 py-2 text-xs font-semibold text-white shadow-glow transition hover:brightness-110"
                >
                  <ShieldCheck size={14} />
                  Login Admin
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {modules.map((module) => (
              <button
                key={module.key}
                type="button"
                onClick={() => handleModuleClick(module)}
                className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                  activeModule === module.key
                    ? 'bg-gradient-to-r from-cyan-500 to-teal-500 text-white shadow-glow'
                    : 'border border-cyan-100 bg-white text-cyan-800 hover:bg-cyan-50'
                }`}
              >
                <span className="inline-flex items-center gap-1.5">
                  {module.requiresAdmin && !isAdmin ? <Lock size={13} /> : null}
                  {module.label}
                </span>
              </button>
            ))}
          </div>

          {authError ? (
            <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-xs text-rose-700">
              {authError}
            </div>
          ) : null}
        </div>
      </header>

      {renderPage()}

      <AdminLoginModal
        isOpen={isLoginModalOpen}
        authError={authError}
        credentials={credentials}
        isSubmitting={isSigningIn}
        onClose={handleCloseLoginModal}
        onChange={(field, value) =>
          setCredentials((prev) => ({
            ...prev,
            [field]: value,
          }))
        }
        onSubmit={handleAdminLogin}
      />
    </div>
  );
}
