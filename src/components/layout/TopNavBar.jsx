import { Link, useLocation } from 'react-router-dom';
import { cn } from '../../lib/utils';

export default function TopNavBar() {
    const location = useLocation();
    const isLoginPage = location.pathname === '/login';

    if (isLoginPage) return null;

    return (
        <nav className="fixed top-0 w-full z-50 bg-surface/70 backdrop-blur-md border-b border-primary-container/30 shadow-sm shadow-secondary/5">
            <div className="flex justify-between items-center px-4 md:px-8 mx-auto h-20 max-w-7xl">
                <Link to="/" className="flex items-center gap-2 group">
                    <div className="w-10 h-10 rounded-full bg-primary-container/30 flex items-center justify-center text-primary group-hover:rotate-12 transition-transform">
                        <span className="material-symbols-outlined text-[24px]">energy_savings_leaf</span>
                    </div>
                    <span className="font-headline-sm text-headline-sm italic tracking-tight text-primary">InfraTrack</span>
                </Link>
                
                <div className="hidden md:flex gap-8 items-center">
                    <Link 
                        to="/" 
                        onClick={() => {
                            if (location.pathname === '/') {
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                            }
                        }}
                        className={cn(
                            "font-label-md text-label-md transition-all duration-300 px-3 py-2 rounded-lg",
                            location.pathname === '/' && !location.hash ? "text-primary border-b-2 border-primary rounded-none" : "text-on-surface-variant hover:text-primary hover:bg-surface-container-high/50"
                        )}
                    >
                        Beranda
                    </Link>
                    <Link 
                        to="/layanan" 
                        className={cn(
                            "font-label-md text-label-md transition-all duration-300 px-3 py-2 rounded-lg",
                            location.pathname === '/layanan' ? "text-primary border-b-2 border-primary rounded-none" : "text-on-surface-variant hover:text-primary hover:bg-surface-container-high/50"
                        )}
                    >
                        Layanan
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
                            "font-label-md text-label-md transition-all duration-300 px-3 py-2 rounded-lg",
                            location.pathname === '/' && location.hash === '#tentang' ? "text-primary border-b-2 border-primary rounded-none" : "text-on-surface-variant hover:text-primary hover:bg-surface-container-high/50"
                        )}
                    >
                        Tentang
                    </Link>
                </div>

                <Link to="/login" className="petal-button px-6 py-2.5 shadow-md hover:shadow-lg transition-all duration-300 active:scale-95 font-label-md text-label-md">
                    Login Petugas
                </Link>
            </div>
        </nav>
    );
}
