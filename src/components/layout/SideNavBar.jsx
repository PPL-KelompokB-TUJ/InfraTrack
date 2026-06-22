import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '../../lib/utils';

export default function SideNavBar({ currentUser, isAdmin, isFieldOfficer, onLogout }) {
    const location = useLocation();
    const navigate = useNavigate();

    const adminItems = [
        { label: 'Ringkasan', icon: 'dashboard', to: '/dashboard' },
        { label: 'Laporan Aktif', icon: 'report_problem', to: '/dashboard/reports' },
        { label: 'Penugasan', icon: 'construction', to: '/dashboard/maintenance' },
        { label: 'Jadwal Preventif', icon: 'event_note', to: '/dashboard/preventive' },
        { label: 'Anggaran', icon: 'payments', to: '/dashboard/budgets' },
        { label: 'Petugas', icon: 'groups', to: '/dashboard/officers' },
        { label: 'Aset', icon: 'apartment', to: '/dashboard/assets' },
        { label: 'Inventaris', icon: 'inventory_2', to: '/dashboard/inventory' },
        { label: 'Master Data', icon: 'database', to: '/dashboard/master-data' },
        { label: 'Analitik AI', icon: 'smart_toy', to: '/dashboard/ai-analytics' },
        { label: 'Ekspor Laporan', icon: 'cloud_download', to: '/dashboard/exports' },
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
        <nav className="hidden md:flex bg-surface-container-low/80 dark:bg-surface-container-high/80 backdrop-blur-xl h-screen w-64 rounded-r-[32px] border-r border-primary-container/20 shadow-lg shadow-primary/5 fixed left-0 top-0 flex-col pt-container-padding pb-gutter z-40 sidebar-scroll overflow-y-auto transition-all duration-500 ease-in-out">
            <div className="px-6 mb-8 flex flex-col items-start">
                <div className="w-12 h-12 rounded-full bg-primary-container/30 flex items-center justify-center mb-4 text-primary">
                    <span className="material-symbols-outlined text-[24px]">energy_savings_leaf</span>
                </div>
                <h1 className="font-headline-md text-headline-md text-primary font-bold italic tracking-tight">InfraTrack</h1>
                <p className="font-label-md text-label-md text-on-surface-variant mt-1">Infrastructure Management</p>
            </div>

            <ul className="flex-1 space-y-2 mt-4 px-2">
                {navItems.map((item) => {
                    const isActive = location.pathname === item.to || (item.to !== '/dashboard' && location.pathname.startsWith(item.to));
                    return (
                        <li key={item.label}>
                            <NavLink
                                to={item.to}
                                end={item.to === '/dashboard'}
                                className={cn(
                                    "flex items-center w-full gap-3 py-3 px-4 transition-all duration-500 ease-in-out font-label-md text-label-md",
                                    isActive
                                        ? "bg-primary-container text-on-primary-container rounded-full mx-2"
                                        : "text-secondary hover:text-primary hover:bg-primary-fixed/30 hover:rounded-full mx-2"
                                )}
                            >
                                <span className={cn("material-symbols-outlined", isActive && "icon-fill")}>{item.icon}</span>
                                <span>{item.label}</span>
                            </NavLink>
                        </li>
                    );
                })}
            </ul>

            <div className="px-6 mt-auto space-y-4 pt-4">
                <NavLink 
                    to="/layanan"
                    className="w-full py-3 petal-button font-label-md text-label-md shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 active:scale-95 text-primary"
                >
                    <span className="material-symbols-outlined">add</span>
                    Laporan Baru
                </NavLink>

                <div className="border-t border-primary-container/20 pt-4 space-y-1">
                    <NavLink
                        to="/dashboard/profile"
                        className={({ isActive }) => cn(
                            "flex items-center gap-3 py-3 px-4 transition-all duration-500 ease-in-out font-label-md text-label-md mx-[-8px]",
                            isActive
                                ? "bg-primary-container/40 text-primary rounded-full"
                                : "text-secondary hover:text-primary hover:bg-primary-fixed/30 hover:rounded-full"
                        )}
                    >
                        <span className="material-symbols-outlined">manage_accounts</span>
                        <span>Profil</span>
                    </NavLink>
                    <button 
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 py-3 px-4 transition-all duration-500 ease-in-out font-label-md text-label-md text-secondary hover:text-error hover:bg-error-container/30 hover:rounded-full mx-[-8px]"
                    >
                        <span className="material-symbols-outlined">logout</span>
                        <span>Keluar</span>
                    </button>
                </div>

                {currentUser && (
                    <NavLink
                        to="/dashboard/profile"
                        className="mt-4 flex items-center gap-3 cursor-pointer group hover:bg-surface-container/50 p-2 rounded-xl transition-all mx-[-8px]"
                    >
                        <img 
                            alt="User" 
                            className="w-8 h-8 rounded-full object-cover border border-primary-container"
                            src={
                                currentUser.user_metadata?.avatar_url ||
                                `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.email || 'user'}`
                            }
                            onError={(e) => {
                                e.currentTarget.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.email || 'user'}`;
                            }}
                        />
                        <div className="min-w-0">
                            <p className="font-label-md text-label-md text-on-surface truncate group-hover:text-primary transition-colors">
                                {currentUser.user_metadata?.full_name || currentUser.email}
                            </p>
                            <p className="font-body-sm text-[10px] text-on-surface-variant leading-none mt-1">
                                {isAdmin ? 'Administrator' : isFieldOfficer ? 'Petugas Lapangan' : 'User'}
                            </p>
                        </div>
                    </NavLink>
                )}
            </div>
        </nav>
    );
}
