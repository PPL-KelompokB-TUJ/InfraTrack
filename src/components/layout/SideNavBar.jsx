import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '../../lib/utils';

export default function SideNavBar({ currentUser, isAdmin, isFieldOfficer, onLogout }) {
    const location = useLocation();
    const navigate = useNavigate();

    const adminItems = [
        { label: 'Ringkasan', icon: 'dashboard', to: '/dashboard' },
        { label: 'Laporan Aktif', icon: 'report_problem', to: '/dashboard/reports' },
        { label: 'Penugasan Pemeliharaan', icon: 'construction', to: '/dashboard/maintenance' },
        { label: 'Jadwal Preventif', icon: 'event_note', to: '/dashboard/preventive' },
        { label: 'Manajemen Petugas', icon: 'groups', to: '/dashboard/officers' },
        { label: 'Manajemen Aset', icon: 'apartment', to: '/dashboard/assets' },
        { label: 'Master Data', icon: 'database', to: '/dashboard/master-data' },
        { label: 'Analitik AI', icon: 'smart_toy', to: '/dashboard/ai-analytics' },
    ];

    const officerItems = [
        { label: 'Penugasan Saya', icon: 'assignment_ind', to: '/dashboard/my-tasks' },
    ];

    const navItems = [
        ...(isFieldOfficer ? officerItems : []),
        ...(isAdmin ? adminItems : []),
    ];

    const handleLogout = async () => {
        if (onLogout) {
            await onLogout();
        }
        navigate('/');
    };

    return (
        <aside className="fixed left-0 top-0 h-full w-[280px] bg-surface-container-low border-r border-outline-variant shadow-md flex-col p-2 space-y-4 z-40 hidden md:flex">
            <div className="px-4 py-8 flex items-center gap-4 border-b border-outline-variant/30">
                <div className="w-10 h-10 rounded-lg bg-primary-container flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-on-primary-container icon-fill">admin_panel_settings</span>
                </div>
                <div>
                    <h1 className="text-xl font-black text-primary leading-tight">InfraTrack Pro</h1>
                    <p className="text-xs text-on-surface-variant font-medium tracking-wide">Panel Kendali Utama</p>
                </div>
            </div>

            <nav className="flex-1 overflow-y-auto py-4 space-y-2 px-2">
                {navItems.map((item) => (
                    <NavLink
                        key={item.label}
                        to={item.to}
                        end={item.to === '/dashboard'}
                        className={({ isActive }) => cn(
                            "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 hover:translate-x-1",
                            isActive
                                ? "bg-secondary-container text-on-secondary-container shadow-sm font-bold" 
                                : "text-on-surface-variant hover:text-primary hover:bg-surface-container-high"
                        )}
                    >
                        <span className={cn("material-symbols-outlined", location.pathname === item.to && "icon-fill")}>{item.icon}</span>
                        <span className="text-base">{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            <div className="px-4 py-4 space-y-4">
                <NavLink 
                    to="/layanan"
                    className="w-full py-3 bg-primary hover:bg-primary-container text-on-primary font-bold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 active:scale-95"
                >
                    <span className="material-symbols-outlined">add</span>
                    Buat Laporan Baru
                </NavLink>
                
                <div className="border-t border-outline-variant/30 pt-4 space-y-1">
                    <button className="flex w-full items-center gap-3 px-3 py-2 rounded-lg text-on-surface-variant hover:text-primary transition-colors text-sm font-medium">
                        <span className="material-symbols-outlined text-[20px]">help</span>
                        <span>Bantuan</span>
                    </button>
                    <button 
                        onClick={handleLogout}
                        className="flex w-full items-center gap-3 px-3 py-2 rounded-lg text-on-surface-variant hover:text-error transition-colors text-sm font-medium"
                    >
                        <span className="material-symbols-outlined text-[20px]">logout</span>
                        <span>Keluar</span>
                    </button>
                </div>

                {currentUser && (
                    <div className="mt-6 flex items-center space-x-3 px-2 py-3 bg-surface-bright rounded-xl border border-outline-variant/30">
                        <div className="w-10 h-10 rounded-full bg-surface-variant overflow-hidden border border-outline-variant shrink-0">
                            <img 
                                alt="User" 
                                className="w-full h-full object-cover"
                                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.email || 'user'}`}
                            />
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="text-sm font-bold text-on-surface truncate">{currentUser.email}</span>
                            <span className="text-[10px] text-on-surface-variant uppercase font-black">
                                {isAdmin ? 'Administrator' : isFieldOfficer ? 'Petugas Lapangan' : 'User'}
                            </span>
                        </div>
                    </div>
                )}
            </div>
        </aside>
    );
}
