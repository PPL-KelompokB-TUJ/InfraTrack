import { useState } from 'react';
import { LogOut, ShieldCheck, Lock, Menu, X, Building2 } from 'lucide-react';
import { isFieldOfficer } from '../lib/authService';

export default function Sidebar({
  modules,
  activeModule,
  isAdmin,
  currentUser,
  isAuthBootstrapping,
  onModuleClick,
  onOpenLoginModal,
  onLogout,
  onLogoClick,
}) {
  const [isOpen, setIsOpen] = useState(false);

  const handleModuleClick = (module) => {
    onModuleClick(module);
    setIsOpen(false);
  };

  const handleLogoClick = () => {
    if (onLogoClick) {
      onLogoClick();
    }
    setIsOpen(false);
  };

  return (
    <>
      {/* Mobile Menu Toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-40 lg:hidden p-2 rounded-lg bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 shadow-md hover:bg-primary/5 dark:hover:bg-gray-700 transition-colors"
      >
        {isOpen ? <X size={20} className="text-slate-600 dark:text-slate-300" /> : <Menu size={20} className="text-slate-600 dark:text-slate-300" />}
      </button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 dark:bg-black/70 z-30 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-screen w-64 bg-white dark:bg-gray-900 border-r border-slate-200 dark:border-gray-700 z-40 lg:z-auto transition-transform duration-300 flex flex-col ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Logo Section */}
        <div 
          onClick={handleLogoClick}
          className="p-4 border-b border-slate-200 dark:border-gray-700 cursor-pointer hover:bg-primary/5 dark:hover:bg-gray-800 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-white overflow-hidden shadow-md">
              <img src="/yorushika-logo.png" alt="Logo" className="w-full h-full object-cover" />
            </div>
            <div>
              <p className="font-bold text-slate-900 dark:text-slate-100 text-sm">InfraTrack</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">v2.0</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {/* MENU UTAMA Section */}
          <div className="pt-2 pb-1">
            <p className="px-3 py-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Menu Utama</p>
            {modules.slice(0, 9).map((module) => {
              // Skip disabled modules
              if (module.disabled) {
                return null;
              }
              
              // Hide modules that require field officer when not a field officer
              if (module.requiresFieldOfficer && !isFieldOfficer(currentUser)) {
                return null;
              }
              
              const isDisabled = module.requiresAdmin && !isAdmin;
              const isActive = activeModule === module.key;

              return (
                <button
                  key={module.key}
                  onClick={() => {
                    if (isDisabled) {
                      onOpenLoginModal();
                      return;
                    }
                    handleModuleClick(module);
                  }}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-primary to-primary text-white shadow-md'
                      : isDisabled
                      ? 'text-slate-400 dark:text-slate-600 cursor-not-allowed'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-gray-700'
                  }`}
                  disabled={isDisabled}
                >
                  <div className="flex items-center gap-2.5">
                    {isDisabled && <Lock size={16} />}
                    <span>{module.label}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* SISTEM Section */}
          <div className="pt-2 pb-1">
            <p className="px-3 py-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Sistem</p>
            {modules.slice(9).map((module) => {
              // Skip disabled modules
              if (module.disabled) {
                return null;
              }
              
              // Hide modules that require field officer when not a field officer
              if (module.requiresFieldOfficer && !isFieldOfficer(currentUser)) {
                return null;
              }
              
              const isDisabled = module.requiresAdmin && !isAdmin;
              const isActive = activeModule === module.key;

              return (
                <button
                  key={module.key}
                  onClick={() => {
                    if (isDisabled) {
                      onOpenLoginModal();
                      return;
                    }
                    handleModuleClick(module);
                  }}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-primary to-primary text-white shadow-md'
                      : isDisabled
                      ? 'text-slate-400 dark:text-slate-600 cursor-not-allowed'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-gray-700'
                  }`}
                  disabled={isDisabled}
                >
                  <div className="flex items-center gap-2.5">
                    {isDisabled && <Lock size={16} />}
                    <span>{module.label}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </nav>

        {/* User Section */}
        <div className="border-t border-slate-200 dark:border-gray-700 p-3 space-y-2">
          {isAuthBootstrapping ? (
            <div className="px-3 py-2.5 text-xs text-slate-500 dark:text-slate-400 text-center">
              Mengecek...
            </div>
          ) : isAdmin ? (
            <>
              <div className="px-3 py-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-700/40">
                <p className="text-xs text-slate-600 dark:text-slate-400">Login sebagai</p>
                <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 truncate">
                  {currentUser?.email}
                </p>
              </div>
              <button
                type="button"
                onClick={onLogout}
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-rose-200 dark:border-rose-700/40 bg-white dark:bg-gray-800 px-3 py-2.5 text-xs font-semibold text-rose-700 dark:text-rose-400 transition hover:bg-rose-50 dark:hover:bg-rose-900/20"
              >
                <LogOut size={14} />
                Logout
              </button>
            </>
          ) : isFieldOfficer(currentUser) ? (
            <>
              <div className="px-3 py-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-700/40">
                <p className="text-xs text-slate-600 dark:text-slate-400">Login sebagai</p>
                <p className="text-xs font-semibold text-orange-700 dark:text-orange-400 truncate">
                  {currentUser?.email}
                </p>
              </div>
              <button
                type="button"
                onClick={onLogout}
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-rose-200 dark:border-rose-700/40 bg-white dark:bg-gray-800 px-3 py-2.5 text-xs font-semibold text-rose-700 dark:text-rose-400 transition hover:bg-rose-50 dark:hover:bg-rose-900/20"
              >
                <LogOut size={14} />
                Logout
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onOpenLoginModal}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-primary to-primary px-3 py-2.5 text-xs font-semibold text-white shadow-md transition hover:brightness-110"
            >
              <ShieldCheck size={14} />
              Login Admin
            </button>
          )}

          {/* Role Info */}
          <div className="px-3 py-2 bg-primary/5 dark:bg-gray-800 rounded-lg border border-slate-200 dark:border-gray-700">
            <p className="text-xs text-slate-600 dark:text-slate-400">Role</p>
            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
              {isAdmin ? '👤 Admin' : isFieldOfficer(currentUser) ? '🚗 Petugas' : '👥 Publik'}
            </p>
          </div>
        </div>
      </aside>

      {/* Main content offset */}
      <div className="hidden lg:block lg:w-64 flex-shrink-0" />
    </>
  );
}
