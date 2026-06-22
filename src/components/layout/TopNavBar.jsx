import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

export default function TopNavBar() {
    const location = useLocation();
    const isLoginPage = location.pathname === '/login';

    if (isLoginPage) return null;

    return (
        <motion.nav 
            initial={{ y: -60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-12 py-4 bg-white/70 backdrop-blur-xl border-b border-primary/5 shadow-sm shadow-primary/5"
        >
            <div className="flex items-center gap-12">
                {/* Custom SVG Logo matching the Sidebar */}
                <Link to="/" className="flex items-center gap-3 cursor-pointer group">
                    <div className="flex-shrink-0 group-hover:rotate-12 transition-transform duration-500 w-[34px] h-[34px] bg-transparent rounded-xl overflow-hidden">
                        <img src="/yorushika-logo.png" alt="Logo" className="w-full h-full object-contain" style={{ filter: 'invert(1)' }} />
                    </div>
                    <span className="text-xl font-black text-on-surface tracking-tight group-hover:text-primary transition-colors">InfraTrack</span>
                </Link>

                {/* Subtle Yorushika indicator for aesthethics */}
                <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-primary/5 border border-primary/10">
                    <motion.div 
                        animate={{ scale: [1, 1.5, 1] }} 
                        transition={{ duration: 2, repeat: Infinity }}
                        className="w-1 h-1 rounded-full bg-primary"
                    />
                    <span className="text-[9px] font-bold text-primary tracking-widest uppercase">春泥棒</span>
                </div>
            </div>
            
            {/* Center Navigation Links - Fills empty space */}
            <div className="hidden md:flex gap-8 items-center absolute left-1/2 -translate-x-1/2">
                <Link 
                    to="/" 
                    onClick={() => {
                        if (location.pathname === '/') {
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                        }
                    }}
                    className={cn(
                        "text-sm font-semibold transition-all duration-300 relative group",
                        location.pathname === '/' && !location.hash ? "text-primary" : "text-on-surface-variant hover:text-primary"
                    )}
                >
                    Beranda
                    <div className={cn(
                        "absolute -bottom-1 left-0 h-0.5 bg-primary transition-all duration-300",
                        location.pathname === '/' && !location.hash ? "w-full" : "w-0 group-hover:w-full"
                    )} />
                </Link>
                <Link 
                    to="/layanan" 
                    className={cn(
                        "text-sm font-semibold transition-all duration-300 relative group",
                        location.pathname === '/layanan' ? "text-primary" : "text-on-surface-variant hover:text-primary"
                    )}
                >
                    Layanan
                    <div className={cn(
                        "absolute -bottom-1 left-0 h-0.5 bg-primary transition-all duration-300",
                        location.pathname === '/layanan' ? "w-full" : "w-0 group-hover:w-full"
                    )} />
                </Link>
                <Link 
                    to="/#tentang"
                    onClick={(e) => {
                        if (location.pathname === '/') {
                            e.preventDefault();
                            document.getElementById('tentang')?.scrollIntoView({ behavior: 'smooth' });
                            window.history.pushState(null, '', '/#tentang');
                            window.dispatchEvent(new Event('popstate'));
                        }
                    }}
                    className={cn(
                        "text-sm font-semibold transition-all duration-300 relative group",
                        location.pathname === '/' && location.hash === '#tentang' ? "text-primary" : "text-on-surface-variant hover:text-primary"
                    )}
                >
                    Tentang
                    <div className={cn(
                        "absolute -bottom-1 left-0 h-0.5 bg-primary transition-all duration-300",
                        location.pathname === '/' && location.hash === '#tentang' ? "w-full" : "w-0 group-hover:w-full"
                    )} />
                </Link>
            </div>

            <div className="flex items-center gap-4">
                <Link 
                    to="/login" 
                    className="relative overflow-hidden group flex items-center justify-center px-6 py-2.5 rounded-full bg-gradient-to-r from-primary to-primary-container text-white font-bold text-sm shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 transition-all active:scale-95"
                >
                    <span className="relative z-10">Login Petugas</span>
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                </Link>
            </div>
        </motion.nav>
    );
}
