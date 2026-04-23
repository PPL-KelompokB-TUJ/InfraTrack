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
        className="fixed top-4 left-4 z-40 lg:hidden p-2 rounded-lg bg-white border border-slate-200 shadow-md hover:bg-slate-50 transition-colors"
      >
        {isOpen ? <X size={20} className="text-slate-600" /> : <Menu size={20} className="text-slate-600" />}
      </button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-screen w-64 bg-white border-r border-slate-200 z-40 lg:z-auto transition-transform duration-300 flex flex-col ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Logo Section */}
        <div 
          onClick={handleLogoClick}
          className="p-4 border-b border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-teal-500 text-white">
              <Building2 size={20} />
            </div>
            <div>
              <p className="font-bold text-slate-900 text-sm">InfraTrack</p>
              <p className="text-xs text-slate-500">v2.0</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {/* MENU UTAMA Section */}
          <div className="pt-2 pb-1">
            <p className="px-3 py-2 text-xs font-bold text-slate-500 uppercase tracking-wider">Menu Utama</p>
            {modules.slice(0, 8).map((module) => {
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
                      ? 'bg-gradient-to-r from-cyan-500 to-teal-500 text-white shadow-md'
                      : isDisabled
                      ? 'text-slate-400 cursor-not-allowed'
                      : 'text-slate-700 hover:bg-slate-100'
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
            <p className="px-3 py-2 text-xs font-bold text-slate-500 uppercase tracking-wider">Sistem</p>
            {modules.slice(8).map((module) => {
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
                      ? 'bg-gradient-to-r from-cyan-500 to-teal-500 text-white shadow-md'
                      : isDisabled
                      ? 'text-slate-400 cursor-not-allowed'
                      : 'text-slate-700 hover:bg-slate-100'
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
        <div className="border-t border-slate-200 p-3 space-y-2">
          {isAuthBootstrapping ? (
            <div className="px-3 py-2.5 text-xs text-slate-500 text-center">
              Mengecek...
            </div>
          ) : isAdmin ? (
            <>
              <div className="px-3 py-2 bg-emerald-50 rounded-lg border border-emerald-200">
                <p className="text-xs text-slate-600">Login sebagai</p>
                <p className="text-xs font-semibold text-emerald-700 truncate">
                  {currentUser?.email}
                </p>
              </div>
              <button
                type="button"
                onClick={onLogout}
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-rose-200 bg-white px-3 py-2.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-50"
              >
                <LogOut size={14} />
                Logout
              </button>
            </>
          ) : isFieldOfficer(currentUser) ? (
            <>
              <div className="px-3 py-2 bg-orange-50 rounded-lg border border-orange-200">
                <p className="text-xs text-slate-600">Login sebagai</p>
                <p className="text-xs font-semibold text-orange-700 truncate">
                  {currentUser?.email}
                </p>
              </div>
              <button
                type="button"
                onClick={onLogout}
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-rose-200 bg-white px-3 py-2.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-50"
              >
                <LogOut size={14} />
                Logout
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onOpenLoginModal}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 to-teal-500 px-3 py-2.5 text-xs font-semibold text-white shadow-md transition hover:brightness-110"
            >
              <ShieldCheck size={14} />
              Login Admin
            </button>
          )}

          {/* Role Info */}
          <div className="px-3 py-2 bg-slate-50 rounded-lg border border-slate-200">
            <p className="text-xs text-slate-600">Role</p>
            <p className="text-xs font-semibold text-slate-800">
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
