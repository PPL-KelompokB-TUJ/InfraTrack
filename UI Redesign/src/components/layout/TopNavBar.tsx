import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/src/lib/utils';

export const TopNavBar: React.FC = () => {
    const location = useLocation();
    const isLoginPage = location.pathname === '/login';

    if (isLoginPage) return null;

    return (
        <nav className="fixed top-0 w-full z-50 bg-white/70 backdrop-blur-md border-b border-outline-variant/30 shadow-sm">
            <div className="flex justify-between items-center px-4 md:px-8 mx-auto h-20 max-w-7xl">
                <Link to="/" className="flex items-center gap-2 group">
                    <span className="material-symbols-outlined text-3xl text-primary group-hover:rotate-12 transition-transform">verified_user</span>
                    <span className="text-2xl font-bold text-primary">InfraTrack</span>
                </Link>
                
                <div className="hidden md:flex gap-8 items-center">
                    <Link 
                        to="/" 
                        className={cn(
                            "font-medium transition-all duration-300 px-3 py-2 rounded-lg",
                            location.pathname === '/' ? "text-primary border-b-2 border-primary rounded-none" : "text-on-surface-variant hover:text-primary hover:bg-surface-container-high/50"
                        )}
                    >
                        Beranda
                    </Link>
                    <Link 
                        to="/layanan" 
                        className={cn(
                            "font-medium transition-all duration-300 px-3 py-2 rounded-lg",
                            location.pathname === '/layanan' ? "text-primary border-b-2 border-primary rounded-none" : "text-on-surface-variant hover:text-primary hover:bg-surface-container-high/50"
                        )}
                    >
                        Layanan
                    </Link>
                    <a href="#" className="font-medium text-on-surface-variant hover:text-primary hover:bg-surface-container-high/50 transition-all duration-300 px-3 py-2 rounded-lg">Tentang</a>
                </div>

                <Link to="/login" className="bg-primary hover:bg-primary-container text-on-primary font-semibold px-6 py-2.5 rounded-full shadow-md hover:shadow-lg transition-all duration-300 active:scale-95 text-sm">
                    Login Petugas
                </Link>
            </div>
        </nav>
    );
};
